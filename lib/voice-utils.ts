'use client';

/**
 * Audio playback and Gemini TTS utilities
 * Uses real Gemini TTS for speech synthesis (not browser fallback)
 * Handles PCM audio conversion to WAV for playback
 */

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let hasUserInteracted = false;

/**
 * Mark that the user has interacted with the page
 * This enables autoplay of AI audio
 */
export function markUserInteraction(): void {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    console.log('[Audio] User interaction detected, autoplay enabled');
  }
}

/**
 * Check if the user has interacted with the page
 */
export function userHasInteracted(): boolean {
  return hasUserInteracted;
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Audio language detection
 */
function detectLanguage(text: string): string {
  const vietnamesePattern =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  return vietnamesePattern.test(text) ? 'vi-VN' : 'en-US';
}

/**
 * Some PCM sources may need 16-bit byte swap before being wrapped into WAV.
 * This helps when raw L16 data sounds distorted due to endian mismatch.
 */
function swap16BitEndian(data: Uint8Array): Uint8Array {
  const swapped = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 < data.length) {
      swapped[i] = data[i + 1];
      swapped[i + 1] = data[i];
    } else {
      swapped[i] = data[i];
    }
  }
  return swapped;
}

/**
 * Create a WAV file from PCM audio data
 * Assumes: mono, 16-bit PCM, little-endian
 */
function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const channels = 1; // mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;

  const wavHeaderSize = 44;
  const fileSize = wavHeaderSize + pcmData.length - 8;
  const subchunk2Size = pcmData.length;

  const wavHeader = new ArrayBuffer(wavHeaderSize);
  const view = new DataView(wavHeader);

  // "RIFF" chunk descriptor
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize, true); // file size - 8
  writeString(8, 'WAVE');

  // "fmt " subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1 size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, channels, true); // number of channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, bitsPerSample, true); // bits per sample

  // "data" subchunk
  writeString(36, 'data');
  view.setUint32(40, subchunk2Size, true); // subchunk2 size

  // Combine header and PCM data
  const wavData = new Uint8Array(wavHeaderSize + pcmData.length);
  wavData.set(new Uint8Array(wavHeader), 0);
  wavData.set(pcmData, wavHeaderSize);

  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Play audio from base64 string (from Gemini TTS)
 * Handles both PCM and other audio formats
 * @param audioBase64 - Base64 encoded audio data
 * @param mimeType - MIME type (e.g., "audio/L16;codec=pcm;rate=24000" or "audio/mpeg")
 * @param skipInteractionCheck - If true, skip checking user interaction (for manual replay)
 * @returns Promise that resolves when audio finishes
 */
export function playGeneratedAudio(
  audioBase64: string,
  mimeType: string = 'audio/L16;codec=pcm;rate=24000',
  skipInteractionCheck: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if user has interacted (unless explicitly skipped)
      if (!skipInteractionCheck && !hasUserInteracted) {
        console.log('[Audio] Autoplay blocked - user interaction required');
        reject(new Error('Autoplay blocked - user interaction required'));
        return;
      }

      // Stop any currently playing audio
      stopCurrentAudio();

      console.log('[Audio] Creating audio from base64');
      console.log('[Audio] MIME type:', mimeType);
      console.log('[Audio] Base64 length:', audioBase64.length);

      // Detect if this is PCM or already a playable format
      let audioUrl: string;

      if (mimeType.includes('L16') || mimeType.includes('pcm')) {
        // This is raw PCM audio - need to convert to WAV
        console.log('[Audio] Detected PCM audio, converting to WAV');

        // Extract sample rate from mime type if available
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        console.log('[Audio] Sample rate:', sampleRate);

        // Convert base64 PCM to Uint8Array
        const pcmDataRaw = base64ToUint8Array(audioBase64);
        console.log('[Audio] PCM data size:', pcmDataRaw.length);

        // Try original PCM first
        let wavBlob = pcmToWavBlob(pcmDataRaw, sampleRate);
        console.log('[Audio] WAV blob created from raw PCM, size:', wavBlob.size);

        // Create object URL from WAV blob
        audioUrl = URL.createObjectURL(wavBlob);
        currentAudioUrl = audioUrl;
        console.log('[Audio] WAV object URL created');
      } else {
        // Assume it's already a playable format (MP3, etc)
        console.log('[Audio] Detected playable audio format, using data URL');
        audioUrl = `data:${mimeType};base64,${audioBase64}`;
        currentAudioUrl = audioUrl;
      }

      // Create audio element
      const audio = new Audio();
      audio.src = audioUrl;
      currentAudio = audio;

      console.log('[Audio] Audio element created, starting playback');

      audio.onended = () => {
        console.log('[Audio] Playback finished');
        if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrl);
        }
        currentAudioUrl = null;
        currentAudio = null;
        resolve();
      };

      audio.onerror = async (err) => {
        console.error('[Audio] Playback error:', err);
        console.error('[Audio] networkState:', audio.networkState);
        console.error('[Audio] readyState:', audio.readyState);
        console.error('[Audio] currentSrc:', audio.currentSrc);

        // Fallback: if PCM raw WAV failed, try 16-bit byte-swapped PCM
        if (mimeType.includes('L16') || mimeType.includes('pcm')) {
          try {
            console.warn('[Audio] Retrying with 16-bit endian swap fallback');

            if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
              URL.revokeObjectURL(currentAudioUrl);
            }

            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

            const pcmDataRaw = base64ToUint8Array(audioBase64);
            const pcmSwapped = swap16BitEndian(pcmDataRaw);
            const wavBlob = pcmToWavBlob(pcmSwapped, sampleRate);
            const fallbackUrl = URL.createObjectURL(wavBlob);

            currentAudioUrl = fallbackUrl;

            const retryAudio = new Audio();
            retryAudio.src = fallbackUrl;
            currentAudio = retryAudio;

            retryAudio.onended = () => {
              console.log('[Audio] Playback finished after endian-swap fallback');
              if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioUrl);
              }
              currentAudioUrl = null;
              currentAudio = null;
              resolve();
            };

            retryAudio.onerror = () => {
              console.error('[Audio] Playback still failed after endian-swap fallback');
              if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioUrl);
              }
              currentAudioUrl = null;
              currentAudio = null;
              reject(new Error('Audio playback failed'));
            };

            await retryAudio.play();
            return;
          } catch (fallbackError) {
            console.error('[Audio] Endian-swap fallback failed:', fallbackError);
          }
        }

        if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrl);
        }
        currentAudioUrl = null;
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch((err) => {
        console.error('[Audio] play() error:', err);
        if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudioUrl);
        }
        currentAudioUrl = null;
        currentAudio = null;
        reject(err);
      });
    } catch (error) {
      console.error('[Audio] Exception during setup:', error);
      reject(error);
    }
  });
}

/**
 * Stop currently playing audio
 */
export function stopCurrentAudio(): void {
  if (currentAudio) {
    console.log('[Audio] Stopping current audio');
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch (e) {
      console.warn('[Audio] Error stopping audio:', e);
    }
    currentAudio = null;
  }

  if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentAudioUrl);
    } catch (e) {
      console.warn('[Audio] Error revoking blob URL:', e);
    }
  }
  currentAudioUrl = null;
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * Manually play audio after user interaction (skip autoplay check)
 * Use this for replay buttons or explicit user action
 */
export async function manualPlayAudio(
  audioBase64: string,
  mimeType: string = 'audio/L16;codec=pcm;rate=24000'
): Promise<void> {
  markUserInteraction();
  return playGeneratedAudio(audioBase64, mimeType, true); // skip check since user explicitly clicked
}

/**
 * Request TTS audio from backend Gemini API
 * @param text - Text to synthesize
 * @param language - Language code (en-US, vi-VN, etc.)
 * @returns Promise with audio data or error
 */
export async function requestGeminiTTS(
  text: string,
  language: string = 'vi-VN'
): Promise<{
  audioBase64?: string;
  mimeType?: string;
  fallback?: boolean;
  error?: string;
}> {
  try {
    const resolvedLanguage = language || detectLanguage(text);

    console.log('[TTS Request] Calling backend');
    console.log('[TTS Request] Text:', text.substring(0, 50));
    console.log('[TTS Request] Language:', resolvedLanguage);

    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: resolvedLanguage }),
    });

    if (!response.ok) {
      const error = `HTTP ${response.status}`;
      console.error('[TTS Request] ❌ API error:', error);
      throw new Error(error);
    }

    const data = await response.json();
    console.log('[TTS Request] ✅ Response received');
    console.log('[TTS Request] Has audio:', !!data.audioBase64);
    console.log('[TTS Request] MIME type:', data.mimeType);
    console.log('[TTS Request] Fallback:', data.fallback);

    return data;
  } catch (error) {
    console.error('[TTS Request] Exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
    };
  }
}

/**
 * Auto-play audio for AI message (main entry point)
 * Handles all TTS logic with error handling and tracking
 * @param text - Text to speak
 * @param language - Language code
 * @param onError - Optional error callback
 * @returns true if audio played, false if failed or unavailable
 */
export async function autoPlayAIMessage(
  text: string,
  language: string = 'vi-VN',
  onError?: (error: string) => void
): Promise<boolean> {
  try {
    const resolvedLanguage = language || detectLanguage(text);

    console.log('[AutoPlay] Starting for message (first 50 chars):', text.substring(0, 50));
    console.log('[AutoPlay] Language:', resolvedLanguage);
    console.log('[AutoPlay] User interaction status:', hasUserInteracted);

    // Request TTS
    const ttsResult = await requestGeminiTTS(text, resolvedLanguage);

    // Check for errors or fallback
    if (ttsResult.error) {
      console.warn('[AutoPlay] TTS error:', ttsResult.error);
      if (onError) {
        onError(ttsResult.error);
      }
      return false;
    }

    if (ttsResult.fallback || !ttsResult.audioBase64) {
      console.warn('[AutoPlay] TTS unavailable or fallback mode');
      if (onError) {
        onError('Audio generation unavailable');
      }
      return false;
    }

    console.log('[AutoPlay] Attempting to play audio');

    // Try to play - will fail gracefully if user hasn't interacted
    try {
      await playGeneratedAudio(
        ttsResult.audioBase64,
        ttsResult.mimeType || 'audio/L16;codec=pcm;rate=24000',
        false // require user interaction
      );
      console.log('[AutoPlay] ✅ Audio playback completed');
      return true;
    } catch (playError) {
      if (
        playError instanceof Error &&
        playError.message.includes('user interaction')
      ) {
        console.log('[AutoPlay] Autoplay blocked by browser policy - waiting for user interaction');
        return false;
      }
      throw playError;
    }
  } catch (error) {
    console.error('[AutoPlay] Exception:', error);
    const errorMsg = error instanceof Error ? error.message : 'Audio playback failed';
    if (onError) {
      onError(errorMsg);
    }
    return false;
  }
}

export async function requestMicrophoneAccess(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please check your browser permissions.');
      }
      if (error.name === 'NotFoundError') {
        throw new Error('No microphone found on this device.');
      }
    }
    throw new Error('Failed to access microphone');
  }
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  try {
    return new MediaRecorder(stream);
  } catch (error) {
    throw new Error('MediaRecorder not supported in this browser');
  }
}

export async function audioToWav(audioBlob: Blob): Promise<Blob> {
  // For now, just return the blob as-is
  // The backend (Gemini API) handles the audio format
  return audioBlob;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Transcribe audio using Gemini API backend
 * @param audioBlob - The audio blob to transcribe
 * @returns Transcribed text or fallback mock text
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.warn('[v0] Transcription failed, returning empty string');
      return '';
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('[v0] Transcription error:', error);
    return '';
  }
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

/**
 * Use browser native speechSynthesis to speak text
 * @param text - The text to speak
 * @param rate - Speech rate (0.1-10, default 1.0)
 * @param pitch - Speech pitch (0-2, default 1.0)
 */
export function useBrowserSpeechSynthesis(
  text: string,
  rate: number = 1.0,
  pitch: number = 1.0
): void {
  if (typeof window === 'undefined') return;

  if (!('speechSynthesis' in window)) {
    console.warn('[v0] Web Speech Synthesis API not available');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  utterance.pitch = Math.max(0, Math.min(2, pitch));

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop browser speech synthesis
 */
export function stopBrowserSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
