import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    // 새로운 챗봇 API 엔드포인트로 요청 전송
    const response = await fetch('http://35.225.69.134:8000/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: userId, // 세션 식별자로 userId 사용
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chatbot');
    }

    const data = await response.json();
    
    // 응답 형식에 맞게 처리
    // 참고: 필요시 data.message 또는 다른 필드로 변경
    return NextResponse.json({ response: data.message || data.reply || data.response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 