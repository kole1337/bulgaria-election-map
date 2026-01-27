import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, X, Menu, Download } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
}

interface Election {
  id: string;
  date: string;
  label: string;
}

interface RegionGeometry {
  type: string;
  id: string;
  properties: {
    name: string;
    code: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface RegionResult {
  regionId: string;
  electionId: string;
  turnout: number;
  totalVotes: number;
  parties: {
    partyId: string;
    votes: number;
    percentage: number;
  }[];
  mps: {
    name: string;
    partyId: string;
    seatNumber: number;
  }[];
}

// ============================================================================
// DUMMY DATA
// ============================================================================

const PARTIES: Party[] = [
  { id: 'gerb', name: 'GERB-SDS', abbreviation: 'GERB', color: '#0066CC' },
  { id: 'pp-db', name: 'Продължаваме Промяната - Демократична България', abbreviation: 'PP-DB', color: '#FFD700' },
  { id: 'dps', name: 'Движение за права и свободи', abbreviation: 'DPS', color: '#00AA44' },
  { id: 'vazrazhdane', name: 'Възраждане', abbreviation: 'Възраждане', color: '#8B4513' },
  { id: 'bsp', name: 'БСП за България', abbreviation: 'BSP', color: '#DC143C' },
  { id: 'itн', name: 'Има такъв народ', abbreviation: 'ITN', color: '#800080' },
];

const ELECTIONS: Election[] = [
  { id: '2021-04-04', date: '2021-04-04', label: 'Април 2021' },
  { id: '2021-07-11', date: '2021-07-11', label: 'Юли 2021' },
  { id: '2021-11-14', date: '2021-11-14', label: 'Ноември 2021' },
  { id: '2022-10-02', date: '2022-10-02', label: 'Октомври 2022' },
  { id: '2023-04-02', date: '2023-04-02', label: 'Април 2023' },
];

// Simplified GeoJSON for Bulgarian regions
const REGIONS_GEOJSON: RegionGeometry[] = [
  {
    type: 'Feature',
    id: 'R01',
    properties: { name: 'София-град', code: 'R01' },
    geometry: { type: 'Polygon', coordinates: [[[23.2, 42.7], [23.5, 42.7], [23.5, 42.6], [23.2, 42.6], [23.2, 42.7]]] }
  },
  {
    type: 'Feature',
    id: 'R02',
    properties: { name: 'Бургас', code: 'R02' },
    geometry: { type: 'Polygon', coordinates: [[[27.3, 42.5], [27.8, 42.5], [27.8, 42.2], [27.3, 42.2], [27.3, 42.5]]] }
  },
  {
    type: 'Feature',
    id: 'R03',
    properties: { name: 'Варна', code: 'R03' },
    geometry: { type: 'Polygon', coordinates: [[[27.8, 43.3], [28.2, 43.3], [28.2, 43.0], [27.8, 43.0], [27.8, 43.3]]] }
  },
  {
    type: 'Feature',
    id: 'R04',
    properties: { name: 'Пловдив', code: 'R04' },
    geometry: { type: 'Polygon', coordinates: [[[24.6, 42.2], [25.1, 42.2], [25.1, 41.9], [24.6, 41.9], [24.6, 42.2]]] }
  },
  {
    type: 'Feature',
    id: 'R05',
    properties: { name: 'Велико Търново', code: 'R05' },
    geometry: { type: 'Polygon', coordinates: [[[25.4, 43.2], [25.9, 43.2], [25.9, 42.9], [25.4, 42.9], [25.4, 43.2]]] }
  },
  {
    type: 'Feature',
    id: 'R06',
    properties: { name: 'Русе', code: 'R06' },
    geometry: { type: 'Polygon', coordinates: [[[25.8, 43.9], [26.3, 43.9], [26.3, 43.6], [25.8, 43.6], [25.8, 43.9]]] }
  },
];

// Generate dummy results
const generateResults = (): RegionResult[] => {
  const results: RegionResult[] = [];

  REGIONS_GEOJSON.forEach(region => {
    ELECTIONS.forEach(election => {
      const totalVotes = Math.floor(Math.random() * 200000) + 100000;
      const turnout = Math.random() * 30 + 50; // 50-80%

      // Generate party votes
      let remainingVotes = totalVotes;
      const partyResults = PARTIES.map((party, idx) => {
        const isLast = idx === PARTIES.length - 1;
        const votes = isLast ? remainingVotes : Math.floor(Math.random() * remainingVotes * 0.4);
        remainingVotes -= votes;
        return {
          partyId: party.id,
          votes,
          percentage: 0 // Will calculate after
        };
      }).sort((a, b) => b.votes - a.votes);

      // Calculate percentages
      partyResults.forEach(pr => {
        pr.percentage = (pr.votes / totalVotes) * 100;
      });

      // Generate MPs (top 3 parties get seats)
      const mps = [];
      partyResults.slice(0, 3).forEach((pr, idx) => {
        const seats = idx === 0 ? 5 : idx === 1 ? 3 : 2;
        for (let i = 0; i < seats; i++) {
          mps.push({
            name: `Депутат ${mps.length + 1}`,
            partyId: pr.partyId,
            seatNumber: mps.length + 1
          });
        }
      });

      results.push({
        regionId: region.id,
        electionId: election.id,
        turnout,
        totalVotes,
        parties: partyResults,
        mps
      });
    });
  });

  return results;
};

const RESULTS = generateResults();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('bg-BG').format(Math.round(num));
};

const formatPercent = (num: number): string => {
  return `${num.toFixed(2)}%`;
};

const getWinnerColor = (regionId: string, electionId: string): { color: string; opacity: number } => {
  const result = RESULTS.find(r => r.regionId === regionId && r.electionId === electionId);
  if (!result || result.parties.length === 0) return { color: '#cccccc', opacity: 0.3 };

  const winner = result.parties[0];
  const runnerUp = result.parties[1];
  const party = PARTIES.find(p => p.id === winner.partyId);

  if (!party) return { color: '#cccccc', opacity: 0.3 };

  const margin = winner.percentage - (runnerUp?.percentage || 0);
  const opacity = 0.55 + (Math.min(margin, 30) / 30) * 0.45;

  return { color: party.color, opacity };
};

const getQueryParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

const setQueryParams = (election: string, region: string | null) => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  params.set('election', election);
  if (region) params.set('region', region);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
};

// ============================================================================
// COMPONENTS
// ============================================================================

const Timeline: React.FC<{
  elections: Election[];
  activeId: string;
  onChange: (id: string) => void;
}> = ({ elections, activeId, onChange }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Избори:</span>
        <div className="flex gap-1">
          {elections.map(election => (
            <button
              key={election.id}
              onClick={() => onChange(election.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap
                ${activeId === election.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              aria-pressed={activeId === election.id}
              title={`${election.label} (${election.date})`}
            >
              {election.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MapView: React.FC<{
  regions: RegionGeometry[];
  activeElectionId: string;
  activeRegionId: string | null;
  onRegionClick: (regionId: string) => void;
}> = ({ regions, activeElectionId, activeRegionId, onRegionClick }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate SVG viewBox from all regions
  const viewBox = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    regions.forEach(region => {
      region.geometry.coordinates[0].forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    const padding = 0.2;
    return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [regions]);

  const handleMouseMove = (e: React.MouseEvent, regionId: string) => {
    setHoveredRegion(regionId);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const tooltipData = useMemo(() => {
    if (!hoveredRegion) return null;

    const region = regions.find(r => r.id === hoveredRegion);
    const result = RESULTS.find(r => r.regionId === hoveredRegion && r.electionId === activeElectionId);

    if (!region || !result) return null;

    const top3 = result.parties.slice(0, 3);
    const maxPct = top3[0]?.percentage || 100;

    return {
      name: region.properties.name,
      parties: top3.map(p => ({
        ...p,
        party: PARTIES.find(party => party.id === p.partyId)!,
        barWidth: (p.percentage / maxPct) * 100
      }))
    };
  }, [hoveredRegion, activeElectionId, regions]);

  return (
    <div className="relative w-full h-full bg-gray-50">
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        role="img"
        aria-label="Карта на избирателните региони на България"
      >
        {regions.map(region => {
          const { color, opacity } = getWinnerColor(region.id, activeElectionId);
          const isActive = activeRegionId === region.id;
          const isHovered = hoveredRegion === region.id;

          const pathD = region.geometry.coordinates[0]
            .map((coord, i) => `${i === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`)
            .join(' ') + ' Z';

          return (
            <path
              key={region.id}
              d={pathD}
              fill={color}
              fillOpacity={opacity}
              stroke={isActive ? '#1e40af' : isHovered ? '#3b82f6' : '#94a3b8'}
              strokeWidth={isActive ? 0.08 : isHovered ? 0.05 : 0.02}
              className="cursor-pointer transition-all"
              onClick={() => onRegionClick(region.id)}
              onMouseEnter={(e) => handleMouseMove(e, region.id)}
              onMouseMove={(e) => handleMouseMove(e, region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRegionClick(region.id);
                }
              }}
              role="button"
              aria-label={`${region.properties.name} избирателен район`}
            />
          );
        })}
      </svg>

      {tooltipData && (
        <div
          className="fixed z-50 bg-white shadow-lg rounded-lg p-3 pointer-events-none border border-gray-200"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            maxWidth: '250px'
          }}
        >
          <div className="font-semibold text-sm mb-2">{tooltipData.name}</div>
          <div className="space-y-1">
            {tooltipData.parties.map(p => (
              <div key={p.partyId} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: p.party.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="truncate font-medium">{p.party.abbreviation}</span>
                    <span className="font-semibold">{formatPercent(p.percentage)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${p.barWidth}%`,
                        backgroundColor: p.party.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RegionPanel: React.FC<{
  regionId: string;
  electionId: string;
  onClose: () => void;
  isMobile: boolean;
}> = ({ regionId, electionId, onClose, isMobile }) => {
  const region = REGIONS_GEOJSON.find(r => r.id === regionId);
  const result = RESULTS.find(r => r.regionId === regionId && r.electionId === electionId);
  const election = ELECTIONS.find(e => e.id === electionId);

  if (!region || !result || !election) return null;

  const winner = result.parties[0];
  const winnerParty = PARTIES.find(p => p.id === winner?.partyId);

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{region.properties.name}</h2>
          <p className="text-sm text-gray-600">{election.label}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Затвори"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Избирателна активност</div>
            <div className="text-2xl font-bold text-blue-900">{formatPercent(result.turnout)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Гласували общо</div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(result.totalVotes)}</div>
          </div>
        </div>

        {winnerParty && (
          <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: `${winnerParty.color}15` }}>
            <div className="text-xs text-gray-600 mb-1">Победител</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: winnerParty.color }} />
              <span className="font-bold text-gray-900">{winnerParty.name}</span>
              <span className="ml-auto font-semibold">{formatPercent(winner.percentage)}</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Резултати по партии</h3>
          <div className="space-y-3">
            {result.parties.map(p => {
              const party = PARTIES.find(party => party.id === p.partyId);
              if (!party) return null;

              const barWidth = (p.percentage / result.parties[0].percentage) * 100;

              return (
                <div key={p.partyId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: party.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{party.name}</div>
                      <div className="text-xs text-gray-600">{party.abbreviation}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-gray-600">Гласове:</span>
                    <span className="font-bold text-gray-900">{formatNumber(p.votes)}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-gray-600">Процент:</span>
                    <span className="font-bold text-gray-900">{formatPercent(p.percentage)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: party.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Избрани депутати ({result.mps.length})</h3>
          <div className="grid gap-2">
            {result.mps.map((mp, idx) => {
              const party = PARTIES.find(p => p.id === mp.partyId);
              if (!party) return null;

              return (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: party.color }} />
                  <span className="text-sm text-gray-900">{mp.name}</span>
                  <span className="ml-auto text-xs text-gray-600">Място {mp.seatNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg shadow-xl flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      {content}
    </div>
  );
};

const Legend: React.FC<{ parties: Party[] }> = ({ parties }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg border border-gray-200 z-10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-3 w-full hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <BarChart3 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">Легенда</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-2 max-w-xs">
          {parties.map(party => (
            <div key={party.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: party.color }} />
              <span className="text-xs text-gray-900">{party.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

const App: React.FC = () => {
  const [activeElectionId, setActiveElectionId] = useState<string>(() => {
    return getQueryParam('election') || ELECTIONS[ELECTIONS.length - 1].id;
  });

  const [activeRegionId, setActiveRegionId] = useState<string | null>(() => {
    return getQueryParam('region');
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setQueryParams(activeElectionId, activeRegionId);
  }, [activeElectionId, activeRegionId]);

  const handleElectionChange = useCallback((electionId: string) => {
    setActiveElectionId(electionId);
  }, []);

  const handleRegionClick = useCallback((regionId: string) => {
    setActiveRegionId(regionId);
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  const handleClosePanel = useCallback(() => {
    setActiveRegionId(null);
    setQueryParams(activeElectionId, null);
  }, [activeElectionId]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Избирателни резултати - България</h1>
          {!isMobile && activeRegionId && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-700 rounded transition-colors"
              aria-label={sidebarOpen ? 'Скрий панела' : 'Покажи панела'}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <Timeline
        elections={ELECTIONS}
        activeId={activeElectionId}
        onChange={handleElectionChange}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <MapView
            regions={REGIONS_GEOJSON}
            activeElectionId={activeElectionId}
            activeRegionId={activeRegionId}
            onRegionClick={handleRegionClick}
          />
          <Legend parties={PARTIES} />
        </div>

        {activeRegionId && !isMobile && sidebarOpen && (
          <RegionPanel
            regionId={activeRegionId}
            electionId={activeElectionId}
            onClose={handleClosePanel}
            isMobile={false}
          />
        )}
      </div>

      {activeRegionId && isMobile && (
        <RegionPanel
          regionId={activeRegionId}
          electionId={activeElectionId}
          onClose={handleClosePanel}
          isMobile={true}
        />
      )}
    </div>
  );
};

export default App;