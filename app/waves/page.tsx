'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BeachGroup {
  lzone: string;
  beaches: string[];
}

// 해수욕장 이름에서 접미사를 제거하고 검색어와 매칭되는지 확인
function matchesSearch(beachName: string, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  // 접미사 제거 ("해수욕장", "해변" 등)
  const cleanName = beachName.replace(/(해수욕장|해변)$/, '').trim();
  return cleanName.toLowerCase().includes(searchTerm.toLowerCase());
}

export default function WavesPage() {
  const [beachGroups, setBeachGroups] = useState<BeachGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    async function fetchBeaches() {
      const { data, error } = await supabase
        .from('waves')
        .select('lzone, beach_name')
        .order('lzone');

      if (error) {
        console.error('Error fetching beaches:', error);
        return;
      }

      // 대해구별로 해수욕장 그룹화
      const groups = data.reduce((acc: BeachGroup[], curr) => {
        const existingGroup = acc.find(g => g.lzone === curr.lzone);
        const beaches = curr.beach_name.split(',')
          .map((b: string) => b.trim())
          .filter((beach: string) => matchesSearch(beach, searchTerm)); // 검색어로 필터링
        
        if (beaches.length > 0) {  // 검색 결과가 있는 경우만 추가
          if (existingGroup) {
            existingGroup.beaches = Array.from(new Set([...existingGroup.beaches, ...beaches]));
          } else {
            acc.push({ lzone: curr.lzone, beaches });
          }
        }
        
        return acc;
      }, []);

      setBeachGroups(groups);
      setLoading(false);
    }

    fetchBeaches();
  }, [searchTerm]); // searchTerm이 변경될 때마다 다시 필터링

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">해수욕장 파도 예보</h1>
      {beachGroups.length === 0 ? (
        <div className="text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beachGroups.map((group) => (
            <Card key={group.lzone}>
              <CardHeader>
                <CardTitle>대해구 {group.lzone}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {group.beaches.map((beach) => (
                    <li key={beach}>
                      <Link 
                        href={`/waves/${encodeURIComponent(beach)}`}
                        className="text-blue-500 hover:underline"
                      >
                        {beach}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 