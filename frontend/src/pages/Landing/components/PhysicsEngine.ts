
export class Oscillator {
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

export class Node {
    x: number = 0;
    y: number = 0;
    vy: number = 0;
    vx: number = 0;
}

export class Line {
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
