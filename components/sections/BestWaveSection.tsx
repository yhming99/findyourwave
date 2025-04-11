/**
 * BestWaveSection 컴포넌트
 */

import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@supabase/supabase-js'
import { point, booleanPointInPolygon } from '@turf/turf'

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 해변 데이터 타입 정의
interface Beach {
  beach_name: string;
  lat: string;
  lon: string;
  region: string;
}

// 해변의 위경도 좌표가 해당 지역 폴리곤 내에 있는지 확인하는 함수
const isBeachInRegion = (beach: Beach, geography: any) => {
  if (!beach.lat || !beach.lon) return false
  if (!geography?.geometry) return false
  
  try {
    const beachPoint = point([parseFloat(beach.lon), parseFloat(beach.lat)])
    return booleanPointInPolygon(beachPoint, geography.geometry)
  } catch (error) {
    console.error('Error checking point in polygon:', error)
    return false
  }
}

// GADM의 행정구역명과 Supabase의 region을 매핑하는 함수
const matchRegion = (beach: Beach, regionName: string, geography: any) => {
  return isBeachInRegion(beach, geography)
}

// 행정구역 한글 이름 매핑
const getRegionKoreanName = (regionName: string) => {
  switch (regionName) {
    case "Jeju":
      return "제주도"
    case "Busan":
      return "부산"
    case "Gangwon":
      return "강원도"
    default:
      return regionName
  }
}

export function BestWaveSection() {
  const [geoData, setGeoData] = useState<any>(null)
  const [beaches, setBeaches] = useState<Beach[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 선택된 지역의 해변들을 필터링
  const selectedBeaches = selectedRegion
    ? beaches.filter(beach => matchRegion(beach, selectedRegion, geoData))
    : []

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // GADM 데이터 로드
        const geoResponse = await fetch('/data/gadm41_KOR_1.json')
        if (!geoResponse.ok) throw new Error('지도 데이터를 불러오는데 실패했습니다')
        const geoData = await geoResponse.json()
        setGeoData(geoData)

        // Supabase에서 해변 데이터 로드
        const { data: beachData, error: beachError } = await supabase
          .from('beaches')
          .select('beach_name, lat, lon, region')

        if (beachError) throw beachError
        if (!beachData) throw new Error('해변 데이터를 불러오는데 실패했습니다')

        setBeaches(beachData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다')
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (error) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="text-white/80 text-center">
          <p className="text-xl">데이터를 불러오는데 실패했습니다</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="h-[calc(100vh-6rem)] flex items-center justify-center bg-transparent">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
            Best Waves
          </h1>
          <p className="text-white/80">
            전국의 서핑 스팟
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[500px]">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-2 h-full">
              <div className="w-full h-full">
                {geoData && (
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 4000,
                      center: [128, 36.5]
                    }}
                    style={{
                      width: "100%",
                      height: "100%"
                    }}
                  >
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const regionName = geo.properties.NAME_1
                          const isSelected = selectedRegion === regionName
                          const isHovered = hoveredRegion === regionName
                          const hasBeaches = beaches.some(beach => matchRegion(beach, regionName, geo))
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={isSelected ? "rgba(255,255,255,0.4)" : isHovered ? "rgba(255,255,255,0.3)" : hasBeaches ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}
                              stroke="rgba(255,255,255,0.6)"
                              strokeWidth={0.5}
                              style={{
                                default: {
                                  outline: "none",
                                  transition: "all 0.3s"
                                },
                                hover: {
                                  fill: "rgba(255,255,255,0.3)",
                                  cursor: hasBeaches ? "pointer" : "default"
                                },
                                pressed: {
                                  fill: "rgba(255,255,255,0.4)"
                                }
                              }}
                              onClick={() => hasBeaches && setSelectedRegion(regionName)}
                              onMouseEnter={() => hasBeaches && setHoveredRegion(regionName)}
                              onMouseLeave={() => setHoveredRegion(null)}
                            />
                          )
                        })
                      }
                    </Geographies>
                    {!isLoading && beaches.map((beach, i) => (
                      <Marker
                        key={i}
                        coordinates={[parseFloat(beach.lon), parseFloat(beach.lat)]}
                      >
                        <circle 
                          r={2} 
                          fill={selectedRegion && matchRegion(beach, selectedRegion, geoData) ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"} 
                        />
                      </Marker>
                    ))}
                  </ComposableMap>
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                    <div className="text-white">데이터를 불러오는 중...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 h-[500px]">
            <div className="h-full flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {selectedRegion ? `${getRegionKoreanName(selectedRegion)} 서핑 스팟` : '지역을 선택하세요'}
                </h2>
                {selectedRegion && (
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    × 닫기
                  </button>
                )}
              </div>
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="text-white/60 text-center py-4">
                    데이터를 불러오는 중...
                  </div>
                ) : selectedBeaches.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBeaches.map((beach, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <h3 className="text-white font-medium">{beach.beach_name}</h3>
                        <p className="text-white/60 text-sm">
                          {beach.region}
                        </p>
                      </div>
                    ))}
                    <p className="text-white/60 text-sm text-center pt-2">
                      총 {selectedBeaches.length}개의 서핑 스팟
                    </p>
                  </div>
                ) : (
                  <p className="text-white/60 text-center">
                    {selectedRegion ? '이 지역에는 등록된 서핑 스팟이 없습니다.' : '지도에서 지역을 선택하면 해당 지역의 서핑 스팟 목록이 표시됩니다.'}
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}