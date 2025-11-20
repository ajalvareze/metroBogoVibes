import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Station, AnnouncementLog, Challenge, StationStatus, GameOverReason, Landmark } from './types';
import { METRO_STATIONS, LANDMARKS, generateCrazyData, generateRandomChallenges, MAX_SPEED, ACCELERATION_RATE, BRAKING_RATE, FRICTION, STATION_TOLERANCE, TRACK_LENGTH, REWARD_PER_STOP, PENALTY_MISSED, INITIAL_TIME, OVERSPEED_THRESHOLD, OBSTACLE_CLEAR_RANGE } from './constants';
import TrainDisplay from './components/TrainDisplay';
import Dashboard from './components/Dashboard';
import AnnouncementPanel from './components/AnnouncementPanel';
import { generateStationAnnouncement, generateTrivia, generateChallengeAlert } from './services/geminiService';
import { playSound, startMusic, startTremble, stopTremble, setMute } from './services/audioService';

type GameMode = 'NORMAL' | 'CRAZY' | null;

const App: React.FC = () => {
  // Data State (Depends on Game Mode)
  const [activeStations, setActiveStations] = useState<Station[]>(METRO_STATIONS);
  const [activeLandmarks, setActiveLandmarks] = useState<Landmark[]>(LANDMARKS);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    position: 0,
    velocity: 0,
    acceleration: 0,
    lastTime: Date.now(),
    isDoorOpen: false,
    currentStationIndex: 0,
    satisfaction: 100,
    health: 100,
    nextStationDistance: METRO_STATIONS[1].distance,
    activeChallenge: null,
    money: 0,
    stationStatus: METRO_STATIONS.reduce((acc, s) => ({...acc, [s.id]: 'PENDING'}), {} as Record<string, StationStatus>),
    timeLeft: INITIAL_TIME,
    gameOverState: 'NONE'
  });

  const [logs, setLogs] = useState<AnnouncementLog[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [hasStartedMusic, setHasStartedMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(null); // null = Start Screen
  
  const stateRef = useRef(gameState);
  const challengesRef = useRef(challenges);
  const stationsRef = useRef(activeStations);
  const inputsRef = useRef({ accelerate: false, brake: false });
  const requestRef = useRef<number>(0);
  const alertLockRef = useRef(false); 
  const soundLockRef = useRef({ depart: false, brake: false, tremble: false });
  
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    challengesRef.current = challenges;
  }, [challenges]);

  // Update stationsRef whenever stations change (e.g. mode switch)
  useEffect(() => {
    stationsRef.current = activeStations;
  }, [activeStations]);

  const addLog = (text: string, station: string, isUrgent = false) => {
      setLogs(prev => {
          const newLogs = [...prev, {
            id: Date.now().toString(),
            timestamp: new Date(),
            text,
            station,
            isUrgent
          }];
          return newLogs.slice(-2);
      });
  };

  const ensureMusic = () => {
      if (!hasStartedMusic) {
          startMusic();
          setHasStartedMusic(true);
      }
  };

  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      setMute(newState);
  };

  const startGame = (mode: 'NORMAL' | 'CRAZY') => {
      let stations = METRO_STATIONS;
      let landmarks = LANDMARKS;

      if (mode === 'CRAZY') {
          const data = generateCrazyData();
          stations = data.stations;
          landmarks = data.landmarks;
      }

      setActiveStations(stations);
      setActiveLandmarks(landmarks);
      
      // Generate challenges based on the chosen stations
      const newChallenges = generateRandomChallenges(stations);
      setChallenges(newChallenges);

      setGameState({
        position: 0,
        velocity: 0,
        acceleration: 0,
        lastTime: Date.now(),
        isDoorOpen: false,
        currentStationIndex: 0,
        satisfaction: 100,
        health: 100,
        nextStationDistance: stations[1].distance,
        activeChallenge: null,
        money: 0,
        stationStatus: stations.reduce((acc, s) => ({...acc, [s.id]: 'PENDING'}), {} as Record<string, StationStatus>),
        timeLeft: INITIAL_TIME,
        gameOverState: 'NONE'
      });
      
      setGameMode(mode);
      setLogs([]);
      ensureMusic();
      addLog(`Initialized ${mode === 'NORMAL' ? 'Línea 1' : 'Línea Loca'} Protocol.`, "SYSTEM");
  };

  const restartGame = () => {
      // Go back to main menu
      setGameMode(null);
      stopTremble(); 
      inputsRef.current.accelerate = false;
      inputsRef.current.brake = false;
  };

  const gameLoop = useCallback(() => {
    // Only run loop if game is active (mode selected)
    if (!stateRef.current) return; 
    
    const now = Date.now();
    const dt = (now - stateRef.current.lastTime) / 1000; 
    
    if (stateRef.current.gameOverState !== 'NONE') {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        stopTremble(); 
        return;
    }

    if (dt > 0.1) { 
        stateRef.current.lastTime = now;
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    let { position, velocity, isDoorOpen, currentStationIndex, health, activeChallenge, money, stationStatus, timeLeft } = stateRef.current;
    let currentChallenge = activeChallenge;
    let newMoney = money;
    let newStationStatus = { ...stationStatus };
    let newGameOverState: GameOverReason = 'NONE';

    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        newGameOverState = 'TIME_OUT';
    }

    let acc = 0;
    
    if (isDoorOpen) {
        velocity = 0;
        acc = 0;
    } else {
        if (inputsRef.current.accelerate) {
            acc += ACCELERATION_RATE;
            if (!soundLockRef.current.depart && velocity < 5) {
                playSound('DEPART');
                soundLockRef.current.depart = true;
            }
        } else {
            soundLockRef.current.depart = false;
        }

        if (inputsRef.current.brake) {
            acc -= BRAKING_RATE;
            if (!soundLockRef.current.brake && velocity > 5) {
                playSound('BRAKE');
                soundLockRef.current.brake = true;
            }
        } else {
             soundLockRef.current.brake = false;
        }
        
        if (velocity > 0) acc -= FRICTION + (velocity * 0.01); 
        if (velocity < 0) acc += FRICTION; 
    }

    velocity += acc * dt;
    
    if (velocity < 0 && !inputsRef.current.brake) velocity = 0; 
    if (velocity < 0.05 && velocity > -0.05 && !inputsRef.current.accelerate) velocity = 0;
    if (velocity > MAX_SPEED) velocity = MAX_SPEED;

    const distAhead = 500; 
    const nextChallenge = challengesRef.current.find(c => 
        !c.cleared && 
        c.startDistance > position && 
        c.startDistance < position + distAhead
    );

    if (nextChallenge && currentChallenge?.id !== nextChallenge.id) {
        currentChallenge = nextChallenge;
        if (!alertLockRef.current) {
            alertLockRef.current = true;
            playSound('WARNING');
            generateChallengeAlert(nextChallenge.type, nextChallenge.description)
                .then(text => {
                    addLog(text, 'SYSTEM', true);
                    alertLockRef.current = false;
                });
        }
    }

    let isTrembling = false;

    if (velocity > OVERSPEED_THRESHOLD) {
        health -= 3.0 * dt;
        isTrembling = true;
    }

    if (currentChallenge) {
        if (currentChallenge.type === 'SPEED_LIMIT' && currentChallenge.endDistance && position > currentChallenge.endDistance) {
             currentChallenge = null; 
        }
        
        if (currentChallenge) {
             if (currentChallenge.type === 'OBSTACLE') {
                 const distToObstacle = currentChallenge.startDistance - position;
                 
                 if (distToObstacle < 5 && distToObstacle > -5) {
                     if (velocity > 2) {
                         health -= 20 * (velocity / 10); 
                         velocity = 0;
                         newMoney -= 500000;
                         addLog("COLLISION DETECTED. HULL DAMAGE.", "SYSTEM", true);
                     } 
                 }
             }
             if (currentChallenge.type === 'SPEED_LIMIT' && position > currentChallenge.startDistance) {
                 const limit = currentChallenge.value || 30;
                 if (velocity > limit) {
                     health -= 0.1; 
                     isTrembling = true; 
                 }
             }
        }
    }

    if (isTrembling) {
        if (!soundLockRef.current.tremble) {
            startTremble();
            soundLockRef.current.tremble = true;
        }
    } else {
        if (soundLockRef.current.tremble) {
            stopTremble();
            soundLockRef.current.tremble = false;
        }
    }

    position += velocity * dt;

    stationsRef.current.forEach(station => {
        if (newStationStatus[station.id] === 'PENDING' && position > station.distance + STATION_TOLERANCE + 150) {
            newStationStatus[station.id] = 'MISSED';
            newMoney -= PENALTY_MISSED;
        }
    });

    if (position < 0) position = 0;
    if (position > TRACK_LENGTH) position = TRACK_LENGTH;
    if (health <= 0) {
        health = 0;
        newGameOverState = 'CRITICAL_FAILURE';
    }

    let nextIdx = currentStationIndex;
    const currentStations = stationsRef.current;
    
    if (position > currentStations[currentStationIndex].distance + 100) {
        if (currentStationIndex < currentStations.length - 1) {
            nextIdx = currentStationIndex + 1;
        }
    }
    
    const distToNext = currentStations[nextIdx].distance - position;

    const newState = {
        ...stateRef.current,
        position,
        velocity,
        acceleration: acc,
        lastTime: now,
        currentStationIndex: nextIdx,
        nextStationDistance: distToNext,
        activeChallenge: currentChallenge,
        health,
        money: newMoney,
        stationStatus: newStationStatus,
        timeLeft,
        gameOverState: newGameOverState
    };
    
    setGameState(newState);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start/Stop Loop based on Game Mode
  useEffect(() => {
    if (gameMode) {
        requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      stopTremble();
    };
  }, [gameLoop, gameMode]);


  const handleAccelerate = (active: boolean) => {
    ensureMusic();
    inputsRef.current.accelerate = active;
  };

  const handleBrake = (active: boolean) => {
    ensureMusic();
    inputsRef.current.brake = active;
  };

  const handleToggleDoors = () => {
    ensureMusic();
    const shouldOpen = !gameState.isDoorOpen;
    let newMoney = gameState.money;
    let updatedStatus = { ...gameState.stationStatus };
    let newGameOverState = gameState.gameOverState;
    let newHealth = gameState.health;
    let timeBonus = 0;
    
    if (shouldOpen) {
        playSound('DOOR_OPEN');
        const currentStation = activeStations[gameState.currentStationIndex];
        const dist = Math.abs(gameState.position - currentStation.distance);
        
        if (dist < STATION_TOLERANCE && gameState.velocity < 0.1) {
            if (updatedStatus[currentStation.id] === 'PENDING') {
                updatedStatus[currentStation.id] = 'COMPLETED';
                newMoney += REWARD_PER_STOP;
                newHealth = Math.min(100, newHealth + 10); 
                timeBonus = 15; 
                addLog(`Boarding successful. +$${REWARD_PER_STOP.toLocaleString()}. Repair +10%. Time +15s.`, 'STATION');

                if (gameState.currentStationIndex === activeStations.length - 1) {
                    if (newMoney < 0) {
                        newGameOverState = 'BANKRUPTCY';
                    } else {
                        newGameOverState = 'WON';
                    }
                }
            }
        }
        triggerAnnouncement();
    } else {
        playSound('DOOR_CLOSE');
    }

    setGameState(prev => ({ 
        ...prev, 
        isDoorOpen: shouldOpen,
        money: newMoney,
        stationStatus: updatedStatus,
        gameOverState: newGameOverState,
        health: newHealth,
        timeLeft: prev.timeLeft + timeBonus
    }));
  };

  const handleClearObstacle = () => {
      ensureMusic();
      const currentChallenge = gameState.activeChallenge;
      if (currentChallenge && currentChallenge.type === 'OBSTACLE') {
          // Instant clear - no timeout
          const updatedList = challengesRef.current.map(c => c.id === currentChallenge.id ? {...c, cleared: true} : c);
          setChallenges(updatedList);
          setGameState(prev => ({ ...prev, activeChallenge: null }));
          
          addLog("Debris cleared. Resuming.", "SYSTEM");
          playSound('DOOR_CLOSE'); // Interaction feedback
      }
  };

  const triggerAnnouncement = async () => {
    if (isAnnouncing) return;
    setIsAnnouncing(true);

    const currentStation = activeStations[gameState.currentStationIndex];
    const isAtStation = Math.abs(gameState.position - currentStation.distance) < STATION_TOLERANCE;
    const prevStation = gameState.currentStationIndex > 0 ? activeStations[gameState.currentStationIndex - 1].name : null;

    let text = "";
    if (isAtStation) {
        text = await generateStationAnnouncement(currentStation.name, prevStation);
    } else {
        text = "Warning: Doors opening outside station.";
    }

    addLog(text, isAtStation ? currentStation.name : 'Unknown');
    setIsAnnouncing(false);
  };

  const canClear = gameState.activeChallenge?.type === 'OBSTACLE' 
        && gameState.velocity < 0.1 
        && gameState.activeChallenge && Math.abs(gameState.activeChallenge.startDistance - gameState.position) < OBSTACLE_CLEAR_RANGE;

  const stationsLeft = Math.max(0, activeStations.length - gameState.currentStationIndex - 1);

  // RENDER START SCREEN
  if (!gameMode) {
      return (
        <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center font-sans text-white p-4">
            <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
                    Bogotá Metro <span className="text-metro-yellow">Sim 2028</span>
                </h1>
                <p className="text-zinc-400 text-sm md:text-lg">Select Operation Mode</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <button 
                    onClick={() => startGame('NORMAL')}
                    className="group bg-zinc-900 hover:bg-zinc-800 border-4 border-metro-green p-6 rounded-2xl flex flex-col items-center transition-all transform hover:scale-105"
                >
                    <span className="text-3xl mb-2">🚄</span>
                    <span className="text-xl font-bold uppercase text-metro-green">Línea 1 (Official)</span>
                    <span className="text-xs text-zinc-500 mt-2">The real planned route. 16 Stations.</span>
                </button>

                <button 
                    onClick={() => startGame('CRAZY')}
                    className="group bg-zinc-900 hover:bg-zinc-800 border-4 border-metro-red p-6 rounded-2xl flex flex-col items-center transition-all transform hover:scale-105 relative overflow-hidden"
                >
                     <div className="absolute top-0 right-0 bg-metro-red text-white text-[10px] font-bold px-2 py-1">RANDOMIZED</div>
                    <span className="text-3xl mb-2">🤪</span>
                    <span className="text-xl font-bold uppercase text-metro-red">Línea Loca</span>
                    <span className="text-xs text-zinc-500 mt-2">Random stations. Chaos guaranteed.</span>
                </button>
            </div>
            <div className="mt-12 text-zinc-600 text-xs">
                v1.2.3 | Generated by Gemini
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-white overflow-hidden font-sans relative select-none">
      {/* Game Over Overlay */}
      {gameState.gameOverState !== 'NONE' && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
              <div className="bg-zinc-900 p-8 rounded-2xl border-4 border-metro-yellow shadow-2xl max-w-md text-center">
                  <div className="mb-4 text-6xl">
                      {gameState.gameOverState === 'WON' && '🎉'}
                      {gameState.gameOverState === 'TIME_OUT' && '⏰'}
                      {gameState.gameOverState === 'CRITICAL_FAILURE' && '💥'}
                      {gameState.gameOverState === 'BANKRUPTCY' && '💸'}
                  </div>
                  <h2 className={`text-4xl font-black uppercase mb-2 
                        ${gameState.gameOverState === 'WON' ? 'text-metro-green' : 'text-metro-red'}
                        ${gameState.gameOverState === 'BANKRUPTCY' ? 'text-metro-red' : ''}
                    `}>
                      {gameState.gameOverState === 'WON' && 'Mission Complete!'}
                      {gameState.gameOverState === 'TIME_OUT' && 'Time Expired'}
                      {gameState.gameOverState === 'CRITICAL_FAILURE' && 'System Failure'}
                      {gameState.gameOverState === 'BANKRUPTCY' && 'YOU ARE FIRED!'}
                  </h2>
                  <p className="text-zinc-400 mb-6">
                      {gameState.gameOverState === 'WON' && 'You successfully navigated the line.'}
                      {gameState.gameOverState === 'TIME_OUT' && 'Schedule failed.'}
                      {gameState.gameOverState === 'CRITICAL_FAILURE' && 'Train destroyed.'}
                      {gameState.gameOverState === 'BANKRUPTCY' && 'Bankruptcy declared.'}
                  </p>
                  <div className="bg-black p-4 rounded mb-6">
                      <div className="text-sm text-zinc-500 uppercase">Final Revenue</div>
                      <div className={`text-2xl font-mono font-bold ${gameState.money < 0 ? 'text-red-500' : 'text-metro-yellow'}`}>
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(gameState.money)}
                      </div>
                  </div>
                  <div className="flex space-x-2">
                      <button 
                        onClick={() => startGame(gameMode!)}
                        className="flex-1 bg-metro-yellow hover:bg-yellow-400 text-black font-bold py-3 rounded-xl uppercase tracking-widest transition-colors"
                      >
                          Retry
                      </button>
                      <button 
                        onClick={restartGame}
                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl uppercase tracking-widest transition-colors"
                      >
                          Menu
                      </button>
                  </div>
              </div>
          </div>
      )}

      <header className="h-10 bg-metro-dark border-b border-zinc-800 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-metro-green rounded flex items-center justify-center font-bold text-xs">M</div>
            <h1 className="font-bold text-sm tracking-tight text-zinc-100">
                Metro Sim <span className="text-metro-yellow">2028</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                    {gameMode === 'CRAZY' ? 'Crazy Mode' : 'Line 1'}
                </span>
            </h1>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={toggleMute}
                className={`w-8 h-6 flex items-center justify-center rounded text-xs ${isMuted ? 'bg-red-900 text-red-200' : 'bg-zinc-700 text-white'}`}
                title="Toggle Sound"
            >
                {isMuted ? '🔇' : '🔊'}
            </button>
            <button 
                onClick={restartGame}
                className="bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
            >
                Menu
            </button>
        </div>
      </header>

      {/* Main Vertical Stack */}
      <div className="flex-1 relative flex flex-col min-h-0">
         
         {/* TOP 50% - TRAIN DISPLAY */}
         <div className="h-[50%] shrink-0 relative z-0">
            <TrainDisplay 
                gameState={gameState} 
                stations={activeStations} 
                landmarks={activeLandmarks}
                challenges={challenges}
            />
         </div>
         
         {/* MIDDLE ~40% - DASHBOARD */}
         <div className="flex-1 min-h-0 z-20 border-t border-zinc-800">
            <Dashboard 
                gameState={gameState}
                onAccelerate={handleAccelerate}
                onBrake={handleBrake}
                onToggleDoors={handleToggleDoors}
                onClearObstacle={handleClearObstacle}
                canClearObstacle={canClear || false}
                distanceToNext={gameState.nextStationDistance}
                nextStationName={activeStations[gameState.currentStationIndex]?.name || "Terminus"}
                stationsLeft={stationsLeft}
            />
         </div>
         
         {/* BOTTOM 10% - PA SYSTEM */}
         <div className="h-[10%] shrink-0 min-h-[60px] z-20 border-t border-zinc-700 bg-black">
            <AnnouncementPanel logs={logs} isLoading={isAnnouncing} />
         </div>
      </div>
    </div>
  );
};

export default App;