"use client";

import { FindYourWaveSection } from "@/components/sections/FindYourWaveSection"
import { MustRideWaveSection } from "@/components/sections/MustRideWaveSection"
import { BestWaveSection } from "@/components/sections/BestWaveSection"

export default function Home() {
  return (
    <main className="snap-y snap-mandatory h-[calc(100vh-4rem)] w-full overflow-y-auto">
      <div className="snap-start min-h-[calc(100vh-4rem)] w-full flex items-center justify-center relative">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/wav1.png"
            alt="Wave background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <FindYourWaveSection />
        </div>
      </div>

      <div className="snap-start min-h-[calc(100vh-4rem)] w-full flex items-center justify-center relative">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/wav3.png"
            alt="Wave background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <MustRideWaveSection />
        </div>
      </div>

      <div className="snap-start min-h-[calc(100vh-4rem)] w-full flex items-center justify-center relative">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/wav4.png"
            alt="Wave background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <BestWaveSection />
        </div>
      </div>
    </main>
  );
}
