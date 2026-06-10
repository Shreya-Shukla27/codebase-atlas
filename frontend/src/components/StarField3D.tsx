"use client";
import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating Orb (glowing planet-like sphere) ─── */
function GlowOrb({
  position,
  color,
  size = 0.15,
  speed = 0.3,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    meshRef.current.position.x = initialPos.x + Math.sin(t) * 0.5;
    meshRef.current.position.y = initialPos.y + Math.cos(t * 1.3) * 0.3;
    meshRef.current.position.z = initialPos.z + Math.sin(t * 0.7) * 0.4;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}

/* ─── Orbital Ring ─── */
function OrbitalRing({
  radius,
  speed = 0.1,
  color = "#4f8ef7",
}: {
  radius: number;
  speed?: number;
  color?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    ringRef.current.rotation.z = clock.getElapsedTime() * speed;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
      <torusGeometry args={[radius, 0.005, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        transparent
        opacity={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ─── Mouse Parallax Camera ─── */
function MouseParallax() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handler = (e: MouseEvent) => {
        mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", handler);
      return () => window.removeEventListener("mousemove", handler);
    }
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.3 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.current.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Scene Content ─── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#6366f1" />

      {/* Star field */}
      <Stars
        radius={50}
        depth={80}
        count={6000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* Orbital rings */}
      <OrbitalRing radius={3} speed={0.08} color="#4f8ef7" />
      <OrbitalRing radius={5} speed={-0.05} color="#6366f1" />
      <OrbitalRing radius={7} speed={0.03} color="#22d3ee" />

      {/* Floating orbs */}
      <GlowOrb position={[2, 1, -3]} color="#f97316" size={0.12} speed={0.4} />
      <GlowOrb position={[-3, -1, -2]} color="#4f8ef7" size={0.18} speed={0.25} />
      <GlowOrb position={[4, -2, -5]} color="#6366f1" size={0.1} speed={0.35} />
      <GlowOrb position={[-2, 2, -4]} color="#22d3ee" size={0.14} speed={0.3} />
      <GlowOrb position={[1, -3, -6]} color="#eab308" size={0.08} speed={0.5} />
      <GlowOrb position={[-4, 0, -3]} color="#f97316" size={0.1} speed={0.2} />
      <GlowOrb position={[3, 3, -7]} color="#a78bfa" size={0.16} speed={0.15} />

      {/* Central glow sphere */}
      <mesh position={[0, 0, -8]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#4f8ef7"
          emissive="#4f8ef7"
          emissiveIntensity={0.8}
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </mesh>

      <MouseParallax />
    </>
  );
}

/* ─── Main Exported Component ─── */
export default function StarField3D() {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: "auto" }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        fallback={null}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

