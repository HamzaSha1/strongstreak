import { createContext, useContext, useState } from 'react';

const ActiveWorkoutContext = createContext(null);

export function ActiveWorkoutProvider({ children }) {
  const [activeDayId, setActiveDayId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const startWorkout = (dayId) => {
    setActiveDayId(dayId);
    setIsMinimized(false);
  };

  const stopWorkout = () => {
    setActiveDayId(null);
    setIsMinimized(false);
  };

  const minimize = () => setIsMinimized(true);
  const maximize = () => setIsMinimized(false);

  return (
    <ActiveWorkoutContext.Provider value={{ activeDayId, isMinimized, startWorkout, stopWorkout, minimize, maximize }}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export const useActiveWorkout = () => useContext(ActiveWorkoutContext);
