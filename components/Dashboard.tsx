import React from 'react';
import { GameState, Challenge } from '../types';
import { MAX_SPEED } from '../constants';

interface DashboardProps {
  gameState: GameState;
  onAccelerate: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onToggleDoors: () => void;
  onClearObstacle: () => void;
  canClearObstacle: boolean;
  distanceToNext: number;
  nextStationName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  gameState, 
  onAccelerate, 
  onBrake, 
  onToggleDoors,
  onClearObstacle,
  canClearObstacle,
  distanceToNext,
  nextStationName
}) => {
  const speedKmh = Math.floor(gameState.velocity * 3.6);
  const speedPercent = (gameState.velocity / MAX_SPEED) * 100;
  
  const formatDistance = (d: number) => {
    if (d > 1000) return `${(d / 1000).toFixed(1)} km`;
    return `${Math.floor(d)} m`;
  };

  const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const canOpenDoors = Math.abs(gameState.velocity) < 0.1 && Math.abs(distanceToNext) < 50;

  // Alert state
  const activeChallenge = gameState.activeChallenge;
  const showWarning = activeChallenge && !activeChallenge.cleared;
  const isCriticalTime = gameState.timeLeft < 60;

  return (
    <div className="bg-metro-panel p-4 md:p-6 border-t border-zinc-700 grid grid-cols-1 md:grid-cols-3 gap-6 select-none relative overflow-hidden">
      {/* Warning Overlay */}
      {showWarning && (
          <div className="absolute inset-0 bg-red-900/20 pointer-events-none z-0 animate-pulse"></div>
      )}

      {/* Left: Status & Speedometer */}
      <div className="flex flex-col space-y-4 z-10">
         <div className={`bg-zinc-900 rounded-lg p-4 border shadow-inner relative overflow-hidden ${showWarning ? 'border-red-500' : 'border-zinc-700'}`}>
            {/* Header Row: Revenue & Time */}
            <div className="flex justify-between mb-2 border-b border-zinc-800 pb-2">
                <div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Revenue</div>
                    <div className={`text-lg font-mono font-bold ${gameState.money >= 0 ? 'text-metro-yellow' : 'text-red-500'}`}>
                        {formatMoney(gameState.money)}
                    </div>
                </div>
                <div className="text-right">
                     <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Deadline</div>
                     <div className={`text-2xl font-mono font-bold ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(gameState.timeLeft)}
                    </div>
                </div>
            </div>

            {/* Speedometer & Health */}
            <div className="flex justify-between items-end mt-2">
                <div className="flex items-baseline space-x-2">
                    <span className={`text-5xl font-mono font-bold ${speedKmh > 150 ? 'text-metro-red' : 'text-white'}`}>
                        {speedKmh.toString().padStart(3, '0')}
                    </span>
                    <span className="text-zinc-500 text-sm">km/h</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Integrity</div>
                     <div className={`text-lg font-bold ${gameState.health < 50 ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.floor(gameState.health)}%
                    </div>
                </div>
            </div>
            {/* Bar */}
            <div className="w-full h-2 bg-zinc-800 mt-2 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-100 ${speedKmh > 150 ? 'bg-red-500' : 'bg-gradient-to-r from-metro-green to-metro-yellow'}`}
                 style={{ width: `${speedPercent}%` }}
               ></div>
            </div>
            {showWarning && (
                <div className="mt-2 text-red-500 font-bold text-xs uppercase animate-bounce bg-black/50 text-center py-1 rounded border border-red-900">
                    ⚠ {activeChallenge?.type === 'OBSTACLE' ? 'OBSTACLE AHEAD - BRAKE TO STOP' : `SLOW ZONE - LIMIT ${activeChallenge?.value} m/s`}
                </div>
            )}
         </div>

         <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 flex justify-between items-center">
            <div>
                <div className="text-xs text-zinc-400 uppercase">Next Station</div>
                <div className="text-white font-semibold truncate w-32">{nextStationName}</div>
            </div>
            <div className="text-right">
                <div className="text-xs text-zinc-400 uppercase">Dist</div>
                <div className={`font-mono text-xl ${distanceToNext < 200 ? 'text-metro-green animate-pulse' : 'text-white'}`}>
                    {formatDistance(Math.abs(distanceToNext))}
                </div>
            </div>
         </div>
      </div>

      {/* Center: Controls */}
      <div className="flex items-center justify-center space-x-6 z-10">
         {/* Brake Lever */}
         <button
            className="group relative w-24 h-48 bg-zinc-800 rounded-xl border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-end p-4 hover:bg-zinc-750 outline-none ring-0"
            onMouseDown={() => onBrake(true)}
            onMouseUp={() => onBrake(false)}
            onTouchStart={() => onBrake(true)}
            onTouchEnd={() => onBrake(false)}
            onMouseLeave={() => onBrake(false)}
         >
             <div className="absolute top-4 text-metro-red font-bold uppercase text-xs tracking-widest">Brake</div>
             <div className="w-16 h-32 bg-zinc-900 rounded-lg border border-zinc-600 relative overflow-hidden">
                 <div className="absolute bottom-0 left-0 w-full bg-red-600/20 group-active:bg-red-600/80 h-full transition-all duration-75 origin-bottom scale-y-0 group-active:scale-y-100"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-20 bg-zinc-700 rounded-full"></div>
                    <div className="absolute w-12 h-8 bg-zinc-500 rounded shadow-lg top-4 group-active:top-24 transition-all duration-100"></div>
                 </div>
             </div>
         </button>

         {/* Throttle Lever */}
         <button
            className="group relative w-24 h-48 bg-zinc-800 rounded-xl border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-end p-4 hover:bg-zinc-750 outline-none ring-0"
            onMouseDown={() => onAccelerate(true)}
            onMouseUp={() => onAccelerate(false)}
            onTouchStart={() => onAccelerate(true)}
            onTouchEnd={() => onAccelerate(false)}
            onMouseLeave={() => onAccelerate(false)}
         >
             <div className="absolute top-4 text-metro-green font-bold uppercase text-xs tracking-widest">Power</div>
             <div className="w-16 h-32 bg-zinc-900 rounded-lg border border-zinc-600 relative overflow-hidden">
                 <div className="absolute bottom-0 left-0 w-full bg-green-600/20 group-active:bg-green-600/80 h-full transition-all duration-75 origin-bottom scale-y-0 group-active:scale-y-100"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-20 bg-zinc-700 rounded-full"></div>
                    <div className="absolute w-12 h-8 bg-zinc-500 rounded shadow-lg bottom-4 group-active:bottom-24 transition-all duration-100"></div>
                 </div>
             </div>
         </button>
      </div>

      {/* Right: Door Control & Indicators */}
      <div className="flex flex-col justify-between space-y-4 z-10">
          {canClearObstacle ? (
             <button 
                onClick={onClearObstacle}
                className="w-full h-24 rounded-xl font-bold uppercase tracking-widest text-lg bg-yellow-500 hover:bg-yellow-400 text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 animate-bounce shadow-[0_0_20px_rgba(255,200,0,0.6)] flex flex-col items-center justify-center"
             >
                 <span>⚠ CLEAR DEBRIS</span>
                 <span className="text-xs mt-1">Click to remove blockage</span>
             </button>
          ) : (
            <>
                <div className="bg-black rounded-lg p-3 border border-zinc-800 flex space-x-2">
                    <div className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold uppercase ${gameState.isDoorOpen ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-zinc-800 text-zinc-600'}`}>Doors Open</div>
                    <div className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold uppercase ${canOpenDoors && !gameState.isDoorOpen ? 'bg-green-900 text-green-200' : 'bg-zinc-800 text-zinc-600'}`}>Station Stop</div>
                </div>

                <button
                    onClick={onToggleDoors}
                    disabled={!canOpenDoors && !gameState.isDoorOpen}
                    className={`w-full h-full rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center shadow-lg outline-none ring-0
                        ${gameState.isDoorOpen 
                            ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1' 
                            : canOpenDoors 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 animate-bounce'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed border-b-4 border-zinc-800'
                        }
                    `}
                >
                    {gameState.isDoorOpen ? 'Close Doors' : 'Open Doors'}
                </button>
            </>
          )}
      </div>
    </div>
  );
};

export default Dashboard;