import React from 'react';
import { GameState } from '../types';
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
  stationsLeft: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  gameState, 
  onAccelerate, 
  onBrake, 
  onToggleDoors,
  onClearObstacle,
  canClearObstacle,
  distanceToNext,
  nextStationName,
  stationsLeft
}) => {
  const speedKmh = Math.floor(gameState.velocity * 3.6);
  
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
  const showWarning = gameState.activeChallenge && !gameState.activeChallenge.cleared;
  const isCriticalTime = gameState.timeLeft < 60;

  // Health Bar Color Logic
  const getHealthColor = () => {
      if (gameState.health > 50) return 'bg-metro-green';
      if (gameState.health > 25) return 'bg-yellow-500';
      return 'bg-red-600 animate-pulse';
  };

  return (
    <div className="bg-metro-panel h-full w-full flex flex-col select-none relative overflow-hidden">
      {/* Warning Overlay */}
      {showWarning && (
          <div className="absolute inset-0 bg-red-900/20 pointer-events-none z-0 animate-pulse"></div>
      )}

      {/* Top Bar: Compact HUD (Half Size) */}
      <div className="flex justify-between items-center bg-zinc-900 border-b border-zinc-700 px-3 py-2 shrink-0 z-10 shadow-sm">
         {/* Left: Stats */}
         <div className="flex space-x-4 items-center">
             <div className="flex flex-col">
                 <span className="text-[10px] text-zinc-500 uppercase leading-none">Rev</span>
                 <span className={`text-xs font-mono font-bold ${gameState.money >= 0 ? 'text-metro-yellow' : 'text-red-500'}`}>
                    {formatMoney(gameState.money)}
                 </span>
             </div>
             
             {/* New Health Bar */}
             <div className="flex flex-col w-24">
                 <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-zinc-500 uppercase leading-none">Integrity</span>
                 </div>
                 <div className="w-full h-2 bg-zinc-800 rounded-sm border border-zinc-700 overflow-hidden relative">
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>
                    <div 
                        className={`h-full transition-all duration-200 ${getHealthColor()}`}
                        style={{ width: `${Math.max(0, gameState.health)}%` }}
                    ></div>
                 </div>
             </div>

             <div className="flex flex-col">
                 <span className="text-[10px] text-zinc-500 uppercase leading-none">Speed</span>
                 <span className={`text-sm font-mono font-bold ${speedKmh > 150 ? 'text-metro-red' : 'text-white'}`}>{speedKmh} km/h</span>
             </div>
         </div>

         {/* Center: Next Station */}
         <div className="text-center hidden md:block">
             <span className="text-[10px] text-zinc-500 uppercase mr-2">Next:</span>
             <span className="text-xs text-white font-bold">{nextStationName}</span>
             <span className={`ml-2 font-mono text-sm ${distanceToNext < 200 ? 'text-metro-green animate-pulse' : 'text-zinc-300'}`}>
                {formatDistance(Math.abs(distanceToNext))}
             </span>
             <span className="ml-2 text-[10px] text-zinc-400 uppercase">
                ({stationsLeft} left)
             </span>
         </div>

         {/* Right: Time */}
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase leading-none">Time</span>
            <span className={`text-sm font-mono font-bold ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatTime(gameState.timeLeft)}
            </span>
         </div>
      </div>

      {/* Main Controls Area - Maximize Space */}
      <div className="flex-1 flex space-x-2 p-2 min-h-0 z-10 bg-zinc-800">
         {/* Brake Lever (Large) */}
         <button
            className="flex-1 group relative bg-zinc-700 rounded-xl border-b-8 border-black active:border-b-0 active:translate-y-2 transition-all flex flex-col items-center justify-center outline-none ring-0 shadow-xl"
            onMouseDown={() => onBrake(true)}
            onMouseUp={() => onBrake(false)}
            onTouchStart={() => onBrake(true)}
            onTouchEnd={() => onBrake(false)}
            onMouseLeave={() => onBrake(false)}
         >
             <div className="text-metro-red font-black uppercase text-lg md:text-2xl tracking-widest mb-4 group-active:scale-95 transition-transform">BRAKE</div>
             {/* Visual Handle */}
             <div className="w-1/3 h-1/2 bg-zinc-900 rounded-full border-4 border-zinc-600 relative overflow-hidden shadow-inner">
                 <div className="absolute bottom-0 w-full bg-red-600 group-active:h-full h-0 transition-all duration-100"></div>
             </div>
         </button>

         {/* Center Action Panel */}
         <div className="w-1/4 flex flex-col space-y-2 justify-center">
             {canClearObstacle ? (
                 <button 
                    onClick={onClearObstacle}
                    className="h-full rounded-xl font-bold uppercase tracking-tighter leading-tight text-xs md:text-sm bg-yellow-500 hover:bg-yellow-400 text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 animate-bounce flex flex-col items-center justify-center"
                 >
                     <span>⚠ CLEAR</span>
                     <span>DEBRIS</span>
                 </button>
             ) : (
                 <button
                    onClick={onToggleDoors}
                    disabled={!canOpenDoors && !gameState.isDoorOpen}
                    className={`h-full rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm transition-all flex flex-col items-center justify-center shadow-lg outline-none
                        ${gameState.isDoorOpen 
                            ? 'bg-red-600 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1' 
                            : canOpenDoors 
                                ? 'bg-blue-600 text-white border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 animate-pulse'
                                : 'bg-zinc-600 text-zinc-400 cursor-not-allowed border-b-4 border-zinc-800'
                        }
                    `}
                >
                    {gameState.isDoorOpen ? 'CLOSE' : 'OPEN DOORS'}
                </button>
             )}
         </div>

         {/* Throttle Lever (Large) */}
         <button
            className="flex-1 group relative bg-zinc-700 rounded-xl border-b-8 border-black active:border-b-0 active:translate-y-2 transition-all flex flex-col items-center justify-center outline-none ring-0 shadow-xl"
            onMouseDown={() => onAccelerate(true)}
            onMouseUp={() => onAccelerate(false)}
            onTouchStart={() => onAccelerate(true)}
            onTouchEnd={() => onAccelerate(false)}
            onMouseLeave={() => onAccelerate(false)}
         >
             <div className="text-metro-green font-black uppercase text-lg md:text-2xl tracking-widest mb-4 group-active:scale-95 transition-transform">POWER</div>
             {/* Visual Handle */}
             <div className="w-1/3 h-1/2 bg-zinc-900 rounded-full border-4 border-zinc-600 relative overflow-hidden shadow-inner">
                 <div className="absolute bottom-0 w-full bg-green-600 group-active:h-full h-0 transition-all duration-100"></div>
             </div>
         </button>
      </div>
      
      {/* Mobile Warning Label */}
      {showWarning && (
         <div className="absolute top-12 w-full text-center">
            <span className="bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full animate-bounce shadow-lg border border-white">
                ⚠ HAZARD AHEAD
            </span>
         </div>
      )}
    </div>
  );
};

export default Dashboard;