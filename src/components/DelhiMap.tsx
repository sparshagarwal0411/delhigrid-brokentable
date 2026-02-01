import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WardSearch } from "@/components/WardSearch";
import { usePollutionData } from "@/hooks/usePollutionData";
import { Ward } from "@/types";
import { WardCard } from "@/components/WardCard";

import {
  Map as MapIcon,
  Wifi,
  WifiOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  LayoutGrid,
  Globe,
  Layers,
  Activity,
  Megaphone,
  Wind,
  Droplets,
  Sprout,
  Car,
  Volume2,
  CheckSquare,
  Grid,
  List,
  MoreHorizontal,
  MapPin,
  Info,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusFromScore, getStatusLabel, getWardColor } from "@/data/wards";

// --- Leaflet Imports ---
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- Types ---
type SortOption = 'aqi-desc' | 'aqi-asc' | 'alphabetical' | 'id-asc' | 'id-desc' | 'score-desc' | 'score-asc';
type MapViewMode = 'wards' | 'category' | 'density'; // Added 'wards'
type ComplaintCategory = 'Air' | 'Water' | 'Soil' | 'Transport' | 'Noise';

interface Complaint {
  id: number;
  lat: number;
  lng: number;
  category: ComplaintCategory;
  status: 'Pending' | 'Resolved' | 'In Progress';
  description: string;
}

// --- Helper: Generate Stable Mock Coordinates for Wards ---
// Since we don't have real lat/lng for 250 wards in the type, we simulate them within Delhi
const getWardCoordinates = (id: number) => {
  const baseLat = 28.6139;
  const baseLng = 77.2090;
  // Deterministic offset based on ID
  const latOffset = (Math.sin(id * 12.9898) * 0.15); 
  const lngOffset = (Math.cos(id * 78.233) * 0.18);
  return [baseLat + latOffset, baseLng + lngOffset] as [number, number];
};

// --- Mock Complaints ---
const generateComplaints = (): Complaint[] => {
  const complaints: Complaint[] = [];
  const categories: ComplaintCategory[] = ['Air', 'Water', 'Soil', 'Transport', 'Noise'];
  const statuses = ['Pending', 'Resolved', 'In Progress'] as const;
  
  for (let i = 0; i < 200; i++) {
    complaints.push({
      id: i + 1,
      lat: 28.5 + (Math.random() * 0.3),
      lng: 77.0 + (Math.random() * 0.3),
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: `Citizen reported issue #${i + 1000}`
    });
  }
  return complaints;
};

const MOCK_COMPLAINTS = generateComplaints();

const CATEGORY_COLORS: Record<ComplaintCategory, string> = {
  Air: '#3b82f6', Water: '#06b6d4', Soil: '#854d0e', Transport: '#64748b', Noise: '#eab308'
};

const CATEGORY_ICONS: Record<ComplaintCategory, any> = {
  Air: Wind, Water: Droplets, Soil: Sprout, Transport: Car, Noise: Volume2
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS) as ComplaintCategory[];

// --- Pagination Component ---
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
      {getPageNumbers().map((page, idx) => (
        page === -1 ? <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span> :
        <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => onPageChange(page)}>{page}</Button>
      ))}
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}

export function DelhiMap() {
  const { wards, isLoading, isUsingRealData } = usePollutionData();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // --- States ---
  // CHANGED: Default is now "map"
  const [visualizationMode, setVisualizationMode] = useState<"grid" | "map">("map");
  // CHANGED: Default map mode is "wards" (250 pins view)
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('wards'); 
  const [selectedCategories, setSelectedCategories] = useState<ComplaintCategory[]>(ALL_CATEGORIES);
  
  // NEW: State for the selected ward in Map View
  const [selectedMapWard, setSelectedMapWard] = useState<Ward | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('id-asc');
  
  const wardsPerPage = 10; 
  const zones = [...new Set(wards.map((w: Ward) => w.zone))];

  // --- Handlers ---
  const toggleCategory = (cat: ComplaintCategory) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const toggleAllCategories = () => {
    setSelectedCategories(selectedCategories.length === ALL_CATEGORIES.length ? [] : ALL_CATEGORIES);
  };
  const isAllSelected = selectedCategories.length === ALL_CATEGORIES.length;

  // Filter Wards Logic
  const filteredWards = useMemo(() => {
    let filtered = selectedZone ? wards.filter((w: Ward) => w.zone === selectedZone) : wards;
    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'aqi-desc': return ((b as any).aqi || 0) - ((a as any).aqi || 0);
        case 'id-asc': return a.id - b.id;
        default: return a.id - b.id;
      }
    });
    return filtered;
  }, [wards, selectedZone, sortOption]);

  const totalPages = Math.ceil(filteredWards.length / wardsPerPage);
  const currentWards = filteredWards.slice((currentPage - 1) * wardsPerPage, currentPage * wardsPerPage);
  const currentRange = `${(currentPage - 1) * wardsPerPage + 1}-${Math.min(currentPage * wardsPerPage, filteredWards.length)}`;

  const handleZoneChange = (zone: string | null) => { setSelectedZone(zone); setCurrentPage(1); };
  const handleSortChange = (value: string) => { setSortOption(value as SortOption); setCurrentPage(1); };

  // Helper for Leaflet colors
  const getHexColorForWard = (score: number) => {
    if (score < 20) return "#ef4444"; // Hazardous
    if (score < 40) return "#f97316"; // Severe
    if (score < 60) return "#eab308"; // Unhealthy
    if (score < 80) return "#84cc16"; // Moderate
    return "#22c55e"; // Good
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <WardSearch />
        
        <div className="bg-muted p-1 rounded-lg flex items-center">
            <Button variant={visualizationMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setVisualizationMode("grid")} className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Grid View
            </Button>
            <Button variant={visualizationMode === "map" ? "default" : "ghost"} size="sm" onClick={() => setVisualizationMode("map")} className="gap-2">
              <Globe className="h-4 w-4" /> Map View
            </Button>
        </div>
      </div>

      {/* Main Visualization Card */}
      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                Delhi {visualizationMode === 'map' ? (mapViewMode === 'wards' ? 'Ward Analytics' : 'Complaint Tracker') : 'Pollution Grid'}
              </CardTitle>
              <Badge variant={isUsingRealData ? "default" : "secondary"} className="flex items-center gap-1">
                {isLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading...</> : 
                 isUsingRealData ? <><Wifi className="h-3 w-3" /> Live</> : <><WifiOff className="h-3 w-3" /> System Ready</>}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          
          {/* ================= GRID VIEW ================= */}
          {visualizationMode === "grid" && (
            <div className="relative bg-muted/20 p-6 min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">Visualizing all {filteredWards.length} wards</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Hazardous</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Good</span>
                  </div>
                </div>
                <div className="grid grid-cols-10 md:grid-cols-16 lg:grid-cols-20 gap-1 max-h-[600px] overflow-y-auto">
                {filteredWards.map((ward) => (
                    <Tooltip key={ward.id} delayDuration={0}>
                        <TooltipTrigger asChild>
                        <button
                            className={`aspect-square rounded-sm transition-all duration-200 ${getWardColor(ward.pollutionScore)} hover:scale-110 hover:z-10 hover:shadow-lg flex items-center justify-center text-white text-[8px] md:text-[10px] font-bold shadow-sm cursor-pointer`}
                            onClick={() => window.location.href = `/ward/${ward.id}`}
                        >
                            {ward.id}
                        </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-0 border-none shadow-xl">
                            <div className="w-48 overflow-hidden rounded-md bg-card">
                                <div className={`px-3 py-2 text-white font-bold flex justify-between items-center ${getWardColor(ward.pollutionScore)}`}>
                                    <span>{getStatusLabel(getStatusFromScore(ward.pollutionScore))}</span>
                                    <span className="text-xs opacity-90">Ward {ward.id}</span>
                                </div>
                                <div className="p-3 bg-background text-center">
                                    <div className="text-sm font-medium truncate">{ward.name}</div>
                                    <div className="text-3xl font-bold mt-1">{ward.aqi || 200}</div>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
                </div>
            </div>
          )}

          {/* ================= MAP VIEW ================= */}
          {visualizationMode === "map" && (
            <div className="flex flex-col md:flex-row h-[600px]">
                {/* 1. Map Area */}
                <div className="flex-1 relative z-0 h-[400px] md:h-full order-2 md:order-1">
                    <MapContainer 
                        center={[28.6139, 77.2090]} 
                        zoom={11} 
                        scrollWheelZoom={true}
                        className="h-full w-full"
                        maxBounds={[[28.4, 76.8], [28.9, 77.5]]}
                        minZoom={10}
                    >
                        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {/* MODE: WARDS (250 Pins) */}
                        {mapViewMode === 'wards' && filteredWards.map((ward) => {
                            const coords = getWardCoordinates(ward.id);
                            const color = getHexColorForWard(ward.pollutionScore);
                            const isSelected = selectedMapWard?.id === ward.id;
                            
                            return (
                                <CircleMarker 
                                    key={ward.id}
                                    center={coords}
                                    pathOptions={{ 
                                        fillColor: color, 
                                        color: isSelected ? 'black' : 'white', 
                                        weight: isSelected ? 3 : 1, 
                                        opacity: 1, 
                                        fillOpacity: 0.9 
                                    }}
                                    radius={isSelected ? 10 : 6}
                                    eventHandlers={{
                                        click: () => setSelectedMapWard(ward) // SET SELECTED WARD
                                    }}
                                >
                                     {/* Simple hover tooltip, detailed info goes to sidebar */}
                                     <MapTooltip direction="top" offset={[0, -10]} opacity={1}>
                                        <div className="text-xs font-bold">{ward.name} (ID: {ward.id})</div>
                                    </MapTooltip>
                                </CircleMarker>
                            );
                        })}

                        {/* MODE: COMPLAINTS */}
                        {(mapViewMode === 'category' || mapViewMode === 'density') && MOCK_COMPLAINTS.map((complaint) => {
                            if (!selectedCategories.includes(complaint.category)) return null;

                            if (mapViewMode === 'density') {
                                return <CircleMarker key={complaint.id} center={[complaint.lat, complaint.lng]} pathOptions={{ fillColor: '#ef4444', color: 'transparent', fillOpacity: 0.15 }} radius={20} />;
                            } else {
                                const color = CATEGORY_COLORS[complaint.category];
                                return (
                                    <CircleMarker key={complaint.id} center={[complaint.lat, complaint.lng]} pathOptions={{ fillColor: color, color: 'white', weight: 1, opacity: 1, fillOpacity: 0.8 }} radius={6}>
                                        <MapTooltip direction="top" offset={[0, -10]} opacity={1}>
                                            <div className="text-center min-w-[150px] p-2">
                                                <Badge variant="outline" className="mb-2" style={{borderColor: color, color: color}}>{complaint.category}</Badge>
                                                <div className="text-sm font-semibold mb-1">{complaint.description}</div>
                                                <div className="text-xs text-muted-foreground">Status: {complaint.status}</div>
                                            </div>
                                        </MapTooltip>
                                    </CircleMarker>
                                );
                            }
                        })}
                    </MapContainer>
                </div>

                {/* 2. Sidebar / Controls */}
                <div className="w-full md:w-80 bg-background border-l p-4 flex flex-col gap-6 order-1 md:order-2 overflow-y-auto">
                    
                    {/* Header */}
                    <div>
                        <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                            {mapViewMode === 'wards' ? <MapPin className="h-5 w-5 text-primary"/> : <Megaphone className="h-5 w-5 text-primary" />}
                            {mapViewMode === 'wards' ? 'Ward Analytics' : 'Complaint System'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {mapViewMode === 'wards' ? 'Click on a pin to view ward details.' : 'Tracking location-based complaints.'}
                        </p>
                    </div>

                    {/* View Mode Selection */}
                    <div className="grid gap-2">
                        <div 
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${mapViewMode === 'wards' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            onClick={() => { setMapViewMode('wards'); setSelectedMapWard(null); }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><MapPin className="h-4 w-4" /></div>
                                <div><div className="font-semibold text-sm">Ward Overview</div><div className="text-[10px] text-muted-foreground">250 Wards</div></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div 
                                className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${mapViewMode === 'category' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                onClick={() => setMapViewMode('category')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Layers className="h-3 w-3" /></div>
                                    <div className="font-semibold text-xs">Category</div>
                                </div>
                            </div>
                            <div 
                                className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${mapViewMode === 'density' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                onClick={() => setMapViewMode('density')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Activity className="h-3 w-3" /></div>
                                    <div className="font-semibold text-xs">Heatmap</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* --- DYNAMIC SIDEBAR CONTENT --- */}
                    
                    {/* SCENARIO 1: Ward Mode - Show Selected Ward Info */}
                    {mapViewMode === 'wards' && (
                        <div className="flex-1">
                             {selectedMapWard ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-heading font-bold text-lg">{selectedMapWard.name}</h4>
                                        <Button variant="ghost" size="icon" h-6 w-6 onClick={() => setSelectedMapWard(null)}><X className="h-4 w-4" /></Button>
                                    </div>
                                    
                                    <div className={`p-4 rounded-lg text-white mb-4 ${getWardColor(selectedMapWard.pollutionScore)}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-lg">{getStatusLabel(getStatusFromScore(selectedMapWard.pollutionScore))}</span>
                                            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">Ward {selectedMapWard.id}</Badge>
                                        </div>
                                        <div className="text-4xl font-bold mb-1">{selectedMapWard.aqi || 200}</div>
                                        <div className="text-xs opacity-90">Current AQI Score</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted rounded-md text-center">
                                                <Wind className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                                <div className="text-xs text-muted-foreground">PM2.5</div>
                                                <div className="font-bold">{selectedMapWard.pm25 || 85}</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-md text-center">
                                                <Car className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                                                <div className="text-xs text-muted-foreground">PM10</div>
                                                <div className="font-bold">{selectedMapWard.pm10 || 140}</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-md text-center">
                                                <Volume2 className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                                                <div className="text-xs text-muted-foreground">Noise</div>
                                                <div className="font-bold">{selectedMapWard.noiseLevel || 65} dB</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-md text-center">
                                                <Droplets className="h-5 w-5 mx-auto mb-1 text-cyan-500" />
                                                <div className="text-xs text-muted-foreground">Water</div>
                                                <div className="font-bold">Good</div>
                                            </div>
                                        </div>
                                        
                                        <Button className="w-full" onClick={() => window.location.href = `/ward/${selectedMapWard.id}`}>
                                            View Full Analytics
                                        </Button>
                                    </div>
                                </div>
                             ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                                    <MapPin className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Select a pin to view details</p>
                                </div>
                             )}

                             {/* Ward Legend */}
                             <div className="mt-6 pt-6 border-t">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">AQI Legend</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>Good</span><span>0-80</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#84cc16]"></span>Moderate</span><span>81-150</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#eab308]"></span>Unhealthy</span><span>151-250</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f97316]"></span>Severe</span><span>251-350</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>Hazardous</span><span>350+</span></div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* SCENARIO 2: Complaint Mode - Show Filters */}
                    {mapViewMode !== 'wards' && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Filter Complaints</h4>
                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAllSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'}`}>
                                    {isAllSelected && <CheckSquare className="h-3.5 w-3.5" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={isAllSelected} onChange={toggleAllCategories} />
                                <div className="flex items-center gap-2 text-sm font-medium"><Layers className="h-4 w-4 text-muted-foreground" /><span>{isAllSelected ? 'Unselect All' : 'Select All'}</span></div>
                            </label>
                            <div className="h-px bg-border my-2" />
                            {(Object.keys(CATEGORY_COLORS) as ComplaintCategory[]).map(cat => {
                                const Icon = CATEGORY_ICONS[cat];
                                const isSelected = selectedCategories.includes(cat);
                                const color = CATEGORY_COLORS[cat];
                                return (
                                    <label key={cat} className="flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-1 rounded -mx-1 select-none">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'}`}>
                                                {isSelected && <CheckSquare className="h-3.5 w-3.5" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleCategory(cat)} />
                                            <div className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4" style={{ color: isSelected ? 'inherit' : '#9ca3af' }} /><span className={isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}>{cat}</span></div>
                                        </div>
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: color, opacity: isSelected ? 1 : 0.3}} />
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-muted/20 p-4 rounded-lg mb-6">
            <div className="flex flex-wrap gap-2">
                <Button variant={selectedZone === null ? "secondary" : "outline"} size="sm" onClick={() => handleZoneChange(null)}>All Zones</Button>
                {zones.map((zone) => <Button key={zone} variant={selectedZone === zone ? "secondary" : "outline"} size="sm" onClick={() => handleZoneChange(zone)}>{zone}</Button>)}
            </div>
            <div className="flex items-center gap-4">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                <div className="h-8 w-px bg-border mx-2 hidden md:block" />
                <div className="flex bg-background rounded-md border">
                    <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("grid")}><Grid className="h-4 w-4" /></Button>
                    <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>

        {/* Bottom Ward List */}
        <div className="mb-8">
            <h3 className="font-heading text-lg font-semibold mb-4">
                {selectedZone ? `${selectedZone} Wards` : 'All Wards'} ({filteredWards.length}) - Showing {currentRange}
            </h3>
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
                {currentWards.map((ward) => <WardCard key={ward.id} ward={ward} showDetails={viewMode === "grid"} />)}
            </div>
        </div>
      </div>
    </div>
  );
}
