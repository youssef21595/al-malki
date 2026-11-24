import { IS_DEV } from './content.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const REQUEST_TIMEOUT_MS = 10000;

function isConfigured() {
  return (
    Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_ANON_KEY.includes('ضع-')
  );
}

function buildHeaders() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  // Legacy anon keys are JWTs and are also sent as a bearer token
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

// Sends a visitor's contact request to the clinic.
// Returns { ok: true } only when the request was really saved.
export async function sendLead({ name, phone, source }) {
  if (!isConfigured()) {
    if (IS_DEV) {
      // Local preview only: simulates success so the final message can be seen
      console.info('Simulated lead (not saved):', { name, phone, source });
      return { ok: true, simulated: true };
    }
    return { ok: false };
  }

  try {
    const baseUrl = SUPABASE_URL.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ name, phone, source }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('Lead was not saved. Status:', response.status);
    }
    return { ok: response.ok };
  } catch (error) {
    console.error('Lead request failed:', error);
    return { ok: false };
  }
}