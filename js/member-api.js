import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

let clientPromise;

function isConfigured() {
  return (
    Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_ANON_KEY.includes('ضع-')
  );
}

// The Supabase library is loaded only when needed, so a failed download
// can never break the rest of the website.
function getClient() {
  if (!clientPromise) {
    clientPromise = import('./supabase-client.js')
      .then((module) => module.supabase)
      .catch((error) => {
        clientPromise = undefined;
        throw error;
      });
  }
  return clientPromise;
}

// Quick check (no network): did this browser keep a login from before?
export function hasStoredSession() {
  try {
    return Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );
  } catch {
    return false;
  }
}

function failureReason(error) {
  if (error.name === 'AuthRetryableFetchError') return 'network';
  if (error.code === 'email_not_confirmed') return 'unconfirmed';
  return 'rejected';
}

// Row Level Security guarantees these queries only ever return the
// signed-in customer's own data.
async function loadProfile(supabase) {
  const { data: member, error } = await supabase
    .from('members')
    .select('full_name, member_code')
    .single();
  if (error || !member) return null;

  const { data: rows } = await supabase.from('points_ledger').select('points');
  const points = (rows || []).reduce((total, row) => total + row.points, 0);

  return { name: member.full_name, memberCode: member.member_code, points };
}

export async function registerMember({ name, phone, email, password }) {
  if (!isConfigured()) return { ok: false, reason: 'network' };
  try {
    const supabase = await getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    if (error) return { ok: false, reason: failureReason(error) };
    if (!data.session) return { ok: true, needsEmailConfirmation: true };
    return { ok: true, profile: await loadProfile(supabase) };
  } catch (error) {
    console.error('Sign up failed:', error);
    return { ok: false, reason: 'network' };
  }
}

export async function loginMember({ email, password }) {
  if (!isConfigured()) return { ok: false, reason: 'network' };
  try {
    const supabase = await getClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, reason: failureReason(error) };
    return { ok: true, profile: await loadProfile(supabase) };
  } catch (error) {
    console.error('Login failed:', error);
    return { ok: false, reason: 'network' };
  }
}