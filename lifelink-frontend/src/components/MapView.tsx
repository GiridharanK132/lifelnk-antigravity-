import React, { useState } from 'react';
import { Hospital, MapPin, Navigation, Info } from 'lucide-react';

interface Point {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: 'hospital' | 'donor' | 'requesting';
  details?: string;
}

interface MapViewProps {
  points: Point[];
  center?: { lat: number; lng: number };
  highlightedPath?: { fromId: number; toIds: number[] };
}

export const MapView: React.FC<MapViewProps> = ({ points, center, highlightedPath }) => {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Translate lat/lng coordinates to standard SVG percentages based on Seattle bounds
  // Seattle bounding box coordinates for our seeded coordinates:
  // Lat: [47.54, 47.68]
  // Lng: [-122.40, -122.30]
  const translateCoordinates = (lat: number, lng: number) => {
    const minLat = 47.54;
    const maxLat = 47.68;
    const minLng = -122.40;
    const maxLng = -122.30;

    // SVG viewbox is 400x300
    const x = ((lng - minLng) / (maxLng - minLng)) * 400;
    // In SVG, Y coordinate is inverted (0 is top)
    const y = 300 - ((lat - minLat) / (maxLat - minLat)) * 300;

    return { x, y };
  };

  const getSourceCoords = () => {
    if (!highlightedPath) return null;
    const src = points.find(p => p.id === highlightedPath.fromId);
    return src ? translateCoordinates(src.latitude, src.longitude) : null;
  };

  const getTargetCoordsList = () => {
    if (!highlightedPath) return [];
    return highlightedPath.toIds
      .map(id => points.find(p => p.id === id))
      .filter((p): p is Point => !!p)
      .map(p => translateCoordinates(p.latitude, p.longitude));
  };

  const srcCoords = getSourceCoords();
  const targetsCoords = getTargetCoordsList();

  return (
    <div className="glass-card flex flex-col relative w-full overflow-hidden min-h-[350px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xs flex items-center gap-2 dark:text-slate-200">
          <Navigation size={14} className="text-red-500" />
          <span>Interactive Grid Mapping Matrix (Seattle Region)</span>
        </h3>
        <span className="text-[9px] font-extrabold uppercase bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
          AI GIS Module
        </span>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 bg-slate-100/50 dark:bg-slate-900/60 rounded-xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40 h-[280px]">
        {/* Background Grid Lines simulating streets */}
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Dynamic GIS rendering */}
        <svg className="w-full h-full" viewBox="0 0 400 300">
          {/* Simulated highways / main lines */}
          <line x1="200" y1="0" x2="200" y2="300" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" className="opacity-20" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="#3b82f6" strokeWidth="1" className="opacity-15" />

          {/* Allocation Paths flow lines */}
          {srcCoords && targetsCoords.map((target, idx) => (
            <g key={idx}>
              {/* Dotted link line */}
              <line
                x1={srcCoords.x}
                y1={srcCoords.y}
                x2={target.x}
                y2={target.y}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                className="animate-pulse"
              />
              {/* Pulsing signal dot running along line */}
              <circle r="3" fill="#ef4444">
                <animateMotion
                  path={`M ${target.x} ${target.y} L ${srcCoords.x} ${srcCoords.y}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Render pins */}
          {points.map((p) => {
            const { x, y } = translateCoordinates(p.latitude, p.longitude);
            const isSelected = selectedPoint?.id === p.id && selectedPoint?.type === p.type;
            const color = p.type === 'hospital' 
              ? '#ef4444' 
              : p.type === 'requesting' 
              ? '#3b82f6' 
              : '#10b981';

            return (
              <g
                key={`${p.type}-${p.id}`}
                onClick={() => setSelectedPoint(p)}
                className="cursor-pointer group"
              >
                {/* Ping rings for active requesting or source hospitals */}
                {(p.type === 'requesting' || (highlightedPath?.toIds.includes(p.id) && p.type === 'hospital')) && (
                  <circle cx={x} cy={y} r="10" fill={color} opacity="0.3" className="animate-ping" />
                )}
                {/* Main pin circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-300 group-hover:scale-125"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Pin HUD details card */}
        {selectedPoint && (
          <div className="absolute bottom-2 left-2 right-2 glass p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex items-start gap-2.5 animate-fadeIn">
            <div className={`p-2 rounded-lg text-white ${selectedPoint.type === 'hospital' ? 'bg-red-500' : selectedPoint.type === 'requesting' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
              {selectedPoint.type === 'hospital' || selectedPoint.type === 'requesting' ? <Hospital size={14} /> : <MapPin size={14} />}
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">{selectedPoint.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{selectedPoint.details || 'Registered Location Node'}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Coords: {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}</p>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-white" />
          <span>Requesting Hosp</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block border border-white" />
          <span>Source Blood Banks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white" />
          <span>Backup Donors</span>
        </div>
      </div>
    </div>
  );
};
