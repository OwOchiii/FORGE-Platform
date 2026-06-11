import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] ========== TRANSCRIBE REQUEST ==========');
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    console.log('[v0] Audio file:', audioFile?.name, 'Size:', audioFile?.size, 'Type:', audioFile?.type);

    if (!audioFile) {
      console.error('[v0] No audio file provided');
      return NextResponse.json(
        {
          error: 'No audio file provided',
          text: 'Please provide an audio file to transcribe.',
        },
        { status: 400 }
      );
    }

    // Use Gemini API for transcription
    const apiKey = process.env.GEMINI_API_KEY;
    const model =
      process.env.GEMINI_TRANSCRIBE_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';

    console.log('[v0] Gemini API Key present:', !!apiKey);
    console.log('[v0] Gemini model:', model);

    if (!apiKey) {
      console.error('[v0] GEMINI_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY not configured',
          text: 'Speech recognition is unavailable. Please use text mode instead.',
        },
        { status: 500 }
      );
    }

    // Convert audio to base64
    console.log('[v0] Converting audio to base64...');
    const buffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');
    console.log('[v0] Base64 audio length:', base64Audio.length);

    // Detect MIME type for Gemini API
    const mimeType = audioFile.type || 'audio/webm';
    console.log('[v0] Using MIME type:', mimeType);

    // Call Gemini API with audio multimodal input
    console.log('[v0] Calling Gemini API for transcription...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                  },
                },
                {
                  text: `Transcribe this audio exactly as spoken. The audio may be in Vietnamese (tiếng Việt) or English. 
If it is Vietnamese, preserve all diacritical marks (dấu thanh, dấu mũ, etc.) accurately.
Return ONLY the transcribed text, nothing else. No explanations, no formatting, just the verbatim text.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0,
          },
        }),
      }
    );

    console.log('[v0] Gemini API Response Status:', response.status);
    console.log('[v0] Gemini API Response OK:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[v0] Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Parse and display detailed error
      try {
        const errorJson = JSON.parse(errorData);
        console.error('[v0] Parsed Error:', JSON.stringify(errorJson, null, 2));
        const errorMsg = errorJson.error?.message || errorJson.error?.code || 'Unknown error';
        console.error('[v0] Error Message:', errorMsg);
      } catch (e) {
        console.error('[v0] Could not parse error response:', e);
      }

      return NextResponse.json(
        {
          error: 'Gemini transcription failed',
          text: 'Could not transcribe audio. Please try again or use text mode.',
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('[v0] ========== TRANSCRIPTION RESPONSE ==========');
    console.log('[v0] Full response:', JSON.stringify(result, null, 2));

    const transcription =
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'Could not transcribe audio';

    console.log('[v0] ========== TRANSCRIPTION SUCCESS ==========');
    console.log('[v0] Transcription:', transcription);

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('[v0] ========== TRANSCRIPTION EXCEPTION ==========');
    console.error('[v0] Error type:', typeof error);
    console.error('[v0] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[v0] Transcription error:', error);
    return NextResponse.json(
      {
        error: 'Transcription failed',
        text: 'Speech recognition error. Please use text mode instead.',
      },
      { status: 500 }
    );
  }
}
