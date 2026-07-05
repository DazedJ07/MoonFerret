'use client';

import { useEffect, useRef } from 'react';

interface GrainientProps {
  color1?: string;
  color2?: string;
  color3?: string;
  timeSpeed?: number;
  colorBalance?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  grainAnimated?: boolean;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  centerX?: number;
  centerY?: number;
  zoom?: number;
}

export default function Grainient({
  color1 = '#75a0e6',
  color2 = '#9983f0',
  color3 = '#aec2e4',
  timeSpeed = 0.25,
  colorBalance = 0,
  warpStrength = 1,
  warpFrequency = 5,
  warpSpeed = 2,
  warpAmplitude = 50,
  blendAngle = 0,
  blendSoftness = 0.05,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.1,
  grainScale = 2,
  grainAnimated = false,
  contrast = 1.5,
  gamma = 1,
  saturation = 1,
  centerX = 0,
  centerY = 0,
  zoom = 0.9,
}: GrainientProps) {
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
      canvas.width = Math.floor(width * 0.5); // lower resolution for high performance
      canvas.height = Math.floor(height * 0.5);
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    };

    window.addEventListener('resize', resize);
    resize();

    // Pre-generate a static grain texture for performance if grainAnimated is false
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 128;
    grainCanvas.height = 128;
    const gCtx = grainCanvas.getContext('2d');
    if (gCtx) {
      const gImg = gCtx.createImageData(128, 128);
      const gData = gImg.data;
      const amt = grainAmount * 255;
      for (let i = 0; i < gData.length; i += 4) {
        const val = (Math.random() - 0.5) * amt;
        gData[i] = 128 + val;
        gData[i + 1] = 128 + val;
        gData[i + 2] = 128 + val;
        gData[i + 3] = 255;
      }
      gCtx.putImageData(gImg, 0, 0);
    }

    const render = () => {
      time += 0.01 * timeSpeed;
      const w = canvas.width;
      const h = canvas.height;

      // Draw base color
      ctx.fillStyle = color3;
      ctx.fillRect(0, 0, w, h);

      // Create organic moving fluid waves using multiple overlay gradients
      ctx.save();

      // Center point
      const midX = w * 0.5 + centerX * w;
      const midY = h * 0.5 + centerY * h;

      // Draw gradient blob 1
      const x1 = midX + Math.sin(time * warpSpeed) * warpAmplitude * warpStrength * 0.2;
      const y1 = midY + Math.cos(time * 0.8) * warpAmplitude * warpStrength * 0.2;
      const r1 = Math.max(w, h) * 0.8 * zoom;

      const grad1 = ctx.createRadialGradient(x1, y1, r1 * 0.1, x1, y1, r1);
      grad1.addColorStop(0, color1);
      grad1.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Draw gradient blob 2
      const x2 = midX + Math.cos(time * warpSpeed * 0.7) * warpAmplitude * warpStrength * 0.25;
      const y2 = midY + Math.sin(time * 1.1) * warpAmplitude * warpStrength * 0.25;
      const r2 = Math.max(w, h) * 0.9 * zoom;

      const grad2 = ctx.createRadialGradient(x2, y2, r2 * 0.05, x2, y2, r2);
      grad2.addColorStop(0, color2);
      grad2.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad2;
      
      // Add rotation blend effect
      ctx.translate(midX, midY);
      ctx.rotate((time * rotationAmount) / 10000);
      ctx.translate(-midX, -midY);
      
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Apply contrast adjustment
      if (contrast !== 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(contrast - 1) * 0.03})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Overlay the noise grain texture
      if (grainAmount > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = grainAmount;
        // Tile the grain canvas across the main canvas
        const pattern = ctx.createPattern(grainCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    color1, color2, color3, timeSpeed, colorBalance, warpStrength,
    warpFrequency, warpSpeed, warpAmplitude, blendAngle, blendSoftness,
    rotationAmount, noiseScale, grainAmount, grainScale, grainAnimated,
    contrast, gamma, saturation, centerX, centerY, zoom
  ]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 block pointer-events-none" />;
}
