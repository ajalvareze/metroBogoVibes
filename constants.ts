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
  { id: 'l2', name: 'Maloka', distance: 3600, type: 'building', scale: 1.5 },
  { id: 'l3', name: 'Plaza de Toros', distance: 7100, type: 'stadium', scale: 0.9 },
  { id: 'l4', name: 'Torre Colpatria', distance: 7800, type: 'building', scale: 1.2 },
  { id: 'l5', name: 'Monserrate', distance: 7500, type: 'mountain', scale: 2.0 },
  { id: 'l6', name: 'Estadio El Campín', distance: 9200, type: 'stadium', scale: 1.0 }, 
];

// Crazy Mode Data Pool - Expanded with REAL Bogotá locations
const CRAZY_LOCATIONS = [
    // Original set
    "Corabastos", "San Victorino", "El Restrepo", "La Piscina", "El Bronx",
    "Unicentro", "Soacha", "Chía", "La Calera", "Paloquemao",
    "7 de Agosto", "Chapinero Alto", "Usme Pueblo", "Doña Juana",
    "Parque de la 93", "Zona T", "Las Aguas", "Museo del Oro",
    "Patio Bonito", "Bosa La Libertad", "Suba Rincón", "Engativá Pueblo",
    "Aeropuerto", "Salitre Mágico", "Parque Simón Bolívar", "La Picota",
    // New Additions
    "Cedritos", "Mazurén", "Toberín", "Portal Norte", "Calle 170",
    "Héroes", "Calle 100", "Calle 127", "Pepe Sierra", "Virrey",
    "Galerías", "Santa Isabel", "Comuneros", "Ricaurte", "CAD",
    "Universidad Nacional", "Campín - U. Antonio Nariño", "Coliseo Live",
    "Titán Plaza", "Minuto de Dios", "Granja - Carrera 77", "Quirigua",
    "Portal de la 80", "Avenida Rojas", "El Tiempo - Maloka", "Salitre - El Greco",
    "CAN", "Gobernación", "Quinta Paredes", "Corferias", "Ciudad Universitaria",
    "Concejo de Bogotá", "Centro Memoria", "Universidades", "Bicentenario",
    "San Diego", "Las Nieves", "Museo Nacional", "San Martín",
    "Profamilia", "Marly", "Flores", "Calle 76", "Calle 85",
    "Niza", "Humedal Córdoba", "Suba - Avenida Boyacá", "21 Ángeles",
    "Transversal 91", "La Campiña", "Portal Suba", "Puente Largo",
    "Alhambra", "Prado", "Alcalá", "Marsella", "Mundo Aventura",
    "Pradera", "Distrito Grafiti", "Puente Aranda", "Zona Industrial",
    "Carrera 43 - Comapan", "Gorgonzola", "Madelena", "Perdomo", "Portal Sur"
];

const CRAZY_DESCRIPTIONS = [
    "Chaotic energy here.", "Good luck stopping.", "Best empanadas.", "Traffic nightmare.",
    "Tourists beware.", "Very expensive.", "Flooded when raining.", "Smells interesting.",
    "Party central.", "Totally gentrified.", "Under construction forever.", "Zombie zone.",
    "TransMilenio crowded here.", "Watch your pockets.", "Great view of the mountains.",
    "Historical vibes.", "Full of students.", "Industrial sector.", "Hipster paradise."
];

// Pool of real landmarks with correct types for Crazy Mode
const CRAZY_LANDMARKS_POOL: { name: string, type: Landmark['type'] }[] = [
    { name: "Monserrate", type: "mountain" },
    { name: "Guadalupe", type: "mountain" },
    { name: "Torre Colpatria", type: "building" },
    { name: "BD Bacatá", type: "building" },
    { name: "Avianca Building", type: "building" },
    { name: "Movistar Arena", type: "stadium" },
    { name: "El Campín", type: "stadium" },
    { name: "Estadio de Techo", type: "stadium" },
    { name: "Jardín Botánico", type: "park" },
    { name: "Parque Simón Bolívar", type: "park" },
    { name: "Parque de la 93", type: "park" },
    { name: "Virgilio Barco Library", type: "building" },
    { name: "Planetario", type: "building" },
    { name: "Plaza de Toros", type: "stadium" }
];

const shuffle = <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const generateCrazyData = () => {
    const shuffledNames = shuffle(CRAZY_LOCATIONS);
    
    // Map standard physical stations to random names
    const crazyStations: Station[] = METRO_STATIONS.map((s, i) => ({
        ...s,
        name: shuffledNames[i % shuffledNames.length],
        description: CRAZY_DESCRIPTIONS[Math.floor(Math.random() * CRAZY_DESCRIPTIONS.length)]
    }));

    // Generate random landmarks from the real pool
    const shuffledLandmarksPool = shuffle(CRAZY_LANDMARKS_POOL);
    const crazyLandmarks: Landmark[] = [];
    const landmarkCount = 6; // Keep same density
    
    for(let i=0; i<landmarkCount; i++) {
        const item = shuffledLandmarksPool[i % shuffledLandmarksPool.length];
        crazyLandmarks.push({
            id: `cl-${i}`,
            name: item.name,
            distance: Math.random() * 10000, // Random position along track
            type: item.type,
            scale: 0.8 + Math.random() * 1.5
        });
    }

    return { stations: crazyStations, landmarks: crazyLandmarks };
};

export const generateRandomChallenges = (stations: Station[]): Challenge[] => {
    const challenges: Challenge[] = [];
    // Create challenges in the gaps between stations
    for (let i = 0; i < stations.length - 1; i++) {
        const start = stations[i].distance;
        const end = stations[i+1].distance;
        const gap = end - start;
        
        // 40% chance of a challenge in this segment
        if (Math.random() < 0.4 && gap > 400) {
            const type = Math.random() > 0.5 ? 'OBSTACLE' : 'SPEED_LIMIT';
            // Place roughly in middle
            const pos = start + (gap * 0.4) + (Math.random() * gap * 0.2);
            
            if (type === 'OBSTACLE') {
                challenges.push({
                    id: `rnd-${i}`,
                    type: 'OBSTACLE',
                    startDistance: pos,
                    description: 'UNEXPECTED DEBRIS',
                    cleared: false
                });
            } else {
                challenges.push({
                    id: `rnd-${i}`,
                    type: 'SPEED_LIMIT',
                    startDistance: pos,
                    endDistance: pos + 200,
                    value: 20 + Math.floor(Math.random() * 20), // 20-40 km/h limit
                    description: 'TRACK DAMAGE AHEAD',
                    cleared: false
                });
            }
        }
    }
    return challenges;
};

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