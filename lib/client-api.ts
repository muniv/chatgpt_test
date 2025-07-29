export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  imageUrl?: string;
  searchResults?: string;
}

// 클라이언트 사이드에서 OpenAI API 직접 호출
export async function sendChatMessage(
  messages: ChatMessage[],
  apiKey: string
): Promise<ChatResponse> {
  try {
    console.log("=== 클라이언트 사이드 채팅 API 호출 ===");

    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages must be a non-empty array");
    }

    // 시스템 메시지와 대화 히스토리 결합
    const systemMessage: ChatMessage = {
      role: "system",
      content: `당신은 도움이 되고 친근한 AI 어시스턴트입니다. 

**중요한 규칙:**
1. 사용자가 최신 정보나 실시간 데이터가 필요한 질문을 하면 반드시 web_search 함수를 사용하세요.
2. 사용자가 "그려줘", "그려", "그림", "이미지 생성", "만들어줘", "그려봐" 등 이미지 생성과 관련된 요청을 하면 반드시 image_generation 함수를 사용하세요.
3. 이미지 생성 시에는 대화의 전체 맥락을 conversation_context에 포함하세요.
4. 함수 호출 후 결과를 사용자에게 친근하게 설명해주세요.`
    };
    
    const allMessages = [systemMessage, ...messages];

    // 직접 이미지 생성 키워드 감지
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const imageKeywords = [
      "그려줘", "그려", "그림", "이미지", "만들어줘", "그려봐",
      "draw", "create", "generate", "image"
    ];
    const hasImageKeyword = imageKeywords.some(keyword =>
      lastUserMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log("마지막 사용자 메시지:", lastUserMessage);
    console.log("이미지 키워드 감지:", hasImageKeyword);

    // Chat Completions API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: allMessages,
        max_tokens: 2000,
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for current information",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query"
                  }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "image_generation",
              description: "Generate an image based on a text prompt with conversation context",
              parameters: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "The image generation prompt"
                  },
                  conversation_context: {
                    type: "string",
                    description: "The conversation context to consider"
                  }
                },
                required: ["prompt", "conversation_context"]
              }
            }
          }
        ],
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("OpenAI 응답:", data);

    let aiResponse = "";
    let imageUrl = "";
    let searchResults = "";

    // Function Calling 결과 처리
    if (data.choices[0]?.message?.tool_calls) {
      for (const toolCall of data.choices[0].message.tool_calls) {
        if (toolCall.function.name === "web_search") {
          const searchQuery = JSON.parse(toolCall.function.arguments).query;
          console.log("웹 검색 실행:", searchQuery);
          
          // 간단한 검색 결과 시뮬레이션 (실제로는 SerpAPI 사용)
          searchResults = `🔍 **검색 결과: ${searchQuery}**\n\n현재 GitHub Pages 환경에서는 실시간 웹 검색 기능이 제한됩니다. 실제 검색 결과를 보려면 로컬 환경에서 SerpAPI를 설정해주세요.`;
        }
        
        if (toolCall.function.name === "image_generation") {
          const { prompt, conversation_context } = JSON.parse(toolCall.function.arguments);
          console.log("이미지 생성 실행:", prompt);
          
          // DALL-E API 호출
          const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: prompt,
              n: 1,
              size: "1024x1024"
            })
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageUrl = imageData.data[0].url;
            console.log("이미지 생성 완료:", imageUrl);
          } else {
            console.error("이미지 생성 실패:", await imageResponse.text());
          }
        }
      }
    }

    // AI 응답 처리
    aiResponse = data.choices[0]?.message?.content || "";

    // 이미지 키워드가 감지되었지만 Function Calling이 실행되지 않은 경우
    if (hasImageKeyword && !imageUrl) {
      console.log("직접 이미지 생성 실행");
      
      const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: lastUserMessage,
          n: 1,
          size: "1024x1024"
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.data[0].url;
        console.log("직접 이미지 생성 완료:", imageUrl);
      }
    }

    return {
      message: aiResponse,
      imageUrl,
      searchResults
    };

  } catch (error) {
    console.error("채팅 API 오류:", error);
    throw error;
  }
}

// API 키 유효성 검사
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error("API 키 검증 오류:", error);
    return false;
  }
} 