# Quest Match — Enemy Animation Update

## What changed

- Existing working sprite-sheet enemies were left on their original art and animation path.
- Skeleton now uses `skeleton_spritesheet_clean.png`, a cleaned version of the existing sheet with the instructional labels removed.
- Minotaur no longer gets incorrectly sliced as a 4x3 sprite sheet. It uses its supplied boss illustration with dedicated idle, attack, and hit motion.
- Phoenix no longer gets incorrectly sliced as a 4x3 sprite sheet. It uses a cleaned version of its supplied illustration with dedicated idle, attack, and hit motion. The embedded HP/name HUD strip was removed.
- Sprite-sheet animation now resets to frame 0 whenever the enemy state changes, so attack/hit sequences start cleanly.
- Existing enemy types that reuse working sprites (Mummy/Specter/Gargoyle/Hydra) were not changed.

## Validation

The repository's dependencies could not be installed in the execution environment because the configured package registry returned a 404 for `yallist@3.1.1`. Therefore a full TypeScript/Vite build could not be completed here.
