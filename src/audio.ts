import { GemType, EnemyType } from './types';

export interface MusicTrackInfo {
  id: number;
  name: string;
  location: string;
  description: string;
  isBoss?: boolean;
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  { id: 1, name: 'Greenwood Journey', location: 'Stage 1 • Verdant Woods', description: 'Pastoral adventure harp & walking bass' },
  { id: 2, name: 'Crystal Grotto', location: 'Stage 2 • Sunken Caves', description: 'Subterranean chimes & cavernous bass drops' },
  { id: 3, name: 'Catacomb Crypts', location: 'Stage 3 • Undead Catacombs', description: 'Haunting minor choir swells & bone rattles' },
  { id: 4, name: 'Infernal Caldera', location: 'Stage 4 • Fire Mountain', description: 'Blazing battle synths & magma war drums' },
  { id: 5, name: 'Sunken Abyss', location: 'Stage 5 • Abyssal Trench', description: 'Deep ocean tidal sweeps & mystic bubbles' },
  { id: 6, name: 'Stormwind Citadel', location: 'Stage 6 • Sky Fortress', description: 'Heroic knight brass & soaring march' },
  { id: 7, name: 'Shadow Realm', location: 'Stage 7 • Void Sanctum', description: 'Dissonant dark pulses & ghost whispers' },
  { id: 8, name: 'The Gilded Tankard', location: 'Merchant Post • Safe Haven', description: 'Warm lute arpeggios & cozy tavern tavern rhythm' },
  { id: 9, name: 'Vanguard Clash', location: 'Mini-Boss • Elite Encounter', description: 'Fast syncopated battle beat & danger stabs' },
  { id: 10, name: 'APEX OVERLORD', location: 'Boss Level • Apocalyptic Lair', description: 'TERRIFYING: War horns, sub-drone & doom chords', isBoss: true },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private currentTrackId = 1;
  private bgmInterval: any = null;
  private bgmStep = 0;
  private bgmActive = false;
  private masterVolume = 0.35;
  private isMuted = false;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.45;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.75;
        this.sfxGain.connect(this.masterGain);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  toggleMute(): boolean {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getCurrentTrack(): MusicTrackInfo {
    return MUSIC_TRACKS.find(t => t.id === this.currentTrackId) || MUSIC_TRACKS[0];
  }

  // --- CORE TONE GENERATION ---
  playTone(freq: number, type: OscillatorType, duration: number, vol = 1, delay = 0, isMusic = false) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const targetGain = isMusic ? (this.musicGain || this.masterGain) : (this.sfxGain || this.masterGain);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const startTime = this.ctx.currentTime + Math.max(0, delay);
    
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), startTime);
    
    gain.gain.setValueAtTime(Math.max(0.0001, vol), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(targetGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playToneSweep(startFreq: number, endFreq: number, type: OscillatorType, duration: number, vol = 1, delay = 0, isMusic = false) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const targetGain = isMusic ? (this.musicGain || this.masterGain) : (this.sfxGain || this.masterGain);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const startTime = this.ctx.currentTime + Math.max(0, delay);

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, startFreq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(Math.max(0.0001, vol), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(targetGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playNoise(duration: number, vol = 1, filterFreq = 1000, delay = 0, isMusic = false) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const targetGain = isMusic ? (this.musicGain || this.masterGain) : (this.sfxGain || this.masterGain);
    const startTime = this.ctx.currentTime + Math.max(0, delay);
    const bufferSize = Math.max(128, Math.floor(this.ctx.sampleRate * duration));
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
    gain.gain.setValueAtTime(Math.max(0.0001, vol), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(targetGain);
    
    noise.start(startTime);
  }

  // --- SPECIAL BOSS INTIMIDATING SOUNDS ---
  playBossIntimidatingEntrance(enemyType?: string) {
    this.init();
    // 1. Earth-shaking sub-bass drone (35Hz)
    this.playToneSweep(65, 30, 'sine', 2.0, 0.95);
    this.playToneSweep(90, 35, 'sawtooth', 1.6, 0.7);

    // 2. Apocalyptic War Horn brass blast (Tritone dread: D1 -> G#1)
    this.playTone(73.42, 'sawtooth', 1.8, 0.8, 0.05); // D2
    this.playTone(103.83, 'sawtooth', 1.8, 0.75, 0.05); // G#2 (Dissonant Tritone)
    this.playTone(146.83, 'square', 1.5, 0.5, 0.08); // D3

    // 3. Shockwave noise rumble
    this.playNoise(1.4, 0.9, 350, 0.0);

    // 4. Terrifying monster roar / shriek echo
    setTimeout(() => {
      this.playDragonRoar();
    }, 200);

    // 5. Menacing pulse heartbeat
    setTimeout(() => {
      this.playTone(55, 'triangle', 0.4, 0.8);
      this.playNoise(0.2, 0.6, 250);
    }, 800);
    setTimeout(() => {
      this.playTone(50, 'triangle', 0.4, 0.9);
      this.playNoise(0.25, 0.7, 220);
    }, 1100);
  }

  // --- ROUND INTRO STINGERS (10 Distinct Soundscapes) ---
  playRoundIntroSound(roundNum: number, isBoss = false, enemyType?: EnemyType) {
    this.init();
    if (isBoss) {
      this.playBossIntimidatingEntrance(enemyType);
      return;
    }

    const trackIndex = ((roundNum - 1) % 7) + 1; // 1 to 7

    switch (trackIndex) {
      case 1: // Greenwood: Crisp harp chime
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.playTone(f, 'sine', 0.35, 0.4, i * 0.07);
        });
        break;
      case 2: // Crystal Grotto: High crystalline bell cascade
        [880, 1174.66, 1396.91, 1760].forEach((f, i) => {
          this.playTone(f, 'triangle', 0.4, 0.35, i * 0.06);
        });
        this.playNoise(0.2, 0.3, 3000, 0.1);
        break;
      case 3: // Catacomb: Haunting minor organ chord
        this.playTone(293.66, 'sawtooth', 0.9, 0.5); // D4
        this.playTone(349.23, 'sawtooth', 0.9, 0.45, 0.02); // F4
        this.playTone(440.00, 'square', 0.9, 0.4, 0.04); // A4
        this.playNoise(0.4, 0.4, 600, 0.05);
        break;
      case 4: // Infernal: Magma burst & brass stab
        this.playToneSweep(150, 40, 'sawtooth', 0.6, 0.8);
        this.playTone(587.33, 'sawtooth', 0.4, 0.5, 0.08); // D5
        this.playNoise(0.5, 0.7, 1200);
        break;
      case 5: // Abyss: Deep tidal chime
        this.playToneSweep(220, 660, 'sine', 0.5, 0.6);
        this.playTone(440, 'sine', 0.6, 0.4, 0.1);
        this.playNoise(0.4, 0.35, 800, 0.05);
        break;
      case 6: // Citadel: Heroic fanfare trumpet
        [392, 523.25, 659.25, 783.99].forEach((f, i) => {
          this.playTone(f, 'sawtooth', 0.3, 0.5, i * 0.08);
          this.playTone(f * 0.5, 'triangle', 0.3, 0.4, i * 0.08);
        });
        break;
      case 7: // Shadow: Ominous dimension rift
      default:
        this.playToneSweep(700, 140, 'sawtooth', 0.7, 0.6);
        this.playTone(90, 'square', 0.8, 0.7, 0.1);
        this.playNoise(0.3, 0.5, 450, 0.05);
        break;
    }
  }

  // --- MATCH-3 & GAMEPLAY SOUNDS ---
  playMatchSound(combo: number) {
    this.init();
    const pitchRatio = Math.pow(1.06, combo);
    const baseFreq = 440 * pitchRatio;
    this.playTone(baseFreq, 'sine', 0.2, 0.4);
    setTimeout(() => this.playTone(baseFreq * 1.25, 'sine', 0.25, 0.3), 40);
  }

  playElementalMatch(type: GemType, chainCount = 1, comboMultiplier = 1) {
    this.init();
    const chainPitch = Math.pow(1.08, Math.min(10, chainCount - 1));

    switch (type) {
      case 'sword': {
        const base = 880 * chainPitch;
        this.playTone(base, 'triangle', 0.12, 0.5);
        this.playTone(base * 2.01, 'sine', 0.18, 0.3, 0.02);
        this.playNoise(0.08, 0.3, 3500);
        break;
      }
      case 'fire': {
        const base = 320 * chainPitch;
        this.playToneSweep(base, base * 1.8, 'sawtooth', 0.22, 0.4);
        this.playNoise(0.18, 0.4, 2200);
        break;
      }
      case 'water': {
        const base = 520 * chainPitch;
        this.playToneSweep(base, base * 1.5, 'sine', 0.25, 0.5);
        this.playTone(base * 1.25, 'sine', 0.2, 0.3, 0.05);
        break;
      }
      case 'earth': {
        const base = 130 * chainPitch;
        this.playToneSweep(base * 1.5, base * 0.7, 'triangle', 0.3, 0.6);
        this.playNoise(0.15, 0.45, 600);
        break;
      }
      case 'heart': {
        const base = 523.25 * chainPitch; // C5
        this.playTone(base, 'sine', 0.3, 0.4);
        this.playTone(base * 1.25, 'sine', 0.35, 0.35, 0.04); // E5
        this.playTone(base * 1.5, 'sine', 0.4, 0.3, 0.08); // G5
        break;
      }
      case 'light': {
        const base = 783.99 * chainPitch;
        this.playTone(base, 'triangle', 0.25, 0.45);
        this.playTone(base * 1.5, 'sine', 0.3, 0.4, 0.03);
        break;
      }
      case 'dark': {
        const base = 180 * chainPitch;
        this.playToneSweep(base * 1.6, base * 0.8, 'sawtooth', 0.3, 0.5);
        this.playNoise(0.15, 0.4, 700);
        break;
      }
    }
  }

  playChainComboFanfare(chainCount: number) {
    this.init();
    if (chainCount < 2) return;
    const root = 440 * Math.pow(1.06, Math.min(12, chainCount));
    const arpeggio = [root, root * 1.25, root * 1.5, root * 2.0];

    arpeggio.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.25, 0.4, idx * 0.06);
      this.playTone(freq * 0.5, 'triangle', 0.2, 0.2, idx * 0.06);
    });
  }

  playEnemyAttackSound(isBoss = false) {
    this.init();
    this.playNoise(0.25, 0.7, 800);
    this.playToneSweep(220, 50, 'sawtooth', 0.25, 0.6);
    this.playTone(80, 'square', 0.3, 0.5, 0.05);

    if (isBoss) {
      setTimeout(() => {
        this.playNoise(0.35, 0.85, 1200);
        this.playToneSweep(300, 50, 'sawtooth', 0.4, 0.75);
      }, 100);
    }
  }

  playDragonRoar() {
    this.init();
    this.playToneSweep(160, 40, 'sawtooth', 0.9, 0.85);
    this.playToneSweep(280, 65, 'square', 0.75, 0.6, 0.04);
    this.playTone(40, 'sine', 0.9, 0.9);
    this.playNoise(0.9, 0.75, 550, 0.08);
    setTimeout(() => {
      this.playToneSweep(200, 45, 'sawtooth', 0.7, 0.7);
      this.playNoise(0.65, 0.6, 750);
    }, 220);
  }

  playMonsterSound(type: string, action?: 'attack' | 'hit' | 'taunt') {
    this.init();
    switch (type) {
      case 'dragon':
        this.playDragonRoar();
        break;
      case 'golem':
        this.playToneSweep(110, 45, 'square', 0.5, 0.8);
        this.playNoise(0.4, 0.6, 450);
        break;
      case 'kraken':
      case 'hydra':
        this.playToneSweep(380, 75, 'sawtooth', 0.6, 0.75);
        this.playNoise(0.5, 0.6, 1200);
        break;
      case 'slime':
        this.playToneSweep(350, 650, 'sine', 0.18, 0.5);
        setTimeout(() => this.playToneSweep(650, 400, 'sine', 0.15, 0.4), 80);
        break;
      case 'skeleton':
        this.playNoise(0.12, 0.4, 3000);
        this.playTone(587.33, 'triangle', 0.08, 0.3, 0.02);
        this.playTone(783.99, 'triangle', 0.08, 0.3, 0.06);
        break;
      case 'imp':
      case 'goblin':
        this.playToneSweep(750, 1100, 'sawtooth', 0.15, 0.4);
        setTimeout(() => this.playToneSweep(1100, 850, 'sawtooth', 0.15, 0.35), 60);
        break;
      case 'vampire':
      case 'specter':
        this.playToneSweep(620, 220, 'sine', 0.45, 0.4);
        this.playTone(185, 'sawtooth', 0.4, 0.3);
        break;
      default:
        this.playToneSweep(250, 90, 'sawtooth', 0.25, 0.5);
        this.playNoise(0.2, 0.4, 800);
        break;
    }
  }

  playMapTravelSound() {
    this.init();
    this.playNoise(0.2, 0.4, 1800);
    this.playToneSweep(260, 520, 'triangle', 0.25, 0.4, 0.05);
    this.playTone(659.25, 'sine', 0.35, 0.4, 0.15);
    this.playTone(783.99, 'sine', 0.45, 0.35, 0.25);
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
    this.playToneSweep(750, 200, 'sawtooth', 0.45, 0.6);
    this.playNoise(0.5, 0.7, 1500);
    this.playTone(70, 'square', 0.5, 0.7, 0.1);
  }

  playSwapSound() {
    this.init();
    this.playTone(480, 'sine', 0.06, 0.25);
  }

  playRuneCrackSound() {
    this.init();
    // Glass/Crystal fracture crunch sound
    this.playNoise(0.08, 0.5, 4500);
    this.playToneSweep(980, 520, 'triangle', 0.12, 0.4);
    this.playTone(1200, 'sine', 0.08, 0.35, 0.03);
  }

  playRuneShatterSound() {
    this.init();
    // Heavy crystal glass shatter + arcane resonance burst
    this.playNoise(0.35, 0.7, 5200);
    this.playToneSweep(1320, 240, 'sawtooth', 0.3, 0.6);
    this.playToneSweep(660, 180, 'square', 0.25, 0.4, 0.05);
    this.playTone(1567.98, 'triangle', 0.2, 0.5, 0.02);
  }

  playRuneVaultUnlockedSound() {
    this.init();
    // Triumphant divine chimes + major chords
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.4, 0.45, idx * 0.08);
      this.playTone(freq * 1.5, 'sine', 0.3, 0.35, idx * 0.08 + 0.02);
    });
    this.playNoise(0.4, 0.5, 6000, 0.2);
  }

  playIceLockedSound() {
    this.init();
    // Cold crystalline clink / freeze resistance rattle
    this.playNoise(0.05, 0.4, 6500);
    this.playTone(1600, 'sine', 0.08, 0.35);
    this.playTone(1200, 'triangle', 0.12, 0.3, 0.02);
  }

  playRelicBurstSound() {
    this.init();
    // Thunderous arcane laser blast
    this.playToneSweep(1800, 120, 'sawtooth', 0.45, 0.8);
    this.playNoise(0.5, 0.75, 2200);
    this.playTone(110, 'square', 0.6, 0.8, 0.1);
  }

  playVictorySound() {
    this.init();
    const notes = [
      { f: 523.25, t: 0, d: 0.2 },
      { f: 659.25, t: 0.2, d: 0.2 },
      { f: 783.99, t: 0.4, d: 0.2 },
      { f: 1046.50, t: 0.6, d: 0.6 },
      { f: 783.99, t: 0.75, d: 0.15 },
      { f: 1046.50, t: 0.9, d: 0.8 },
    ];
    notes.forEach((note) => {
      this.playTone(note.f, 'sawtooth', 0.25, note.d, note.t);
      this.playTone(note.f, 'square', 0.15, note.d, note.t);
      this.playTone(note.f * 0.5, 'triangle', 0.3, note.d, note.t);
    });
    this.playNoise(0.6, 0.3, 4000, 0.6);
  }

  playDefeatSound() {
    this.init();
    const notes = [440, 415.30, 392, 349.23];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.4, 0.4, i * 0.15);
    });
  }

  playChainPulseSFX() {
    this.init();
    this.playToneSweep(600, 800, 'sine', 0.1, 0.4);
    this.playTone(400, 'triangle', 0.15, 0.3);
  }

  playBombExplosionSFX() {
    this.init();
    this.playToneSweep(180, 30, 'square', 0.5, 0.9);
    this.playToneSweep(120, 25, 'sawtooth', 0.6, 0.8);
    this.playNoise(0.45, 0.85, 1200);
    setTimeout(() => {
      this.playNoise(0.25, 0.5, 800);
      this.playTone(60, 'triangle', 0.3, 0.6);
    }, 120);
  }

  playLineBeamSFX() {
    this.init();
    this.playToneSweep(350, 1800, 'sawtooth', 0.3, 0.6);
    this.playToneSweep(700, 2400, 'sine', 0.25, 0.4);
    this.playNoise(0.15, 0.4, 4000);
  }

  playLightHolySFX() {
    this.init();
    this.playToneSweep(600, 1500, 'sine', 0.35, 0.6);
    this.playTone(880, 'triangle', 0.3, 0.5);
    this.playTone(1320, 'sine', 0.2, 0.5, 0.08);
  }

  playDarkVoidSFX() {
    this.init();
    this.playToneSweep(300, 60, 'sawtooth', 0.5, 0.7);
    this.playTone(90, 'square', 0.4, 0.8);
    this.playNoise(0.2, 0.6, 600);
  }

  playCritSFX() {
    this.init();
    this.playTone(880, 'sawtooth', 0.4, 0.3);
    this.playToneSweep(1200, 300, 'square', 0.35, 0.3);
    this.playNoise(0.25, 0.4, 2500);
  }

  playRainbowSparkleSFX() {
    this.init();
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98];
    freqs.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.25, 0.4, idx * 0.04);
      this.playTone(f * 0.5, 'triangle', 0.2, 0.2, idx * 0.04);
    });
  }

  playSpecialGemCreatedSFX() {
    this.init();
    const scale = [440, 554.37, 659.25, 880];
    scale.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.2, 0.45, idx * 0.05);
    });
  }

  // --- PROCEDURAL 10-TRACK BGM SYNTHESIZER ---

  setTrack(trackId: number) {
    if (trackId < 1) trackId = 10;
    if (trackId > 10) trackId = 1;
    this.currentTrackId = trackId;
    this.bgmStep = 0;
  }

  nextTrack(): MusicTrackInfo {
    this.setTrack(this.currentTrackId === 10 ? 1 : this.currentTrackId + 1);
    return this.getCurrentTrack();
  }

  prevTrack(): MusicTrackInfo {
    this.setTrack(this.currentTrackId === 1 ? 10 : this.currentTrackId - 1);
    return this.getCurrentTrack();
  }

  startBGM(trackId?: number) {
    this.init();
    if (trackId !== undefined) {
      this.setTrack(trackId);
    }
    
    if (this.bgmActive) return;
    this.bgmActive = true;
    this.bgmStep = 0;

    this.runBgmLoop();
  }

  private runBgmLoop() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
    }

    // Dynamic tempo based on track archetype
    const getIntervalMs = (track: number) => {
      switch (track) {
        case 10: return 240; // APEX BOSS: Heavy, tense, crushing tempo
        case 9: return 180;  // Elite Clash: Fast battle
        case 8: return 220;  // Tavern / Shop: Cozy bounce
        case 4: return 195;  // Infernal: Fast magma drive
        case 2: return 260;  // Crystal Cave: Spaced cavernous echo
        case 5: return 270;  // Abyss: Slow floating underwater
        case 3: return 240;  // Catacombs: Eerie tension
        default: return 220; // Standard ~136 BPM
      }
    };

    const tick = () => {
      if (!this.bgmActive) return;
      this.renderTrackStep(this.currentTrackId, this.bgmStep);
      this.bgmStep++;
    };

    this.bgmInterval = setInterval(tick, getIntervalMs(this.currentTrackId));
  }

  // Plays 1 musical tick for the current active track
  private renderTrackStep(track: number, stepIndex: number) {
    const step = stepIndex % 16;
    const bar = Math.floor(stepIndex / 16);

    switch (track) {
      // ----------------------------------------------------
      // TRACK 1: Greenwood Journey (Verdant Forest Adventure)
      // ----------------------------------------------------
      case 1: {
        const bassNotes = [130.81, 130.81, 164.81, 130.81, 174.61, 196.00, 164.81, 130.81]; // C3, E3, F3, G3
        const leadNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00];
        
        // Gentle walking bass
        this.playTone(bassNotes[step % 8], 'triangle', 0.18, 0.18, 0, true);
        
        // Melodic harp lead
        if (step % 2 === 0) {
          this.playTone(leadNotes[(step / 2 + bar) % 8], 'sine', 0.22, 0.14, 0, true);
        }
        // Shaker noise
        if (step % 2 === 1) {
          this.playNoise(0.02, 0.03, 6000, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 2: Crystal Grotto (Echoing Subterranean Cave)
      // ----------------------------------------------------
      case 2: {
        const caveBass = [82.41, 82.41, 110.00, 82.41, 98.00, 82.41, 123.47, 98.00]; // E2, A2, G2, B2
        const crystalChimes = [659.25, 987.77, 1318.51, 1567.98, 1174.66, 880.00, 987.77, 1318.51];

        // Subterranean sub pulse
        this.playTone(caveBass[step % 8], 'sine', 0.35, 0.24, 0, true);

        // High crystal sparkle
        if (step % 4 === 0 || step % 4 === 3) {
          const chimeFreq = crystalChimes[(step + bar) % 8];
          this.playTone(chimeFreq, 'triangle', 0.3, 0.12, 0, true);
          // Echo delay
          this.playTone(chimeFreq, 'sine', 0.25, 0.06, 0.12, true);
        }
        // Drip drop
        if (step === 7 || step === 14) {
          this.playToneSweep(1800, 2400, 'sine', 0.08, 0.08, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 3: Catacomb Crypts (Haunting Undead Tomb)
      // ----------------------------------------------------
      case 3: {
        const cryptBass = [73.42, 73.42, 87.31, 73.42, 110.00, 103.83, 73.42, 65.41]; // D2, F2, A2, G#2, C2
        const organNotes = [293.66, 349.23, 440.00, 415.30, 349.23, 293.66, 261.63, 293.66];

        // Low tomb drone
        this.playTone(cryptBass[step % 8], 'sawtooth', 0.25, 0.18, 0, true);

        // Organ chords
        if (step % 4 === 0) {
          this.playTone(organNotes[(step / 4 + bar) % 8], 'square', 0.45, 0.12, 0, true);
          this.playTone(organNotes[(step / 4 + bar) % 8] * 1.5, 'sine', 0.4, 0.08, 0.02, true);
        }

        // Bone clack percussion
        if (step % 4 === 2) {
          this.playNoise(0.04, 0.06, 3200, 0, true);
          this.playTone(850, 'triangle', 0.03, 0.06, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 4: Infernal Caldera (Fast Magma Battle Synth)
      // ----------------------------------------------------
      case 4: {
        const fireBass = [92.50, 92.50, 110.00, 92.50, 138.59, 123.47, 92.50, 146.83]; // F#2, A2, C#3, B2, D3
        const arpeggio = [369.99, 440.00, 554.37, 739.99, 554.37, 440.00, 369.99, 277.18];

        // Driving sawtooth bass
        this.playTone(fireBass[step % 8], 'sawtooth', 0.14, 0.22, 0, true);

        // Fast arpeggiator
        this.playTone(arpeggio[step % 8], 'sawtooth', 0.1, 0.1, 0, true);

        // Magma kick drum
        if (step % 4 === 0) {
          this.playToneSweep(140, 35, 'square', 0.15, 0.28, 0, true);
          this.playNoise(0.08, 0.15, 600, 0, true);
        }
        // Snare slap
        if (step % 4 === 2) {
          this.playNoise(0.12, 0.14, 2400, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 5: Sunken Abyss (Mystic Deep Ocean Trench)
      // ----------------------------------------------------
      case 5: {
        const oceanChords = [196.00, 246.94, 293.66, 392.00, 349.23, 293.66, 220.00, 196.00]; // G3, B3, D4, G4

        // Deep aquatic sub drone
        this.playToneSweep(65, 45, 'sine', 0.6, 0.25, 0, true);

        // Swelling water chords
        if (step % 4 === 0) {
          const chord = oceanChords[(step / 4 + bar) % 8];
          this.playTone(chord, 'sine', 0.5, 0.15, 0, true);
          this.playTone(chord * 1.25, 'sine', 0.45, 0.12, 0.05, true);
        }

        // Bubbling high chimes
        if (step % 3 === 0) {
          this.playToneSweep(700, 1100, 'sine', 0.14, 0.08, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 6: Stormwind Citadel (Heroic Knight Fanfare)
      // ----------------------------------------------------
      case 6: {
        const brassTones = [466.16, 587.33, 698.46, 932.33, 698.46, 587.33, 466.16, 349.23]; // Bb4, D5, F5, Bb5

        // Valiant marching bass
        this.playTone(step % 2 === 0 ? 116.54 : 146.83, 'triangle', 0.16, 0.2, 0, true);

        // Brass lead
        if (step % 2 === 0) {
          this.playTone(brassTones[(step / 2 + bar) % 8], 'sawtooth', 0.2, 0.14, 0, true);
          this.playTone(brassTones[(step / 2 + bar) % 8] * 0.5, 'square', 0.18, 0.08, 0, true);
        }

        // Marching snare
        if (step % 2 === 1) {
          this.playNoise(0.04, 0.06, 4500, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 7: Shadow Realm (Dark Dissonant Void)
      // ----------------------------------------------------
      case 7: {
        const voidDissonance = [77.78, 82.41, 77.78, 116.54, 77.78, 92.50, 110.00, 77.78]; // Eb2, E2, Bb2

        // Dark detuned pulse
        this.playTone(voidDissonance[step % 8], 'sawtooth', 0.22, 0.25, 0, true);
        this.playTone(voidDissonance[step % 8] * 1.01, 'square', 0.2, 0.18, 0.02, true);

        // Shadow whisper
        if (step % 4 === 1) {
          this.playNoise(0.18, 0.06, 800, 0, true);
          this.playToneSweep(600, 200, 'sine', 0.2, 0.07, 0.04, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 8: The Gilded Tankard (Cozy Medieval Shop & Tavern)
      // ----------------------------------------------------
      case 8: {
        const luteBass = [110.00, 110.00, 146.83, 110.00, 164.81, 146.83, 130.81, 110.00]; // A2, D3, E3, C3
        const luteChords = [440.00, 523.25, 659.25, 587.33, 659.25, 523.25, 493.88, 440.00];

        // Lute thumb bass pluck
        this.playTone(luteBass[step % 8], 'triangle', 0.18, 0.22, 0, true);

        // Lute acoustic strum
        if (step % 2 === 0) {
          const note = luteChords[(step / 2 + bar) % 8];
          this.playTone(note, 'sine', 0.25, 0.16, 0, true);
          this.playTone(note * 1.25, 'triangle', 0.2, 0.1, 0.03, true);
        }

        // Tavern foot-tap tambourine
        if (step % 4 === 0) {
          this.playToneSweep(90, 40, 'triangle', 0.12, 0.15, 0, true);
        }
        if (step % 4 === 2) {
          this.playNoise(0.04, 0.05, 5000, 0, true);
        }
        break;
      }

      // ----------------------------------------------------
      // TRACK 9: Vanguard Clash (Fast Elite Mini-Boss Battle)
      // ----------------------------------------------------
      case 9: {
        const clashBass = [123.47, 123.47, 146.83, 123.47, 164.81, 146.83, 123.47, 185.00]; // B2, D3, E3, F#3

        // Fast pulsating bass
        this.playTone(clashBass[step % 8], 'sawtooth', 0.12, 0.25, 0, true);
        this.playTone(clashBass[step % 8] * 0.5, 'square', 0.14, 0.2, 0, true);

        // Danger brass stab every 4 steps
        if (step % 4 === 0) {
          this.playTone(493.88, 'sawtooth', 0.25, 0.18, 0, true);
          this.playTone(739.99, 'square', 0.22, 0.14, 0.02, true);
          this.playToneSweep(180, 45, 'sawtooth', 0.18, 0.3, 0, true);
        }
        // Rapid double hi-hat
        this.playNoise(0.02, 0.06, 7500, 0, true);
        break;
      }

      // ----------------------------------------------------
      // TRACK 10: APEX OVERLORD (MENACING, INTIMIDATING BOSS THEME)
      // ----------------------------------------------------
      case 10: {
        // Intimidating doom chords: C# minor -> A major -> F minor -> G# diminished
        const bossBass = [69.30, 69.30, 55.00, 55.00, 43.65, 43.65, 51.91, 69.30]; // C#2, A1, F1, G#1
        const hornStabs = [277.18, 329.63, 415.30, 277.18, 220.00, 261.63, 349.23, 207.65];

        // 1. Apocalyptic Sub-Bass Ground Drone
        this.playTone(bossBass[step % 8], 'sawtooth', 0.26, 0.35, 0, true);
        this.playTone(bossBass[step % 8] * 0.5, 'sine', 0.28, 0.38, 0, true); // Deep sub rumble (34Hz)

        // 2. Heavy Brass War Horn Stabs (Every 2 steps)
        if (step % 2 === 0) {
          const horn = hornStabs[(step / 2 + bar) % 8];
          this.playToneSweep(horn, horn * 0.96, 'sawtooth', 0.35, 0.22, 0, true);
          this.playTone(horn * 1.5, 'square', 0.3, 0.14, 0.02, true);
        }

        // 3. Menacing Tense Heartbeat Percussion
        if (step % 4 === 0) {
          // Thud 1
          this.playToneSweep(120, 30, 'square', 0.18, 0.4, 0, true);
          this.playNoise(0.12, 0.25, 400, 0, true);
        }
        if (step % 4 === 1) {
          // Thud 2 (Double beat)
          this.playToneSweep(95, 25, 'triangle', 0.14, 0.35, 0, true);
          this.playNoise(0.08, 0.18, 300, 0, true);
        }

        // 4. Tension cymbal hiss / chain scrape on off-beats
        if (step % 4 === 3) {
          this.playNoise(0.1, 0.08, 3500, 0, true);
        }
        break;
      }
    }
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
