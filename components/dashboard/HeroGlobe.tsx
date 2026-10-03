"use client";
import { useEffect, useRef } from "react";

const SIZE = 360;
const TILT = (-18 * Math.PI) / 180;
const STEP = 20;

// Orthographic projection of a lat/lon point after spinning by `rot` and tilting the axis.
function project(lat: number, lon: number, rot: number) {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180 + rot;
  const x = Math.cos(phi) * Math.sin(lam);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lam);
  return { x, y: y * Math.cos(TILT) - z * Math.sin(TILT), z: y * Math.sin(TILT) + z * Math.cos(TILT) };
}

export default function HeroGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);
    const c = SIZE / 2, r = SIZE / 2 - 4;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const line = (pts: { x: number; y: number; z: number }[]) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const front = (a.z + b.z) / 2;
        ctx.strokeStyle = front > 0 ? `rgba(150,195,255,${0.12 + front * 0.4})` : "rgba(110,150,230,0.05)";
        ctx.beginPath();
        ctx.moveTo(c + a.x * r, c - a.y * r);
        ctx.lineTo(c + b.x * r, c - b.y * r);
        ctx.stroke();
      }
    };

    const draw = (rot: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const body = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
      body.addColorStop(0, "#5aa0ff");
      body.addColorStop(0.45, "#1f5fd6");
      body.addColorStop(1, "#071a4a");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1;
      for (let lat = -80; lat <= 80; lat += STEP) {
        const pts = [];
        for (let lon = 0; lon <= 360; lon += 5) pts.push(project(lat, lon, rot));
        line(pts);
      }
      for (let lon = 0; lon < 360; lon += STEP) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 5) pts.push(project(lat, lon, rot));
        line(pts);
      }
      for (let lat = -60; lat <= 60; lat += STEP) {
        for (let lon = 0; lon < 360; lon += STEP) {
          const p = project(lat, lon, rot);
          if (p.z <= 0) continue;
          ctx.fillStyle = `rgba(215,232,255,${0.25 + p.z * 0.6})`;
          ctx.beginPath();
          ctx.arc(c + p.x * r, c - p.y * r, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Soft shading to keep the sphere reading as a solid.
      const shade = ctx.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.4, c, c, r);
      shade.addColorStop(0, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(3,10,35,0.55)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (reduce) { draw(0.6); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      draw(((now - start) / 1000) * 0.35);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="hero-globe-canvas" width={SIZE} height={SIZE} role="img" aria-label="Rotating globe" />;
}
