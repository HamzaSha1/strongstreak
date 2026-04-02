import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to interact with the global exercise library.
 * - Fetches all exercises from the DB
 * - Provides a function to ensure an exercise exists (upsert by name)
 */
export function useExerciseLibrary() {
  const queryClient = useQueryClient();

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exerciseLibrary'],
    queryFn: () => base44.entities.Exercise.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Ensure exercise exists in the global library (idempotent)
  const ensureExercise = async ({ display_name, exercise_type = 'strength', muscle_group = '' }) => {
    const normalized = display_name.trim().toLowerCase();
    const existing = libraryExercises.find((e) => e.name === normalized);
    if (existing) return existing;

    // Double-check DB in case local cache is stale
    const found = await base44.entities.Exercise.filter({ name: normalized });
    if (found.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
      return found[0];
    }

    const created = await base44.entities.Exercise.create({
      name: normalized,
      display_name: display_name.trim(),
      exercise_type,
      muscle_group,
    });
    queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
    return created;
  };

  return { libraryExercises, ensureExercise };
}