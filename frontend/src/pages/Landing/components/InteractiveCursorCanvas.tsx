import React, { useEffect, useRef } from 'react';
import { Oscillator, Line } from './PhysicsEngine';

export const InteractiveCursorCanvas: React.FC = () => {
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
            <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

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
