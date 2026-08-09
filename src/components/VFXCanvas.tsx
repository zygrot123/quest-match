import React, { useEffect, useRef } from 'react';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'circle' | 'ember' | 'water' | 'earth_rock' | 'earth_dust' | 'spark';
  gravity?: number;
  shrink?: number;
  sway?: number;
  rotation?: number;
  vRot?: number;
}

export const VFXCanvas = ({ particles, onParticlesUpdate }: { particles: Particle[], onParticlesUpdate?: (p: Particle[]) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Sync newly incoming particles to the animation ref
  useEffect(() => {
    if (particles && particles.length > 0) {
      particlesRef.current = [...particlesRef.current, ...particles];
      if (onParticlesUpdate) {
        onParticlesUpdate([]);
      }
    }
  }, [particles, onParticlesUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Resize the backing store only when the viewport actually changes size,
    // instead of every frame (canvas.width/height writes clear + reset the
    // context, which is wasteful at 60fps and was previously running even
    // when zero particles were on screen).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {

      // Clear in CSS-pixel space; the context transform already accounts for DPR.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.filter(p => {
          p.life -= 0.016; // Approx 60fps
          
          if (p.life <= 0) {
            return false;
          }

          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.save();

          if (p.type === 'ember') {
            p.x += p.vx + Math.sin((p.maxLife - p.life) * 12) * (p.sway || 0.8);
            p.y += p.vy;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size *= 0.96;

            // Flickering flame effect
            const flickerAlpha = Math.min(1, alpha * (0.65 + Math.random() * 0.35));
            ctx.globalAlpha = flickerAlpha;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#f97316';
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();

          } else if (p.type === 'water') {
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size *= 0.97;

            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#38bdf8';
            ctx.fillStyle = p.color;

            // Main water droplet
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();

            // Glistening white center highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, Math.max(0.1, p.size * 0.35), 0, Math.PI * 2);
            ctx.fill();

          } else if (p.type === 'earth_rock') {
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            if (p.vRot) p.rotation = (p.rotation || 0) + p.vRot;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size *= 0.96;

            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            if (p.rotation) ctx.rotate(p.rotation);

            ctx.fillStyle = p.color;
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 1;

            const s = Math.max(0.1, p.size);
            ctx.beginPath();
            ctx.rect(-s, -s, s * 2, s * 2);
            ctx.fill();
            ctx.stroke();

          } else if (p.type === 'earth_dust') {
            p.x += p.vx * 0.92;
            p.y += p.vy * 0.92;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size += 0.2; // expand dust

            ctx.globalAlpha = alpha * 0.45; // soft translucent cloud
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();

          } else if (p.type === 'spark') {
            p.x += p.vx;
            p.y += p.vy;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size *= 0.94;

            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(0.5, p.size);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
            ctx.stroke();

          } else {
            // Default circle
            p.x += p.vx;
            p.y += p.vy;
            if (p.shrink !== undefined) p.size *= p.shrink; else p.size *= 0.95;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fill();
          }

          ctx.restore();
          return true;
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-30"
    />
  );
};

export const spawnFireEmbers = (x: number, y: number, count = 18): Particle[] => {
  const particles: Particle[] = [];
  const colors = ['#fef08a', '#fde047', '#fb923c', '#f97316', '#ef4444', '#dc2626'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * 0.8 - 0.4) - Math.PI / 2;
    const speed = Math.random() * 3.5 + 1.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed * 0.5,
      vy: -Math.abs(Math.sin(angle) * speed) - 1,
      life: 0.6 + Math.random() * 0.5,
      maxLife: 1.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2.5,
      type: 'ember',
      sway: Math.random() * 1.2 + 0.4,
      shrink: 0.965,
    });
  }
  return particles;
};

export const spawnWaterSplash = (x: number, y: number, count = 18): Particle[] => {
  const particles: Particle[] = [];
  const colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#60a5fa', '#2563eb'];
  for (let i = 0; i < count; i++) {
    const speed = Math.random() * 5.5 + 2.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: Math.sin((Math.random() - 0.5) * Math.PI) * speed,
      vy: -Math.random() * 5 - 2,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 3,
      type: 'water',
      gravity: 0.28,
      shrink: 0.97,
    });
  }
  return particles;
};

export const spawnEarthDust = (x: number, y: number, count = 20): Particle[] => {
  const particles: Particle[] = [];
  const rockColors = ['#047857', '#059669', '#10b981', '#34d399', '#b45309', '#d97706', '#78716c'];
  const dustColors = ['#065f46', '#047857', '#10b981', '#65a30d', '#a16207', '#a8a29e'];

  for (let i = 0; i < Math.floor(count * 0.6); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color: rockColors[Math.floor(Math.random() * rockColors.length)],
      size: Math.random() * 3.5 + 2.5,
      type: 'earth_rock',
      gravity: 0.3,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.3,
      shrink: 0.96,
    });
  }

  for (let i = 0; i < Math.ceil(count * 0.4); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.9,
      color: dustColors[Math.floor(Math.random() * dustColors.length)],
      size: Math.random() * 4 + 3,
      type: 'earth_dust',
      shrink: 1.02,
    });
  }

  return particles;
};

export const spawnSwordSparks = (x: number, y: number, count = 16): Particle[] => {
  const particles: Particle[] = [];
  const colors = ['#ffffff', '#f1f5f9', '#cbd5e1', '#94a3b8', '#e2e8f0'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.3,
      maxLife: 0.65,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 2.5 + 1.5,
      type: 'spark',
      shrink: 0.94,
    });
  }
  return particles;
};

export const spawnHeartAura = (x: number, y: number, count = 14): Particle[] => {
  const particles: Particle[] = [];
  const colors = ['#f472b6', '#f43f5e', '#fb7185', '#f1f5f9', '#fbcfe8'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 1;
    particles.push({
      x: x + (Math.random() - 0.5) * 15,
      y: y + (Math.random() - 0.5) * 15,
      vx: Math.cos(angle) * speed * 0.6,
      vy: -Math.abs(Math.sin(angle) * speed) - 1.2,
      life: 0.6 + Math.random() * 0.4,
      maxLife: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 2,
      type: 'ember',
      sway: 0.5,
      shrink: 0.97,
    });
  }
  return particles;
};

export const spawnElementalAura = (x: number, y: number, element: 'fire' | 'water' | 'earth', count = 8): Particle[] => {
  const particles: Particle[] = [];
  
  if (element === 'fire') {
    const colors = ['#fde047', '#fb923c', '#f97316', '#ef4444', '#fef08a'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * 1.2 - 0.6) - Math.PI / 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 40 + 20,
        vx: Math.cos(angle) * speed * 0.4,
        vy: -Math.abs(Math.sin(angle) * speed) - 1,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3.5 + 2,
        type: 'ember',
        sway: 0.8,
        shrink: 0.97,
      });
    }
  } else if (element === 'water') {
    const colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#60a5fa'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.8 + 0.8;
      particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed) - 0.8,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3.5 + 2,
        type: 'water',
        gravity: -0.05,
        shrink: 0.98,
      });
    }
  } else {
    const colors = ['#34d399', '#10b981', '#059669', '#a3e635', '#fef08a'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        type: 'earth_dust',
        shrink: 0.98,
      });
    }
  }

  return particles;
};

export const spawnExplosion = (x: number, y: number, color: string, count: number = 20): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      color,
      size: Math.random() * 4 + 2,
    });
  }
  return particles;
};

