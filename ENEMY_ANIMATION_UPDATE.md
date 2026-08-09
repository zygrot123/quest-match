# Quest Match — Enemy Animation Update

## What changed
- Reworked `BossModel` sprite playback to use requestAnimationFrame timing instead of a coarse setInterval.
- Existing 4x3 sprite sheets remain the source art for enemies that were already working.
- Existing enemies now have smoother idle breathing, softer attack lunge, and tighter hit recoil.
- Skeleton, Minotaur, and Phoenix use the generated Quest Match artwork already included in `src/assets/images`.
- Generated enemies receive dedicated subtle idle/attack/hit motion so the new art does not look static.
- Stun particle positions are deterministic instead of changing randomly on every render.

## Validation
The source was updated and packaged. A full npm build could not be executed in this environment because the configured package registry returns 404 for `yallist@3.1.1` during dependency installation.
