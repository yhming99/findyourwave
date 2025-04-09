"use client"

/**
 * FindYourWaveSection 컴포넌트
 * 
 * 사용자와 대화형으로 서핑 스팟을 찾아주는 메인 섹션입니다.
 * 채팅 인터페이스를 통해 사용자의 요구사항을 파악하고
 * 적절한 서핑 스팟을 추천해줍니다.
 */

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FindYourWaveSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your wave finder. Tell me what kind of waves you're looking for!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    getUser();
  }, [supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 로그인 체크
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    try {
      setIsLoading(true);
      const userMessage = { role: 'user' as const, content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-full flex flex-col justify-center">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
            Find Your Wave
          </h1>
          <p className="text-white/80">
            당신에게 딱 맞는 파도를 찾아보세요
          </p>
        </div>

        <div className="rounded-lg border bg-white/10 backdrop-blur-sm p-4 space-y-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar>
                    <AvatarImage src="/bot-avatar.png" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`${
                    message.role === 'user'
                      ? 'bg-white/20 backdrop-blur-sm text-white rounded-lg rounded-tr-none'
                      : 'bg-white/20 text-white rounded-lg rounded-tl-none'
                  } p-3`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar>
                    <AvatarImage src="/user-avatar.png" />
                    <AvatarFallback>Me</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar>
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-white/20 text-white rounded-lg rounded-tl-none p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={userId ? "원하는 파도 조건을 입력하세요..." : "로그인 후 이용 가능합니다"}
              className="flex-1 bg-white/20 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading || !userId}
            />
            <Button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading || !userId}
            >
              {isLoading ? '전송 중...' : userId ? '전송' : '로그인'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
} 