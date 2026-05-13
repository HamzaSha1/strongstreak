import { createContext, useContext, useState, useRef } from 'react';

const ActiveWorkoutContext = createContext(null);

export function ActiveWorkoutProvider({ children }) {
  const [activeDayId, setActiveDayId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const workoutStartTime = useRef(null);

  const startWorkout = (dayId) => {
    workoutStartTime.current = Date.now();
    setActiveDayId(dayId);
    setIsMinimized(false);
  };

  const stopWorkout = () => {
    workoutStartTime.current = null;
    setActiveDayId(null);
    setIsMinimized(false);
  };

  const minimize = () => setIsMinimized(true);
  const maximize = () => setIsMinimized(false);

  return (
    <ActiveWorkoutContext.Provider value={{ activeDayId, isMinimized, workoutStartTime, startWorkout, stopWorkout, minimize, maximize }}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export const useActiveWorkout = () => useContext(ActiveWorkoutContext);