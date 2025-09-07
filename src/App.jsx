import { useState } from 'react';
import { Leaf, Globe, BarChart2 } from "lucide-react";
import { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';
import styled from '@emotion/styled';
import './Particles.css';
import './App.css';

const defaultColors = ['#a56f6fff', '#49258bff', '#318d72ff'];

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

const Particles = ({
  particleCount = 270,
  particleSpread = 5,
  speed = 0.5,
  particleColors,
  moveParticlesOnHover = true,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 135,
  sizeRandomness = 17,
  cameraDistance = 20,
  disableRotation = false,
  className
}) => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ depth: false, alpha: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, cameraDistance);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize, false);
    resize();

    const handleMouseMove = e => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
    };

    if (moveParticlesOnHover) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

    for (let i = 0; i < count; i++) {
      let x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      const r = Math.cbrt(Math.random());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
      colors.set(col, i * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors }
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: particleSpread },
        uBaseSize: { value: particleBaseSize },
        uSizeRandomness: { value: sizeRandomness },
        uAlphaParticles: { value: alphaParticles ? 1 : 0 }
      },
      transparent: true,
      depthTest: false
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let animationFrameId;
    let lastTime = performance.now();
    let elapsed = 0;

    const update = t => {
      animationFrameId = requestAnimationFrame(update);
      const delta = t - lastTime;
      lastTime = t;
      elapsed += delta * speed;

      program.uniforms.uTime.value = elapsed * 0.001;

      if (moveParticlesOnHover) {
        particles.position.x = -mouseRef.current.x * particleHoverFactor;
        particles.position.y = -mouseRef.current.y * particleHoverFactor;
      } else {
        particles.position.x = 0;
        particles.position.y = 0;
      }

      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * speed;
      }

      renderer.render({ scene: particles, camera });
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  
  }, [
    particleCount,
    particleSpread,
    speed,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation
  ]);

  return <div ref={containerRef} className={`particles-container ${className}`} />;
};

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="relative min-h-screen font-[Inter] bg-gradient-to-tr from-emerald-100 via-white to-cyan-100 text-gray-800 overflow-hidden">
      <Particles
        particleCount={210}
        particleSpread={10}
        speed={0.7}
        particleColors={["#5a222286", "#51928dff", "#236b48ff"]}
        moveParticlesOnHover={true}
        particleHoverFactor={3}
        alphaParticles={false}
        particleBaseSize={130}
        sizeRandomness={0.7}
        cameraDistance={35}
        disableRotation={false}
        className="absolute inset-0 -z-20"
      />
    <>
  <style>
    {`
      :root {
        --green-700: #15803d;
        --green-600: #16a34a;
        --green-400: #4ade80;
        --gray-100: #f3f4f6;
        --gray-600: #141414ff;
        --white: #ffffff;
        --blue-600: #2563eb;
      }

      /* Layout */
      .main-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      .main-content {
        flex-grow: 1;
      }
      .header-margin {
        margin-bottom: 20px;
      }

      /* Hero */
      .hero-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        padding: 0 1.5rem;
        gap: 1rem;
      }
      .hero-card {
        position: relative;
        background: rgba(163, 54, 54, 0.18);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border-radius: 1rem;
        padding: 2.5rem;
        text-align: center;
        max-width: 32rem;
        width: 100%;
        min-height: 500px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .hero-title {
        font-size: 3.75rem;
        line-height: 1;
        font-weight: 800;
        color: var(--green-700);
        text-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      }
      @media (min-width: 768px) {
        .hero-title { font-size: 4.5rem; }
      }
      .hero-subtitle {
        font-size: 1.125rem;
        line-height: 1.75rem;
        color: var(--gray-100);
        margin-bottom: 2rem;
      }
      @media (min-width: 768px) {
        .hero-subtitle { font-size: 1.25rem; }
      }
      .hero-highlight {
        color: var(--green-400);
        font-weight: 600;
      }
      .button-group {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      /* Buttons */
      .cta-button {
        padding: 0.75rem 1.75rem;
        color: var(--white);
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        backdrop-filter: blur(4px);
        border: none;
      }
      .cta-button.primary { background: rgba(50, 139, 50, 0.8); }
      .cta-button.primary:hover { background: var(--green-700); }
      .cta-button.secondary {
        background: transparent;
        color: var(--green-400);
        border: 1px solid var(--green-400);
      }
      .cta-button.secondary:hover {
        background: var(--green-400);
        color: var(--white);
      }

      /* Features */
      .feature-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 5rem 1.5rem;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
      }
      .feature-grid {
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
      }
      @media (min-width: 768px) {
        .feature-grid { grid-template-columns: repeat(3, 1fr); }
      }
      .feature-card {
        padding: 2.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: box-shadow 0.3s ease;
        background: #f1f1f1ff;
      }
      .feature-card:hover {
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
      }
      .feature-icon {
        font-size: 2.5rem;
        color: var(--green-600);
        margin: 1.5rem auto;
      }
      .feature-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      .feature-description { color: var(--gray-600); }
      .feature-button {
        background: rgba(187, 53, 53, 0.7);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        box-shadow: 0 1px 2px rgba(146, 80, 80, 0.05);
      }

      /* CTA Section */
      .cta-section {
        max-width: 72rem;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--gray-600);
        text-align: center;
        z-index: 10;
      }
      @media (min-width: 768px) {
        .cta-section { flex-direction: row; text-align: left; }
      }
      .cta-heading {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .cta-heading-button {
        background: rgba(255,255,255,0.2);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      .cta-heading-button:hover { background: rgba(87, 117, 77, 0.8); }
      .cta-description {
        margin: 0 auto 2rem;
        max-width: 27rem;
      }
      .join-button {
        padding: 0.75rem 2rem;
        background: var(--white);
        color: var(--green-700);
        font-weight: 600;
        border-radius: 0.75rem;
        border: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: background 0.3s ease;
      }
      .join-button:hover { background: #8f80c5ff; }

      /* Footer */
      .footer-section {
        width: 100%;
        background: rgba(245, 245, 245, 0.32);
        backdrop-filter: blur(8px);
        box-shadow: inset 0 2px 4px rgba(133, 36, 76, 0.06);
        margin-top: 3rem;
      }
      .footer-content {
        max-width: 70rem;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--gray-600);
      }
      @media (min-width: 768px) {
        .footer-content { flex-direction: row; justify-content: space-between; }
      }
      .footer-copyright {
        font-size: 0.875rem;
      }
      .footer-links {
        display: flex;
        gap: 1.75rem;
        margin-top: 1rem;
      }
      @media (min-width: 768px) {
        .footer-links { margin-top: 0; }
      }
      .footer-link {
        color: var(--gray-600);
        text-decoration: none;
        transition: color 0.3s ease;
      }
      .footer-link:hover { color: var(--green-600); }
    `}
  </style>

  <div className="main-container">
    <main className="main-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-card">
          <h1 className="hero-title header-margin">
            <span role="img" aria-label="Earth">🌍</span> Carbon Analyzer
          </h1>
          <p className="hero-subtitle">
            Track, analyze, and reduce your carbon footprint with{" "}
            <span className="hero-highlight">real-time insights</span>.
          </p>
          <div className="button-group">
            <button className="cta-button primary">Get Started</button>
            <button className="cta-button secondary">Learn More</button>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🌿</div>
            <h3 className="feature-title header-margin">
              <button className="feature-button">Eco Tracking</button>
            </h3>
            <p className="feature-description">
              Monitor your daily activities and measure your carbon emissions instantly.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">
              <button className="feature-button">Smart Comparisons</button>
            </h3>
            <p className="feature-description">
              Compare your footprint with peers, communities, and global averages.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3 className="feature-title">
              <button className="feature-button">Sustainability Tips</button>
            </h3>
            <p className="feature-description">
              Get actionable advice to reduce your carbon footprint and live greener.
            </p>
          </div>
        </div>
      </section>
    </main>

    {/* CTA Section */}
    <section className="cta-section">
      <h2 className="cta-heading">
        <button className="cta-heading-button">Ready to make an impact?</button>
      </h2>
      <p className="cta-description">
        Start tracking your carbon footprint today and join the movement for a sustainable future.
      </p>
      <button className="join-button">Join Now</button>
    </section>

    {/* Footer */}
    <footer className="footer-section">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Carbon Analyzer. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</>


       </div>
  );
}

export default App;
