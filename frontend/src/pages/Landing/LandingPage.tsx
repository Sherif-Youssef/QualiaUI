import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import qualiaDemo from '../../assets/videos/qualiademo.mp4';

/* PHYSICS ENGINE CLASSES */
class Oscillator {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;
  value: number;

  constructor(options: { phase?: number; offset?: number; frequency?: number; amplitude?: number } = {}) {
    this.phase = options.phase || 0;
    this.offset = options.offset || 0;
    this.frequency = options.frequency || 0.001;
    this.amplitude = options.amplitude || 1;
    this.value = 0;
  }

  update() {
    this.phase += this.frequency;
    this.value = this.offset + Math.sin(this.phase) * this.amplitude;
    return this.value;
  }
}

class Node {
  x: number = 0;
  y: number = 0;
  vy: number = 0;
  vx: number = 0;
}

class Line {
  spring: number;
  friction: number;
  nodes: Node[];

  constructor(options: { spring: number }, friction: number, size: number, pos: { x: number, y: number }) {
    this.spring = options.spring + 0.1 * Math.random() - 0.05;
    this.friction = friction + 0.01 * Math.random() - 0.005;
    this.nodes = Array.from({ length: size }, () => {
      const n = new Node();
      n.x = pos.x;
      n.y = pos.y;
      return n;
    });
  }

  update(pos: { x: number, y: number }, dampening: number, tension: number) {
    let e = this.spring;
    const first = this.nodes[0];

    first.vx += (pos.x - first.x) * e;
    first.vy += (pos.y - first.y) * e;

    for (let i = 0; i < this.nodes.length; i++) {
      const t = this.nodes[i];
      if (i > 0) {
        const prev = this.nodes[i - 1];
        t.vx += (prev.x - t.x) * e;
        t.vy += (prev.y - t.y) * e;
        t.vx += prev.vx * dampening;
        t.vy += prev.vy * dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x += t.vx;
      t.y += t.vy;
      e *= tension;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    let n = this.nodes[0].x;
    let i = this.nodes[0].y;
    ctx.beginPath();
    ctx.moveTo(n, i);
    
    let a: number, o: number;
    for (a = 1, o = this.nodes.length - 2; a < o; a++) {
      const e = this.nodes[a];
      const t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      ctx.quadraticCurveTo(e.x, e.y, n, i);
    }
    const lastNode = this.nodes[a];
    const targetNode = this.nodes[a + 1];
    ctx.quadraticCurveTo(lastNode.x, lastNode.y, targetNode.x, targetNode.y);
    ctx.stroke();
    ctx.closePath();
  }
}

/*MAIN COMPONENT*/

const InteractiveCursorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const pos = { x: 0, y: 0 };
    const lines: Line[] = [];
    const E = {
      friction: 0.5,
      trails: 80,
      size: 50,
      dampening: 0.025,
      tension: 0.99,
    };

    const colorOscillator = new Oscillator({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 200,
    });

    const onMove = (e: any) => {
      if (lines.length === 0) {
        for (let i = 0; i < E.trails; i++) {
          lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }, E.friction, E.size, pos));
        }
      }
      
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      pos.x = clientX - rect.left;
      pos.y = clientY - rect.top;
    };

    const render = () => {
      if (!running) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'multiply'; 
      ctx.strokeStyle = `hsla(${Math.round(colorOscillator.update())}, 80%, 40%, 0.25)`;
      ctx.lineWidth = 1.5;

      for (let i = 0; i < lines.length; i++) {
        lines[i].update(pos, E.dampening, E.tension);
        lines[i].draw(ctx);
      }
      requestAnimationFrame(render);
    };

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('touchstart', onMove);
    container.addEventListener('touchmove', onMove);
    
    resize();
    render();

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('touchstart', onMove);
      container.removeEventListener('touchmove', onMove);
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-white overflow-hidden py-44 flex flex-col items-center justify-center border-y border-gray-100"
    >
      {/*  Animation Layer (Behind Everything)  */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/*  Content Layer (In Front)  */}
      <div className="relative z-10 text-center px-4 pointer-events-none max-w-5xl">
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
          YOUR COMPLETE PLATFORM FOR <br />
          <span className="text-indigo-600">WEB UI TEST AUTOMATION</span>
        </h2>
        <p className="text-slate-500 font-medium text-xl max-w-2xl mx-auto mb-10">
          Experience the Fluidity of Effortless Testing.
        </p>
      </div>
    </section>
  );
};

export default InteractiveCursorCanvas;
/* Animated Background  */
const AuraBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50/60 to-blue-50/80" />

      {/* Central radial glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, rgba(14,165,233,0.15) 40%, transparent 70%)',
          animation: 'aura-pulse 6s ease-in-out infinite',
        }}
      />

      {/* Top-left orb */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)',
          animation: 'orb-drift-1 12s ease-in-out infinite',
        }}
          />
      {/* Bottom-right orb */}
      <div
        className="absolute -bottom-48 -right-32 w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.45) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
          animation: 'orb-drift-2 15s ease-in-out infinite',
        }}
      />

      {/* Mid-right accent */}
      <div
        className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.5) 0%, transparent 70%)',
          animation: 'orb-drift-3 10s ease-in-out infinite',
        }}
          />
      {/* Floating particles */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + (i % 4)}px`,
            height: `${2 + (i % 4)}px`,
            left: `${(i * 5.5 + 3) % 100}%`,
            top: `${(i * 7.3 + 10) % 85}%`,
            background: i % 3 === 0
              ? 'rgba(6,182,212,0.6)'
              : i % 3 === 1
              ? 'rgba(14,165,233,0.5)'
              : 'rgba(20,184,166,0.55)',
            animation: `particle-float ${5 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.7) % 6}s`,
          }}
        />
      ))}
      {/* Subtle grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgb(6,182,212)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};


/* FAQ Item  */
interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-cyan-200 hover:shadow-sm"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-cyan-50/30 transition-colors duration-200"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-800 text-base pr-4">{question}</span>
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            background: open ? 'linear-gradient(135deg, #06b6d4, #0ea5e9)' : 'white',
            borderColor: open ? 'transparent' : undefined,
          }}
              >
      <svg
            className={`w-3.5 h-3.5 transition-colors duration-300 ${open ? 'text-white' : 'text-gray-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '300px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
          {answer}
        </div>
      </div>
    </div>
  );
};
/* Scroll Fade Container  */
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
      >
          
    {children}
    </div>
  );
};
/*  Main Page  */
const faqData = [
  {
    question: 'What is QUALIA UI?',
    answer: 'QUALIA UI is an AI-powered web testing platform that lets you describe test cases in plain English and automatically generates, runs, and validates end-to-end UI tests. No coding required.',
  },
  {
    question: 'What can QUALIA UI build?',
    answer: 'QUALIA can run complete test suites for any web application from simple click-through flows to complex multi-step workflows involving forms, authentication, shopping carts, and more.',
  },
  {
    question: 'Who uses QUALIA UI?',
    answer: 'QUALIA is built for QA engineers, frontend developers, product managers, and startups who want reliable UI test coverage without spending weeks writing test scripts manually.',
  },
  {
    question: 'Is QUALIA UI free to use?',
    answer: 'QUALIA offers a generous free tier.',
  },
  {
    question: 'Is QUALIA UI open source?',
    answer: 'QUALIA core runtime is not open source.',
  },
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [testInput, setTestInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [testName, setTestName] = useState('');
    const [focused, setFocused] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleRun = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white font-body overflow-x-hidden">
            <style>{`
        @keyframes aura-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.55; }
        }
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 30px) scale(1.08); }
          66% { transform: translate(-20px, 50px) scale(0.95); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, -40px) scale(1.1); }
          70% { transform: translate(30px, -20px) scale(0.92); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          33% { transform: translateY(-14px) translateX(6px); opacity: 1; }
          66% { transform: translateY(-6px) translateX(-8px); opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(6,182,212,0.1); }
          50% { box-shadow: 0 0 30px rgba(6,182,212,0.5), 0 0 60px rgba(6,182,212,0.2); }
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .btn-cyan-glow {
          background: linear-gradient(135deg, #06b6d4, #0ea5e9);
          box-shadow: 0 4px 20px rgba(6,182,212,0.35);
          transition: all 0.25s ease;
        }
        .btn-cyan-glow:hover {
          background: linear-gradient(135deg, #0891b2, #0284c7);
          box-shadow: 0 6px 28px rgba(6,182,212,0.55), 0 0 0 3px rgba(6,182,212,0.12);
          transform: translateY(-1px);
        }
        .btn-cyan-glow:active {
          transform: translateY(0px);
        }
        .chat-container {
          box-shadow: 0 8px 48px rgba(6,182,212,0.12), 0 2px 16px rgba(0,0,0,0.06);
          transition: box-shadow 0.3s ease;
        }
        .chat-container:focus-within {
          box-shadow: 0 12px 56px rgba(6,182,212,0.22), 0 2px 20px rgba(0,0,0,0.08);
        }
        .input-pill {
          transition: all 0.2s ease;
        }
        .input-pill:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(6,182,212,0.3);
        }
        .nav-link {
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: #06b6d4; }
        .video-container {
          box-shadow: 0 20px 80px rgba(6,182,212,0.12), 0 4px 24px rgba(0,0,0,0.08);
        }
        .feature-chip {
          animation: badge-float 3s ease-in-out infinite;
        }
      `}</style>
            {/*  NAV  */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
                <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-gray-900 text-lg tracking-tight">QUALIA</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="nav-link text-sm text-gray-500 font-medium">Features</a>
                    <a href="#demo" className="nav-link text-sm text-gray-500 font-medium">Demo</a>
                    <a href="#faq" className="nav-link text-sm text-gray-500 font-medium">FAQ</a>
                </div>
                <button
                    onClick={() => navigate('/.login')}
                    className="btn-cyan-glow text-white text-sm font-semibold px-5 py-2 rounded-full"
                >
                    Sign In
                </button>
            </nav>
            {/*  HERO  */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4">
                <AuraBackground />

                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">

                    {/* Badge */}
                    <div
                        className="feature-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-700 mb-8 border border-cyan-200/80"
                        style={{ background: 'rgba(6,182,212,0.07)', animationDelay: '0s' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        AI-Powered Web Testing
                    </div>

                    {/* Headline */}
                    <h1 className="font-sans font-bold text-gray-900 mb-5 leading-tight" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', letterSpacing: '-0.03em' }}>
                        Test anything.{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #6366f1 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                
                            Describe it.
                        </span>
                        <br />
                        QUALIA handles the rest.
                    </h1>

                    <p className="text-gray-500 text-lg leading-relaxed mb-12 max-w-xl">
                        Generate, run, and validate end-to-end UI tests from plain English.
                        No scripts. No setup. Just results.
                    </p>

                    {/*Chat Input Box */}
                    <div
                        className="chat-container w-full max-w-2xl rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 p-4"
                    >
                        {/* Main textarea */}
                        <textarea
                            rows={3}
                            value={testInput}
                            onChange={e => setTestInput(e.target.value)}
                            onFocus={() => setFocused('main')}
                            onBlur={() => setFocused(null)}
                            placeholder="Describe your test case… (e.g., Add a red shirt to the cart and proceed to checkout)"
                            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none leading-relaxed"
                            style={{ fontFamily: 'inherit' }}
                        />

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-3" />
                        {/* Bottom row: URL + Name + Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200/80 flex-1 min-w-0">
                                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        placeholder="Enter website URL"
                                        className="input-pill bg-transparent text-xs text-gray-700 placeholder-gray-400 border-none outline-none w-full min-w-0"
                                    />
                                </div>

                                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200/80 flex-1 min-w-0">
                                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={testName}
                                        onChange={e => setTestName(e.target.value)}
                                        placeholder="Test Case Name"
                                        className="input-pill bg-transparent text-xs text-gray-700 placeholder-gray-400 border-none outline-none w-full min-w-0"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleRun}
                                className="btn-cyan-glow flex items-center justify-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex-shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                                </svg>
                                Run Test
                            </button>
                        </div>
                    </div>

                    {/* Trusted by hint */}
                    <p className="mt-6 text-xs text-gray-400 font-medium tracking-wide uppercase">
                        Playwright-powered · Fully automated · Instant results
                    </p>
                </div>
                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
                    <span className="text-xs text-gray-400 font-medium">Scroll</span>
                    <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-transparent" />
                </div>
            </section>

            {/*  VIDEO / DEMO SECTION  */}
    <section id="demo" className="py-24 px-4 bg-gradient-to-b from-white to-gray-50/60">
        <FadeIn className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                    Product Demo
                </span>
                <h2 className="font-sans font-bold text-gray-900 text-4xl mb-4" style={{ letterSpacing: '-0.025em' }}>
                    See QUALIA in action
                </h2>
                <p className="text-gray-500 text-base max-w-md mx-auto">
                    Watch how QUALIA turns a one-line description into a full, automated test run in seconds.
                </p>
            </div>

            {/* Video container */}
            <div className="video-container relative rounded-2xl overflow-hidden bg-gray-900 aspect-video border border-gray-200 shadow-2xl">
                
                {/* 1. THE ACTUAL VIDEO (Hidden until click) */}
                {isPlaying && (
                    <video 
                        className="absolute inset-0 w-full h-full object-cover z-20"
                        controls
                        autoPlay
                        onEnded={() => setIsPlaying(false)}
                    >
                        <source src={qualiaDemo} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}

                {/* 2. THE THUMBNAIL UI (Only visible when not playing) */}
                {!isPlaying && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 z-10"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a2e 50%, #0f172a 100%)' }}
                    >
                        {/* Subtle grid */}
                        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="video-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6,182,212,0.8)" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#video-grid)" />
                        </svg>

                        {/* Faint orb behind play button */}
                        <div
                            className="absolute w-48 h-48 rounded-full opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, transparent 70%)' }}
                        />

                        {/* Play button - Triggers the video */}
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="relative z-30 w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/30 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all duration-300 group scale-100 hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
                        >
                            <svg
                                className="w-6 h-6 text-white group-hover:text-cyan-300 transition-colors ml-0.5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M5 3l14 9-14 9V3z" />
                            </svg>
                        </button>
                        
                        <p className="relative z-30 mt-5 text-white/40 text-sm font-medium">Click to watch demo</p>

                        {/* Floating terminal-like hints */}
                        <div
                            className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400/70 border border-cyan-400/10"
                            style={{ background: 'rgba(6,182,212,0.06)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            test_runner.running...
                        </div>
                        
                    </div>
                )}
            </div>
        </FadeIn>
    </section>
            {/*  FEATURES  */}
            <section id="features" className="py-24 px-4 bg-white">
                <FadeIn className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                            Why QUALIA
                        </span>
                        <h2 className="font-sans font-bold text-gray-900 text-4xl" style={{ letterSpacing: '-0.025em' }}>
                            Built for the way teams actually work
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                ),
                                title: 'AI Test Generation',
                                description: 'Describe any user flow in plain English and QUALIA instantly generates a complete, runnable test suite.',
                            },
                            {
                                icon: (
                                    <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ),
                                title: 'Instant Execution',
                                description: 'Tests run in a real Chromium browser. Visual screenshots captured at every step. Results in seconds.',
                            },
                            {
                                icon: (
                                    <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                ),
                                title: 'Visual Reports',
                                description: 'Get rich, step-by-step reports with annotated screenshots so you always know exactly what passed or failed.',
                            },
                        ].map((feature, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="group p-6 rounded-2xl border border-gray-200/80 hover:border-cyan-200 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/30">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-cyan-100 group-hover:border-cyan-200 transition-colors"
                                        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(14,165,233,0.06))' }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-sans font-semibold text-gray-900 text-base mb-2">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </FadeIn>
            </section>
            {/*  CTA  */}
            <section className="py-28 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-600" />
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="cta-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.6" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#cta-grid)" />
                    </svg>
                </div>
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
                />
                <FadeIn className="relative z-10 max-w-2xl mx-auto text-center">
                    <h2 className="font-sans font-bold text-white text-4xl md:text-5xl mb-5" style={{ letterSpacing: '-0.025em' }}>
                        Ready to start testing?
                    </h2>
                    <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                        Make UI testing effortless with QUALIA. Automate workflows, and unlock powerful testing features — all in one place.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2.5 bg-white text-cyan-700 font-semibold text-base px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                        </svg>
                        Get Started Free
                    </button>
                </FadeIn>
            </section>

            <InteractiveCursorCanvas />

            {/*  FAQ  */}
            <section id="faq" className="py-24 px-4 bg-white">
                <FadeIn className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                            FAQ
                        </span>
                        <h2 className="font-sans font-bold text-gray-900 text-4xl" style={{ letterSpacing: '-0.025em' }}>
                            Frequently Asked Questions
                        </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {faqData.map((item, i) => (
                            <FadeIn key={i} delay={i * 0.07}>
                                <FAQItem question={item.question} answer={item.answer} index={i} />
                            </FadeIn>
                        ))}
                    </div>
                </FadeIn>
            </section>
            {/*  FOOTER  */}
            <footer className="py-10 px-4 border-t border-gray-100 bg-white">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-gray-700 text-sm">QUALIA</span>
                    </div>
                    <p className="text-xs text-gray-400">© 2026 QUALIA UI. All rights reserved.</p>
                    <div className="flex items-center gap-5">
                        <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Privacy</a>
                        <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Terms</a>
                        <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};