import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ safe: true });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation assistant. Analyze the following user-generated text and determine if it contains objectionable content such as: hate speech, harassment, explicit/sexual content, violence, spam, or illegal activity.

Text to analyze: "${text}"

Respond with a JSON object only:
{
  "safe": true/false,
  "reason": "brief reason if not safe, otherwise null"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          reason: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});