'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, Info, Calendar, Cloud, Sun, CloudSun } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 풍향을 각도로 변환하는 함수
function getWindDirection(wd: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((wd + 360) % 360) / 22.5);
  return directions[index % 16];
}

// 방향에 따른 회전 각도 계산 함수 (바람/스웰이 향하는 방향으로 수정)
function getDirectionRotation(direction: string): number {
  const directionAngles: Record<string, number> = {
    'N': 180,  // 북쪽에서 오는 바람은 남쪽으로
    'NNE': 202.5,
    'NE': 225,  // 북동쪽에서 오는 바람은 남서쪽으로
    'ENE': 247.5,
    'E': 270,   // 동쪽에서 오는 바람은 서쪽으로
    'ESE': 292.5,
    'SE': 315,  // 남동쪽에서 오는 바람은 북서쪽으로
    'SSE': 337.5,
    'S': 0,     // 남쪽에서 오는 바람은 북쪽으로
    'SSW': 22.5,
    'SW': 45,   // 남서쪽에서 오는 바람은 북동쪽으로
    'WSW': 67.5,
    'W': 90,    // 서쪽에서 오는 바람은 동쪽으로
    'WNW': 112.5,
    'NW': 135,  // 북서쪽에서 오는 바람은 남동쪽으로
    'NNW': 157.5
  };
  return directionAngles[direction] || 0;
}

// 파도 등급 계산 함수
function calculateRating(wh_sig: number): { rating: string; color: string } {
  if (wh_sig < 0.5) return { rating: "POOR", color: "text-orange-500" };
  if (wh_sig < 1.0) return { rating: "POOR TO FAIR", color: "text-yellow-500" };
  if (wh_sig < 1.5) return { rating: "FAIR", color: "text-green-500" };
  if (wh_sig < 2.0) return { rating: "FAIR TO GOOD", color: "text-emerald-500" };
  return { rating: "GOOD", color: "text-blue-500" };
}

// 빈 데이터 생성 함수
function createEmptyForecast(hour: string) {
  return {
    time: hour,
    surf: "-",
    rating: "NO DATA",
    color: "text-muted-foreground",
    primarySwell: {
      height: "-",
      period: "-",
      direction: "N"
    },
    wind: {
      speed: "-",
      gust: "-",
      direction: "N"
    },
    weather: {
      temp: "-",
      icon: "partly-cloudy"
    },
    pressure: "-",
    probability: "-"
  };
}

// 날짜 포맷팅 함수
function formatDate(dateStr: string) {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${month}월${day}일`;
}

interface TideData {
  current: { height: string };
  points: Array<{
    time: string;
    height: string;
  }>;
  sunInfo: {
    firstLight: string;
    sunrise: string;
    sunset: string;
    lastLight: string;
  };
}

// 샘플 타이드 데이터 생성 함수
function generateTideData(date: string): TideData {
  const dateOffset = parseInt(date.substring(6, 8)) % 3;
  
  return {
    current: { height: `${1.2 + dateOffset * 0.1}m` },
    points: [
      { time: "5:34am", height: `${1.7 + dateOffset * 0.1}m` },
      { time: "12:14pm", height: `${0.3 + dateOffset * 0.1}m` },
      { time: "6:07pm", height: `${1.3 + dateOffset * 0.1}m` },
      { time: "11:54pm", height: `${0.3 + dateOffset * 0.1}m` },
    ],
    sunInfo: {
      firstLight: "5:30am",
      sunrise: "5:53am",
      sunset: "5:52pm",
      lastLight: "6:15pm",
    }
  };
}

export default function BeachPageClient({ beach }: { beach: string }) {
  const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
  const [tideData, setTideData] = useState<Record<string, TideData>>({});
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const decodedBeach = decodeURIComponent(beach);
  const hours = Array.from({ length: 8 }, (_, i) => `${(i * 3).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    async function fetchData() {
      // 먼저 해당 해수욕장의 대해구를 찾습니다
      const { data: lzoneData } = await supabase
        .from('waves')
        .select('lzone')
        .like('beach_name', `%${decodedBeach}%`)
        .limit(1);

      if (!lzoneData?.length) return;

      const lzone = lzoneData[0].lzone;

      // 해당 대해구의 모든 예보 데이터를 가져옵니다
      const { data: waveData } = await supabase
        .from('waves')
        .select('*')
        .eq('lzone', lzone)
        .order('date', { ascending: true });

      if (!waveData) return;

      // 날짜별로 데이터 그룹화
      const grouped: Record<string, any> = {};
      const tides: Record<string, TideData> = {};
      
      waveData.forEach(record => {
        const dateStr = record.date.toString();
        const date = dateStr.substring(0, 8);
        const hour = dateStr.substring(8, 10);
        
        if (!grouped[date]) {
          grouped[date] = {};
          hours.forEach(h => {
            grouped[date][h] = createEmptyForecast(h);
          });
          // 날짜별 타이드 데이터 생성
          tides[date] = generateTideData(date);
        }

        grouped[date][`${hour}:00`] = {
          time: `${hour}:00`,
          surf: `${(record.wave - 0.2).toFixed(1)}-${(record.wave + 0.2).toFixed(1)}`,
          ...calculateRating(record.wave),
          primarySwell: {
            height: `${record.wave.toFixed(1)}m`,
            period: `${Math.round(record.period)}`,
            direction: getWindDirection(record.wave_direction)
          },
          wind: {
            speed: Math.round(record.wind).toString(),
            gust: Math.round(record.wind * 1.3).toString(),
            direction: getWindDirection(record.wind_direction)
          },
          weather: {
            temp: "22",
            icon: "partly-cloudy"
          },
          pressure: "1018mb",
          probability: "95%"
        };
      });

      setGroupedData(grouped);
      setTideData(tides);
      setLoading(false);
    }

    fetchData();

    const channel = supabase
      .channel(`${decodedBeach}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waves'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [decodedBeach]);

  const toggleDay = (day: string) => {
    setOpenDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const getKeyHoursForecast = (forecasts: any[]) => {
    return forecasts.filter(f => ["06:00", "12:00", "18:00"].includes(f.time));
  };

  const renderTideSection = (tideData: TideData) => (
    <div className="mt-4 border-t border-border">
      <div className="flex justify-between items-center p-2">
        <div>
          <h2 className="text-base font-medium">Tides (m)</h2>
          <p className="text-xs text-muted-foreground">{decodedBeach}</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1 h-7 text-xs">
          <Calendar className="h-3 w-3" />
          <span>Tide calendar</span>
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="flex justify-between items-center p-2">
          <div className="text-base font-medium">{tideData.current.height}</div>
          <div className="text-xs text-muted-foreground">Now</div>
        </div>

        {/* Tide Chart */}
        <div className="relative h-32 bg-muted/50">
          {/* Tide line */}
          <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0,100 C100,50 200,30 300,50 C400,70 500,120 600,100 C700,80 800,50 900,70 C950,80 1000,90 1000,100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>

          {/* Tide points with labels */}
          {tideData.points.map((point, index) => {
            const positions = [
              { top: "top-1/4", left: "left-[15%]" },
              { top: "top-3/4", left: "left-[40%]" },
              { top: "top-1/3", left: "left-[65%]" },
              { top: "top-2/3", left: "left-[85%]" },
            ];
            return (
              <div key={index} className={`absolute ${positions[index].top} ${positions[index].left} -ml-6 -mt-6`}>
                <div className="text-[10px] text-muted-foreground">{point.time}</div>
                <div className="text-[10px] font-medium">{point.height}</div>
              </div>
            );
          })}

          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground px-2">
            <div>3am</div>
            <div>6am</div>
            <div>9am</div>
            <div>Noon</div>
            <div>3pm</div>
            <div>6pm</div>
            <div>9pm</div>
          </div>

          {/* Now indicator */}
          <div className="absolute top-0 bottom-0 left-[65%] w-px bg-border">
            <div className="absolute top-0 -ml-4 bg-background text-[10px] px-1 py-0.5 rounded border border-border">Now</div>
          </div>
        </div>

        {/* Sunrise/Sunset info */}
        <div className="grid grid-cols-2 gap-4 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-yellow-500 mr-1 text-xs">☀️</div>
              <div>
                <div className="text-[10px] text-muted-foreground">First light</div>
                <div className="text-xs font-medium">Sunrise</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>{tideData.sunInfo.firstLight}</div>
              <div>{tideData.sunInfo.sunrise}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-500 mr-1 text-xs">🌙</div>
              <div>
                <div className="text-[10px] text-muted-foreground">Sunset</div>
                <div className="text-xs font-medium">Last light</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>{tideData.sunInfo.sunset}</div>
              <div>{tideData.sunInfo.lastLight}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background p-4 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{decodedBeach}</h1>
      </div>
      {Object.entries(groupedData).map(([date, dayData]) => {
        const forecasts = Object.values(dayData);
        return (
          <Collapsible
            key={date}
            open={openDays.includes(date)}
            onOpenChange={() => toggleDay(date)}
          >
            <div className="border-b border-border last:border-b-0">
              <div className="p-2">
                <CollapsibleTrigger className="w-full">
                  <div className="flex justify-between items-center mb-2 hover:bg-muted/50 p-2 rounded-md cursor-pointer">
                    <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
                    <span className="text-muted-foreground">
                      {openDays.includes(date) ? "Show less" : "Show all times"}
                    </span>
                  </div>
                </CollapsibleTrigger>
                
                <div className="space-y-2">
                  <div className="w-full">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground text-xs">
                          <th className="p-2 font-medium w-[120px]">Surf</th>
                          <th className="p-2 font-medium hidden sm:table-cell w-[100px]">Rating</th>
                          <th className="p-2 font-medium w-[120px]">Swell</th>
                          <th className="p-2 font-medium w-[120px]">Wind</th>
                          <th className="p-2 font-medium hidden lg:table-cell w-[100px]">Weather</th>
                          <th className="p-2 font-medium hidden xl:table-cell w-[80px]">Pressure</th>
                          <th className="p-2 font-medium hidden xl:table-cell w-[80px]">
                            Prob
                            <Info className="h-3 w-3 inline-block ml-1 text-muted-foreground" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(openDays.includes(date) ? forecasts : getKeyHoursForecast(forecasts)).map((forecast, index) => (
                          <tr key={index} className="border-t border-border hover:bg-muted/50">
                            <td className="p-2 w-[120px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-0.5 h-8 ${forecast.color}`}></div>
                                <div>
                                  <div className="text-xs text-muted-foreground">{forecast.time}</div>
                                  <div className="text-sm font-medium">{forecast.surf}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2 hidden sm:table-cell w-[100px]">
                              <div className={`${forecast.color} text-sm font-medium truncate`}>{forecast.rating}</div>
                            </td>
                            <td className="p-2 w-[120px]">
                              <div className="flex items-center text-xs">
                                <div className="font-medium mr-1">{forecast.primarySwell.height}</div>
                                <div className="text-muted-foreground mr-1">{forecast.primarySwell.period}s</div>
                                <div
                                  className="transform"
                                  style={{ rotate: `${getDirectionRotation(forecast.primarySwell.direction)}deg` }}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </div>
                              </div>
                            </td>
                            <td className="p-2 w-[120px]">
                              <div className="flex items-center bg-muted px-2 py-1 rounded-md text-xs">
                                <div className="flex flex-col items-center">
                                  <div className="font-medium">{forecast.wind.speed}</div>
                                  <div className="text-[10px] text-destructive">{forecast.wind.gust}</div>
                                  <div className="text-[10px] text-muted-foreground">kph</div>
                                </div>
                                <div
                                  className="ml-1 transform"
                                  style={{ rotate: `${getDirectionRotation(forecast.wind.direction)}deg` }}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </div>
                              </div>
                            </td>
                            <td className="p-2 w-[100px] hidden lg:table-cell">
                              <div className="flex items-center">
                                <CloudSun className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                <div className="ml-1 sm:ml-2 text-sm">{forecast.weather.temp}°c</div>
                              </div>
                            </td>
                            <td className="p-2 w-[80px] hidden xl:table-cell">
                              <div className="text-sm">{forecast.pressure}</div>
                            </td>
                            <td className="p-2 w-[80px] hidden xl:table-cell">
                              <div className="text-sm">{forecast.probability}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <CollapsibleContent>
                    {tideData[date] && renderTideSection(tideData[date])}
                  </CollapsibleContent>
                </div>
              </div>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
} 