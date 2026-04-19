import { useEffect, useRef, useState } from 'react';

const W = 300;
const H = 300;
const BIRD_X = 60;
const BIRD_R = 12;
const GRAVITY = 0.5;
const FLAP = -8;
const PIPE_W = 40;
const GAP = 90;
const PIPE_SPEED = 2.5;

function makePipe() {
  const topH = 40 + Math.random() * (H - GAP - 80);
  return { x: W, topH };
}

export default function FlappyBirdGame({ isActive }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    bird: { y: H / 2, vy: 0 },
    pipes: [makePipe()],
    score: 0,
    dead: false,
    started: false,
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef(null);

  const flap = () => {
    const s = stateRef.current;
    if (!isActive) return;
    if (s.dead) {
      // restart
      stateRef.current = {
        bird: { y: H / 2, vy: 0 },
        pipes: [makePipe()],
        score: 0,
        dead: false,
        started: true,
      };
      setScore(0);
      setDead(false);
      setStarted(true);
      return;
    }
    s.started = true;
    s.bird.vy = FLAP;
    setStarted(true);
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    let lastPipe = 0;

    const loop = (ts) => {
      const s = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Update
      if (s.started && !s.dead) {
        s.bird.vy += GRAVITY;
        s.bird.y += s.bird.vy;

        // Spawn pipes
        if (ts - lastPipe > 1800) {
          s.pipes.push(makePipe());
          lastPipe = ts;
        }

        // Move & cull pipes
        s.pipes = s.pipes.filter((p) => {
          p.x -= PIPE_SPEED;
          // Score
          if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
          }
          return p.x + PIPE_W > 0;
        });

        // Collision
        const by = s.bird.y;
        if (by - BIRD_R <= 0 || by + BIRD_R >= H) {
          s.dead = true;
          setDead(true);
        }
        for (const p of s.pipes) {
          const inX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
          if (inX && (by - BIRD_R < p.topH || by + BIRD_R > p.topH + GAP)) {
            s.dead = true;
            setDead(true);
          }
        }
      }

      // Draw
      ctx.fillStyle = '#0e1a2e';
      ctx.fillRect(0, 0, W, H);

      // Pipes
      ctx.fillStyle = '#22c55e';
      for (const p of s.pipes) {
        ctx.fillRect(p.x, 0, PIPE_W, p.topH);
        ctx.fillRect(p.x, p.topH + GAP, PIPE_W, H - p.topH - GAP);
        // Pipe caps
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 4, p.topH - 12, PIPE_W + 8, 12);
        ctx.fillRect(p.x - 4, p.topH + GAP, PIPE_W + 8, 12);
        ctx.fillStyle = '#22c55e';
      }

      // Bird
      ctx.save();
      const angle = Math.min(Math.max(s.bird.vy * 3, -30), 70) * (Math.PI / 180);
      ctx.translate(BIRD_X, s.bird.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(BIRD_R, 0);
      ctx.lineTo(BIRD_R + 8, -3);
      ctx.lineTo(BIRD_R + 8, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Overlay messages
      if (!s.started) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tap to start!', W / 2, H / 2);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Space or tap to flap', W / 2, H / 2 + 26);
      }

      if (s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', W / 2, H / 2 - 10);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 18);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText('Tap to restart', W / 2, H / 2 + 42);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border-2 border-primary cursor-pointer"
        onClick={flap}
        onTouchEnd={(e) => { e.preventDefault(); flap(); }}
      />
      <p className="text-sm font-semibold text-primary">Score: {score}</p>
      <p className="text-xs text-muted-foreground">Tap to flap!</p>
    </div>
  );
}