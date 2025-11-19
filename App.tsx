import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Station, AnnouncementLog, Challenge, StationStatus, GameOverReason } from './types';
import { METRO_STATIONS, LANDMARKS, CHALLENGES, MAX_SPEED, ACCELERATION_RATE, BRAKING_RATE, FRICTION, STATION_TOLERANCE, TRACK_LENGTH, REWARD_PER_STOP, PENALTY_MISSED, INITIAL_TIME, OVERSPEED_THRESHOLD, OBSTACLE_CLEAR_RANGE } from './constants';
import TrainDisplay from './components/TrainDisplay';
import Dashboard from './components/Dashboard';
import AnnouncementPanel from './components/AnnouncementPanel';
import { generateStationAnnouncement, generateTrivia, generateChallengeAlert } from './services/geminiService';
import { playSound, startMusic, startTremble, stopTremble } from './services/audioService';

const App: React.FC = () => {
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
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES);
  const [hasStartedMusic, setHasStartedMusic] = useState(false);
  
  const stateRef = useRef(gameState);
  const challengesRef = useRef(challenges);
  const inputsRef = useRef({ accelerate: false, brake: false });
  const requestRef = useRef<number>();
  const alertLockRef = useRef(false); // Prevent spamming alerts
  const soundLockRef = useRef({ depart: false, brake: false, tremble: false });
  
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Sync challenges ref
  useEffect(() => {
    challengesRef.current = challenges;
  }, [challenges]);

  const addLog = (text: string, station: string, isUrgent = false) => {
      setLogs(prev => {
          // Keep only the last 5 logs to prevent overflowing and performance issues
          const newLogs = [...prev, {
            id: Date.now().toString(),
            timestamp: new Date(),
            text,
            station,
            isUrgent
          }];
          return newLogs.slice(-5);
      });
  };

  // Ensure music starts on interaction
  const ensureMusic = () => {
      if (!hasStartedMusic) {
          startMusic();
          setHasStartedMusic(true);
      }
  };

  // Game Loop
  const gameLoop = useCallback(() => {
    const now = Date.now();
    const dt = (now - stateRef.current.lastTime) / 1000; // Delta time in seconds
    
    if (stateRef.current.gameOverState !== 'NONE') {
        // Stop loop if game over
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        stopTremble(); // Ensure tremble stops on game over
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

    // --- Time Management ---
    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        newGameOverState = 'TIME_OUT';
    }

    // --- Physics ---
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
        
        if (velocity > 0) acc -= FRICTION + (velocity * 0.01); // Air resistance
        if (velocity < 0) acc += FRICTION; 
    }

    velocity += acc * dt;
    
    // Clamp
    if (velocity < 0 && !inputsRef.current.brake) velocity = 0; 
    if (velocity < 0.05 && velocity > -0.05 && !inputsRef.current.accelerate) velocity = 0;
    if (velocity > MAX_SPEED) velocity = MAX_SPEED;

    // --- Challenges Logic ---
    const distAhead = 500; // Look ahead
    const nextChallenge = challengesRef.current.find(c => 
        !c.cleared && 
        c.startDistance > position && 
        c.startDistance < position + distAhead
    );

    // Activate challenge
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

    // Check general overspeed
    if (velocity > OVERSPEED_THRESHOLD) {
        health -= 3.0 * dt;
        isTrembling = true;
    }

    // Challenge Active Logic
    if (currentChallenge) {
        if (currentChallenge.type === 'SPEED_LIMIT' && currentChallenge.endDistance && position > currentChallenge.endDistance) {
             currentChallenge = null; // Zone ended
        }
        
        if (currentChallenge) {
             // OBSTACLE
             if (currentChallenge.type === 'OBSTACLE') {
                 const distToObstacle = currentChallenge.startDistance - position;
                 
                 // Collision
                 if (distToObstacle < 5 && distToObstacle > -5) {
                     if (velocity > 2) {
                         health -= 20 * (velocity / 10); // High damage collision
                         velocity = 0;
                         newMoney -= 500000;
                         addLog("COLLISION DETECTED. HULL DAMAGE.", "SYSTEM", true);
                     } 
                     // If stopped here, we wait for manual clear (handled via button)
                 }
             }
             // SPEED LIMIT
             if (currentChallenge.type === 'SPEED_LIMIT' && position > currentChallenge.startDistance) {
                 const limit = currentChallenge.value || 30;
                 if (velocity > limit) {
                     health -= 0.1; // Drain health
                     isTrembling = true; // Tremble if speeding in zone
                 }
             }
        }
    }

    // --- Manage Tremble Sound ---
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

    // --- Check for Missed Stations ---
    METRO_STATIONS.forEach(station => {
        // If we passed the station stop zone by a safe margin and it is still PENDING
        if (newStationStatus[station.id] === 'PENDING' && position > station.distance + STATION_TOLERANCE + 150) {
            newStationStatus[station.id] = 'MISSED';
            newMoney -= PENALTY_MISSED;
        }
    });

    // Bounds
    if (position < 0) position = 0;
    if (position > TRACK_LENGTH) position = TRACK_LENGTH;
    if (health <= 0) {
        health = 0;
        newGameOverState = 'CRITICAL_FAILURE';
    }

    // Find next station
    let nextIdx = currentStationIndex;
    if (position > METRO_STATIONS[currentStationIndex].distance + 100) {
        if (currentStationIndex < METRO_STATIONS.length - 1) {
            nextIdx = currentStationIndex + 1;
        }
    }
    
    const distToNext = METRO_STATIONS[nextIdx].distance - position;

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

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      stopTremble();
    };
  }, [gameLoop]);


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
        // Check if we are at a station to collect money
        const currentStation = METRO_STATIONS[gameState.currentStationIndex];
        const dist = Math.abs(gameState.position - currentStation.distance);
        
        if (dist < STATION_TOLERANCE && gameState.velocity < 0.1) {
            if (updatedStatus[currentStation.id] === 'PENDING') {
                updatedStatus[currentStation.id] = 'COMPLETED';
                newMoney += REWARD_PER_STOP;
                newHealth = Math.min(100, newHealth + 10); // Repair 10%
                timeBonus = 15; // Bonus time adjusted to 15s
                addLog(`Boarding successful. +$${REWARD_PER_STOP.toLocaleString()}. Repair +10%. Time +15s.`, 'STATION');

                // Check Win Condition (Last Station)
                if (gameState.currentStationIndex === METRO_STATIONS.length - 1) {
                    // Final Check: Money
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
          addLog("Construction crew clearing debris...", "SYSTEM");
          
          // Delay slightly for effect
          setTimeout(() => {
              addLog("Track cleared. Resume schedule.", "SYSTEM");
              const updatedList = challengesRef.current.map(c => c.id === currentChallenge.id ? {...c, cleared: true} : c);
              setChallenges(updatedList);
              setGameState(prev => ({ ...prev, activeChallenge: null }));
          }, 1000);
      }
  };

  const triggerAnnouncement = async () => {
    if (isAnnouncing) return;
    setIsAnnouncing(true);

    const currentStation = METRO_STATIONS[gameState.currentStationIndex];
    const isAtStation = Math.abs(gameState.position - currentStation.distance) < STATION_TOLERANCE;
    const prevStation = gameState.currentStationIndex > 0 ? METRO_STATIONS[gameState.currentStationIndex - 1].name : null;

    let text = "";
    if (isAtStation) {
        text = await generateStationAnnouncement(currentStation.name, prevStation);
    } else {
        text = "Attention: Doors opening outside of station zone.";
    }

    addLog(text, isAtStation ? currentStation.name : 'Unknown');
    setIsAnnouncing(false);
  };

  const restartGame = () => {
      setGameState({
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
      setChallenges(CHALLENGES);
      setLogs([]);
      stopTremble(); // Stop any lingering sound
      addLog("System Rebooted. Ready for departure.", "SYSTEM");
      inputsRef.current.accelerate = false;
      inputsRef.current.brake = false;
      ensureMusic();
  };

  useEffect(() => {
    const init = async () => {
        const trivia = await generateTrivia();
        addLog(`Welcome to High-Speed Testing. ${trivia}`, 'Depot');
    };
    init();
  }, []);

  // Helper to check if clearing is allowed
  const canClear = gameState.activeChallenge?.type === 'OBSTACLE' 
        && gameState.velocity < 0.1 
        && gameState.activeChallenge && Math.abs(gameState.activeChallenge.startDistance - gameState.position) < OBSTACLE_CLEAR_RANGE;

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
                      {gameState.gameOverState === 'WON' && 'You successfully navigated Line 1 to Calle 72.'}
                      {gameState.gameOverState === 'TIME_OUT' && 'The schedule was not met. Passengers are delayed.'}
                      {gameState.gameOverState === 'CRITICAL_FAILURE' && 'Train integrity critical. Construction hazards fatal.'}
                      {gameState.gameOverState === 'BANKRUPTCY' && 'We need to make money! You finished with massive debt.'}
                  </p>
                  <div className="bg-black p-4 rounded mb-6">
                      <div className="text-sm text-zinc-500 uppercase">Final Revenue</div>
                      <div className={`text-2xl font-mono font-bold ${gameState.money < 0 ? 'text-red-500' : 'text-metro-yellow'}`}>
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(gameState.money)}
                      </div>
                  </div>
                  <button 
                    onClick={restartGame}
                    className="w-full bg-metro-yellow hover:bg-yellow-400 text-black font-bold py-3 rounded-xl uppercase tracking-widest transition-colors"
                  >
                      Try Again
                  </button>
              </div>
          </div>
      )}

      <header className="h-12 bg-metro-dark border-b border-zinc-800 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-metro-green rounded-md flex items-center justify-center font-bold text-lg">M</div>
            <h1 className="font-bold text-lg tracking-tight text-zinc-100">Bogotá Metro Sim <span className="text-metro-yellow">2028</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="text-xs text-zinc-500 font-mono hidden md:block">
               SYS_STATUS: CONSTRUCTION MODE | V_NET: 2.4.1
            </div>
            <button 
                onClick={restartGame}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold uppercase transition-colors shadow-lg border border-red-400"
            >
                Reset Sim
            </button>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col min-h-0">
         <div className="shrink-0">
            <TrainDisplay 
                gameState={gameState} 
                stations={METRO_STATIONS} 
                landmarks={LANDMARKS}
                challenges={challenges}
            />
         </div>
         
         <div className="flex-1 flex flex-col md:flex-row min-h-0 border-t border-zinc-800 bg-zinc-900">
            {/* Dashboard Container - Flex 1 (Takes remaining space) */}
            <div className="flex-1 relative z-20 p-2 md:p-0 overflow-y-auto md:overflow-visible">
                <Dashboard 
                    gameState={gameState}
                    onAccelerate={handleAccelerate}
                    onBrake={handleBrake}
                    onToggleDoors={handleToggleDoors}
                    onClearObstacle={handleClearObstacle}
                    canClearObstacle={canClear || false}
                    distanceToNext={gameState.nextStationDistance}
                    nextStationName={METRO_STATIONS[gameState.currentStationIndex].name}
                />
            </div>
            
            {/* PA System - Fixed width on desktop, fixed height on mobile. DOES NOT EXPAND PARENT */}
            <div className="w-full md:w-96 shrink-0 z-20 border-t md:border-t-0 md:border-l border-zinc-700">
                <AnnouncementPanel logs={logs} isLoading={isAnnouncing} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;