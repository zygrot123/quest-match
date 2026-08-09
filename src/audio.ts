import { GemType } from './types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;
        this.masterGain.connect(this.ctx.destination);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 1, delay = 0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const startTime = this.ctx.currentTime + delay;
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playToneSweep(startFreq: number, endFreq: number, type: OscillatorType, duration: number, vol = 1, delay = 0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const startTime = this.ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playNoise(duration: number, vol = 1, filterFreq = 1000, delay = 0) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const startTime = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(startTime);
  }

  playMatchSound(combo: number) {
    this.init();
    const pitchRatio = Math.pow(1.06, combo);
    const baseFreq = 440 * pitchRatio;
    this.playTone(baseFreq, 'sine', 0.2, 0.4);
    setTimeout(() => this.playTone(baseFreq * 1.25, 'sine', 0.25, 0.3), 40);
  }

  playElementalMatch(type: GemType, chainCount = 1, comboMultiplier = 1) {
    this.init();
    // Pitch scales with chain count
    const chainPitch = Math.pow(1.08, Math.min(10, chainCount - 1));

    switch (type) {
      case 'sword': {
        // Metallic sharp clink
        const base = 880 * chainPitch;
        this.playTone(base, 'triangle', 0.12, 0.5);
        this.playTone(base * 2.01, 'sine', 0.18, 0.3, 0.02);
        this.playNoise(0.08, 0.3, 3500);
        break;
      }
      case 'fire': {
        // Crackling fiery sweep
        const base = 320 * chainPitch;
        this.playToneSweep(base, base * 1.8, 'sawtooth', 0.22, 0.4);
        this.playNoise(0.18, 0.4, 2200);
        break;
      }
      case 'water': {
        // Cascading water drop ripple
        const base = 520 * chainPitch;
        this.playToneSweep(base, base * 1.5, 'sine', 0.25, 0.5);
        this.playTone(base * 1.25, 'sine', 0.2, 0.3, 0.05);
        break;
      }
      case 'earth': {
        // Heavy resonant bass thud
        const base = 130 * chainPitch;
        this.playToneSweep(base * 1.5, base * 0.7, 'triangle', 0.3, 0.6);
        this.playNoise(0.15, 0.45, 600);
        break;
      }
      case 'heart': {
        // Harmonic major twin chime
        const base = 523.25 * chainPitch; // C5
        this.playTone(base, 'sine', 0.3, 0.4);
        this.playTone(base * 1.25, 'sine', 0.35, 0.35, 0.04); // E5
        this.playTone(base * 1.5, 'sine', 0.4, 0.3, 0.08); // G5
        break;
      }
    }
  }

  playChainComboFanfare(chainCount: number) {
    this.init();
    if (chainCount < 2) return;

    // Ascending arpeggio notes
    const root = 440 * Math.pow(1.06, Math.min(12, chainCount));
    const arpeggio = [root, root * 1.25, root * 1.5, root * 2.0];

    arpeggio.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.25, 0.4, idx * 0.06);
      this.playTone(freq * 0.5, 'triangle', 0.2, 0.2, idx * 0.06);
    });
  }

  playEnemyAttackSound(isBoss = false) {
    this.init();
    // Impactful heavy slash & low rumble
    this.playNoise(0.25, 0.7, 800);
    this.playToneSweep(220, 50, 'sawtooth', 0.25, 0.6);
    this.playTone(80, 'square', 0.3, 0.5, 0.05);

    if (isBoss) {
      setTimeout(() => {
        this.playNoise(0.35, 0.8, 1200);
        this.playToneSweep(300, 70, 'sawtooth', 0.35, 0.7);
      }, 100);
    }
  }

  playHitSound() {
    this.init();
    this.playNoise(0.25, 0.7, 900);
    this.playToneSweep(180, 50, 'square', 0.2, 0.5);
  }

  playErrorSound() {
    this.init();
    this.playTone(220, 'sawtooth', 0.2, 0.5);
    this.playTone(175, 'sawtooth', 0.28, 0.5, 0.08);
  }

  playBossAbilitySound() {
    this.init();
    this.playToneSweep(750, 250, 'sawtooth', 0.35, 0.5);
    this.playNoise(0.4, 0.6, 1500);
    this.playTone(90, 'square', 0.4, 0.6, 0.1);
  }

  playSwapSound() {
    this.init();
    this.playTone(480, 'sine', 0.06, 0.25);
  }

  playVictorySound() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.4, 0.5, i * 0.1);
      this.playTone(freq * 0.5, 'triangle', 0.4, 0.3, i * 0.1);
    });
  }

  playDefeatSound() {
    this.init();
    const notes = [440, 415.30, 392, 349.23];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.4, 0.4, i * 0.15);
    });
  }

  // --- SPECIAL COMBO GEM & BOMB SOUND EFFECTS ---
  playBombExplosionSFX() {
    this.init();
    // Deep sub-bass boom
    this.playToneSweep(180, 30, 'square', 0.5, 0.9);
    this.playToneSweep(120, 25, 'sawtooth', 0.6, 0.8);
    // Fiery noise blast
    this.playNoise(0.45, 0.85, 1200);
    // Secondary crackle echo
    setTimeout(() => {
      this.playNoise(0.25, 0.5, 800);
      this.playTone(60, 'triangle', 0.3, 0.6);
    }, 120);
  }

  playLineBeamSFX() {
    this.init();
    // High-tech laser sweep
    this.playToneSweep(350, 1800, 'sawtooth', 0.3, 0.6);
    this.playToneSweep(700, 2400, 'sine', 0.25, 0.4);
    this.playNoise(0.15, 0.4, 4000);
  }

  playLightHolySFX() {
    this.init();
    // Celestial radiant chimes
    this.playToneSweep(600, 1500, 'sine', 0.35, 0.6);
    this.playTone(880, 'triangle', 0.3, 0.5);
    this.playTone(1320, 'sine', 0.2, 0.5, 0.08);
  }

  playDarkVoidSFX() {
    this.init();
    // Deep abyss growl + pitch sweep
    this.playToneSweep(300, 60, 'sawtooth', 0.5, 0.7);
    this.playTone(90, 'square', 0.4, 0.8);
    this.playNoise(0.2, 0.6, 600);
  }

  playCritSFX() {
    this.init();
    // Thunderous critical strike
    this.playTone(880, 'sawtooth', 0.4, 0.3);
    this.playToneSweep(1200, 300, 'square', 0.35, 0.3);
    this.playNoise(0.25, 0.4, 2500);
  }

  playRainbowSparkleSFX() {
    this.init();
    // Pentatonic arpeggio cascade
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98];
    freqs.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.25, 0.4, idx * 0.04);
      this.playTone(f * 0.5, 'triangle', 0.2, 0.2, idx * 0.04);
    });
  }

  playSpecialGemCreatedSFX() {
    this.init();
    // Ascending magical creation chime
    const scale = [440, 554.37, 659.25, 880];
    scale.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.2, 0.45, idx * 0.05);
    });
  }

  // --- PROCEDURAL BGM SYNTHESIZER ---
  private bgmInterval: any = null;
  private bgmStep = 0;
  private bgmActive = false;

  startBGM() {
    this.init();
    if (this.bgmActive) return;
    this.bgmActive = true;
    this.bgmStep = 0;

    // Rhythmic 16-step pentatonic battle bassline & synth lead
    const bassline = [110, 110, 146.83, 110, 130.81, 110, 164.81, 130.81]; // A2, D3, C3, E3
    const leadNotes = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];

    this.bgmInterval = setInterval(() => {
      if (!this.bgmActive) return;
      
      const step = this.bgmStep % 8;
      const bassFreq = bassline[step];
      const leadFreq = leadNotes[step];

      // Bass pulse
      this.playTone(bassFreq, 'triangle', 0.15, 0.18);
      
      // Melody accent every 2 steps
      if (step % 2 === 0) {
        this.playTone(leadFreq, 'sine', 0.2, 0.08);
      }
      
      // Hi-hat tick
      if (step % 2 === 1) {
        this.playNoise(0.03, 0.04, 8000);
      }

      this.bgmStep++;
    }, 220); // ~136 BPM
  }

  stopBGM() {
    this.bgmActive = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  toggleBGM(): boolean {
    if (this.bgmActive) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  isBGMActive(): boolean {
    return this.bgmActive;
  }
}

export const audio = new AudioEngine();
