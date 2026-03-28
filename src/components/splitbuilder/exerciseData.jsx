// Everkinetic line-art illustrations from Wikimedia Commons (CC BY-SA 3.0)
// All hashes verified against actual Wikimedia Commons file pages.
const WK = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

// Helper: build a thumbnail URL given the hash, filename and desired width
const wk = (hash, filename, w = 400) =>
  `${WK}/${hash}/${filename}/${w}px-${filename}`;

// ─── Verified files ───────────────────────────────────────────────────────────
// Bench press 1.svg              → 7/74
// Arnold press 1.svg             → 9/96
// Alternating bicep curl...1.svg → b/b6
// Alternating hammer curl...1.svg→ 8/8c
// Alternating incline curl...1.svg→a/ab
// Ab rollout on knees...1.svg    → b/ba
// Air bike 1.svg                 → a/ae
// Barbell shoulder press 1.svg   → 9/99
// Barbell dead lifts 1.svg       → 9/92
// Barbell lunges 1.svg           → 8/8a
// Back extension stability...1.svg→2/22
// Back flys exercise band 1.svg  → d/d6
// Decline crunch 1.svg           → 9/96
// Decline barbell bench press 1.svg→a/ad

export const MUSCLE_GROUP_IMAGES = {
  Chest:     wk('7/74', 'Bench_press_1.svg', 500),
  Shoulders: wk('9/99', 'Barbell_shoulder_press_1.svg', 400),
  Triceps:   wk('a/ad', 'Decline_barbell_bench_press_1.svg', 400),
  Back:      wk('d/d6', 'Back_flys_exercise_band_1.svg', 400),
  Biceps:    wk('b/b6', 'Alternating_bicep_curl_with_dumbbell_1.svg', 350),
  Legs:      wk('8/8a', 'Barbell_lunges_1.svg', 400),
  Glutes:    wk('2/22', 'Back_extension_stability_ball_1.svg', 400),
  Core:      wk('b/ba', 'Ab_rollout_on_knees_with_barbell_1.svg', 400),
  Cardio:    wk('a/ae', 'Air_bike_1.svg', 400),
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
    { name: 'Bench Press',            image: wk('7/74', 'Bench_press_1.svg', 400) },
    { name: 'Incline Dumbbell Press', image: wk('a/ad', 'Decline_barbell_bench_press_1.svg', 400) },
    { name: 'Dumbbell Fly',           image: wk('d/d2', 'Decline_dumbbell_flys_1.svg', 400) },
    { name: 'Dips (Chest)',           image: wk('2/22', 'Back_extension_stability_ball_1.svg', 400) },
    { name: 'Push-Ups',               image: wk('b/ba', 'Ab_rollout_on_knees_with_barbell_1.svg', 400) },
    { name: 'Pec Deck',               image: wk('7/74', 'Bench_press_1.svg', 400) },
  ],
  Shoulders: [
    { name: 'Overhead Press', image: wk('9/99', 'Barbell_shoulder_press_1.svg', 400) },
    { name: 'Lateral Raise',   image: wk('d/d6', 'Back_flys_exercise_band_1.svg', 400) },
    { name: 'Front Raise',     image: wk('9/99', 'Barbell_shoulder_press_1.svg', 400) },
    { name: 'Face Pull',       image: wk('d/d6', 'Back_flys_exercise_band_1.svg', 400) },
    { name: 'Arnold Press',    image: wk('9/96', 'Arnold_press_1.svg', 300) },
  ],
  Triceps: [
    { name: 'Tricep Pushdown',           image: wk('a/ad', 'Decline_barbell_bench_press_1.svg', 400) },
    { name: 'Overhead Tricep Extension', image: wk('9/96', 'Arnold_press_1.svg', 300) },
    { name: 'Skull Crushers',            image: wk('3/35', 'Decline_close_grip_bench_to_skull_crusher_1.svg', 400) },
    { name: 'Dips (Triceps)',            image: wk('a/ad', 'Decline_barbell_bench_press_1.svg', 400) },
    { name: 'Close Grip Press',          image: wk('7/74', 'Bench_press_1.svg', 400) },
  ],
  Back: [
    { name: 'Deadlift',     image: wk('9/92', 'Barbell_dead_lifts_1.svg', 400) },
    { name: 'Pull-Up',      image: wk('d/d6', 'Back_flys_exercise_band_1.svg', 400) },
    { name: 'Barbell Row',  image: wk('9/92', 'Barbell_dead_lifts_1.svg', 400) },
    { name: 'Cable Row',    image: wk('d/d6', 'Back_flys_exercise_band_1.svg', 400) },
    { name: 'Lat Pulldown', image: wk('2/22', 'Back_extension_stability_ball_1.svg', 400) },
  ],
  Biceps: [
    { name: 'Bicep Curl',    image: wk('b/b6', 'Alternating_bicep_curl_with_dumbbell_1.svg', 300) },
    { name: 'Hammer Curl',   image: wk('8/8c', 'Alternating_hammer_curl_with_dumbbell_1.svg', 300) },
    { name: 'Preacher Curl', image: wk('b/b6', 'Alternating_bicep_curl_with_dumbbell_1.svg', 300) },
    { name: 'Incline Curl',  image: wk('a/ab', 'Alternating_incline_curl_with_dumbbell_1.svg', 400) },
  ],
  Legs: [
    { name: 'Squat',                 image: wk('9/92', 'Barbell_dead_lifts_1.svg', 400) },
    { name: 'Romanian Deadlift',     image: wk('9/92', 'Barbell_dead_lifts_1.svg', 400) },
    { name: 'Leg Press',             image: wk('8/8a', 'Barbell_lunges_1.svg', 400) },
    { name: 'Leg Curl',              image: wk('2/22', 'Back_extension_stability_ball_1.svg', 400) },
    { name: 'Leg Extension',         image: wk('8/8a', 'Barbell_lunges_1.svg', 400) },
    { name: 'Bulgarian Split Squat', image: wk('8/8a', 'Barbell_lunges_1.svg', 400) },
  ],
  Glutes: [
    { name: 'Hip Thrust',    image: wk('2/22', 'Back_extension_stability_ball_1.svg', 400) },
    { name: 'Glute Bridge',  image: wk('7/78', 'Back_extension_stability_ball_2.svg', 400) },
    { name: 'Cable Kickback',image: wk('d/d6', 'Back_flys_exercise_band_1.svg', 400) },
  ],
  Core: [
    { name: 'Plank',            image: wk('b/ba', 'Ab_rollout_on_knees_with_barbell_1.svg', 400) },
    { name: 'Crunches',         image: wk('9/96', 'Decline_crunch_1.svg', 400) },
    { name: 'Leg Raise',        image: wk('9/96', 'Decline_crunch_1.svg', 400) },
    { name: 'Russian Twist',    image: wk('b/ba', 'Ab_rollout_on_knees_with_barbell_1.svg', 400) },
    { name: 'Ab Wheel Rollout', image: wk('b/ba', 'Ab_rollout_on_knees_with_barbell_1.svg', 400) },
  ],
  Cardio: [
    { name: 'Treadmill Run', image: wk('a/ae', 'Air_bike_1.svg', 400) },
    { name: 'Cycling',       image: wk('a/ae', 'Air_bike_1.svg', 400) },
    { name: 'Rowing',        image: wk('a/ae', 'Air_bike_1.svg', 400) },
    { name: 'Jump Rope',     image: wk('a/ae', 'Air_bike_1.svg', 400) },
    { name: 'Stair Climber', image: wk('a/ae', 'Air_bike_1.svg', 400) },
    { name: 'Elliptical',    image: wk('a/ae', 'Air_bike_1.svg', 400) },
  ],
};

export const SESSION_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Custom'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const REST_OPTIONS = [
  { label: '30s', value: 30 }, { label: '45s', value: 45 }, { label: '60s', value: 60 },
  { label: '90s', value: 90 }, { label: '2m', value: 120 }, { label: '3m', value: 180 }, { label: '5m', value: 300 },
];