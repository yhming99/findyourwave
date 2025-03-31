/**
 * BestWaveSection 컴포넌트
 * 
 * 전 세계의 인기 있는 서핑 스팟들을 지도와 함께 보여주는 섹션입니다.
 * 인터랙티브 맵에 각 스팟의 위치가 표시되며, 
 * 하단에는 주요 스팟들의 상세 정보가 카드 형태로 제공됩니다.
 */

import { Button } from "@/components/ui/button"

export function BestWaveSection() {
  return (
    <section className="h-full flex flex-col justify-center">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
            Best Waves
          </h1>
          <p className="text-white/80">
            세계적으로 유명한 서핑 스팟
          </p>
        </div>

        <div className="relative w-full h-36 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-white/80">Ready to catch your wave?</h3>
              <p className="text-white/80 mb-4">Join us and find your perfect spot</p>
              <Button size="lg">Get Started</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 