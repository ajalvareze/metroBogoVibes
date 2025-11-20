import React, { useEffect, useRef } from 'react';
import { AnnouncementLog } from '../types';

interface AnnouncementPanelProps {
  logs: AnnouncementLog[];
  isLoading: boolean;
}

const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ logs, isLoading }) => {
  const lastLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (lastLogRef.current) {
        lastLogRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logs, isLoading]);

  return (
    <div className="h-full w-full bg-black border-t border-metro-yellow flex flex-col text-xs font-mono overflow-hidden relative">
      {/* Tiny floating label */}
      <div className="absolute top-0 right-0 bg-metro-yellow text-black text-[9px] px-1 font-bold uppercase z-10 opacity-50">PA SYSTEM</div>
      
      <div className="flex-1 overflow-hidden p-2 space-y-1 bg-black/90">
        {logs.length === 0 && (
            <div className="text-zinc-700 italic text-[10px]">Ready...</div>
        )}
        {logs.map((log, index) => (
          <div 
            key={log.id} 
            ref={index === logs.length - 1 ? lastLogRef : null}
            className="flex space-x-2 items-start"
          >
             <span className="text-metro-green font-bold shrink-0">[{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
             <span className={`${log.isUrgent ? 'text-red-400' : 'text-zinc-300'} truncate`}>{log.text}</span>
          </div>
        ))}
        {isLoading && (
             <div className="flex space-x-1 items-center opacity-50">
                 <div className="w-1 h-1 bg-metro-green rounded-full animate-ping"></div>
                 <div className="text-zinc-500 text-[10px]">Transmitting...</div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementPanel;