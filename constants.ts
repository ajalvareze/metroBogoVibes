import { Station, Landmark, Challenge } from './types';

// Updated Station List - Highly compressed for arcade gameplay (~10.5km total)
export const METRO_STATIONS: Station[] = [
  { id: 's1', name: 'Carrera 94', distance: 0, description: 'Patio Taller Start' },
  { id: 's2', name: 'Portal Américas', distance: 600, description: 'Major transport hub' },
  { id: 's3', name: 'Carrera 80', distance: 1200, description: 'Kennedy Central' },
  { id: 's4', name: 'Calle 42 Sur', distance: 1800, description: 'Residential sector' },
  { id: 's5', name: 'Ciudad Kennedy', distance: 2500, description: 'Hospital zone' },
  { id: 's6', name: 'Avenida Boyacá', distance: 3200, description: 'Main avenue interchange' },
  { id: 's7', name: 'Avenida Carrera 68', distance: 3900, description: 'Future feeder connection' },
  { id: 's8', name: 'Avenida Carrera 50', distance: 4600, description: 'Industrial zone' },
  { id: 's9', name: 'SENA', distance: 5300, description: 'NQS Interchange' },
  { id: 's10', name: 'Avenida Carrera 24', distance: 6000, description: 'Antonio Nariño' },
  { id: 's11', name: 'Hospital', distance: 6700, description: 'Medical district' },
  { id: 's12', name: 'Avenida Jiménez', distance: 7400, description: 'Historic Center / San Victorino' },
  { id: 's13', name: 'Estación Central', distance: 8100, description: 'Calle 26 Interchange' },
  { id: 's14', name: 'Calle 45', distance: 8800, description: 'University Zone' },
  { id: 's15', name: 'Calle 63', distance: 9500, description: 'Lourdes Park' },
  { id: 's16', name: 'Calle 72', distance: 10200, description: 'Financial District Terminus' },
];

export const LANDMARKS: Landmark[] = [
  { id: 'l1', name: 'Mundo Aventura', distance: 2800, type: 'park', scale: 1.0 },
  { id: 'l2', name: 'Estadio El Campín', distance: 9200, type: 'stadium', scale: 1.0 }, 
  { id: 'l3', name: 'Torre Colpatria', distance: 7800, type: 'building', scale: 1.2 },
  { id: 'l4', name: 'Monserrate', distance: 7500, type: 'mountain', scale: 2.0 },
];

export const CHALLENGES: Challenge[] = [
  { 
    id: 'c1', 
    type: 'SPEED_LIMIT', 
    startDistance: 2000, 
    endDistance: 2200, // Very short zone (200m)
    value: 30, // m/s
    description: 'SLOW ZONE: Unstable Ground.', 
    cleared: false 
  },
  { 
    id: 'c2', 
    type: 'OBSTACLE', 
    startDistance: 3500, 
    description: 'DANGER: Debris on Track. STOP.', 
    cleared: false 
  },
  { 
    id: 'c3', 
    type: 'SPEED_LIMIT', 
    startDistance: 5000, 
    endDistance: 5200, 
    value: 25, 
    description: 'SLOW ZONE: Bridge Inspection.', 
    cleared: false 
  },
  { 
    id: 'c4', 
    type: 'OBSTACLE', 
    startDistance: 7000, 
    description: 'DANGER: Construction Crane.', 
    cleared: false 
  },
  { 
    id: 'c5', 
    type: 'SPEED_LIMIT', 
    startDistance: 8500, 
    endDistance: 8700, 
    value: 20, 
    description: 'SLOW ZONE: Curve Alignment.', 
    cleared: false 
  }
];

// Physics Constants (Arcade Mode)
export const MAX_SPEED = 70; // m/s (approx 250 km/h)
export const ACCELERATION_RATE = 5.0; // m/s^2
export const BRAKING_RATE = 10.0; // m/s^2
export const FRICTION = 0.2; 
export const STATION_TOLERANCE = 75; 
export const TRACK_LENGTH = 10500; // Reduced to match stations
export const OVERSPEED_THRESHOLD = 41.6; // m/s (~150 km/h)
export const HAZARD_ZONE_WIDTH = 100; // meters visible on track for obstacles
export const OBSTACLE_CLEAR_RANGE = 60; // meters (increased range)

// Gameplay Constants
export const INITIAL_TIME = 360; // 6 minutes

// Visual Constants
export const PIXELS_PER_METER = 6.0;

// Economy Constants
export const TICKET_PRICE = 2950; 
export const AVG_PASSENGERS = 200; 
export const REWARD_PER_STOP = TICKET_PRICE * AVG_PASSENGERS; 
export const PENALTY_MISSED = 1000000;