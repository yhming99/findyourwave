'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BeachGroup {
  region: string;
  beaches: Array<{
    name: string;
    lzone: string;
  }>;
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
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    async function fetchBeaches() {
      // 먼저 waves 테이블에서 lzone이 있는 beach_name들을 가져옴
      const { data: wavesData, error: wavesError } = await supabase
        .from('waves')
        .select('beach_name, lzone')
        .not('lzone', 'is', null);

      if (wavesError) {
        console.error('Error fetching waves:', wavesError);
        return;
      }

      // 유효한 beach_name 목록 생성
      const validBeaches = new Set(
        wavesData.flatMap(wave => 
          wave.beach_name.split(',').map((b: string) => b.trim())
        )
      );

      // beaches 테이블에서 region 정보 가져오기
      const { data: beachesData, error: beachesError } = await supabase
        .from('beaches')
        .select('beach_name, region')
        .in('beach_name', Array.from(validBeaches));

      if (beachesError) {
        console.error('Error fetching beaches:', beachesError);
        return;
      }

      // region별로 그룹화
      const groupedBeaches = beachesData.reduce((acc: BeachGroup[], curr) => {
        if (!matchesSearch(curr.beach_name, searchTerm)) return acc;

        const wave = wavesData.find(w => 
          w.beach_name.split(',').map((b: string) => b.trim()).includes(curr.beach_name)
        );
        
        if (!wave) return acc;

        const existingGroup = acc.find(g => g.region === curr.region);
        const beachInfo = {
          name: curr.beach_name,
          lzone: wave.lzone
        };

        if (existingGroup) {
          existingGroup.beaches.push(beachInfo);
        } else {
          acc.push({
            region: curr.region,
            beaches: [beachInfo]
          });
        }

        return acc;
      }, []);

      // region 이름으로 정렬
      const sortedGroups = groupedBeaches.sort((a, b) => 
        a.region.localeCompare(b.region)
      );

      setBeachGroups(sortedGroups);
      setLoading(false);
    }

    fetchBeaches();
  }, [searchTerm]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">해수욕장 파도 예보</h1>
      {beachGroups.length === 0 ? (
        <div className="text-center text-gray-500">
          검색 결과가 없습니다.
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
                          key={beach.name}
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