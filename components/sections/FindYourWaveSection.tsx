"use client"

/**
 * FindYourWaveSection 컴포넌트
 * 
 * 사용자와 대화형으로 서핑 스팟을 찾아주는 메인 섹션입니다.
 * 채팅 인터페이스를 통해 사용자의 요구사항을 파악하고
 * 적절한 서핑 스팟을 추천해줍니다.
 */


import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FindYourWaveSection() {
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
          <div className="space-y-4">
            {/* AI 메시지 */}
            <div className="flex gap-3 justify-start">
              <Avatar>
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="bg-white/20 text-white p-3 rounded-lg rounded-tl-none">
                Hello! I'm your wave finder. Tell me what kind of waves you're looking for!
              </div>
            </div>

            {/* 사용자 메시지 */}
            <div className="flex gap-3 justify-end">
              <div className="bg-primary/20 backdrop-blur-sm text-white p-3 rounded-lg rounded-tr-none">
                I'm looking for beginner-friendly waves this weekend.
              </div>
              <Avatar>
                <AvatarImage src="/user-avatar.png" />
                <AvatarFallback>Me</AvatarFallback>
              </Avatar>
            </div>

            {/* AI 응답 */}
            <div className="flex gap-3 justify-start">
              <Avatar>
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="bg-white/20 text-white p-3 rounded-lg rounded-tl-none">
                Great! I'll find some gentle waves perfect for beginners. Any specific location you have in mind?
              </div>
            </div>
          </div>

          <form className="flex gap-2">
            <Input
              placeholder="원하는 파도 조건을 입력하세요..."
              className="flex-1 bg-white/20 border-white/20 text-white placeholder:text-white/50"
            />
            <Button className="bg-primary/80 hover:bg-primary text-white">
              전송
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
} 