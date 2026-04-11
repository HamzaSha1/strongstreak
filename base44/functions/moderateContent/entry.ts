import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, image_url } = await req.json();

    const hasText = text && text.trim().length > 0;
    const hasImage = !!image_url;

    if (!hasText && !hasImage) {
      return Response.json({ safe: true });
    }

    const prompt = `You are a strict content moderation assistant for a fitness social app. Analyze the following user-generated content and determine if it is objectionable.

Objectionable content includes: hate speech, harassment, sexual/explicit content, nudity, violence, threats, self-harm promotion, spam, discrimination, bullying, or anything illegal.

${hasText ? `Caption text: "${text}"` : ''}
${hasImage ? `An image is also attached — analyze it for objectionable visual content.` : ''}

Respond with a JSON object only:
{
  "safe": true or false,
  "reason": "brief reason if not safe, otherwise null"
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: hasImage ? [image_url] : null,
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