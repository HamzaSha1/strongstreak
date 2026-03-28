import { useState, useEffect, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 15;

export default function SnakeGame({ isActive, onGameEnd, gameState, onGameStateChange }) {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(() => gameState?.snake ?? [[10, 10]]);
  const [food, setFood] = useState(() => gameState?.food ?? [15, 15]);
  const [direction, setDirection] = useState(() => gameState?.direction ?? [1, 0]);
  const [nextDirection, setNextDirection] = useState(() => gameState?.nextDirection ?? [1, 0]);
  const [score, setScore] = useState(() => gameState?.score ?? 0);
  const gameLoopRef = useRef(null);

  // Save game state when it changes
  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange({ snake, food, direction, nextDirection, score });
    }
  }, [snake, food, direction, nextDirection, score, onGameStateChange]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isActive) return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (direction[1] === 0) setNextDirection([0, -1]);
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (direction[1] === 0) setNextDirection([0, 1]);
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          if (direction[0] === 0) setNextDirection([-1, 0]);
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          if (direction[0] === 0) setNextDirection([1, 0]);
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isActive]);

  // Handle touch/swipe input
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      const threshold = 30;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > threshold && direction[0] === 0) setNextDirection([1, 0]);
        if (diffX < -threshold && direction[0] === 0) setNextDirection([-1, 0]);
      } else {
        if (diffY > threshold && direction[1] === 0) setNextDirection([0, 1]);
        if (diffY < -threshold && direction[1] === 0) setNextDirection([0, -1]);
      }
    };

    if (isActive) {
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchend', handleTouchEnd, false);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [direction, isActive]);

  // Game loop
  useEffect(() => {
    if (!isActive) return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        setDirection(nextDirection);
        
        const head = prevSnake[0];
        const newHead = [
          (head[0] + nextDirection[0] + GRID_SIZE) % GRID_SIZE,
          (head[1] + nextDirection[1] + GRID_SIZE) % GRID_SIZE,
        ];

        // Check self collision - restart game
        if (prevSnake.some((segment) => segment[0] === newHead[0] && segment[1] === newHead[1])) {
          setDirection([1, 0]);
          setNextDirection([1, 0]);
          setScore(0);
          return [[10, 10]];
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          const newFood = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
          setFood(newFood);
          setScore((prev) => prev + 10);
          return newSnake;
        }

        return newSnake.slice(0, -1);
      });
    }, 100);

    return () => clearInterval(gameLoopRef.current);
  }, [isActive, nextDirection, food, onGameEnd]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#23d9d9';
    snake.forEach((segment) => {
      ctx.fillRect(segment[0] * CELL_SIZE, segment[1] * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });

    // Draw food
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(food[0] * CELL_SIZE, food[1] * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border-2 border-primary rounded-lg bg-slate-900"
      />
      <p className="text-sm font-semibold text-primary">Score: {score}</p>
      <p className="text-xs text-muted-foreground">Use arrow keys or swipe to move</p>
    </div>
  );
}