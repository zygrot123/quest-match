import { useCallback, useEffect, useState } from 'react';
import { audio, MUSIC_TRACKS, MusicTrackInfo } from '../audio';
import { GemType, EnemyType } from '../types';

export interface UseGameAudioOptions {
  autoInitOnInteraction?: boolean;
}

export function useGameAudio(options: UseGameAudioOptions = { autoInitOnInteraction: true }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrackInfo>(() => audio.getCurrentTrack());
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getIsMuted());

  // Auto-initialize web audio on first user click or touch
  useEffect(() => {
    if (!options.autoInitOnInteraction) return;

    const handleUserGesture = () => {
      audio.init();
    };

    window.addEventListener('click', handleUserGesture, { once: true });
    window.addEventListener('touchstart', handleUserGesture, { once: true });
    window.addEventListener('keydown', handleUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, [options.autoInitOnInteraction]);

  // Trigger audio feedback for match-3 events with elemental sound synthesis & chain pitch scaling
  const playMatchSFX = useCallback((gemTypes: GemType[], comboMultiplier = 1, chainCount = 1) => {
    const uniqueTypes = Array.from(new Set(gemTypes));

    if (uniqueTypes.length === 0) {
      audio.playMatchSound(chainCount);
      return;
    }

    uniqueTypes.forEach((type, idx) => {
      setTimeout(() => {
        audio.playElementalMatch(type, chainCount, comboMultiplier);
      }, idx * 40);
    });

    if (chainCount >= 2) {
      audio.playChainComboFanfare(chainCount);
    }
  }, []);

  const playChainComboSFX = useCallback((chainCount: number) => {
    if (chainCount >= 2) {
      audio.playChainComboFanfare(chainCount);
    }
  }, []);

  const playEnemyAttackSFX = useCallback((isBoss = false, isAbility = false) => {
    if (isAbility) {
      audio.playBossAbilitySound();
    } else {
      audio.playEnemyAttackSound(isBoss);
    }
  }, []);

  const playBossIntroSFX = useCallback((enemyType?: EnemyType) => {
    audio.playBossIntimidatingEntrance(enemyType);
  }, []);

  const playRoundIntroSFX = useCallback((roundNum: number, isBoss = false, enemyType?: EnemyType) => {
    audio.playRoundIntroSound(roundNum, isBoss, enemyType);
  }, []);

  const playSwapSFX = useCallback(() => {
    audio.playSwapSound();
  }, []);

  const playErrorSFX = useCallback(() => {
    audio.playErrorSound();
  }, []);

  const playVictorySFX = useCallback(() => {
    audio.playVictorySound();
  }, []);

  const playDefeatSFX = useCallback(() => {
    audio.playDefeatSound();
  }, []);

  const playBombSFX = useCallback(() => {
    audio.playBombExplosionSFX();
  }, []);

  const playLineBeamSFX = useCallback(() => {
    audio.playLineBeamSFX();
  }, []);

  const playRainbowSFX = useCallback(() => {
    audio.playRainbowSparkleSFX();
  }, []);

  const playSpecialCreatedSFX = useCallback(() => {
    audio.playSpecialGemCreatedSFX();
  }, []);

  const playLightSFX = useCallback(() => {
    audio.playLightHolySFX();
  }, []);

  const playDarkSFX = useCallback(() => {
    audio.playDarkVoidSFX();
  }, []);

  const playCritSFX = useCallback(() => {
    audio.playCritSFX();
  }, []);

  const playChainPulseSFX = useCallback(() => {
    audio.playChainPulseSFX();
  }, []);

  const playRuneCrackSFX = useCallback(() => {
    audio.playRuneCrackSound();
  }, []);

  const playRuneShatterSFX = useCallback(() => {
    audio.playRuneShatterSound();
  }, []);

  const playRuneVaultUnlockedSFX = useCallback(() => {
    audio.playRuneVaultUnlockedSound();
  }, []);

  const playIceLockedSFX = useCallback(() => {
    audio.playIceLockedSound();
  }, []);

  const playRelicBurstSFX = useCallback(() => {
    audio.playRelicBurstSound();
  }, []);

  const toggleBGM = useCallback(() => {
    const active = audio.toggleBGM();
    setCurrentTrack(audio.getCurrentTrack());
    return active;
  }, []);

  const startBGM = useCallback((trackId?: number) => {
    audio.startBGM(trackId);
    setCurrentTrack(audio.getCurrentTrack());
  }, []);

  const stopBGM = useCallback(() => {
    audio.stopBGM();
  }, []);

  const isBGMActive = useCallback(() => {
    return audio.isBGMActive();
  }, []);

  const setTrack = useCallback((trackId: number) => {
    audio.setTrack(trackId);
    setCurrentTrack(audio.getCurrentTrack());
  }, []);

  const nextTrack = useCallback(() => {
    const trk = audio.nextTrack();
    setCurrentTrack(trk);
    return trk;
  }, []);

  const prevTrack = useCallback(() => {
    const trk = audio.prevTrack();
    setCurrentTrack(trk);
    return trk;
  }, []);

  const toggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    return muted;
  }, []);

  const setVolume = useCallback((vol: number) => {
    audio.setVolume(vol);
  }, []);

  return {
    playMatchSFX,
    playChainComboSFX,
    playEnemyAttackSFX,
    playBossIntroSFX,
    playRoundIntroSFX,
    playSwapSFX,
    playErrorSFX,
    playVictorySFX,
    playDefeatSFX,
    playBombSFX,
    playLineBeamSFX,
    playRainbowSFX,
    playSpecialCreatedSFX,
    playLightSFX,
    playDarkSFX,
    playCritSFX,
    playChainPulseSFX,
    playRuneCrackSFX,
    playRuneShatterSFX,
    playRuneVaultUnlockedSFX,
    playIceLockedSFX,
    playRelicBurstSFX,
    toggleBGM,
    startBGM,
    stopBGM,
    isBGMActive,
    currentTrack,
    setTrack,
    nextTrack,
    prevTrack,
    isMuted,
    toggleMute,
    setVolume,
    allTracks: MUSIC_TRACKS,
    audioEngine: audio,
  };
}
