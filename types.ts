export interface Station {
  id: string;
  name: string;
  distance: number; // Position on track in virtual meters
  description: string; // Static description
}

export enum TrainState {
  STOPPED,
  ACCELERATING,
  COASTING,
  BRAKING
}

export interface Landmark {
  id: string;
  name: string;
  distance: number;
  type: 'building' | 'stadium' | 'park' | 'mountain';
  scale: number;
}

export type ChallengeType = 'OBSTACLE' | 'SPEED_LIMIT';

export interface Challenge {
  id: string;
  type: ChallengeType;
  startDistance: number;
  endDistance?: number; // Only for zones like speed limit
  value?: number; // e.g., max speed allowed
  description: string;
  cleared: boolean;
}

export type StationStatus = 'PENDING' | 'COMPLETED' | 'MISSED';

export type GameOverReason = 'NONE' | 'WON' | 'TIME_OUT' | 'CRITICAL_FAILURE' | 'BANKRUPTCY';

export interface GameState {
  position: number; // Current position in virtual meters
  velocity: number; // Current speed in m/s
  acceleration: number; // Current acceleration in m/s^2
  lastTime: number; // Timestamp of last frame
  isDoorOpen: boolean;
  currentStationIndex: number;
  satisfaction: number; // 0-100
  health: number; // 0-100, Game Over if 0
  nextStationDistance: number;
  activeChallenge: Challenge | null;
  money: number; // Current revenue in COP
  stationStatus: Record<string, StationStatus>;
  timeLeft: number; // Seconds remaining
  gameOverState: GameOverReason;
}

export interface AnnouncementLog {
  id: string;
  timestamp: Date;
  text: string;
  station: string;
  isUrgent?: boolean;
}