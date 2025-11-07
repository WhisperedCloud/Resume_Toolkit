import React, { useRef, useEffect } from 'react';

export const LiquidEther: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        
        const PI = Math.PI;
        const TAU = PI * 2;
        
        let time = 0;
        
        class Particle {
            x: number;
            y: number;
            ox: number;
            oy: number;
            
            constructor(x: number, y: number) {
                this.x = this.ox = x;
                this.y = this.oy = y;
            }
            
            update() {
                const
                    dx = this.x - width/2,
                    dy = this.y - height/2,
                    dist = Math.sqrt(dx*dx + dy*dy),
                    angle = Math.atan2(dy, dx);
                
                const
                    d = 100 + Math.sin(time*0.01 + dist * 0.01) * 50;
                
                this.x = this.ox + Math.cos(angle) * d;
                this.y = this.oy + Math.sin(angle) * d;
            }
            
            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, TAU);
                ctx.fillStyle = `hsla(
                    ${(time*0.1 + this.ox*0.2 + this.oy*0.2) % 360},
                    80%, 60%, 0.5)`;
                ctx.fill();
            }
        }
        
        const particles: Particle[] = [];
        const spacing = 40;
        
        for (let x = 0; x < width + spacing; x += spacing) {
            for (let y = 0; y < height + spacing; y += spacing) {
                particles.push(new Particle(x, y));
            }
        }

        let animationFrameId: number;

        const loop = () => {
            if (!ctx) return;
            time++;
            
            ctx.fillStyle = "rgba(17, 24, 39, 0.1)"; // bg-gray-900 with opacity
            ctx.fillRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            animationFrameId = requestAnimationFrame(loop);
        }
        
        loop();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        }

    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};
