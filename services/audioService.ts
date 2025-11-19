// Simple synthesizer service using Web Audio API
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;
let musicNodes: { stop: () => void } | null = null;
let trembleNodes: { stop: () => void } | null = null;

const getCtx = () => {
    if (!audioCtx) audioCtx = new AudioContextClass();
    return audioCtx;
}

export const startMusic = () => {
    try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        if (musicNodes) return; // Already playing

        const now = ctx.currentTime;

        // 1. Low Bass Drone (Subway rumble/hum)
        const bassOsc = ctx.createOscillator();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(50, now);
        
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(120, now);

        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(0.15, now);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);

        // 2. High Atmospheric Pad (Synthwave vibe)
        const padOsc = ctx.createOscillator();
        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(220, now); // A3

        // Slow LFO for modulation
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(100, now);
        lfo.connect(lfoGain);
        lfoGain.connect(padOsc.frequency); // Vibrato effect

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0.03, now);
        
        padOsc.connect(padGain);
        padGain.connect(ctx.destination);
        padOsc.start(now);
        lfo.start(now);

        // 3. Rhythmic Pulse (Like tracks passing)
        const pulseOsc = ctx.createOscillator();
        pulseOsc.type = 'square';
        pulseOsc.frequency.setValueAtTime(0, now); // Clicky
        
        const pulseGain = ctx.createGain();
        pulseGain.gain.setValueAtTime(0, now);
        
        pulseOsc.connect(pulseGain);
        pulseGain.connect(ctx.destination);
        pulseOsc.start(now);

        // Sequencer loop for the pulse
        const intervalId = setInterval(() => {
            if (ctx.state === 'running') {
                const t = ctx.currentTime;
                pulseOsc.frequency.setValueAtTime(100, t);
                pulseOsc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
                
                pulseGain.gain.setValueAtTime(0.05, t);
                pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            }
        }, 1000); // 60 BPM pulse

        musicNodes = {
            stop: () => {
                bassOsc.stop();
                padOsc.stop();
                lfo.stop();
                pulseOsc.stop();
                clearInterval(intervalId);
                musicNodes = null;
            }
        };

    } catch (e) {
        console.warn("Music start failed", e);
    }
};

export const stopMusic = () => {
    if (musicNodes) {
        musicNodes.stop();
    }
};

export const startTremble = () => {
    try {
        if (trembleNodes) return; // Already trembling
        const ctx = getCtx();
        if(ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        // Create a rattling noise
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Jagged irregular noise
            data[i] = (Math.random() * 2 - 1) * ((i % 100 < 20) ? 0.8 : 0.2);
        }
        
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = buffer;
        noiseSrc.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(400, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);

        // AM Modulation for "shaking" sound
        const amOsc = ctx.createOscillator();
        amOsc.type = 'square';
        amOsc.frequency.setValueAtTime(15, now); // 15Hz rattle
        const amGain = ctx.createGain();
        amGain.gain.setValueAtTime(0.5, now);

        amOsc.connect(amGain);
        amGain.connect(gain.gain);
        
        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(gain);
        gain.connect(ctx.destination);

        noiseSrc.start(now);
        amOsc.start(now);

        trembleNodes = {
            stop: () => {
                noiseSrc.stop();
                amOsc.stop();
                trembleNodes = null;
            }
        };

    } catch (e) {
        console.warn("Tremble start failed", e);
    }
};

export const stopTremble = () => {
    if (trembleNodes) {
        trembleNodes.stop();
    }
};

export const playSound = (type: 'DOOR_OPEN' | 'DOOR_CLOSE' | 'BRAKE' | 'DEPART' | 'WARNING') => {
    try {
        const ctx = getCtx();
        if(ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'DOOR_OPEN':
                // Ding Dong (High then Low)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(660, now); // E5
                osc.frequency.setValueAtTime(550, now + 0.15); // C#5
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                
                // Add a little hiss for pneumatic doors
                const bufferSize = ctx.sampleRate * 0.5;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.05, now);
                noiseGain.gain.linearRampToValueAtTime(0, now + 0.5);
                noise.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start(now);
                break;

            case 'DOOR_CLOSE':
                // Rapid Beeps
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now);
                
                // Beep 1
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.setValueAtTime(0, now + 0.1);
                
                // Beep 2
                gain.gain.setValueAtTime(0.05, now + 0.2);
                gain.gain.setValueAtTime(0, now + 0.3);

                // Slam (Low thud)
                const slamOsc = ctx.createOscillator();
                const slamGain = ctx.createGain();
                slamOsc.connect(slamGain);
                slamGain.connect(ctx.destination);
                slamOsc.frequency.setValueAtTime(100, now + 0.35);
                slamOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                slamGain.gain.setValueAtTime(0.2, now + 0.35);
                slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                
                osc.start(now);
                osc.stop(now + 0.4);
                slamOsc.start(now + 0.35);
                slamOsc.stop(now + 0.6);
                break;

            case 'BRAKE':
                // High pitched squeal fading in
                const brakeOsc = ctx.createOscillator();
                brakeOsc.type = 'sawtooth';
                brakeOsc.frequency.setValueAtTime(1200, now);
                brakeOsc.frequency.linearRampToValueAtTime(800, now + 0.5);
                
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                
                brakeOsc.connect(gain);
                brakeOsc.start(now);
                brakeOsc.stop(now + 0.5);
                break;

            case 'DEPART':
                // Rising motor tone
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 1.0);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 1.0);
                osc.start(now);
                osc.stop(now + 1.0);
                break;

            case 'WARNING':
                 // Alarm
                 osc.type = 'sawtooth';
                 osc.frequency.setValueAtTime(800, now);
                 osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                 gain.gain.setValueAtTime(0.1, now);
                 gain.gain.linearRampToValueAtTime(0, now + 0.3);
                 osc.start(now);
                 osc.stop(now + 0.3);
                 break;
        }
    } catch (e) {
        console.warn("Audio playback failed", e);
    }
}