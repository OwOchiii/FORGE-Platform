'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle, UserCircle } from 'lucide-react';
import { ModeToggle } from '@/components/sales-simulator/ModeToggle';
import { TextChatInput } from '@/components/sales-simulator/TextChatInput';
import { CustomerAvatarCard } from '@/components/sales-simulator/CustomerAvatarCard';
import {
  autoPlayAIMessage,
  stopCurrentAudio,
  markUserInteraction,
  manualPlayAudio,
} from '@/lib/voice-utils';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  id?: string;
  audioBase64?: string;
  mimeType?: string;
}

interface AISalesSimulatorProps {
  productName: string;
  productDescription: string;
  productPrice: string;
  scenarioDescription: string;
  customSystemPrompt?: string;
}

export default function AISalesSimulator({
  productName,
  productDescription,
  productPrice,
  scenarioDescription,
  customSystemPrompt,
}: AISalesSimulatorProps) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [salesScore, setSalesScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [turnScores, setTurnScores] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState('early');
  const [saleOutcome, setSaleOutcome] = useState<string | null>(null);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [persona, setPersona] = useState<'skeptical' | 'warm_lead' | 'random'>('random');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefRef = useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string>('');

  // Initialize conversation with AI greeting
  useEffect(() => {
    const initializeConversation = async () => {
      const aiGreeting = `Chào bạn, tôi đang quan tâm đến ${productName}. Bạn có thể giới thiệu rõ hơn về sản phẩm này cho tôi được không?`;

      const initialMsg: ConversationMessage = {
        role: 'ai',
        content: aiGreeting,
        timestamp: new Date(),
        id: `msg-${Date.now()}`,
      };

      setConversation([initialMsg]);

      console.log('[AISalesSimulator] Initialized with greeting, waiting for user interaction');
      // Do NOT auto-play - wait for user interaction
    };
    initializeConversation();
  }, [productName, persona]); // Re-initialize if persona changes (and if it makes sense)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-play new AI messages with Gemini TTS
  useEffect(() => {
    if (conversation.length === 0) return;

    const lastMessage = conversation[conversation.length - 1];

    if (
      lastMessage.role === 'ai' &&
      lastMessage.id !== lastSpokenMessageIdRef.current &&
      lastMessage.content
    ) {
      const timer = setTimeout(() => {
        console.log('[AISalesSimulator] Auto-playing message:', lastMessage.id);
        setIsSpeaking(true);

        autoPlayAIMessage(lastMessage.content, 'vi-VN', (error) => {
          console.error('[AISalesSimulator] Message auto-play failed:', error);
          setIsSpeaking(false);
        }).then((success) => {
          // Đánh dấu đã xử lý message này để tránh re-render phát lại
          lastSpokenMessageIdRef.current = lastMessage.id || '';

          if (success) {
            console.log('[AISalesSimulator] Message auto-played:', lastMessage.id);

            // Simulate speaking duration
            const speakingDuration = Math.min(lastMessage.content.length * 50, 10000);
            setTimeout(() => {
              setIsSpeaking(false);
            }, speakingDuration);
          } else {
            setIsSpeaking(false);
          }
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [conversation]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      console.log('[AISalesSimulator] Cleaning up audio on unmount');
      stopCurrentAudio();
    };
  }, []);

  const startRecording = async () => {
    // Mark user interaction
    markUserInteraction();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Create FormData for audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      // Call API to transcribe audio
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      const userMessage = data.text;
      setTranscription(userMessage);

      // Add user message to conversation
      const newUserMessage: ConversationMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        id: `msg-${Date.now()}-${Math.random()}`,
      };
      setConversation((prev) => [...prev, newUserMessage]);

      // Get AI response
      await getAIResponse(userMessage);
    } catch (error) {
      console.error('Transcription error:', error);
      setFeedback('Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const finalSessionScore = turnScores.length > 0
        ? Math.round(turnScores.reduce((sum, score) => sum + score, 0) / turnScores.length)
        : 50;

      const response = await fetch('/api/ai-sales-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          productName,
          productDescription,
          productPrice,
          conversationHistory: conversation.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          turnCount: Math.floor((conversation.length + 1) / 2),
          sessionScore: finalSessionScore,
          ...(customSystemPrompt ? { customSystemPrompt } : {}),
        }),
      });

      if (!response.ok) throw new Error('AI response failed');

      const data = await response.json();
      const aiMessage = data.response;
      const scoreUpdate = data.score || (finalSessionScore + data.convictionDelta * 2);
      const feedbackText = data.feedback || 'Good effort!';
      const stage = data.stage || 'early';
      const outcome = data.outcome || null;
      const isComplete = data.isConversationComplete || false;

      // Update scores
      setSalesScore(scoreUpdate);
      setFeedback(feedbackText);
      setTurnScores((prev) => [...prev, scoreUpdate]);
      setCurrentStage(stage);

      // Handle conversation completion
      if (isComplete && outcome) {
        console.log('[AISalesSimulator] Conversation complete with outcome:', outcome);
        setIsConversationComplete(true);
        setSaleOutcome(outcome);
        
        // Save to localStorage for charts
        const history = JSON.parse(localStorage.getItem('forge-simulator-history') || '[]');
        history.push({
          date: new Date().toISOString(),
          score: scoreUpdate,
          outcome,
          persona,
          productName
        });
        localStorage.setItem('forge-simulator-history', JSON.stringify(history));
      }

      // Get TTS audio
      let audioBase64 = '';
      let mimeType = '';
      try {
        const ttsResponse = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiMessage, language: 'vi-VN' }),
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioBase64 = ttsData.audioBase64 || '';
          mimeType = ttsData.mimeType || 'audio/L16;codec=pcm;rate=24000';
        }
      } catch (ttsError) {
        console.warn('[AISalesSimulator] TTS request failed:', ttsError);
      }

      // Add AI message with audio
      const newAIMessage: ConversationMessage = {
        role: 'ai',
        content: aiMessage,
        timestamp: new Date(),
        id: `msg-${Date.now()}-${Math.random()}`,
        audioBase64,
        mimeType,
      };
      setConversation((prev) => [...prev, newAIMessage]);
      setTranscription('');
      setErrorMessage('');
    } catch (error) {
      console.error('AI response error:', error);
      setFeedback('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextMessage = async (textMessage: string) => {
    // Mark user interaction
    markUserInteraction();

    // Add user message to conversation
    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: textMessage,
      timestamp: new Date(),
      id: `msg-${Date.now()}-${Math.random()}`,
    };
    setConversation((prev) => [...prev, newUserMessage]);

    // Get AI response
    await getAIResponse(textMessage);
  };

  const handleManualAudioPlay = async (messageId: string, audioBase64: string, mimeType: string) => {
    try {
      markUserInteraction();
      setPlayingAudioId(messageId);
      await manualPlayAudio(audioBase64, mimeType);
    } catch (error) {
      console.error('[AISalesSimulator] Manual audio play failed:', error);
      setErrorMessage('Audio playback failed');
    } finally {
      setPlayingAudioId(null);
    }
  };

  const finalSessionScore =
    turnScores.length > 0
      ? Math.round(turnScores.reduce((sum, score) => sum + score, 0) / turnScores.length)
      : 0;

  const getOutcomeColor = (outcome: string | null) => {
    if (outcome === 'buy') return 'bg-green-50 border-green-200 text-green-900';
    if (outcome === 'need_more_info') return 'bg-blue-50 border-blue-200 text-blue-900';
    if (outcome === 'reject') return 'bg-red-50 border-red-200 text-red-900';
    return '';
  };

  const getOutcomeIcon = (outcome: string | null) => {
    if (outcome === 'buy') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (outcome === 'need_more_info') return <AlertCircle className="w-5 h-5 text-blue-600" />;
    return null;
  };

  return (
    <div className="w-full min-h-0 h-[800px] bg-white/50 dark:bg-slate-800/30 rounded-[2rem] p-4 lg:p-6 border border-gray-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 min-h-0 h-full">
        {/* Conversation Panel */}
        <div className="lg:col-span-3 min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl drop-shadow-sm">Sales Pitch: {productName}</h2>
              <p className="text-sm text-orange-100 mt-1 font-medium">Stage: <span className="capitalize">{currentStage}</span></p>
            </div>
            
            {/* Persona Selector */}
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
              <UserCircle className="w-5 h-5 text-white/90" />
              <select 
                value={persona} 
                onChange={(e) => setPersona(e.target.value as any)}
                disabled={conversation.length > 1}
                className="bg-transparent text-white text-sm font-medium border-none focus:ring-0 cursor-pointer disabled:opacity-50 appearance-none pr-4"
              >
                <option value="random" className="text-gray-900">Random Customer</option>
                <option value="warm_lead" className="text-gray-900">Warm Lead</option>
                <option value="skeptical" className="text-gray-900">Skeptical Buyer</option>
              </select>
            </div>
          </div>

          {/* Status Banner */}
          {isConversationComplete && saleOutcome && (
            <div className={`shrink-0 border-b border-gray-200 dark:border-slate-700 p-4 ${
              saleOutcome === 'buy' ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300' :
              saleOutcome === 'need_more_info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300' :
              'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-3">
                {getOutcomeIcon(saleOutcome)}
                <div>
                  <p className="font-bold">Conversation Ended</p>
                  <p className="text-sm opacity-90">
                    {saleOutcome === 'buy' && 'Customer decided to buy! Great job closing the deal.'}
                    {saleOutcome === 'need_more_info' && 'Customer wants more information before deciding.'}
                    {saleOutcome === 'reject' && 'Customer decided not to proceed at this time.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Messages */}
        <div
          className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50"
          role="log"
          aria-label="Conversation messages"
          aria-live="polite"
        >
          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              role="article"
              aria-label={`${msg.role === 'user' ? 'Your message' : 'AI response'}: ${msg.content}`}
            >
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                <span
                  className={`text-xs mt-2 block ${msg.role === 'user' ? 'text-orange-100' : 'text-gray-400 dark:text-gray-500'}`}
                  aria-label={`Sent at ${msg.timestamp.toLocaleTimeString()}`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Manual Play Button for AI messages with audio */}
              {msg.role === 'ai' && msg.audioBase64 && msg.id && (
                <button
                  onClick={() =>
                    handleManualAudioPlay(
                      msg.id!,
                      msg.audioBase64!,
                      msg.mimeType || 'audio/L16;codec=pcm;rate=24000'
                    )
                  }
                  disabled={playingAudioId === msg.id}
                  aria-label={playingAudioId === msg.id ? 'Playing audio' : 'Play audio'}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/60 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 flex-shrink-0 self-end mb-1"
                >
                  {playingAudioId === msg.id ? (
                    <Volume2 className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          ))}
          <div ref={conversationEndRef} aria-live="assertive" />
        </div>

        {/* Mode Toggle */}
        <div className="shrink-0">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 flex flex-col bg-gray-50/50 dark:bg-slate-800/50">
          {/* Error/Feedback */}
          {errorMessage && (
            <div className="border-b border-gray-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/10 p-4">
              <div className="flex items-start gap-3 text-sm text-red-900 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-sm">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold mb-1">System Message</p>
                  <p className="text-red-800 dark:text-red-400 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Complete Message */}
          {isConversationComplete && (
            <div className="border-t border-gray-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/10 p-6">
              <div className="text-center text-green-900 dark:text-green-400 text-sm font-medium">
                <p className="text-base font-bold mb-1">Conversation Complete</p>
                <p className="opacity-80">This sales simulation has ended. Great practice session!</p>
              </div>
            </div>
          )}

          {/* Voice Mode Input */}
          {!isConversationComplete && mode === 'voice' && (
            <div className="border-t border-gray-200 dark:border-slate-700 p-5 space-y-4 shrink-0 bg-white dark:bg-slate-800">
              {transcription && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                  <span className="font-semibold block mb-1">Your transcription:</span> {transcription}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isSpeaking}
                  variant={isRecording ? 'destructive' : 'outline'}
                  className={`flex-1 h-12 text-base font-semibold rounded-xl ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 animate-pulse'
                      : 'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-md shadow-orange-500/20'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Speaking
                    </>
                  )}
                </Button>
                {isSpeaking && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-sm border border-orange-100 dark:border-orange-900/50">
                    <Volume2 className="w-5 h-5 animate-pulse text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-700 dark:text-orange-400 font-medium hidden sm:inline">AI Speaking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Mode Input */}
          {!isConversationComplete && mode === 'text' && (
            <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
              <TextChatInput
                onSendMessage={handleTextMessage}
                isLoading={isLoading}
                placeholder="Type your response to the AI customer..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 min-h-0 overflow-y-auto space-y-6 lg:pl-2 custom-scrollbar">
        {/* Customer Avatar */}
        <CustomerAvatarCard 
          isSpeaking={isSpeaking}
          stage={currentStage}
          customerName="AI Customer"
        />

        {/* Product Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">📦</span>
            Product Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700">
              <p className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Name</p>
              <p className="text-gray-900 dark:text-gray-200 font-medium">{productName}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">
              <p className="font-semibold text-orange-800 dark:text-orange-400 text-xs uppercase tracking-wider mb-1">Price</p>
              <p className="text-orange-600 dark:text-orange-400 font-bold text-lg">{productPrice}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700">
              <p className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Key Features</p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{productDescription}</p>
            </div>
          </div>
        </div>

        {/* Sales Score */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sales Performance</h3>
          <div className="space-y-4">
            {/* Current Turn Score */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-500/20 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-orange-900 dark:text-orange-400">Current Turn</span>
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{Math.round(salesScore)}</span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">{feedback}</p>
            </div>

            {/* Final Session Score */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/20 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-green-900 dark:text-green-400">Session Avg</span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(finalSessionScore)}
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                {turnScores.length} turn{turnScores.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Score Bar */}
            <div>
              <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 dark:bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${salesScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex gap-3">
              {feedback.includes('Great') || feedback.includes('Excellent') ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Feedback</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scenario */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-500/20 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />
          <h4 className="font-bold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100 dark:border-transparent">🎯</span>
            Scenario
          </h4>
          <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed relative z-10">{scenarioDescription}</p>
        </div>

        {/* Stage Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500">📍</span> Stage Progress
          </h4>
          <div className="space-y-3 text-sm">
            {['early', 'mid', 'closing'].map((stage) => (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                    currentStage === stage ? 'bg-orange-500 shadow-orange-500/50' : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                />
                <span className={`capitalize font-medium ${currentStage === stage ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{stage}</span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                  isConversationComplete ? 'bg-green-500 shadow-green-500/50' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
              <span className={`font-medium ${isConversationComplete ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
