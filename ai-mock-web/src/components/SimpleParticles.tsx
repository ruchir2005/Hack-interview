'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export default function SimpleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with devicePixelRatio for crisp rendering
    const resizeCanvas = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = { w: window.innerWidth, h: window.innerHeight };
      canvas.width = Math.floor(rect.w * dpr);
      canvas.height = Math.floor(rect.h * dpr);
      canvas.style.width = rect.w + 'px';
      canvas.style.height = rect.h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.max(50, Math.floor((window.innerWidth * window.innerHeight) / 8000)); // Higher density
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * (canvas.clientWidth || window.innerWidth),
          y: Math.random() * (canvas.clientHeight || window.innerHeight),
          size: Math.random() * 2.5 + 1.5,
          speedX: Math.random() * 1.2 - 0.6,
          speedY: Math.random() * 1.2 - 0.6,
          color: `hsla(${30 + Math.random() * 30}, 90%, 70%, 0.9)`,
        });
      }
      return particles;
    };

    // Animation loop
    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Update and draw particles
      particlesRef.current.forEach((p, i) => {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Bounce off edges
        if (p.x < 0 || p.x > w) p.speedX *= -1;
        if (p.y < 0 || p.y > h) p.speedY *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${Math.random() * 60 + 15}, 80%, 70%, ${1 - distance / 100})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Debug watermark so we can confirm canvas is visible
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
      ctx.fillText('Particles Running', 16, 24);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize particles
    particlesRef.current = createParticles();
    // One-time debug log
    console.log('[SimpleParticles] Initialized with', particlesRef.current.length, 'particles');
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-90"
    />
  );
}
