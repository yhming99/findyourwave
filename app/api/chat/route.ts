import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    // n8n 웹훅으로 요청 전송
    const response = await fetch('https://n8n.findyourwave.uk/webhook/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: userId, // Postgres Chat Memory의 키로 사용될 userId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chatbot');
    }

    const data = await response.json();
    return NextResponse.json({ response: data.reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 