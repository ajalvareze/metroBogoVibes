import React, { useEffect, useRef } from 'react';
import { AnnouncementLog } from '../types';

interface AnnouncementPanelProps {
  logs: AnnouncementLog[];
  isLoading: boolean;
}

const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ logs, isLoading }) => {
  const lastLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever logs change
  useEffect(() => {
    if (lastLogRef.current) {
        lastLogRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logs, isLoading]);

  return (
    <div className="h-48 md:h-full w-full bg-black border-l border-zinc-800 flex flex-col text-sm font-mono overflow-hidden">
      <div className="bg-metro-yellow text-black px-3 py-2 font-bold uppercase tracking-wide flex justify-between items-center shrink-0 z-10 shadow-md">
         <span>PA System</span>
         {isLoading && <span className="animate-pulse text-xs">Broadcasting...</span>}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50 relative">
        {logs.length === 0 && (
            <div className="text-zinc-600 italic text-xs mt-2">System Initialized...</div>
        )}
        {logs.map((log, index) => (
          <div 
            key={log.id} 
            ref={index === logs.length - 1 ? lastLogRef : null}
            className="animate-fade-in"
          >
            <div className="flex items-center justify-between mb-1">
               <span className="text-zinc-500 text-[10px] uppercase tracking-wider bg-zinc-900 px-1 rounded">{log.station}</span>
               <span className="text-metro-green text-[10px] font-bold">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            </div>
            <p className={`leading-snug border-l-2 pl-2 py-1 text-xs md:text-sm ${log.isUrgent ? 'border-red-500 text-red-100 bg-red-900/20' : 'border-zinc-600 text-zinc-300'}`}>
              "{log.text}"
            </p>
          </div>
        ))}
        {isLoading && (
             <div ref={lastLogRef} className="animate-pulse flex space-x-2 items-center mt-2">
                 <div className="w-1.5 h-1.5 bg-metro-green rounded-full animate-ping"></div>
                 <div className="text-zinc-500 text-xs">Generating...</div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementPanel;