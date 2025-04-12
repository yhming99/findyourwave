/**
 * BestWaveSection 컴포넌트
 */

import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@supabase/supabase-js'
import { point, booleanPointInPolygon } from '@turf/turf'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

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

interface SubRegion {
  name: string;
  beaches: Beach[];
}

interface RegionData {
  name: string;
  koreanName: string;
  subRegions: { [key: string]: string };  // 영문: 한글 매핑
}

// 지역 정보 정의
const REGIONS: Record<string, RegionData> = {
  'Gangwon-do': {
    name: 'Gangwon-do',
    koreanName: '강원도',
    subRegions: {
      'Gangneung': 'Gangneung',
      'Goseong': 'Goseong',
      'Donghae': 'Donghae',
      'Samcheok': 'Samcheok',
      'Sokcho': 'Sokcho',
      'Yangyang': 'Yangyang'
    }
  },
  'Gyeongsangbuk-do': {
    name: 'Gyeongsangbuk-do',
    koreanName: '경상북도',
    subRegions: {
      'Pohang': 'Pohang',
      'Uljin': 'Uljin',
      'Yeongdeok': 'Yeongdeok'
    }
  },
  'Gyeongsangnam-do': {
    name: 'Gyeongsangnam-do',
    koreanName: '경상남도',
    subRegions: {
      'Geoje': 'Geoje',
      'Tongyeong': 'Tongyeong',
      'Namhae': 'Namhae',
      'Sacheon': 'Sacheon'
    }
  },
  'Jeollabuk-do': {
    name: 'Jeollabuk-do',
    koreanName: '전라북도',
    subRegions: {
      'Buan': 'Buan',
      'Gunsan': 'Gunsan'
    }
  },
  'Jeollanam-do': {
    name: 'Jeollanam-do',
    koreanName: '전라남도',
    subRegions: {
      'Yeosu': 'Yeosu',
      'Wando': 'Wando',
      'Goheung': 'Goheung',
      'Sinan': 'Sinan',
      'Jindo': 'Jindo',
      'Muan': 'Muan',
      'Mokpo': 'Mokpo',
      'Hampyeong': 'Hampyeong',
      'Yeonggwang': 'Yeonggwang',
      'Boseong': 'Boseong',
      'Jangheung': 'Jangheung'
    }
  },
  'Chungcheongnam-do': {
    name: 'Chungcheongnam-do',
    koreanName: '충청남도',
    subRegions: {
      'Boryeong': 'Boryeong',
      'Seocheon': 'Seocheon',
      'Taean': 'Taean',
      'Dangjin': 'Dangjin',
      'Seosan': 'Seosan'
    }
  },
  'Gyeonggi-do': {
    name: 'Gyeonggi-do',
    koreanName: '경기도',
    subRegions: {
      'Hwaseong': 'Hwaseong'
    }
  },
  'Incheon': {
    name: 'Incheon',
    koreanName: '인천광역시',
    subRegions: {
      'Jung': 'Jung',
      'Ongjin': 'Ongjin',
      'Ganghwa': 'Ganghwa'
    }
  },
  'Busan': {
    name: 'Busan',
    koreanName: '부산광역시',
    subRegions: {
      'Gijang': 'Gijang',
      'Haeundae': 'Haeundae',
      'Suyeong': 'Suyeong',
      'Saha': 'Saha',
      'Seo': 'Seo'
    }
  },
  'Ulsan': {
    name: 'Ulsan',
    koreanName: '울산광역시',
    subRegions: {
      'Dong': 'Dong',
      'Buk': 'Buk',
      'Ulju': 'Ulju'
    }
  },
  'Jeju': {
    name: 'Jeju',
    koreanName: '제주특별자치도',
    subRegions: {
      'Jeju': 'Jeju',
      'Seogwipo': 'Seogwipo'
    }
  }
}

interface GroupedBeaches {
  [region: string]: {
    [subRegion: string]: Beach[];
  };
}

// GADM 레벨 2 데이터 캐시
let gadm2Data: any = null;

// GADM 레벨 2 데이터 로드
const loadGadm2Data = async () => {
  if (!gadm2Data) {
    try {
      const response = await fetch('/data/gadm41_KOR_2.json')
      if (!response.ok) throw new Error('Failed to load administrative region data')
      gadm2Data = await response.json()
    } catch (error) {
      console.error('Error loading GADM level 2 data:', error)
      throw error
    }
  }
  return gadm2Data
}

// 해변의 하위 행정구역 찾기
const findSubRegion = (beach: Beach, gadm2Data: any): { region: string, subRegion: string } | null => {
  if (!beach.lat || !beach.lon) {
    console.log(`[Debug] Beach ${beach.beach_name} has no coordinates`)
    return null
  }
  
  const beachPoint = point([parseFloat(beach.lon), parseFloat(beach.lat)])
  
  for (const feature of gadm2Data.features) {
    try {
      if (booleanPointInPolygon(beachPoint, feature)) {
        const region = feature.properties.NAME_1
        const subRegion = feature.properties.NAME_2
        
        if (REGIONS[region] && REGIONS[region].subRegions[subRegion]) {
          return { region, subRegion }
        }
      }
    } catch (error) {
      console.error(`[Debug] Error checking polygon for ${beach.beach_name}:`, error)
    }
  }
  
  return null
}

// 해변 목록 컴포넌트
const BeachList = ({ beaches }: { beaches: Beach[] }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // 로컬 스토리지에서 즐겨찾기 불러오기
  useEffect(() => {
    const savedFavorites = localStorage.getItem('beachFavorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  // 즐겨찾기 토글
  const toggleFavorite = (beachName: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(beachName)) {
      newFavorites.delete(beachName)
    } else {
      newFavorites.add(beachName)
    }
    setFavorites(newFavorites)
    localStorage.setItem('beachFavorites', JSON.stringify(Array.from(newFavorites)))
  }

  return (
    <div className="space-y-2">
      {beaches.map((beach) => (
        <div
          key={`${beach.beach_name}-${beach.lat}-${beach.lon}`}
          className="flex items-center justify-between p-2 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
        >
          <Link 
            href={`/waves/${encodeURIComponent(beach.beach_name)}`}
            className="flex-1"
          >
            {beach.beach_name}
            <span className="text-sm text-white/60 ml-2">({beach.region})</span>
          </Link>
          <button
            onClick={() => toggleFavorite(beach.beach_name)}
            className="ml-2 text-white/60 hover:text-white"
          >
            {favorites.has(beach.beach_name) ? '♥' : '♡'}
          </button>
        </div>
      ))}
    </div>
  )
}

export function BestWaveSection() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(null)
  const [beaches, setBeaches] = useState<Beach[]>([])
  const [groupedBeaches, setGroupedBeaches] = useState<GroupedBeaches>({})
  const [geoData, setGeoData] = useState<any>(null)

  // 해변 데이터 그룹화
  const groupBeachesByRegion = async (beaches: Beach[], geoData: any) => {
    console.log(`[Debug] Starting to group ${beaches.length} beaches`)
    const grouped: GroupedBeaches = {}
    const gadm2Data = await loadGadm2Data()
    
    let matchedCount = 0
    let unmatchedCount = 0
    
    for (const beach of beaches) {
      try {
        const result = findSubRegion(beach, gadm2Data)
        if (!result) {
          unmatchedCount++
          continue
        }
        
        matchedCount++
        const { region, subRegion } = result
        
        if (!grouped[region]) {
          grouped[region] = {}
        }
        if (!grouped[region][subRegion]) {
          grouped[region][subRegion] = []
        }
        grouped[region][subRegion].push(beach)
      } catch (error) {
        console.error(`[Debug] Error processing beach ${beach.beach_name}:`, error)
      }
    }
    
    console.log(`[Debug] Matching complete: ${matchedCount} matched, ${unmatchedCount} unmatched`)
    console.log('[Debug] Grouped beaches:', grouped)
    
    return grouped
  }

  // 선택된 지역의 하위 행정구역별 해변
  const currentGroupedBeaches = selectedRegion ? groupedBeaches[selectedRegion] || {} : {}

  // 하위 행정구역 카드 컴포넌트
  const SubRegionCards = () => {
    if (!selectedRegion) return null
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {Object.entries(currentGroupedBeaches).map(([subRegion, beaches]) => (
          <button
            key={subRegion}
            onClick={() => setSelectedSubRegion(subRegion)}
            className={`p-4 rounded-lg text-left transition-all ${
              selectedSubRegion === subRegion
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            <div className="font-medium">{subRegion}</div>
            <div className="text-sm opacity-80">{beaches.length}개의 해변</div>
          </button>
        ))}
      </div>
    )
  }
  
  // 표시할 해변 목록
  const displayedBeaches = selectedRegion && selectedSubRegion
    ? currentGroupedBeaches[selectedSubRegion] || []
    : []

  useEffect(() => {
    const loadData = async () => {
      try {
        // GADM 데이터 로드
        const geoResponse = await fetch('/data/gadm41_KOR_1.json')
        if (!geoResponse.ok) throw new Error('지도 데이터를 불러오는데 실패했습니다')
        const geoData = await geoResponse.json()
        
        // 한글 이름으로 변경
        geoData.features = geoData.features.map((feature: any) => {
          const koreanName = Object.values(REGIONS).find(r => 
            feature.properties.NAME_1.includes(r.name) || 
            r.name.includes(feature.properties.NAME_1)
          )?.name
          
          if (koreanName) {
            feature.properties.NAME_1 = koreanName
          }
          return feature
        })
        
        setGeoData(geoData)

        // Supabase에서 해변 데이터 로드
        const { data: beachData, error: beachError } = await supabase
          .from('beaches')
          .select('beach_name, lat, lon, region')
          .order('beach_name')

        if (beachError) throw beachError
        if (!beachData) throw new Error('해변 데이터를 불러오는데 실패했습니다')

        setBeaches(beachData)
        
        // 해변 데이터 그룹화
        const grouped = await groupBeachesByRegion(beachData, geoData)
        setGroupedBeaches(grouped)
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }

    loadData()
  }, [])

  return (
    <section className="min-h-screen bg-transparent">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">
            대한민국 서핑스팟
          </h1>
          <p className="text-white/80 text-sm">
            지역별 서핑 스팟을 확인해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
          <div className="lg:col-span-2">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 h-full">
              <div className="absolute inset-0">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 4800,
                    center: [127.5, 36.3]
                  }}
                  style={{
                    width: "100%",
                    height: "100%"
                  }}
                >
                  {geoData && (
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => setSelectedRegion(geo.properties.NAME_1)}
                            style={{
                              default: {
                                fill: selectedRegion === geo.properties.NAME_1 
                                  ? "rgba(255,255,255,0.4)" 
                                  : "rgba(255,255,255,0.2)",
                                stroke: "rgba(255,255,255,0.6)",
                                strokeWidth: 0.5,
                                outline: "none",
                                transition: "all 0.3s"
                              },
                              hover: {
                                fill: "rgba(255,255,255,0.3)",
                                stroke: "rgba(255,255,255,0.6)",
                                strokeWidth: 0.5,
                                outline: "none",
                              },
                              pressed: {
                                fill: "rgba(255,255,255,0.4)",
                              }
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  )}
                  {beaches.map((beach) => (
                    <Marker
                      key={`${beach.beach_name}-${beach.lat}-${beach.lon}`}
                      coordinates={[parseFloat(beach.lon), parseFloat(beach.lat)]}
                    >
                      <circle 
                        r={2} 
                        fill={selectedRegion ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"} 
                      />
                    </Marker>
                  ))}
                </ComposableMap>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-full flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {selectedRegion 
                    ? `${REGIONS[selectedRegion]?.koreanName || selectedRegion} 서핑스팟`
                    : '지역을 선택하세요'
                  }
                </h2>
                {selectedRegion && (
                  <button
                    onClick={() => {
                      setSelectedRegion(null)
                      setSelectedSubRegion(null)
                    }}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    × 닫기
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {selectedRegion ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[12rem] overflow-y-auto">
                        {Object.entries(currentGroupedBeaches).map(([subRegion, beaches]) => {
                          // 행정구역 이름 매핑
                          const getKoreanName = (name: string) => {
                            const mappings: { [key: string]: string } = {
                              'Gangneung': '강릉시',
                              'Goseong': '고성군',
                              'Donghae': '동해시',
                              'Samcheok': '삼척시',
                              'Sokcho': '속초시',
                              'Yangyang': '양양군',
                              'Pohang': '포항시',
                              'Uljin': '울진군',
                              'Yeongdeok': '영덕군',
                              'Geoje': '거제시',
                              'Tongyeong': '통영시',
                              'Namhae': '남해군',
                              'Sacheon': '사천시',
                              'Buan': '부안군',
                              'Gunsan': '군산시',
                              'Yeosu': '여수시',
                              'Wando': '완도군',
                              'Goheung': '고흥군',
                              'Sinan': '신안군',
                              'Jindo': '진도군',
                              'Muan': '무안군',
                              'Mokpo': '목포시',
                              'Hampyeong': '함평군',
                              'Yeonggwang': '영광군',
                              'Boseong': '보성군',
                              'Jangheung': '장흥군',
                              'Boryeong': '보령시',
                              'Seocheon': '서천군',
                              'Taean': '태안군',
                              'Dangjin': '당진시',
                              'Seosan': '서산시',
                              'Hwaseong': '화성시',
                              'Jung': '중구',
                              'Ongjin': '옹진군',
                              'Ganghwa': '강화군',
                              'Gijang': '기장군',
                              'Haeundae': '해운대구',
                              'Suyeong': '수영구',
                              'Saha': '사하구',
                              'Seo': '서구',
                              'Dong': '동구',
                              'Buk': '북구',
                              'Ulju': '울주군',
                              'Jeju': '제주시',
                              'Seogwipo': '서귀포시'
                            };
                            return mappings[name] || name;
                          };
                          
                          const koreanName = getKoreanName(subRegion);
                          return (
                            <button
                              key={subRegion}
                              onClick={() => setSelectedSubRegion(subRegion)}
                              className={`p-2 rounded-lg text-left transition-all ${
                                selectedSubRegion === subRegion
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white/10 text-white/80 hover:bg-white/15'
                              }`}
                            >
                              <div className="font-medium text-sm">{koreanName}</div>
                              <div className="text-xs opacity-80">{beaches.length}개의 해변</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-[calc(100vh-30rem)] overflow-y-auto">
                        {selectedSubRegion ? (
                          displayedBeaches.length > 0 ? (
                            <BeachList beaches={displayedBeaches} />
                          ) : (
                            <div className="text-white/60 text-center py-4">
                              해당 지역에는 서핑 스팟이 없습니다.
                            </div>
                          )
                        ) : (
                          <div className="text-white/60 text-center py-4">
                            하위 행정구역을 선택하세요
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-4">
                      지도에서 지역을 선택하세요
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 