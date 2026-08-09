import { EnemyType } from '../types';
import { audio } from '../audio';

export interface TauntLine {
  text: string;
  action: 'attack' | 'hit' | 'taunt';
}

export const MOB_TAUNTS: Record<EnemyType, TauntLine[]> = {
  dragon: [
    { text: "ROOOOOAAAAR!! 🔥", action: 'attack' },
    { text: "GRAAAAAARGH!", action: 'attack' },
    { text: "GRRRRRR... *INFERNO BREATH*", action: 'attack' },
    { text: "SKREEEEEEECH!", action: 'hit' },
    { text: "GRAAAAH! *FIRE BLAST*", action: 'attack' },
    { text: "GRRRRR... *SMOKE EXHALES*", action: 'hit' },
    { text: "ROAAAAAAAAR!!", action: 'taunt' },
    { text: "GRAAAAAH! *FLAME SPARK*", action: 'hit' },
    { text: "GROOOOOOAR!", action: 'taunt' },
    { text: "SKRAAAAAAAGH!", action: 'attack' }
  ],
  slime: [
    { text: "GLOOP GLOOP!", action: 'attack' },
    { text: "SQUISH! *BLUB*", action: 'hit' },
    { text: "PLOP! *GOO SLAM*", action: 'attack' },
    { text: "SPLAT! *CRYSTAL DRIZZLE*", action: 'attack' },
    { text: "BLUB BLUB BLUB!", action: 'taunt' },
    { text: "Glooop...", action: 'taunt' },
    { text: "Squish squish!", action: 'hit' },
    { text: "GLOOP! *BOUNCE*", action: 'attack' },
    { text: "Blub!", action: 'hit' },
    { text: "SPLAT!!", action: 'hit' }
  ],
  golem: [
    { text: "GRRR... BOULDER CRUSH!", action: 'attack' },
    { text: "CRACK! *GRANITE SHARDS*", action: 'hit' },
    { text: "EARTHQUAKE STRIKE!", action: 'attack' },
    { text: "STOMP! *CRUMBLE*", action: 'attack' },
    { text: "GRRRR... MOUNTAIN STANDS!", action: 'hit' },
    { text: "GRRRRRR...", action: 'taunt' },
    { text: "CRUMBLE TO DUST!", action: 'attack' },
    { text: "STONE HOLDS FIRM!", action: 'hit' },
    { text: "ROAR OF ANCIENT ROCK!", action: 'taunt' },
    { text: "GRANITE IMPACT!", action: 'attack' }
  ],
  goblin: [
    { text: "Grrr... Hand over your shiny gold!", action: 'taunt' },
    { text: "Grah! Sneaky stab time!", action: 'attack' },
    { text: "Grrr... My dagger seeks your purse!", action: 'attack' },
    { text: "Goblins rule these dark tunnels!", action: 'taunt' },
    { text: "Heh-heh... You won't leave with your boots!", action: 'hit' },
    { text: "Slice their ankles! Grah!", action: 'attack' },
    { text: "Grrr... All the shiny gems are mine!", action: 'hit' },
    { text: "Gah! You'll pay for that, knight!", action: 'hit' },
    { text: "Grah-grah-grah!", action: 'attack' },
    { text: "Goblin steel strike!", action: 'taunt' }
  ],
  imp: [
    { text: "Hehehe! Ignite your soul!", action: 'taunt' },
    { text: "Fire pyre! Cackle cackle!", action: 'attack' },
    { text: "Sparks fly!", action: 'attack' },
    { text: "Too hot to handle!", action: 'taunt' },
    { text: "Inferno blast!", action: 'attack' },
    { text: "Sizzling heat!", action: 'hit' },
    { text: "Flame mischief!", action: 'attack' },
    { text: "Burn baby burn!", action: 'hit' },
    { text: "Catch my fireballs!", action: 'attack' },
    { text: "Cackle cackle!", action: 'taunt' }
  ],
  skeleton: [
    { text: "None shall pass...", action: 'taunt' },
    { text: "Clack clack! Bones forged in steel!", action: 'hit' },
    { text: "Join our march of death!", action: 'attack' },
    { text: "Icy chill of the grave!", action: 'attack' },
    { text: "Bone cut incoming!", action: 'attack' },
    { text: "Cold bone strike!", action: 'hit' },
    { text: "Dust to dust!", action: 'attack' },
    { text: "Rattle rattle!", action: 'hit' },
    { text: "Death arrives!", action: 'taunt' },
    { text: "Bone sword clash!", action: 'attack' }
  ],
  elf: [
    { text: "Nature's wrath shall wither your spirit!", action: 'attack' },
    { text: "The forest remembers every intruder!", action: 'taunt' },
    { text: "Gale wind arrow, fly true!", action: 'attack' },
    { text: "You disrupt the sacred balance!", action: 'hit' },
    { text: "Swift as the woodland breeze!", action: 'taunt' },
    { text: "Entangling vines trap your steps!", action: 'attack' },
    { text: "Forest magic guides my strike!", action: 'hit' },
    { text: "The woods belong to us!", action: 'taunt' },
    { text: "Venom of the enchanted thorn!", action: 'attack' },
    { text: "You cannot hide from the elven gaze!", action: 'hit' }
  ],
  minotaur: [
    { text: "MUUUUUUU! HOOF STOMP!", action: 'attack' },
    { text: "GRRRR... HORNS OF STEEL!", action: 'attack' },
    { text: "LABYRINTH SMASH!", action: 'attack' },
    { text: "MUUUUU! MY AXE CLEAVES ALL!", action: 'taunt' },
    { text: "GRRR... FOOLISH MORTAL!", action: 'hit' }
  ],
  mummy: [
    { text: "Curse of the Sun Pharaoh...", action: 'taunt' },
    { text: "Bandages bind your soul!", action: 'attack' },
    { text: "Sand rot takes hold...", action: 'attack' },
    { text: "Ancient golden wrack!", action: 'hit' },
    { text: "Return to dust!", action: 'attack' }
  ],
  specter: [
    { text: "Boo... Ethereal chill!", action: 'attack' },
    { text: "Your soul bleeds dark void!", action: 'attack' },
    { text: "You cannot touch the phantom...", action: 'hit' },
    { text: "Cold shadows embrace you!", action: 'taunt' },
    { text: "Void whisper...", action: 'attack' }
  ],
  kraken: [
    { text: "SKREEEE! ABYSSAL TENTACLES!", action: 'attack' },
    { text: "DRAG THEM TO THE DEPTHS!", action: 'attack' },
    { text: "TIDAL CRUSH!", action: 'attack' },
    { text: "SKREEEE!", action: 'hit' },
    { text: "OCEAN DEVOURS ALL!", action: 'taunt' }
  ],
  phoenix: [
    { text: "REBIRTH IN HOLY EMBER!", action: 'attack' },
    { text: "SOLAR FLAME BURST!", action: 'attack' },
    { text: "ETERNAL FEATHERS GLOW!", action: 'taunt' },
    { text: "SKRAAAAH!", action: 'hit' },
    { text: "RADIANT ASHES RISE!", action: 'attack' }
  ],
  gargoyle: [
    { text: "STONE SENTINEL AWAKENS!", action: 'attack' },
    { text: "WINGED SLAM!", action: 'attack' },
    { text: "GRANITE ARMOR RETAINS!", action: 'hit' },
    { text: "IRON CLAWS STRIKE!", action: 'attack' },
    { text: "GUARD THE BASTION!", action: 'taunt' }
  ],
  vampire: [
    { text: "Sanguine thirst commands me!", action: 'taunt' },
    { text: "Your blood smells divine...", action: 'attack' },
    { text: "Crimson fangs sink deep!", action: 'attack' },
    { text: "Shadow flight!", action: 'hit' },
    { text: "Nightfall is eternal!", action: 'attack' }
  ],
  hydra: [
    { text: "SEVEN HEADS STRIKE AS ONE!", action: 'attack' },
    { text: "VENOMOUS BREATH!", action: 'attack' },
    { text: "SKREEEEE! MULTI-HEAD CLEAVE!", action: 'attack' },
    { text: "CUT ONE DOWN, TWO RISE!", action: 'taunt' },
    { text: "HISSSSSS!", action: 'hit' }
  ]
};

// Monster Sound Trigger & Dialogue Engine
export const speakMobTaunt = (type: EnemyType, triggerAction?: 'attack' | 'hit' | 'taunt'): string | null => {
  // Trigger authentic procedural Web Audio monster sound effect
  audio.playMonsterSound(type, triggerAction);

  const taunts = MOB_TAUNTS[type] || MOB_TAUNTS.slime;
  const filtered = triggerAction ? taunts.filter(t => t.action === triggerAction) : taunts;
  const pool = filtered.length > 0 ? filtered : taunts;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return selected.text;
};

