/**
 * MustRideWaveSection 컴포넌트
 * 
 * 다음 주에 꼭 가봐야 할 서핑 스팟들을 카드 형태로 보여주는 섹션입니다.
 * 각 카드에는 해변 이미지, 파도 높이, 날짜, 평점 등의 정보가 포함됩니다.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
         ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight } from 'lucide-react';

interface Beach {
  region: string;
  beach_name: string;
  date: string;
  surf_score: number;
  wave: number;
  wave_direction?: string;
  period: number;
  wind: number;
  wind_direction?: string;
}

// 방향에 따른 화살표 컴포넌트 매핑
const DirectionArrow = ({ direction }: { direction?: string }) => {
  if (!direction) return null;
  
  const arrows = {
    'N': ArrowUp,
    'NE': ArrowUpRight,
    'E': ArrowRight,
    'SE': ArrowDownRight,
    'S': ArrowDown,
    'SW': ArrowDownLeft,
    'W': ArrowLeft,
    'NW': ArrowUpLeft
  };

  const Arrow = arrows[direction as keyof typeof arrows];
  if (!Arrow) {
    console.log('Invalid direction:', direction);
    return null;
  }

  return (
    <Arrow className="h-4 w-4 inline ml-1" />
  );
};

// 날짜 포맷 함수 추가
const formatDate = (dateStr: string) => {
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  const hour = dateStr.substring(8, 10);
  return `${month}월${day}일 ${hour}시`;
};

export function MustRideWaveSection() {
  const [topBeaches, setTopBeaches] = useState<Beach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchTopBeaches = async () => {
      try {
        // 현재 날짜 기준으로 3일치 데이터 범위 계산
        const today = new Date();
        const dates = Array.from({length: 3}, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          return date.getFullYear() +
                 String(date.getMonth() + 1).padStart(2, '0') +
                 String(date.getDate()).padStart(2, '0');
        });

        // 주간 시간대 (06시 ~ 18시)
        const dayHours = ['06', '09', '12', '15', '18'];
        
        // 날짜와 시간 조합으로 필터 생성
        const dateTimeFilters = dates.flatMap(date => 
          dayHours.map(hour => `date.eq.${date}${hour}`)
        ).join(',');

        const { data, error: fetchError } = await supabase
          .from('best_spot')
          .select('region, beach_name, date, surf_score, wave, wave_direction, period, wind, wind_direction')
          .or(dateTimeFilters)
          .order('surf_score', { ascending: false });

        console.log('Fetch result:', { data, fetchError, dateTimeFilters });

        if (fetchError) {
          setError(`데이터 가져오기 오류: ${fetchError.message}`);
          return;
        }

        if (!data || data.length === 0) {
          console.log('No data found in best_spot table');
          setTopBeaches([]);
          return;
        }

        // 각 해변별로 최고 점수만 선택
        const bestScoresByBeach = data.reduce((acc: { [key: string]: Beach }, curr) => {
          const key = curr.beach_name;
          if (!acc[key] || acc[key].surf_score < curr.surf_score) {
            acc[key] = curr;
          }
          return acc;
        }, {});

        // 최고 점수 순으로 정렬하여 상위 3개 선택
        const topSpots = Object.values(bestScoresByBeach)
          .sort((a, b) => b.surf_score - a.surf_score)
          .slice(0, 3);

        setTopBeaches(topSpots);
      } catch (error: any) {
        console.error('Detailed error:', error);
        setError(error?.message || 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopBeaches();
  }, []);

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
          {isLoading ? (
            <div className="col-span-3 text-center text-white/80">로딩 중...</div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-400">
              {error}
            </div>
          ) : topBeaches.length === 0 ? (
            <div className="col-span-3 text-center text-white/80">
              추천 해변이 없습니다. best_spot 테이블에 데이터를 추가해주세요.
            </div>
          ) : (
            topBeaches.map((beach) => (
              <Link 
                key={beach.beach_name}
                href={`/waves/${encodeURIComponent(beach.beach_name)}`} 
                className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-transform hover:scale-105 h-48"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
                <div className="absolute inset-x-0 top-0 p-4 text-white z-20 bg-black/40">
                  <h3 className="text-xl font-bold">{beach.region} {beach.beach_name}</h3>
                  <p className="text-sm opacity-90">{formatDate(beach.date)}</p>
                  <p className="text-sm opacity-90">
                    파도: {beach.wave}m <DirectionArrow direction={beach.wave_direction} /> | 
                    피리어드: {beach.period}s | 
                    풍속: {beach.wind}m/s <DirectionArrow direction={beach.wind_direction} />
                  </p>
                  <div className="text-sm font-semibold text-yellow-400">
                    점수: {beach.surf_score.toFixed(1)}
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-sm text-white/80 z-20">
                  파도 상세 보기 →
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
} 