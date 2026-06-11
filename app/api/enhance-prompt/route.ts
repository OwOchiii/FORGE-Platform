import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, instruction, items, systemPrompt } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const enhanceRequest = `You are an expert sales training course designer. Improve the following AI sales simulation lesson task fields to make them clearer, more engaging, and pedagogically effective.

Current fields:
- Task Title: ${title || '(empty)'}
- Instruction (shown to trainee): ${instruction || '(empty)'}
- Items/Product to sell: ${items || '(empty)'}
- System Prompt (AI customer behavior): ${systemPrompt || '(empty)'}

Return ONLY a valid JSON object with this exact structure (no markdown fences, no extra text):
{
  "title": "improved task title",
  "instruction": "improved instruction text for the trainee",
  "items": "improved product/items description for the trainee",
  "systemPrompt": "improved system prompt that makes the AI customer more realistic and challenging"
}

Rules for improvement:
- Keep the same core intent but make each field more specific and actionable
- For the system prompt: ensure the AI customer role is clearly defined, includes realistic objections, a buying stage progression, and response format instructions (RESPONSE / SCORE / FEEDBACK)
- For items: include product name, key features, price range if plausible, and target customer
- Keep language professional but natural
- Do not invent completely different scenarios — enhance what is given`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: enhanceRequest }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.4,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[enhance-prompt] Gemini API error:', errorData);
      return NextResponse.json({ error: 'AI enhancement failed' }, { status: 500 });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from the response
    let enhanced: { title: string; instruction: string; items: string; systemPrompt: string };
    try {
      // Strip markdown fences if present
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      enhanced = JSON.parse(cleaned);
    } catch {
      console.error('[enhance-prompt] Failed to parse JSON response:', rawText);
      return NextResponse.json({ error: 'Failed to parse enhanced content' }, { status: 500 });
    }

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('[enhance-prompt] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
