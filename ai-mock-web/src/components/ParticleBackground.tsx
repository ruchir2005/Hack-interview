'use client';

import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing particles
    container.innerHTML = '';
    particlesRef.current = [];

    // Create initial set of particles
    const createParticles = (count: number) => {
      for (let i = 0; i < count; i++) {
        createParticle();
      }
    };

    // Create a single particle
    const createParticle = () => {
      const particle = document.createElement('div');
      const isLarge = Math.random() > 0.7;
      particle.className = `particle ${isLarge ? 'particle-large' : ''}`;
      
      // Random starting position
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      
      // Random movement
      const speed = 0.1 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      // Size variation
      const size = isLarge ? 6 + Math.random() * 4 : 2 + Math.random() * 4;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${startX}%`;
      particle.style.top = `${startY}%`;
      particle.style.opacity = (0.3 + Math.random() * 0.7).toString();
      
      container.appendChild(particle);
      
      // Store particle reference with its velocity
      const particleRef = {
        element: particle,
        x: startX,
        y: startY,
        velocity,
        size
      };
      
      particlesRef.current.push(particleRef);
      return particleRef;
    };

    // Animation loop
    const animate = () => {
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > 100) {
          particle.velocity.x *= -1;
          particle.x = Math.max(0, Math.min(100, particle.x));
        }
        if (particle.y < 0 || particle.y > 100) {
          particle.velocity.y *= -1;
          particle.y = Math.max(0, Math.min(100, particle.y));
        }
        
        // Apply position
        particle.element.style.left = `${particle.x}%`;
        particle.element.style.top = `${particle.y}%`;
        
        // Create connections
        createConnections(particle);
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Create connections for a single particle
    const createConnections = (particle: any) => {
      const connections = Array.from(container.querySelectorAll('.connection-line'));
      connections.forEach(conn => conn.remove());
      
      particlesRef.current.forEach(otherParticle => {
        if (particle === otherParticle) return;
        
        const dx = otherParticle.x - particle.x;
        const dy = otherParticle.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only connect nearby particles
        if (distance < 20) {
          const line = document.createElement('div');
          line.className = 'connection-line';
          line.style.left = `${particle.x}%`;
          line.style.top = `${particle.y}%`;
          line.style.width = `${distance}%`;
          line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
          line.style.opacity = (0.5 - (distance / 40)).toString();
          
          container.appendChild(line);
        }
      });
    };

    // Initial setup
    createParticles(30);
    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      container.innerHTML = '';
      particlesRef.current = [];
    };
  }, []);
};

export default ParticleBackground;
