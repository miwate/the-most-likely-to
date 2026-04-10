import { useEffect, useRef } from "react";

const COLORS = ["#383F51", "#DDDBF1", "#3C4F76", "#D1BEB0", "#AB9F9D", "#506899"];

export default function Confetti() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    for (let i = 0; i < 100; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height / 2,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -16 - 4,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 12,
        gravity: 0.25 + Math.random() * 0.1,
        alpha: 1,
        decay: 0.005 + Math.random() * 0.008,
      });
    }

    let raf;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vx *= 0.99;
        p.alpha -= p.decay;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
    }
    frame();

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
