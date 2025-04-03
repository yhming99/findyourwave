'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BeachGroup {
  lzone: number;
  beaches: string[];
}

export default function WavesPage() {
  const [beachGroups, setBeachGroups] = useState<BeachGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBeaches() {
      const { data, error } = await supabase
        .from('waves')
        .select('lzone, beach_name')
        .eq('date', '2025040200'); // 첫 번째 타임스탬프만 가져옴

      if (error) {
        console.error('Error fetching beaches:', error);
        return;
      }

      // 대해구별로 해수욕장 그룹화
      const groups = data.reduce((acc: BeachGroup[], curr) => {
        const existingGroup = acc.find(g => g.lzone === curr.lzone);
        const beaches = curr.beach_name.split(',').map((b: string) => b.trim());
        
        if (existingGroup) {
          existingGroup.beaches = beaches;
        } else {
          acc.push({ lzone: curr.lzone, beaches });
        }
        
        return acc;
      }, []);

      setBeachGroups(groups);
      setLoading(false);
    }

    fetchBeaches();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">해수욕장 파도 예보</h1>
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
    </div>
  );
} 