// Stock images from Unsplash (exercise/fitness themed)
export const MUSCLE_GROUP_IMAGES = {
  Chest: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
  Shoulders: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&q=80',
  Triceps: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80',
  Back: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  Biceps: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=80',
  Legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&q=80',
  Glutes: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80',
  Core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  Cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80',
};

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
    { name: 'Bench Press', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Incline Dumbbell Press', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { name: 'Cable Fly', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Dips (Chest)', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
    { name: 'Push-Ups', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
    { name: 'Pec Deck', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&q=80' },
  ],
  Shoulders: [
    { name: 'Overhead Press', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&q=80' },
    { name: 'Lateral Raise', image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=300&q=80' },
    { name: 'Front Raise', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Face Pull', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Arnold Press', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
  ],
  Triceps: [
    { name: 'Tricep Pushdown', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
    { name: 'Overhead Tricep Extension', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Skull Crushers', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { name: 'Dips (Triceps)', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Diamond Push-Ups', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
  ],
  Back: [
    { name: 'Deadlift', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Pull-Up', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
    { name: 'Barbell Row', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Cable Row', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { name: 'Lat Pulldown', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&q=80' },
  ],
  Biceps: [
    { name: 'Bicep Curl', image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=300&q=80' },
    { name: 'Hammer Curl', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Preacher Curl', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
    { name: 'Incline Curl', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
  ],
  Legs: [
    { name: 'Squat', image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=300&q=80' },
    { name: 'Romanian Deadlift', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Leg Press', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&q=80' },
    { name: 'Leg Curl', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Leg Extension', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { name: 'Bulgarian Split Squat', image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=300&q=80' },
  ],
  Glutes: [
    { name: 'Hip Thrust', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&q=80' },
    { name: 'Glute Bridge', image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=300&q=80' },
    { name: 'Cable Kickback', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
  ],
  Core: [
    { name: 'Plank', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
    { name: 'Crunches', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Leg Raise', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { name: 'Russian Twist', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Ab Wheel Rollout', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
  ],
  Cardio: [
    { name: 'Treadmill Run', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&q=80' },
    { name: 'Cycling', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
    { name: 'Rowing', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80' },
    { name: 'Jump Rope', image: 'https://images.unsplash.com/photo-1598971639058-a4575aced1f0?w=300&q=80' },
    { name: 'Stair Climber', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&q=80' },
    { name: 'Elliptical', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
  ],
};

export const SESSION_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Custom'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const REST_OPTIONS = [
  { label: '30s', value: 30 }, { label: '45s', value: 45 }, { label: '60s', value: 60 },
  { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }, { label: '5m', value: 300 },
];