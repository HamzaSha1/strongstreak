import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url, mode } = await req.json();
    if (!image_url) return Response.json({ error: 'image_url required' }, { status: 400 });

    const isDay = mode === 'day';

    const prompt = isDay
      ? `You are a workout data parser. Analyze this workout screenshot and extract ALL exercises shown.
For each exercise extract:
- exercise_name: exact name as shown
- sets: array of objects with { reps (number or null), weight_kg (number or null), rir (number or null, Reps In Reserve) }
- target_reps: target rep range if shown (e.g. "8-12"), else use the most common reps value
- target_sets: total number of sets

Return data for a SINGLE workout day.
If weight is in lbs, convert to kg (divide by 2.205).
If no weight is shown, set weight_kg to null.
If no RIR is shown, set rir to null.`
      : `You are a workout split data parser. Analyze this screenshot which may contain a full week workout program.
Extract ALL days and their exercises.
For each day extract:
- day_name: day of week (Monday, Tuesday, etc.) or session name (Push, Pull, Legs, etc.)
- session_type: one of Push, Pull, Legs, Upper, Lower, Full Body, Cardio, Rest, Custom
- exercises: array of exercises, each with:
  - exercise_name: exact name
  - target_sets: number
  - target_reps: rep range string (e.g. "8-12") or null
  - rpe: RPE value if shown (1-10) or null

Return data for ALL days shown in the image (could be a full weekly split).`;

    const jsonSchema = isDay
      ? {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  exercise_name: { type: 'string' },
                  target_sets: { type: 'number' },
                  target_reps: { type: 'string' },
                  sets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        reps: { type: 'number' },
                        weight_kg: { type: 'number' },
                        rir: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        }
      : {
          type: 'object',
          properties: {
            split_name: { type: 'string' },
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day_name: { type: 'string' },
                  session_type: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        exercise_name: { type: 'string' },
                        target_sets: { type: 'number' },
                        target_reps: { type: 'string' },
                        rpe: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [image_url],
      response_json_schema: jsonSchema,
      model: 'claude_sonnet_4_6',
    });

    return Response.json({ success: true, data: result, mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});