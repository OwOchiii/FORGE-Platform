import { NextRequest, NextResponse } from 'next/server';

/**
 * ElevenLabs Text-to-Speech API Route
 *
 * Uses ElevenLabs for high-quality TTS (supports Vietnamese natively).
 * Falls back to Gemini TTS if ElevenLabs is not configured.
 */
export async function POST(request: NextRequest) {
  try {
    const { text, language = 'vi-VN' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided', audioBase64: '', fallback: true },
        { status: 400 }
      );
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;

    // ── ElevenLabs Path ─────────────────────────────────────────────────────
    if (elevenLabsApiKey && elevenLabsVoiceId) {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`;

      const body = {
        text,
        model_id: 'eleven_flash_v2_5', // multilingual v2 supports Vietnamese
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.82,
          style: 0.0,
          use_speaker_boost: true,
        },
        language_code: language === 'vi-VN' ? 'vi' : 'en',
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
        return NextResponse.json({
          audioBase64,
          mimeType: 'audio/mpeg',
          fallback: false,
          provider: 'elevenlabs',
        });
      }

      const errText = await res.text();
      console.error('[elevenlabs-tts] ElevenLabs error:', res.status, errText.substring(0, 200));
      // Fall through to Gemini fallback
    }

    // ── Gemini TTS Fallback ─────────────────────────────────────────────────
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const ttsModel = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'No TTS service configured', audioBase64: '', fallback: true },
        { status: 500 }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${geminiApiKey}`;

    const geminiBody = {
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: language === 'vi-VN' ? 'Kore' : 'Puck',
            },
          },
        },
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[elevenlabs-tts] Gemini fallback error:', geminiRes.status, errText.substring(0, 200));
      return NextResponse.json(
        { error: 'TTS failed', audioBase64: '', fallback: true },
        { status: 200 }
      );
    }

    const geminiData = await geminiRes.json();
    const audioContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    const mimeType = geminiData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!audioContent) {
      return NextResponse.json(
        { error: 'No audio generated', audioBase64: '', fallback: true },
        { status: 200 }
      );
    }

    return NextResponse.json({
      audioBase64: audioContent,
      mimeType,
      fallback: true,
      provider: 'gemini',
    });
  } catch (error) {
    console.error('[elevenlabs-tts] Exception:', error);
    return NextResponse.json(
      { error: 'TTS exception', audioBase64: '', fallback: true },
      { status: 200 }
    );
  }
}
