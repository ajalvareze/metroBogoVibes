import React from 'react';
import { GameState, Station, Landmark, Challenge } from '../types';
import { PIXELS_PER_METER, HAZARD_ZONE_WIDTH, OVERSPEED_THRESHOLD } from '../constants';

interface TrainDisplayProps {
  gameState: GameState;
  stations: Station[];
  landmarks: Landmark[];
  challenges: Challenge[];
}

const TrainDisplay: React.FC<TrainDisplayProps> = ({ gameState, stations, landmarks, challenges }) => {
  // Adjusted parallax for new zoomed-in scale (PIXELS_PER_METER = 6)
  // Mountains move very slowly
  const bgPos = -(gameState.position * 0.1) % 2000; 
  // City moves moderately
  const cityPos = -(gameState.position * 1.5) % 2000;
  // Track moves at full speed
  const trackPos = -(gameState.position * PIXELS_PER_METER) % 200;
  
  const speedKmh = gameState.velocity * 3.6;
  
  // Tremble Logic: Overspeed OR Speeding in Slow Zone
  const isOverspeed = gameState.velocity > OVERSPEED_THRESHOLD;
  const activeSpeedLimit = gameState.activeChallenge?.type === 'SPEED_LIMIT' ? gameState.activeChallenge : null;
  const isSpeedingInZone = activeSpeedLimit ? gameState.velocity > (activeSpeedLimit.value || 100) : false;
  const isTrembling = isOverspeed || isSpeedingInZone;

  const getElementStyle = (worldPos: number, scale = 1) => {
    const relativeMeters = worldPos - gameState.position;
    const screenPixels = relativeMeters * PIXELS_PER_METER;
    
    // Optimization: Don't render if far off screen
    if (screenPixels < -2000 || screenPixels > 3000) {
        return { display: 'none' };
    }

    return {
      transform: `translateX(calc(50vw + ${screenPixels}px)) scale(${scale})`,
    };
  };

  return (
    <div className={`relative w-full h-64 md:h-80 bg-slate-900 overflow-hidden border-b-4 ${gameState.health < 30 ? 'border-red-600 animate-pulse' : 'border-metro-yellow'}`}>
      {/* Sky / Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950"></div>
      
      {/* 1. Far Background: Mountains (Monserrate & Cerros Orientales) */}
      <div 
        className="absolute bottom-24 left-0 h-64 w-[4000px] opacity-30 transition-transform duration-0 ease-linear will-change-transform"
        style={{ transform: `translateX(${bgPos}px)` }}
      >
        <svg width="100%" height="100%" viewBox="0 0 2000 200" preserveAspectRatio="none">
          <path d="M0,200 L300,50 L600,180 L900,80 L1400,190 L1700,40 L2000,200 Z" fill="#1e293b" />
        </svg>
      </div>

      {/* 2. Mid Background: City Skyline */}
      <div 
        className="absolute bottom-16 left-0 h-64 w-[4000px] opacity-50 transition-transform duration-0 ease-linear will-change-transform"
        style={{ transform: `translateX(${cityPos}px)` }}
      >
         <div className="flex items-end h-full space-x-2">
            {Array.from({ length: 40 }).map((_, i) => (
               <div key={i} className="bg-slate-800 w-24 border-t border-slate-700" style={{ height: `${20 + (i * 37 % 70)}%` }}>
                   {/* Windows */}
                   <div className="flex flex-wrap gap-1 p-1 opacity-30">
                       {Array.from({ length: 6 }).map((_, j) => (
                           <div key={j} className="w-1 h-2 bg-yellow-100/50 rounded-sm"></div>
                       ))}
                   </div>
               </div>
            ))}
         </div>
      </div>

      {/* 2b. Landmarks (Parallax linked to position) */}
      {landmarks.map(landmark => (
         <div 
            key={landmark.id}
            className="absolute bottom-20 left-0 flex flex-col items-center justify-end z-0 transition-transform duration-0 ease-linear will-change-transform"
            style={getElementStyle(landmark.distance, landmark.scale)}
         >
             {/* Colpatria Tower */}
             {landmark.type === 'building' && (
                 <div className="relative flex flex-col items-center">
                    <div className="w-16 h-80 bg-gradient-to-t from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center relative overflow-hidden">
                        {/* Illumination */}
                        <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 via-yellow-600/30 to-transparent animate-pulse"></div>
                        <div className="w-1 h-full bg-white/10 absolute left-4"></div>
                        <div className="w-1 h-full bg-white/10 absolute right-4"></div>
                    </div>
                    <div className="w-20 h-4 bg-slate-900"></div>
                 </div>
             )}

             {/* Monserrate Church */}
             {landmark.type === 'mountain' && (
                <div className="relative">
                    <div className="w-[500px] h-64 bg-emerald-950 rounded-[100%] absolute -bottom-10 -left-60 blur-md"></div>
                    <div className="relative z-10 flex flex-col items-center -mt-32">
                        <div className="w-4 h-6 bg-white shadow-[0_0_15px_white]"></div>
                        <div className="w-12 h-8 bg-white rounded-t-lg"></div>
                    </div>
                </div>
             )}

             {/* El Campin */}
             {landmark.type === 'stadium' && (
                 <div className="relative">
                     <div className="w-96 h-32 bg-zinc-700 rounded-t-[100px] border-8 border-zinc-600 flex items-end justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#000_20px,#000_22px)] opacity-20"></div>
                        <div className="text-zinc-400 font-bold text-2xl mb-4 tracking-[0.5em]">ESTADIO</div>
                     </div>
                 </div>
             )}

             {/* Mundo Aventura (Rollercoaster loop) */}
             {landmark.type === 'park' && (
                 <div className="relative w-64 h-64">
                     <svg width="100%" height="100%" viewBox="0 0 100 100" className="stroke-red-600 stroke-[4px] fill-none">
                         <path d="M0,100 Q25,0 50,50 T100,100" />
                     </svg>
                     <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
                 </div>
             )}
             
             <div className="bg-black/70 px-3 py-1 rounded-full text-white text-xs font-bold mt-2 border border-zinc-700 shadow-lg whitespace-nowrap">
                 📍 {landmark.name}
             </div>
         </div>
      ))}

      {/* 3. The Viaduct (Track Structure) - Very fast moving */}
      <div className="absolute bottom-0 w-full h-20 bg-zinc-900 flex items-center justify-center z-10 border-t border-zinc-700">
         {/* Rails */}
         <div className="absolute top-2 w-full h-2 bg-zinc-600"></div>
         
         {/* Challenge Zone Track Overlays (Speed Limit & Obstacles) */}
         {challenges.map(c => {
             if (c.cleared) return null;
             
             let startX = 0;
             let width = 0;
             let className = "";

             if (c.type === 'SPEED_LIMIT' && c.endDistance) {
                 startX = (c.startDistance - gameState.position) * PIXELS_PER_METER + window.innerWidth / 2;
                 width = (c.endDistance - c.startDistance) * PIXELS_PER_METER;
                 className = "bg-red-600/50 animate-pulse";
             } else if (c.type === 'OBSTACLE') {
                 // Draw hazard zone 50m before obstacle
                 const zoneStart = c.startDistance - HAZARD_ZONE_WIDTH;
                 startX = (zoneStart - gameState.position) * PIXELS_PER_METER + window.innerWidth / 2;
                 width = HAZARD_ZONE_WIDTH * PIXELS_PER_METER;
                 // Yellow/Black stripes pattern for construction
                 className = "bg-[repeating-linear-gradient(45deg,yellow,yellow_10px,black_10px,black_20px)] opacity-70 border-y-2 border-yellow-500";
             }
             
             // If offscreen, don't render
             if (startX + width < 0 || startX > window.innerWidth + 2000) return null;

             return (
                 <div 
                    key={`track-${c.id}`}
                    className={`absolute top-2 h-2 z-10 ${className}`}
                    style={{ left: startX, width: width }}
                 ></div>
             )
         })}

         {/* Sleepers / Ties (moving pattern) */}
         <div 
            className="absolute top-0 left-0 w-[4000px] h-full flex transition-transform duration-0 ease-linear will-change-transform"
            style={{ transform: `translateX(${trackPos}px)` }}
         >
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-8 h-full border-l-4 border-zinc-800 bg-zinc-800/50 mr-[192px] relative">
                     {/* Detailed sleeper */}
                    <div className="absolute top-2 -left-20 w-48 h-3 bg-stone-700 shadow-lg"></div> 
                </div>
            ))}
         </div>
      </div>

      {/* 4. Active Challenges (Obstacles on Track) */}
      {challenges.map(challenge => {
          if (challenge.cleared) return null;
          return (
            <div
                key={challenge.id}
                className="absolute bottom-20 flex flex-col items-center justify-end z-20 transition-transform duration-0 ease-linear will-change-transform"
                style={getElementStyle(challenge.startDistance)}
            >
                {challenge.type === 'OBSTACLE' && (
                    <div className="flex flex-col items-center">
                        {/* Construction Barrier */}
                        <div className="flex space-x-1">
                            <div className="w-24 h-16 bg-[repeating-linear-gradient(45deg,yellow,yellow_10px,black_10px,black_20px)] border-2 border-white shadow-xl"></div>
                            <div className="w-24 h-16 bg-[repeating-linear-gradient(-45deg,yellow,yellow_10px,black_10px,black_20px)] border-2 border-white shadow-xl"></div>
                        </div>
                        <div className="w-2 h-10 bg-zinc-500"></div>
                        <div className="absolute -top-16 animate-bounce">
                             <div className="bg-red-600 text-white font-bold px-3 py-1 rounded text-sm uppercase border-2 border-white whitespace-nowrap shadow-lg">
                                 Track Blocked
                             </div>
                             <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-red-600 mx-auto"></div>
                        </div>
                    </div>
                )}
                {challenge.type === 'SPEED_LIMIT' && (
                    <div className="flex flex-col items-center opacity-90">
                        <div className="w-32 h-32 rounded-full bg-white border-8 border-red-600 flex items-center justify-center shadow-lg">
                            <span className="text-black font-black text-5xl">{challenge.value}</span>
                        </div>
                        <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 mt-2 rounded uppercase tracking-wider shadow-md border border-black">
                            SLOW ZONE START
                        </div>
                    </div>
                )}
            </div>
          );
      })}

      {/* 4b. Speed Limit END markers */}
      {challenges.filter(c => c.type === 'SPEED_LIMIT' && c.endDistance).map(challenge => (
          <div 
             key={`end-${challenge.id}`}
             className="absolute bottom-20 flex flex-col items-center justify-end z-20 transition-transform duration-0 ease-linear will-change-transform"
             style={getElementStyle(challenge.endDistance!)}
          >
             <div className="flex flex-col items-center opacity-90">
                 <div className="w-32 h-32 rounded-full bg-zinc-200 border-8 border-zinc-500 flex items-center justify-center shadow-lg">
                     <div className="w-full h-2 bg-black -rotate-45 absolute"></div>
                     <div className="w-full h-2 bg-black -rotate-45 absolute translate-x-4"></div>
                     <div className="w-full h-2 bg-black -rotate-45 absolute -translate-x-4"></div>
                 </div>
                 <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 mt-2 rounded uppercase tracking-wider shadow-md border border-white">
                     ZONE END
                 </div>
             </div>
          </div>
      ))}

      {/* 5. Stations Objects & Stop Indicators */}
      {stations.map(station => (
        <div 
          key={station.id}
          className="absolute bottom-20 flex flex-col items-center justify-end z-10 transition-transform duration-0 ease-linear will-change-transform"
          style={getElementStyle(station.distance)}
        >
            {/* Platform Zone Indicator on Track */}
            <div className="absolute -bottom-6 w-[1200px] h-4 bg-metro-green/30 border-x-2 border-metro-green flex justify-between items-center px-2">
                <div className="text-[10px] text-metro-green font-mono">PLATFORM START</div>
                <div className="text-[10px] text-metro-green font-mono">PLATFORM END</div>
            </div>

            {/* The Station Building */}
           <div className="bg-zinc-800 border-t-4 border-metro-green px-10 py-6 rounded-t-xl shadow-2xl min-w-[500px] text-center relative">
              {/* Roof Overhang */}
              <div className="absolute -top-4 left-[-20px] right-[-20px] h-4 bg-zinc-700 skew-x-12 rounded"></div>
              
              <div className="text-metro-yellow font-bold tracking-[0.3em] uppercase text-xs mb-2">Estación Metro de Bogotá</div>
              <div className="text-white font-black text-4xl font-sans uppercase tracking-tight">{station.name}</div>
              
              {/* Pillars */}
              <div className="absolute -bottom-20 left-4 w-8 h-24 bg-zinc-700"></div>
              <div className="absolute -bottom-20 right-4 w-8 h-24 bg-zinc-700"></div>
           </div>

           {/* STOP MARKER - Precise point */}
           <div className="absolute bottom-0 flex flex-col items-center">
               <div className="animate-bounce mb-2 flex flex-col items-center">
                   <div className="bg-green-500 text-black font-black text-xs px-3 py-1 rounded uppercase shadow-[0_0_15px_rgba(0,255,0,0.8)]">
                       Stop Here
                   </div>
                   <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-green-500"></div>
               </div>
               <div className="w-1 h-32 bg-red-500/50 dashed-line"></div>
               <div className="w-64 h-2 bg-red-600 shadow-[0_0_10px_red]"></div>
           </div>
        </div>
      ))}

      {/* 6. The Train (Player) */}
      {/* Wrap in positioning div first */}
      <div className={`absolute bottom-[72px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-transform duration-100`}>
         {/* Apply tremble animation to inner div so it doesn't conflict with positioning */}
         <div className={`relative w-80 h-28 bg-gray-100 rounded-t-2xl rounded-b-lg shadow-2xl overflow-hidden border border-gray-400 ${isTrembling ? 'animate-tremble' : ''} ${gameState.health < 30 && !isTrembling ? 'animate-pulse' : ''}`}>
            {/* Aerodynamic Nose */}
            <div className="absolute right-0 top-0 h-full w-20 bg-gray-200 skew-x-[-15deg] origin-bottom border-l border-gray-300"></div>
            
            {/* Livery Stripes */}
            <div className="absolute top-6 left-0 w-full h-5 bg-metro-red"></div>
            <div className="absolute bottom-3 left-0 w-full h-3 bg-metro-yellow"></div>
            
            {/* Windows */}
            <div className="absolute top-4 left-6 flex space-x-3">
               <div className="w-16 h-12 bg-blue-950 rounded-sm border border-gray-400 shadow-inner"></div>
               <div className="w-16 h-12 bg-blue-950 rounded-sm border border-gray-400 shadow-inner"></div>
               <div className="w-16 h-12 bg-blue-950 rounded-sm border border-gray-400 shadow-inner"></div>
               {/* Driver Cabin */}
               <div className="w-14 h-12 bg-black rounded-tr-2xl border border-gray-400 shadow-inner"></div>
            </div>

            {/* Doors */}
            <div className={`absolute bottom-5 left-24 w-14 h-16 bg-gray-200 border border-gray-400 transition-all duration-500 ${gameState.isDoorOpen ? 'bg-black/20 border-dashed' : ''}`}>
                <div className={`w-[2px] h-full bg-zinc-400 mx-auto transition-transform duration-500 ${gameState.isDoorOpen ? 'scale-x-[15]' : 'scale-x-1'}`}></div>
            </div>

            {/* Bogies / Wheels */}
            <div className="absolute -bottom-2 left-10 w-12 h-6 bg-zinc-800 rounded"></div>
            <div className="absolute -bottom-2 right-12 w-12 h-6 bg-zinc-800 rounded"></div>
         </div>
      </div>
      
      {/* Speed Effect (Motion Blur Lines) */}
      {gameState.velocity > 10 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {Array.from({ length: Math.floor(gameState.velocity / 5) }).map((_, i) => (
                   <div 
                        key={i}
                        className="absolute h-[1px] bg-white/20"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${50 + Math.random() * 200}px`,
                            animation: `speedLine ${0.2 + Math.random() * 0.3}s linear infinite`
                        }}
                   ></div>
               ))}
               <style>{`
                   @keyframes speedLine {
                       from { transform: translateX(100vw); }
                       to { transform: translateX(-100vw); }
                   }
               `}</style>
          </div>
      )}

      {/* Damage Overlay */}
      {gameState.health < 50 && (
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(255,0,0,0.5)] z-40 animate-pulse mix-blend-overlay"></div>
      )}
    </div>
  );
};

export default TrainDisplay;