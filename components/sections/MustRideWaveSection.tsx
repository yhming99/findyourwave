/**
 * MustRideWaveSection 컴포넌트
 * 
 * 다음 주에 꼭 가봐야 할 서핑 스팟들을 카드 형태로 보여주는 섹션입니다.
 * 각 카드에는 해변 이미지, 파도 높이, 날짜, 평점 등의 정보가 포함됩니다.
 */


import Link from "next/link"


interface Beach {
  id: string
  name: string
  waveHeight: string
  date: string
  rating: number
  imageUrl: string
}



export function MustRideWaveSection() {
  return (
    <section className="h-full flex flex-col justify-center">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
            Must Ride Waves
          </h1>
          <p className="text-white/80">
            이번 주 꼭 가봐야 할 서핑 스팟
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link href="/notes?beach=죽도" className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-transform hover:scale-105 h-36">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
              <h3 className="text-xl font-bold mb-1">양양 죽도해변</h3>
              <p className="text-sm opacity-90">파고: 1.5m | 풍속: 5m/s</p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/notes?beach=정암" className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-transform hover:scale-105 h-36">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
              <h3 className="text-xl font-bold mb-1">양양 정암해변</h3>
              <p className="text-sm opacity-90">파고: 2.0m | 풍속: 3m/s</p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/notes?beach=금진" className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-transform hover:scale-105 h-36">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
              <h3 className="text-xl font-bold mb-1">강릉 금진해변</h3>
              <p className="text-sm opacity-90">파고: 1.8m | 풍속: 4m/s</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
} 