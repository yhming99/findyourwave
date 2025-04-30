/**
 * MustRideWaveSection 컴포넌트
 * 
 * 각 지역구별로 점수가 가장 높은 서핑 스팟들을 카드 형태로 보여주는 섹션입니다.
 * 각 카드에는 해변 이미지, 파도 높이, 날짜, 평점 등의 정보가 포함됩니다.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
         ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
         ChevronLeft, ChevronRight } from 'lucide-react';

interface Beach {
  region: string;
  beach_name: string;
  date: string;
  surf_score: number;
  wave: number;
  wave_direction?: string | number;
  period: number;
  wind: number;
  wind_direction?: string | number;
}

// 방향에 따른 화살표 컴포넌트
const DirectionArrow = ({ direction, isWind = false }: { direction?: string | number, isWind?: boolean }) => {
  if (direction === undefined || direction === null) return null;
  
  // 문자열이면 숫자로 변환
  const numDegree = typeof direction === 'string' ? parseFloat(direction) : direction;
  
  // 8방향으로 변환 (0도는 북쪽, 시계 방향으로 증가)
  let directionStr: keyof typeof arrowMap | undefined;
  if (numDegree >= 337.5 || numDegree < 22.5) directionStr = 'N';
  else if (numDegree >= 22.5 && numDegree < 67.5) directionStr = 'NE';
  else if (numDegree >= 67.5 && numDegree < 112.5) directionStr = 'E';
  else if (numDegree >= 112.5 && numDegree < 157.5) directionStr = 'SE';
  else if (numDegree >= 157.5 && numDegree < 202.5) directionStr = 'S';
  else if (numDegree >= 202.5 && numDegree < 247.5) directionStr = 'SW';
  else if (numDegree >= 247.5 && numDegree < 292.5) directionStr = 'W';
  else if (numDegree >= 292.5 && numDegree < 337.5) directionStr = 'NW';
  else return null;
  
  // 파도 방향 화살표 (파도가 오는 방향)
  const waveArrowMap = {
    'N': ArrowDown,    // 북쪽에서 오는 바람은 남쪽으로 가는 화살표
    'NE': ArrowDownLeft,
    'E': ArrowLeft,
    'SE': ArrowUpLeft,
    'S': ArrowUp,
    'SW': ArrowUpRight,
    'W': ArrowRight,
    'NW': ArrowDownRight
  } as const;
  
  // 바람 방향 화살표 (바람이 불어오는 방향에서 반대로)
  const windArrowMap = {
    'N': ArrowDown,    // 북쪽에서 오는 바람은 남쪽으로 가는 화살표
    'NE': ArrowDownLeft,
    'E': ArrowLeft,
    'SE': ArrowUpLeft,
    'S': ArrowUp,
    'SW': ArrowUpRight,
    'W': ArrowRight,
    'NW': ArrowDownRight
  } as const;
  
  // 바람이면 바람용 화살표, 아니면 파도용 화살표 사용
  const arrowMap = isWind ? windArrowMap : waveArrowMap;
  
  const Arrow = arrowMap[directionStr];
  if (!Arrow) return null;

  return <Arrow className="h-4 w-4 inline ml-1" />;
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
  const [currentPage, setCurrentPage] = useState(1);
  const beachesPerPage = 6;

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

        // 각 지역구별로 최고 점수 선택
        const bestScoresByRegion: { [region: string]: Beach } = {};
        
        Object.values(bestScoresByBeach).forEach(beach => {
          const region = beach.region;
          if (!bestScoresByRegion[region] || bestScoresByRegion[region].surf_score < beach.surf_score) {
            bestScoresByRegion[region] = beach;
          }
        });

        // 점수 순으로 정렬
        const bestRegionalBeaches = Object.values(bestScoresByRegion)
          .sort((a, b) => b.surf_score - a.surf_score);

        setTopBeaches(bestRegionalBeaches);
      } catch (error: any) {
        console.error('Detailed error:', error);
        setError(error?.message || 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopBeaches();
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 현재 페이지의 해변들
  const currentBeaches = topBeaches.slice(
    (currentPage - 1) * beachesPerPage,
    currentPage * beachesPerPage
  );

  // 총 페이지 수
  const totalPages = Math.ceil(topBeaches.length / beachesPerPage);

  return (
    <section className="h-full flex flex-col justify-center py-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
            Must Ride Waves
          </h1>
          <p className="text-white/80">
            각 지역 최고의 서핑 스팟
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center text-white/80">로딩 중...</div>
          ) : error ? (
            <div className="col-span-full text-center text-red-400">
              {error}
            </div>
          ) : topBeaches.length === 0 ? (
            <div className="col-span-full text-center text-white/80">
              추천 해변이 없습니다. best_spot 테이블에 데이터를 추가해주세요.
            </div>
          ) : (
            currentBeaches.map((beach) => (
              <Link 
                key={beach.beach_name}
                href={`/waves/${encodeURIComponent(beach.beach_name)}`} 
                className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-transform hover:scale-105 h-40"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
                <div className="absolute inset-x-0 top-0 p-3 text-white z-20 bg-black/40">
                  <h3 className="text-lg font-bold">{beach.region} {beach.beach_name}</h3>
                  <p className="text-xs opacity-90">{formatDate(beach.date)}</p>
                  <p className="text-xs opacity-90">
                    파도:{beach.wave.toFixed(1)}m <DirectionArrow direction={beach.wave_direction} /> | 피리어드:{beach.period.toFixed(1)}s | 풍속:{beach.wind.toFixed(1)}m/s <DirectionArrow direction={beach.wind_direction} isWind={true} />
                  </p>
                  <div className="text-sm font-semibold text-yellow-400 mt-1">
                    점수: {beach.surf_score.toFixed(2)}
                  </div>
                </div>
                <div className="absolute bottom-2 right-3 text-xs text-white/80 z-20">
                  파도 상세 보기 →
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentPage === 1 
                  ? 'text-white/40 cursor-not-allowed' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentPage === index + 1
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentPage === totalPages
                  ? 'text-white/40 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
} 