import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  rotation: number;
}

const COLORS = ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#c084fc', '#f472b6'];

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100, // percentage
        y: -10, // start above screen
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        velocity: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => {
        // Use a random fall duration between 2 and 4 seconds
        const duration = Math.random() * 2 + 2;
        // Random horizontal drift
        const xDrift = (Math.random() - 0.5) * 40;
        
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              width: p.size,
              height: p.size * (Math.random() > 0.5 ? 1 : 2),
              backgroundColor: p.color,
            }}
            initial={{ y: 0, x: 0, rotate: p.rotation, opacity: 1 }}
            animate={{ 
              y: '120vh', 
              x: `${xDrift}vw`,
              rotate: p.rotation + (Math.random() * 720 - 360),
              opacity: [1, 1, 0]
            }}
            transition={{
              duration,
              ease: "easeIn",
              times: [0, 0.8, 1],
            }}
          />
        );
      })}
    </div>
  );
};
