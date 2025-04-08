'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WaveData {
  beach_name: string;
  lzone: string;
}

interface BeachData {
  beach_name: string;
  region: string;
}

interface BeachGroup {
  region: string;
  beaches: Array<{
    name: string;
    lzone: string;
  }>;
}

interface JoinedData {
  beach_name: string;
  lzone: string;
  beaches: {
    region: string;
  } | null;
}

interface ProcessedBeach {
  name: string;
  lzone: string;
  region: string;
}

// 해수욕장 이름에서 접미사를 제거하고 검색어와 매칭되는지 확인
function matchesSearch(beachName: string, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  // 접미사 제거 ("해수욕장", "해변" 등)
  const cleanName = beachName.replace(/(해수욕장|해변)$/, '').trim();
  return cleanName.toLowerCase().includes(searchTerm.toLowerCase());
}

function WavesContent() {
  const [beachGroups, setBeachGroups] = useState<BeachGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    async function fetchBeaches() {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching waves data...');

        // waves 테이블에서 데이터 가져오기
        const { data: wavesData, error: wavesError } = await supabase
          .from('waves')
          .select('beach_name, lzone, date')
          .not('lzone', 'is', null)
          .order('date', { ascending: false })
          .limit(1000);

        if (wavesError) {
          console.error('Error fetching waves data:', wavesError);
          setError(`파도 데이터를 가져오는 중 오류가 발생했습니다: ${wavesError.message}`);
          return;
        }

        if (!wavesData || wavesData.length === 0) {
          console.log('No waves data found');
          setBeachGroups([]);
          return;
        }

        console.log('Total waves data:', wavesData.length);
        
        // Set 대신 Object.values().filter() 사용
        const availableDates = Object.values(
          wavesData.reduce((acc: Record<string, string>, w) => {
            acc[w.date] = w.date;
            return acc;
          }, {})
        ).slice(0, 5);
        console.log('Available dates:', availableDates);

        // 가장 최근 날짜의 데이터만 사용
        const latestDate = wavesData[0].date;
        console.log('Using date:', latestDate);
        
        const todayData = wavesData.filter(wave => wave.date === latestDate);
        console.log('Latest data count:', todayData.length);

        // beach_name, lzone, region을 모두 함께 사용하여 유니크한 조합 생성
        const validBeaches = todayData.flatMap((wave: WaveData) => 
          wave.beach_name.split(',').map((b: string) => ({
            name: b.trim(),
            lzone: wave.lzone
          }))
        );

        console.log('Valid beaches:', validBeaches.length);

        // beaches 테이블에서 region 정보 가져오기
        const { data: beachesData, error: beachesError } = await supabase
          .from('beaches')
          .select('beach_name, region')
          .in('beach_name', validBeaches.map(b => b.name));

        if (beachesError) {
          console.error('Error fetching beaches data:', beachesError);
          setError(`해수욕장 정보를 가져오는 중 오류가 발생했습니다: ${beachesError.message}`);
          return;
        }

        if (!beachesData || beachesData.length === 0) {
          console.log('No beaches data found');
          setBeachGroups([]);
          return;
        }

        // 데이터 매핑 및 필터링 - lzone과 region을 함께 고려
        const filteredData = beachesData
          .filter(beach => matchesSearch(beach.beach_name, searchTerm))
          .flatMap(beach => {
            return validBeaches
              .filter(vb => vb.name === beach.beach_name)
              .map(vb => ({
                name: beach.beach_name,
                lzone: vb.lzone,
                region: beach.region
              }));
          })
          .filter(item => item.lzone);

        // region별로 그룹화 - lzone 포함하여 유니크하게 처리
        const groupedData = filteredData.reduce((groups: Record<string, BeachGroup>, item) => {
          if (!groups[item.region]) {
            groups[item.region] = {
              region: item.region,
              beaches: []
            };
          }
          
          // 같은 이름과 lzone 조합이 없을 때만 추가
          const exists = groups[item.region].beaches.some(
            b => b.name === item.name && b.lzone === item.lzone
          );
          
          if (!exists) {
            groups[item.region].beaches.push({
              name: item.name,
              lzone: item.lzone
            });
          }
          
          return groups;
        }, {});

        // 최종 정렬된 그룹 배열 생성
        const sortedGroups = Object.values(groupedData)
          .sort((a, b) => a.region.localeCompare(b.region))
          .map(group => ({
            ...group,
            beaches: group.beaches.sort((a, b) => a.name.localeCompare(b.name))
          }));

        console.log('Grouped beaches count:', sortedGroups.length);
        setBeachGroups(sortedGroups);
      } catch (error) {
        console.error('Unexpected error:', error);
        setError('예상치 못한 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchBeaches();
  }, [searchTerm]);

  if (loading) return <div className="p-4">데이터를 불러오는 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">해수욕장 파도 예보</h1>
      {beachGroups.length === 0 ? (
        <div className="text-center text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-8">
          {beachGroups.map((group) => (
            <div key={group.region} className="space-y-4">
              <h2 className="text-xl font-semibold">{group.region}</h2>
              <Card className="w-full">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4">
                    {group.beaches
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((beach) => (
                        <Link 
                          key={`${beach.name}-${beach.lzone}`}
                          href={`/waves/${encodeURIComponent(beach.name)}`}
                          className="text-blue-500 hover:underline whitespace-nowrap"
                        >
                          {beach.name} ({beach.lzone})
                        </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WavesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <WavesContent />
    </Suspense>
  );
} 