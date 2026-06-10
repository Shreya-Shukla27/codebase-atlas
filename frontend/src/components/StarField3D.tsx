"use client";
import { useRef, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  color: string;
}

interface Orb {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  glowColor: string;
  yOffset: number;
  ySpeed: number;
}

interface Ring {
  radius: number;
  speed: number;
  color: string;
  opacity: number;
  tilt: number;
}

/* ─── Constants ─── */
const STAR_COUNT = 800;
const ORB_COUNT = 8;
const RING_COUNT = 3;

const COLORS = [
  "#4f8ef7", "#6366f1", "#22d3ee", "#a78bfa",
  "#f97316", "#eab308", "#818cf8", "#38bdf8",
];

/* ─── Helpers ─── */
function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random(),
      size: randomBetween(0.3, 1.8),
      brightness: randomBetween(0.3, 1),
      color: Math.random() > 0.85
        ? COLORS[Math.floor(Math.random() * COLORS.length)]
        : "#ffffff",
    });
  }
  return stars;
}

function createOrbs(count: number): Orb[] {
  const orbs: Orb[] = [];
  for (let i = 0; i < count; i++) {
    const color = COLORS[i % COLORS.length];
    orbs.push({
      angle: randomBetween(0, Math.PI * 2),
      radius: randomBetween(80, 300),
      speed: randomBetween(0.0003, 0.0012) * (Math.random() > 0.5 ? 1 : -1),
      size: randomBetween(3, 12),
      color,
      glowColor: color,
      yOffset: 0,
      ySpeed: randomBetween(0.0005, 0.002),
    });
  }
  return orbs;
}

function createRings(count: number): Ring[] {
  return [
    { radius: 120, speed: 0.0002, color: "#4f8ef7", opacity: 0.12, tilt: 0.3 },
    { radius: 200, speed: -0.00015, color: "#6366f1", opacity: 0.08, tilt: 0.5 },
    { radius: 300, speed: 0.0001, color: "#22d3ee", opacity: 0.06, tilt: 0.2 },
  ].slice(0, count);
}

/* ─── Main Component ─── */
export default function StarField3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const frameRef = useRef<number>(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const mouse = mouseRef.current;

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.03;
    mouse.y += (mouse.targetY - mouse.y) * 0.03;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Central nebula glow
    const nebulaGrad = ctx.createRadialGradient(
      cx + mouse.x * 10, cy + mouse.y * 10, 0,
      cx + mouse.x * 10, cy + mouse.y * 10, 350
    );
    nebulaGrad.addColorStop(0, "rgba(99, 102, 241, 0.06)");
    nebulaGrad.addColorStop(0.4, "rgba(79, 142, 247, 0.03)");
    nebulaGrad.addColorStop(1, "transparent");
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, width, height);

    // Secondary nebula
    const nebula2 = ctx.createRadialGradient(
      cx + 200 + mouse.x * 5, cy - 150 + mouse.y * 5, 0,
      cx + 200 + mouse.x * 5, cy - 150 + mouse.y * 5, 250
    );
    nebula2.addColorStop(0, "rgba(34, 211, 238, 0.04)");
    nebula2.addColorStop(1, "transparent");
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, width, height);

    // ─── Orbital Rings ───
    const rings = ringsRef.current;
    for (const ring of rings) {
      const angle = time * ring.speed;
      ctx.save();
      ctx.translate(cx + mouse.x * 15, cy + mouse.y * 15);
      ctx.rotate(angle);
      ctx.scale(1, ring.tilt);
      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.opacity;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ─── Stars ───
    const stars = starsRef.current;
    for (const star of stars) {
      const parallax = star.z * 0.5 + 0.5;
      const sx = cx + star.x * cx * 1.2 + mouse.x * 20 * parallax;
      const sy = cy + star.y * cy * 1.2 + mouse.y * 20 * parallax;

      // Twinkle
      const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * (star.brightness * 3) + star.x * 100);
      const alpha = star.brightness * twinkle;

      if (star.color !== "#ffffff") {
        // Colored stars get a glow
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha * 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(sx, sy, star.size * parallax, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ─── Floating Orbs ───
    const orbs = orbsRef.current;
    for (const orb of orbs) {
      orb.angle += orb.speed;
      orb.yOffset = Math.sin(time * orb.ySpeed) * 30;

      const ox = cx + Math.cos(orb.angle) * orb.radius + mouse.x * 25;
      const oy = cy + Math.sin(orb.angle) * orb.radius * 0.4 + orb.yOffset + mouse.y * 25;

      // Outer glow
      const glowGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.size * 6);
      glowGrad.addColorStop(0, orb.glowColor + "40");
      glowGrad.addColorStop(0.5, orb.glowColor + "10");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(ox - orb.size * 6, oy - orb.size * 6, orb.size * 12, orb.size * 12);

      // Core
      const coreGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.size);
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.3, orb.color);
      coreGrad.addColorStop(1, orb.color + "00");
      ctx.beginPath();
      ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    // ─── Central star ───
    const centralPulse = 0.8 + 0.2 * Math.sin(time * 0.0008);
    const centralGrad = ctx.createRadialGradient(
      cx + mouse.x * 10, cy + mouse.y * 10, 0,
      cx + mouse.x * 10, cy + mouse.y * 10, 60 * centralPulse
    );
    centralGrad.addColorStop(0, "rgba(79, 142, 247, 0.15)");
    centralGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.05)");
    centralGrad.addColorStop(1, "transparent");
    ctx.fillStyle = centralGrad;
    ctx.beginPath();
    ctx.arc(cx + mouse.x * 10, cy + mouse.y * 10, 60 * centralPulse, 0, Math.PI * 2);
    ctx.fill();

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Init
    starsRef.current = createStars(STAR_COUNT);
    orbsRef.current = createOrbs(ORB_COUNT);
    ringsRef.current = createRings(RING_COUNT);

    // Resize handler
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    // Mouse handler
    function handleMouse(e: MouseEvent) {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", handleMouse);

    // Animation loop
    let running = true;
    function animate(time: number) {
      if (!running) return;
      const dpr = window.devicePixelRatio || 1;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx!, window.innerWidth, window.innerHeight, time);
      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
