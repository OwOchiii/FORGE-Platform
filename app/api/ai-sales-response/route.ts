import { NextRequest, NextResponse } from 'next/server';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
}

interface ParsedResponse {
  response: string;
  score: number;
  feedback: string;
  stage: string;
  outcome: string | null;
  isConversationComplete: boolean;
}

/**
 * Parse plain text response in format:
 * RESPONSE: <text>
 * SCORE: <number>
 * FEEDBACK: <text>
 */
function parseTextResponse(rawText: string, stage: string): ParsedResponse {
  try {
    const responseMatch = rawText.match(/RESPONSE:\s*([\s\S]*?)(?=\nSCORE:|$)/i);
    const scoreMatch = rawText.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = rawText.match(/FEEDBACK:\s*([\s\S]*?)$/i);

    let response = getFallbackResponseForStage(stage);
    let score = 50;
    let feedback = 'Tiếp tục cố gắng!';

    if (responseMatch && responseMatch[1]) {
      response = responseMatch[1].trim();
      response = cleanupIncompleteResponse(response);
    }

    if (scoreMatch && scoreMatch[1]) {
      const parsedScore = parseInt(scoreMatch[1], 10);
      score = Math.min(100, Math.max(0, parsedScore));
    }

    if (feedbackMatch && feedbackMatch[1]) {
      feedback = feedbackMatch[1].trim();
    }

    console.log('[v0] Parsed response:', {
      response: response.substring(0, 100),
      score,
      feedback,
      stage,
    });

    return {
      response,
      score,
      feedback,
      stage,
      outcome: null,
      isConversationComplete: false,
    };
  } catch (e) {
    console.error('[v0] Error parsing text response:', e);
    return {
      response: getFallbackResponseForStage(stage),
      score: 50,
      feedback: 'Tiếp tục cố gắng!',
      stage,
      outcome: null,
      isConversationComplete: false,
    };
  }
}

function cleanupIncompleteResponse(response: string): string {
  let cleaned = response.trim();

  const incompleteEndings = [
    'nhưng',
    'và',
    'hoặc',
    'để',
    'vì',
    'làm',
    'khi',
    'nếu',
    'hay',
    'là',
    ',',
  ];

  incompleteEndings.forEach((ending) => {
    const regex = new RegExp(`\\s+${ending}$`, 'i');
    cleaned = cleaned.replace(regex, '');
  });

  if (cleaned.length < 15) {
    cleaned = 'Nghe cũng hay. Bạn có thể giải thích thêm được không?';
  }

  return cleaned;
}

function getFallbackResponseForStage(stage: string): string {
  const fallbacks: Record<string, string> = {
    early: 'Nghe có vẻ thú vị đấy. Bạn có thể nói cho tôi biết sản phẩm này là gì và dùng để làm gì?',
    mid: 'Nghe cũng khá ổn. Nhưng bạn có thể giải thích rõ hơn về cách nó hoạt động và mang lại lợi ích gì cho tôi không?',
    closing: 'Được, tôi sẽ cân nhắc. Nhưng trước khi quyết định, bạn có thể cho tôi biết giá bao nhiêu và chính sách bảo hành như thế nào không?',
    closed: 'Cảm ơn bạn đã giới thiệu. Tôi sẽ cân nhắc kỹ lưỡng.',
  };

  return fallbacks[stage] || 'Nghe cũng hay. Bạn có thể giải thích thêm được không?';
}

function determineCustomerStage(turnCount: number, sessionScore: number): string {
  if (turnCount <= 2) {
    return 'early';
  }
  if (turnCount <= 4) {
    return 'mid';
  }
  if (turnCount >= 5 && sessionScore >= 65) {
    return 'closing';
  }
  return 'mid';
}

function determineSaleOutcome(finalScore: number, turnCount: number): string | null {
  if (turnCount < 6) {
    return null;
  }

  if (finalScore >= 75) {
    return 'buy';
  }
  if (finalScore <= 40) {
    return 'reject';
  }
  return 'need_more_info';
}

function getStageSpecificInstruction(stage: string): string {
  const instructions: Record<string, string> = {
    early: `STAGE: EARLY
You are just starting to evaluate the product. Ask high-level questions to understand what it is and who it's for.
Your questions should be general like: "What does this product do?", "Who is it designed for?"
Show mild skepticism or curiosity. Keep it simple and natural.`,

    mid: `STAGE: MID
You've learned the basics. Now ask deeper questions about features, benefits, real-world applications, and value proposition.
Your questions should be specific like: "How does it specifically solve our problem?", "Can you give me an example?"
Show genuine interest but remain somewhat cautious. Ask for proof or examples.`,

    closing: `STAGE: CLOSING
You're almost convinced. Now focus only on final decision factors like price, implementation, support, or ROI.
Your questions should be about purchase-related topics like: "What's the pricing?", "How long to implement?", "What support do you offer?"
Show that you're seriously considering buying. The conversation is winding down.`,

    closed: `STAGE: CLOSED
The conversation is ending. Based on the trainee's answers to your closing questions, make a final decision.
Choose ONE outcome: BUY if they answered well, NEED_MORE_INFO if unsure, REJECT if not convinced.
Be direct and clear about your decision. No more questions.`,
  };

  return instructions[stage] || '';
}


export async function POST(request: NextRequest) {
  try {
    const {
      userMessage,
      productName,
      productDescription,
      productPrice,
      conversationHistory,
      turnCount = 1,
      sessionScore = 50,
      customSystemPrompt,
    } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      console.error('[v0] GEMINI_API_KEY not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('[v0] ========== AI SALES RESPONSE REQUEST ==========');
    console.log('[v0] Model:', model);
    console.log('[v0] Turn count:', turnCount);
    console.log('[v0] Session score:', sessionScore);

    // Determine current stage
    const currentStage = determineCustomerStage(turnCount, sessionScore);
    console.log('[v0] Current stage:', currentStage);

    // Get stage-specific instruction
    const stageInstruction = getStageSpecificInstruction(currentStage);

    // Build conversation history for context
    const messages = (conversationHistory as ConversationMessage[]).map((msg) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Add current user message
    messages.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // If the lesson has a custom system prompt, use it with stage instruction appended
    const systemPrompt = customSystemPrompt
      ? `${customSystemPrompt}\n\n${stageInstruction}`
      : `Bạn là KHÁCH HÀNG, không phải nhân viên bán hàng.

Sản phẩm: ${productName}
Giá: ${productPrice}
Tính năng chính: ${productDescription}

Vai trò bắt buộc:
- Bạn là người mua đang cân nhắc
- Bạn KHÔNG BAO GIỜ được giới thiệu sản phẩm như người bán
- Bạn KHÔNG được liệt kê tính năng sản phẩm theo kiểu sales
- Bạn KHÔNG được thuyết phục ngược lại người dùng
- Bạn chỉ được hỏi thêm, nêu lo ngại, phản biện nhẹ

Quy tắc bắt buộc:
- Luôn trả lời bằng tiếng Việt
- Viết 1-2 câu hoàn chỉnh
- Không bao giờ kết thúc dang dở
- Không kết thúc bằng: "nhưng", "và", "hoặc", "để", "vì", "làm", "khi", "nếu", "hay", "là"
- Không bao giờ nói như người bán hàng
- Mỗi câu trả lời phải là duy nhất

${stageInstruction}

Format bắt buộc:
RESPONSE: <câu trả lời của khách hàng>
SCORE: <0-100>
FEEDBACK: <nhận xét ngắn>`;

    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      contents: messages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    };

    console.log('[v0] Request body prepared with stage:', currentStage);

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
      console.error('[v0] ========== GEMINI API ERROR ==========');
      console.error('[v0] Status:', response.status);
      console.error('[v0] Error:', JSON.stringify(errorData, null, 2));

      const fallbackResponse = getFallbackResponseForStage(currentStage);
      return NextResponse.json({
        response: fallbackResponse,
        score: 50,
        feedback: 'Tiếp tục cố gắng!',
        stage: currentStage,
        outcome: null,
        isConversationComplete: false,
      });
    }

    console.log('[v0] ========== GEMINI API SUCCESS ==========');
    const result = await response.json();

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[v0] Raw text:', rawText.substring(0, 200));

    // Parse the plain text response
    const parsedResponse = parseTextResponse(rawText, currentStage);

    // Check if conversation should close
    let outcome = null;
    let isConversationComplete = false;

    if (currentStage === 'closing' && turnCount >= 6) {
      const finalScore = sessionScore + (parsedResponse.score - 50) / 10;
      outcome = determineSaleOutcome(finalScore, turnCount + 1);

      if (outcome) {
        isConversationComplete = true;
        console.log('[v0] Conversation complete with outcome:', outcome);
      }
    }

    return NextResponse.json({
      response: parsedResponse.response,
      score: parsedResponse.score,
      feedback: parsedResponse.feedback,
      stage: currentStage,
      outcome,
      isConversationComplete,
    });
  } catch (error) {
    console.error('[v0] AI response error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI response',
        response: 'Nghe cũng hay. Bạn có thể giải thích rõ hơn được không?',
        score: 50,
        feedback: 'Tiếp tục cố gắng!',
        stage: 'mid',
        outcome: null,
        isConversationComplete: false,
      },
      { status: 500 }
    );
  }
}
