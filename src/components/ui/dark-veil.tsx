'use client';

import { useEffect, useRef } from 'react';

interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
}

export default function DarkVeil({
  hueShift = 35,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.8,
  scanlineFrequency = 0,
  warpAmount = 0,
  resolutionScale = 1.5,
}: DarkVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * resolutionScale;
      canvas.height = height * resolutionScale;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.01 * speed;
      const w = canvas.width;
      const h = canvas.height;

      // Draw base dark background
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, w, h);

      // Save context
      ctx.save();
      
      // Draw shifting organic glowing ambient gradient blobs
      const cx1 = w * 0.5 + Math.sin(time * 0.7) * w * 0.25;
      const cy1 = h * 0.5 + Math.cos(time * 0.5) * h * 0.25;
      const r1 = Math.min(w, h) * 0.6;
      
      const grad1 = ctx.createRadialGradient(cx1, cy1, r1 * 0.1, cx1, cy1, r1);
      const h1 = (220 + hueShift + Math.sin(time) * 15) % 360;
      grad1.addColorStop(0, `hsla(${h1}, 70%, 45%, 0.15)`);
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const cx2 = w * 0.3 + Math.cos(time * 0.4) * w * 0.2;
      const cy2 = h * 0.6 + Math.sin(time * 0.8) * h * 0.2;
      const r2 = Math.min(w, h) * 0.7;
      
      const grad2 = ctx.createRadialGradient(cx2, cy2, r2 * 0.1, cx2, cy2, r2);
      const h2 = (280 + hueShift + Math.cos(time * 0.7) * 20) % 360;
      grad2.addColorStop(0, `hsla(${h2}, 80%, 40%, 0.12)`);
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      const cx3 = w * 0.7 + Math.sin(time * 0.5) * w * 0.2;
      const cy3 = h * 0.4 + Math.cos(time * 0.6) * h * 0.2;
      const r3 = Math.min(w, h) * 0.55;

      const grad3 = ctx.createRadialGradient(cx3, cy3, r3 * 0.1, cx3, cy3, r3);
      const h3 = (160 + hueShift + Math.sin(time * 0.5) * 10) % 360;
      grad3.addColorStop(0, `hsla(${h3}, 75%, 35%, 0.12)`);
      grad3.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();

      // Scanline simulation
      if (scanlineIntensity > 0 && scanlineFrequency > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${scanlineIntensity * 0.03})`;
        for (let y = 0; y < h; y += scanlineFrequency) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      // Noise simulation
      if (noiseIntensity > 0) {
        try {
          const noiseData = ctx.getImageData(0, 0, w, h);
          const data = noiseData.data;
          const len = data.length;
          const amt = noiseIntensity * 255 * 0.15;
          for (let i = 0; i < len; i += 4) {
            const noise = (Math.random() - 0.5) * amt;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
          }
          ctx.putImageData(noiseData, 0, 0);
        } catch (e) {
          // ignore potential CORS issues with putImageData on local canvas
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 block pointer-events-none" />;
}
