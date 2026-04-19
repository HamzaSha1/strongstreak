// Persists the user's preferred rest-time mini-game to localStorage
// options: 'snake' | 'flappy' | 'breathing'
const KEY = 'rest_game_preference';

export function useRestGame() {
  const get = () => localStorage.getItem(KEY) || 'snake';
  const set = (game) => localStorage.setItem(KEY, game);
  return { get, set };
}