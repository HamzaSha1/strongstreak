export const SESSION_MUSCLE_GROUPS = {
  Push: ['Chest', 'Shoulders', 'Triceps'],
  Pull: ['Back', 'Biceps'],
  Legs: ['Legs', 'Glutes'],
  Upper: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
  Lower: ['Legs', 'Glutes'],
  'Full Body': ['Chest', 'Back', 'Legs', 'Shoulders', 'Core'],
  Cardio: ['Cardio'],
  Custom: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio'],
};

export const EXERCISES_BY_MUSCLE = {
  Chest: [
    { name: 'Bench Press' },
    { name: 'Incline Dumbbell Press' },
    { name: 'Dumbbell Fly' },
    { name: 'Dips (Chest)' },
    { name: 'Push-Ups' },
    { name: 'Pec Deck' },
  ],
  Shoulders: [
    { name: 'Overhead Press' },
    { name: 'Lateral Raise' },
    { name: 'Front Raise' },
    { name: 'Face Pull' },
    { name: 'Arnold Press' },
  ],
  Triceps: [
    { name: 'Tricep Pushdown' },
    { name: 'Overhead Tricep Extension' },
    { name: 'Skull Crushers' },
    { name: 'Dips (Triceps)' },
    { name: 'Close Grip Press' },
  ],
  Back: [
    { name: 'Deadlift' },
    { name: 'Pull-Up' },
    { name: 'Barbell Row' },
    { name: 'Cable Row' },
    { name: 'Lat Pulldown' },
  ],
  Biceps: [
    { name: 'Bicep Curl' },
    { name: 'Hammer Curl' },
    { name: 'Preacher Curl' },
    { name: 'Incline Curl' },
  ],
  Legs: [
    { name: 'Squat' },
    { name: 'Romanian Deadlift' },
    { name: 'Leg Press' },
    { name: 'Leg Curl' },
    { name: 'Leg Extension' },
    { name: 'Bulgarian Split Squat' },
  ],
  Glutes: [
    { name: 'Hip Thrust' },
    { name: 'Glute Bridge' },
    { name: 'Cable Kickback' },
  ],
  Core: [
    { name: 'Plank' },
    { name: 'Crunches' },
    { name: 'Leg Raise' },
    { name: 'Russian Twist' },
    { name: 'Ab Wheel Rollout' },
  ],
  Cardio: [
    { name: 'Treadmill Run' },
    { name: 'Cycling' },
    { name: 'Rowing' },
    { name: 'Jump Rope' },
    { name: 'Stair Climber' },
    { name: 'Elliptical' },
  ],
};

// Muscle group each exercise belongs to (for showing the right illustration)
export const EXERCISE_MUSCLE_MAP = {
  'Bench Press': 'Chest', 'Incline Dumbbell Press': 'Chest', 'Dumbbell Fly': 'Chest',
  'Dips (Chest)': 'Chest', 'Push-Ups': 'Chest', 'Pec Deck': 'Chest',
  'Overhead Press': 'Shoulders', 'Lateral Raise': 'Shoulders', 'Front Raise': 'Shoulders',
  'Face Pull': 'Shoulders', 'Arnold Press': 'Shoulders',
  'Tricep Pushdown': 'Triceps', 'Overhead Tricep Extension': 'Triceps', 'Skull Crushers': 'Triceps',
  'Dips (Triceps)': 'Triceps', 'Close Grip Press': 'Triceps',
  'Deadlift': 'Back', 'Pull-Up': 'Back', 'Barbell Row': 'Back', 'Cable Row': 'Back', 'Lat Pulldown': 'Back',
  'Bicep Curl': 'Biceps', 'Hammer Curl': 'Biceps', 'Preacher Curl': 'Biceps', 'Incline Curl': 'Biceps',
  'Squat': 'Legs', 'Romanian Deadlift': 'Legs', 'Leg Press': 'Legs', 'Leg Curl': 'Legs',
  'Leg Extension': 'Legs', 'Bulgarian Split Squat': 'Legs',
  'Hip Thrust': 'Glutes', 'Glute Bridge': 'Glutes', 'Cable Kickback': 'Glutes',
  'Plank': 'Core', 'Crunches': 'Core', 'Leg Raise': 'Core', 'Russian Twist': 'Core', 'Ab Wheel Rollout': 'Core',
  'Treadmill Run': 'Cardio', 'Cycling': 'Cardio', 'Rowing': 'Cardio',
  'Jump Rope': 'Cardio', 'Stair Climber': 'Cardio', 'Elliptical': 'Cardio',
};

export const SESSION_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Custom'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const REST_OPTIONS = [
  { label: '30s', value: 30 }, { label: '45s', value: 45 }, { label: '60s', value: 60 },
  { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }, { label: '5m', value: 300 },
];