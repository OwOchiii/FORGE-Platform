import { NextRequest, NextResponse } from 'next/server';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
}

interface SimulatorConfig {
  mode?: string;
  projectName?: string;
  salesPitch?: string;
  productType?: string;
  description?: string;
  customerPersona?: string;
  openingCustomerMessage?: string;
  goal?: string;
  keyFeatures?: string[];
  commonObjections?: string[];
  commonQuestions?: string[];
  questionTopics?: string[];
  salesTips?: string[];
  scoringCriteria?: {
    good?: string;
    average?: string;
    bad?: string;
  };
  feedbackRules?: Record<string, string>;
  stageRules?: {
    early?: string;
    mid?: string;
    closing?: string;
    complete?: string;
  };
  priceInfo?: string;
  location?: string;
}

interface ParsedResponse {
  response: string;
  score: number;
  feedback: string;
  stage: string;
  outcome: string | null;
  isConversationComplete: boolean;
}

// ─── Stage Logic ──────────────────────────────────────────────────────────────

function determineCustomerStage(turnCount: number, sessionScore: number): string {
  if (turnCount <= 2) return 'early';
  if (turnCount <= 4) return 'mid';
  if (turnCount >= 5 && sessionScore >= 60) return 'closing';
  return 'mid';
}

function determineSaleOutcome(finalScore: number, turnCount: number): string | null {
  if (turnCount < 6) return null;
  if (finalScore >= 72) return 'buy';
  if (finalScore <= 38) return 'reject';
  return 'need_more_info';
}

// ─── Fallbacks (Vietnamese) ───────────────────────────────────────────────────

function getFallbackResponseForStage(stage: string): string {
  const fallbacks: Record<string, string> = {
    early: 'Nghe có vẻ thú vị. Bạn có thể giới thiệu rõ hơn về sản phẩm này không?',
    mid: 'Ổn đấy. Bạn có thể cho tôi biết cụ thể hơn nó mang lại lợi ích gì không?',
    closing: 'Tôi sẽ cân nhắc. Bạn có thể cho tôi biết thêm về giá cả và chính sách hỗ trợ không?',
    closed: 'Cảm ơn bạn đã giới thiệu. Tôi sẽ suy nghĩ thêm.',
  };
  return fallbacks[stage] ?? 'Bạn có thể giải thích thêm được không?';
}

// ─── Vietnamese Stage Instructions ────────────────────────────────────────────

function getStageInstruction(stage: string, config?: SimulatorConfig): string {
  // Use custom stageRules from simulator_config if provided
  if (config?.stageRules) {
    const custom = config.stageRules[stage as keyof typeof config.stageRules];
    if (custom) {
      return `[GIAI ĐOẠN HỘI THOẠI: ${stage.toUpperCase()}]\n${custom}`;
    }
  }

  const instructions: Record<string, string> = {
    early: `[GIAI ĐOẠN: KHỞI ĐẦU]
Bạn vừa nghe qua giới thiệu tổng quan. Hãy đặt câu hỏi rộng để hiểu sản phẩm là gì và dành cho ai.
Ví dụ: "Sản phẩm này dùng để làm gì?", "Ai thường sử dụng nó?", "Có phù hợp với tôi không?"
Thể hiện sự tò mò nhẹ hoặc hoài nghi vừa phải. Giữ đơn giản và tự nhiên.`,

    mid: `[GIAI ĐOẠN: TÌM HIỂU SÂU]
Bạn đã hiểu cơ bản. Bây giờ hãy hỏi sâu hơn về tính năng, ứng dụng thực tế và giá trị cụ thể.
Ví dụ: "Nó giải quyết vấn đề của tôi bằng cách nào?", "Bạn có thể cho ví dụ thực tế không?", "So với giải pháp khác thì sao?"
Thể hiện sự quan tâm thực sự nhưng vẫn thận trọng. Yêu cầu bằng chứng hoặc ví dụ.`,

    closing: `[GIAI ĐOẠN: CHỐT DEAL]
Bạn gần như đã bị thuyết phục. Bây giờ chỉ hỏi về các yếu tố quyết định cuối cùng: giá cả, triển khai, hỗ trợ.
Ví dụ: "Giá bao nhiêu?", "Bao lâu để triển khai?", "Có hỗ trợ sau bán hàng không?"
Thể hiện bạn đang nghiêm túc cân nhắc. Cuộc hội thoại đang đến hồi kết.`,

    closed: `[GIAI ĐOẠN: KẾT THÚC]
Cuộc hội thoại đang kết thúc. Hãy đưa ra quyết định cuối cùng dựa trên những câu trả lời của nhân viên bán hàng.
Nếu họ trả lời tốt → mua hàng. Nếu không chắc → cần thêm thông tin. Nếu không thuyết phục → từ chối.
Hãy rõ ràng và dứt khoát trong quyết định của bạn.`,
  };

  return instructions[stage] ?? '';
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  productName: string,
  productDescription: string,
  productPrice: string,
  stage: string,
  config?: SimulatorConfig,
  customSystemPrompt?: string,
): string {
  const stageInstruction = getStageInstruction(stage, config);

  // If admin provided a fully custom prompt, use it + stage instruction appended
  if (customSystemPrompt) {
    return `${customSystemPrompt}

${stageInstruction}

QUY TẮC FORMAT BẮT BUỘC:
RESPONSE: <câu trả lời của bạn bằng tiếng Việt, 1-3 câu hoàn chỉnh>
SCORE: <0-100 đánh giá chất lượng câu trả lời của nhân viên bán hàng>
FEEDBACK: <nhận xét ngắn gọn bằng tiếng Việt>`;
  }

  // Build persona from simulator_config if available
  const personaDescription = config?.customerPersona
    ?? 'Bạn là một khách hàng doanh nghiệp đang cân nhắc mua sản phẩm.';

  const productInfo = config
    ? `Sản phẩm: ${config.projectName ?? productName}
Loại: ${config.productType ?? 'Sản phẩm/Dịch vụ'}
Mô tả: ${config.description ?? productDescription}
${config.priceInfo ? `Thông tin giá: ${config.priceInfo}` : `Giá: ${productPrice}`}
${config.location ? `Vị trí: ${config.location}` : ''}
${config.keyFeatures?.length ? `Tính năng nổi bật: ${config.keyFeatures.join(', ')}` : ''}
${config.commonObjections?.length ? `Phản đối thường gặp (bạn có thể dùng): ${config.commonObjections.join(' | ')}` : ''}`
    : `Sản phẩm: ${productName}
Giá: ${productPrice}
Mô tả: ${productDescription}`;

  const scoringGuide = config?.scoringCriteria
    ? `Tiêu chí chấm điểm:
- Tốt (70-100): ${config.scoringCriteria.good ?? 'Trả lời thuyết phục, đủ thông tin'}
- Trung bình (40-69): ${config.scoringCriteria.average ?? 'Trả lời đúng nhưng chưa thuyết phục'}
- Kém (0-39): ${config.scoringCriteria.bad ?? 'Không trả lời được hoặc mất điểm'}` 
    : `Tiêu chí chấm điểm:
- Tốt (70-100): Câu trả lời thuyết phục, có ví dụ, xử lý phản đối tốt
- Trung bình (40-69): Trả lời đúng nhưng chưa đủ thuyết phục  
- Kém (0-39): Không trả lời được, né tránh, hoặc mất kiểm soát`;

  return `Bạn là KHÁCH HÀNG trong một buổi thực hành bán hàng. KHÔNG phải nhân viên bán hàng.

${personaDescription}

THÔNG TIN SẢN PHẨM (chỉ để bạn biết ngữ cảnh, CHƯA được nhân viên giới thiệu):
${productInfo}

QUY TẮC VAI TRÒ BẮT BUỘC — VI PHẠM SẼ BỊ VÔ HIỆU:
1. Bạn là NGƯỜI MUA đang đánh giá, KHÔNG PHẢI người bán
2. KHÔNG BAO GIỜ giới thiệu sản phẩm như người bán hàng
3. KHÔNG liệt kê tính năng theo kiểu quảng cáo
4. KHÔNG biết trước giá cụ thể hoặc thông số kỹ thuật chi tiết — chỉ hỏi về chúng
5. KHÔNG đồng ý mua quá sớm (ít nhất 5 lượt đối thoại)
6. Chỉ được hỏi thêm, nêu lo ngại, phản biện nhẹ hoặc yêu cầu làm rõ
7. Phản ứng phù hợp với chất lượng câu trả lời: câu trả lời tốt → thái độ cởi mở hơn; câu trả lời kém → hoài nghi hơn

QUY TẮC NGÔN NGỮ VÀ ĐỊNH DẠNG:
- LUÔN trả lời bằng TIẾNG VIỆT (bất kể người dùng nói tiếng gì)
- Viết 1-3 câu hoàn chỉnh, tự nhiên như người nói chuyện thật
- KHÔNG kết thúc câu bằng: nhưng, và, hoặc, để, vì, làm, khi, nếu, hay, là, ,
- Mỗi phản hồi phải khác nhau, không lặp lại
- Giọng điệu: lịch sự nhưng thận trọng, đúng giọng khách hàng doanh nghiệp Việt Nam

${stageInstruction}

${scoringGuide}

FORMAT BẮT BUỘC — PHẢI TUÂN THỦ CHÍNH XÁC:
RESPONSE: <câu trả lời của khách hàng bằng tiếng Việt>
SCORE: <số từ 0-100>
FEEDBACK: <nhận xét ngắn bằng tiếng Việt về chất lượng câu trả lời của nhân viên>`;
}

// ─── Response Cleanup ─────────────────────────────────────────────────────────

function parseTextResponse(rawText: string, stage: string): ParsedResponse {
  try {
    const responseMatch = rawText.match(/RESPONSE:\s*([\s\S]*?)(?=\nSCORE:|$)/i);
    const scoreMatch = rawText.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = rawText.match(/FEEDBACK:\s*([\s\S]*?)$/i);

    let response = getFallbackResponseForStage(stage);
    let score = 50;
    let feedback = 'Tiếp tục cố gắng!';

    if (responseMatch?.[1]) {
      response = cleanupResponse(responseMatch[1].trim());
    }
    if (scoreMatch?.[1]) {
      score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
    }
    if (feedbackMatch?.[1]) {
      feedback = feedbackMatch[1].trim();
    }

    return { response, score, feedback, stage, outcome: null, isConversationComplete: false };
  } catch {
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

function cleanupResponse(response: string): string {
  let cleaned = response.trim();

  const incompleteEndings = ['nhưng', 'và', 'hoặc', 'để', 'vì', 'làm', 'khi', 'nếu', 'hay', 'là', ','];
  for (const ending of incompleteEndings) {
    cleaned = cleaned.replace(new RegExp(`\\s+${ending}$`, 'i'), '');
  }

  if (cleaned.length < 15) {
    cleaned = 'Nghe cũng hay. Bạn có thể giải thích thêm được không?';
  }

  return cleaned;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

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
      simulatorConfig,
    } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const currentStage = determineCustomerStage(turnCount, sessionScore);

    const systemPrompt = buildSystemPrompt(
      productName,
      productDescription,
      productPrice,
      currentStage,
      simulatorConfig as SimulatorConfig | undefined,
      customSystemPrompt,
    );

    // Build messages array
    const messages = (conversationHistory as ConversationMessage[]).map((msg) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    messages.push({ role: 'user', parts: [{ text: userMessage }] });

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.75,
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
      const errorData = await response.json().catch(() => ({}));
      console.error('[ai-sales-response] Gemini error:', response.status, errorData);

      return NextResponse.json({
        response: getFallbackResponseForStage(currentStage),
        score: 50,
        feedback: 'Tiếp tục cố gắng!',
        stage: currentStage,
        outcome: null,
        isConversationComplete: false,
      });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsedResponse = parseTextResponse(rawText, currentStage);

    // Determine completion and outcome
    let outcome: string | null = null;
    let isConversationComplete = false;

    if (currentStage === 'closing' && turnCount >= 6) {
      const finalScore = sessionScore + (parsedResponse.score - 50) / 8;
      outcome = determineSaleOutcome(finalScore, turnCount + 1);
      if (outcome) {
        isConversationComplete = true;
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
    console.error('[ai-sales-response] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI response',
        response: 'Bạn có thể giải thích rõ hơn được không?',
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
