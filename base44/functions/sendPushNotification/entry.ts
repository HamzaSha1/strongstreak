import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const KEY_ID   = '2Q6T45ZPG3';
const TEAM_ID  = '75WWAB423Y';
const BUNDLE_ID = 'com.zodwallet.strongstreak';
const APNS_HOST = 'https://api.push.apple.com'; // use api.sandbox.push.apple.com for dev builds

// ── APNs JWT ─────────────────────────────────────────────────────────────────

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function strToBase64url(str: string): string {
  return bytesToBase64url(new TextEncoder().encode(str));
}

async function makeAPNsJWT(): Promise<string> {
  const pem = Deno.env.get('APNS_PRIVATE_KEY');
  if (!pem) throw new Error('APNS_PRIVATE_KEY env var is not set');

  const pkcs8 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const keyBytes = Uint8Array.from(atob(pkcs8), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header  = strToBase64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID }));
  const payload = strToBase64url(JSON.stringify({ iss: TEAM_ID, iat: Math.floor(Date.now() / 1000) }));
  const signingInput = `${header}.${payload}`;

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${bytesToBase64url(new Uint8Array(sig))}`;
}

// ── Send to one device ────────────────────────────────────────────────────────

async function sendToDevice(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ ok: boolean; status: number }> {
  const jwt = await makeAPNsJWT();
  const res = await fetch(`${APNS_HOST}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'apns-topic': BUNDLE_ID,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aps: {
        alert: { title, body },
        sound: 'default',
      },
      ...data,
    }),
  });
  return { ok: res.ok, status: res.status };
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetUserEmail, title, body, data } = await req.json();
    if (!targetUserEmail || !title || !body) {
      return Response.json({ error: 'Missing targetUserEmail, title, or body' }, { status: 400 });
    }

    const tokens = await base44.asServiceRole.entities.DeviceToken.filter({
      user_id: targetUserEmail,
    });

    if (tokens.length === 0) {
      return Response.json({ error: 'No device tokens found for this user' }, { status: 404 });
    }

    const results = await Promise.all(
      tokens.map((t: { token: string }) => sendToDevice(t.token, title, body, data)),
    );

    const sent = results.filter((r) => r.ok).length;
    return Response.json({ sent, total: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
