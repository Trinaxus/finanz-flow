import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  pulsePhase: number;
  pulseSpeed: number;
  glowIntensity: number;
}

export const NeuralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useStore(state => state.theme);
  const neuralBackground = useStore(state => state.neuralBackground);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Calculate number of points based on screen size
    const getPointCount = () => {
      const area = window.innerWidth * window.innerHeight;
      const baseCount = Math.min(60, Math.max(20, Math.floor(area / 25000)));
      return baseCount;
    };

    // Calculate connection distance based on screen size
    const getMaxDistance = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      return Math.min(250, Math.max(150, minDimension / 4));
    };

    const colors = {
      pink: 'rgba(255, 20, 147, 0.6)',
      blue: 'rgba(0, 191, 255, 0.6)',
      purple: 'rgba(147, 51, 234, 0.6)',
      cyan: 'rgba(34, 211, 238, 0.6)'
    };

    const colorKeys = Object.keys(colors) as (keyof typeof colors)[];

    const points: Point[] = [];
    for (let i = 0; i < getPointCount(); i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        color: colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]],
        size: 2 + Math.random() * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.02,
        glowIntensity: 0.5 + Math.random() * 0.5
      });
    }

    let animationFrameId: number;

    function animate() {
      frameRef.current++;
      
      ctx.fillStyle = theme === 'dark' ? '#0F172A' : '#F9FAFB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (neuralBackground) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, theme === 'dark' ? '#1E293B' : '#F8FAFC');
        gradient.addColorStop(1, theme === 'dark' ? '#0F172A' : '#F9FAFB');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        points.forEach(point => {
          const acceleration = Math.sin(frameRef.current * 0.01) * 0.1;
          point.x += point.vx * (1 + acceleration);
          point.y += point.vy * (1 + acceleration);

          if (point.x < 0 || point.x > canvas.width) {
            point.vx *= -0.95;
            point.x = point.x < 0 ? 0 : canvas.width;
          }
          if (point.y < 0 || point.y > canvas.height) {
            point.vy *= -0.95;
            point.y = point.y < 0 ? 0 : canvas.height;
          }

          point.pulsePhase += point.pulseSpeed;
        });

        ctx.lineWidth = 1.5;
        points.forEach((point, i) => {
          points.slice(i + 1).forEach(other => {
            const dx = other.x - point.x;
            const dy = other.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = getMaxDistance();

            if (distance < maxDistance) {
              const midX = (point.x + other.x) / 2;
              const midY = (point.y + other.y) / 2;
              
              const curveMagnitude = Math.sin(frameRef.current * 0.02) * 20;
              const controlX = midX + Math.sin(frameRef.current * 0.01) * curveMagnitude;
              const controlY = midY + Math.cos(frameRef.current * 0.01) * curveMagnitude;

              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
              ctx.quadraticCurveTo(controlX, controlY, other.x, other.y);

              const opacity = (1 - distance / maxDistance) * 0.4;
              const gradient = ctx.createLinearGradient(point.x, point.y, other.x, other.y);
              
              const pulseIntensity = Math.sin(frameRef.current * 0.05) * 0.2 + 0.8;
              const color1 = point.color.replace('0.6)', `${opacity * pulseIntensity})`);
              const color2 = other.color.replace('0.6)', `${opacity * pulseIntensity})`);
              
              gradient.addColorStop(0, color1);
              gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.15})`);
              gradient.addColorStop(1, color2);
              
              ctx.strokeStyle = gradient;
              ctx.stroke();
            }
          });
        });

        points.forEach(point => {
          const pulseSize = 1 + Math.sin(point.pulsePhase) * 0.3;
          const radius = point.size * pulseSize;
          const glowSize = 15 * point.glowIntensity * pulseSize;

          for (let i = 0; i < 3; i++) {
            const layerSize = glowSize * (1 - i * 0.2);
            const glowGradient = ctx.createRadialGradient(
              point.x, point.y, 0,
              point.x, point.y, layerSize
            );

            const baseColor = point.color.replace('0.6)', '');
            glowGradient.addColorStop(0, baseColor + `${0.3 * (1 - i * 0.2)})`);
            glowGradient.addColorStop(0.5, baseColor + `${0.15 * (1 - i * 0.2)})`);
            glowGradient.addColorStop(1, baseColor + '0)');

            ctx.beginPath();
            ctx.arc(point.x, point.y, layerSize, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = point.color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(point.x - radius * 0.3, point.y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
      resize();
      
      // Update points count on resize
      const newCount = getPointCount();
      if (newCount < points.length) {
        points.length = newCount; // Remove excess points
      } else if (newCount > points.length) {
        // Add new points
        for (let i = points.length; i < newCount; i++) {
          points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            color: colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]],
            size: 2 + Math.random() * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.03 + Math.random() * 0.02,
            glowIntensity: 0.5 + Math.random() * 0.5
          });
        }
      }
    });
    animate();

    return () => {
      window.removeEventListener('resize', () => {
        resize();
        
        // Update points count on resize
        const newCount = getPointCount();
        if (newCount < points.length) {
          points.length = newCount; // Remove excess points
        } else if (newCount > points.length) {
          // Add new points
          for (let i = points.length; i < newCount; i++) {
            points.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              color: colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]],
              size: 2 + Math.random() * 2,
              pulsePhase: Math.random() * Math.PI * 2,
              pulseSpeed: 0.03 + Math.random() * 0.02,
              glowIntensity: 0.5 + Math.random() * 0.5
            });
          }
        }
      });
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, neuralBackground]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
};
