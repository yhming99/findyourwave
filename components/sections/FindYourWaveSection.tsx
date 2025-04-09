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
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FindYourWaveSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "안녕하세요! 원하시는 파도 조건을 말씀해주세요!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // 브라우저 localStorage에서 visitorId를 가져오거나 새로 생성
    const storedVisitorId = localStorage.getItem('visitorId');
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
    } else {
      const newVisitorId = uuidv4();
      localStorage.setItem('visitorId', newVisitorId);
      setVisitorId(newVisitorId);
    }
  }, []);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage = { role: 'user' as const, content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch('https://n8n.findyourwave.uk/webhook/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId: visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('API Response:', data);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
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
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`${
                    message.role === 'user'
                      ? 'bg-white/10 backdrop-blur-sm text-white rounded-lg rounded-tr-none'
                      : 'bg-white/10 text-white rounded-lg rounded-tl-none'
                  } p-3`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar>
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
              placeholder="원하는 파도 조건을 입력하세요..."
              className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            <Button 
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            >
              {isLoading ? '전송 중...' : '전송'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
} 