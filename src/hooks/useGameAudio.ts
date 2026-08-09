import { useCallback, useEffect } from 'react';
import { audio } from '../audio';
import { GemType } from '../types';

export interface UseGameAudioOptions {
  autoInitOnInteraction?: boolean;
}

export function useGameAudio(options: UseGameAudioOptions = { autoInitOnInteraction: true }) {
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
    // Collect unique matched gem types
    const uniqueTypes = Array.from(new Set(gemTypes));

    if (uniqueTypes.length === 0) {
      audio.playMatchSound(chainCount);
      return;
    }

    // Play primary elemental sound for the dominant matched gem
    uniqueTypes.forEach((type, idx) => {
      setTimeout(() => {
        audio.playElementalMatch(type, chainCount, comboMultiplier);
      }, idx * 40);
    });

    // If chain combo is 2+, trigger additional arpeggio fanfare
    if (chainCount >= 2) {
      audio.playChainComboFanfare(chainCount);
    }
  }, []);

  // Trigger dedicated chain combo fanfare for high-streak combos
  const playChainComboSFX = useCallback((chainCount: number) => {
    if (chainCount >= 2) {
      audio.playChainComboFanfare(chainCount);
    }
  }, []);

  // Trigger audio feedback for enemy attacks and boss abilities
  const playEnemyAttackSFX = useCallback((isBoss = false, isAbility = false) => {
    if (isAbility) {
      audio.playBossAbilitySound();
    } else {
      audio.playEnemyAttackSound(isBoss);
    }
  }, []);

  // Trigger player tile swap sound
  const playSwapSFX = useCallback(() => {
    audio.playSwapSound();
  }, []);

  // Trigger invalid move / error sound
  const playErrorSFX = useCallback(() => {
    audio.playErrorSound();
  }, []);

  // Trigger victory sound
  const playVictorySFX = useCallback(() => {
    audio.playVictorySound();
  }, []);

  // Trigger defeat sound
  const playDefeatSFX = useCallback(() => {
    audio.playDefeatSound();
  }, []);

  // Trigger special gem combo sound effects
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

  const toggleBGM = useCallback(() => {
    return audio.toggleBGM();
  }, []);

  const startBGM = useCallback(() => {
    audio.startBGM();
  }, []);

  const stopBGM = useCallback(() => {
    audio.stopBGM();
  }, []);

  const isBGMActive = useCallback(() => {
    return audio.isBGMActive();
  }, []);

  return {
    playMatchSFX,
    playChainComboSFX,
    playEnemyAttackSFX,
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
    toggleBGM,
    startBGM,
    stopBGM,
    isBGMActive,
    audioEngine: audio,
  };
}
