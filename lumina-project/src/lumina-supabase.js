// ============================================================
// lumina-supabase.js
// Shared data layer — import this from BOTH the mobile app and
// the admin dashboard so they read/write the same backend.
//
// npm install @supabase/supabase-js
//
// .env (Vite: VITE_..., Next.js: NEXT_PUBLIC_...) — adjust prefix
// to match your build tool:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
// ============================================================
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ---------------- AUTH ---------------- */

export async function signUp({ email, password, role, cityId }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, city_id: cityId ?? null } },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateViewerCity(userId, cityId) {
  const { error } = await supabase.from('profiles').update({ city_id: cityId }).eq('id', userId);
  if (error) throw error;
}

/* ---------------- REFERENCE DATA ---------------- */

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return data;
}

export async function fetchCities() {
  const { data, error } = await supabase.from('cities').select('*').order('wilaya_code');
  if (error) throw error;
  return data;
}

export async function fetchNeighborhoods(cityId) {
  const { data, error } = await supabase.from('neighborhoods').select('name').eq('city_id', cityId);
  if (error) throw error;
  return data.map((r) => r.name);
}

/* ---------------- VIEWER-FACING LISTINGS ---------------- */

export async function fetchLiveListings({ cityId, categoryId, neighborhood }) {
  let q = supabase.from('listings').select('*').eq('status', 'live').eq('city_id', cityId);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (neighborhood && neighborhood !== 'all') q = q.eq('neighborhood', neighborhood);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function submitRating(listingId, stars, viewerId) {
  const { error } = await supabase.from('ratings').insert({ listing_id: listingId, stars, viewer_id: viewerId });
  if (error) throw error;
}

export async function reportListing(listingId, reason, reporterId) {
  const { error } = await supabase.from('reports').insert({ listing_id: listingId, reason, reporter_id: reporterId });
  if (error) throw error;
}

/* ---------------- PROVIDER SIDE ---------------- */

export async function fetchMyListing(providerId) {
  const { data, error } = await supabase.from('listings').select('*').eq('provider_id', providerId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertMyListing(providerId, listing) {
  const payload = { ...listing, provider_id: providerId, status: 'pending' };
  const { data, error } = await supabase.from('listings').upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchSupportThread(providerId) {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendSupportMessage(providerId, sender, text) {
  const { error } = await supabase.from('support_messages').insert({ provider_id: providerId, sender, text });
  if (error) throw error;
}

/* ---------------- ADMIN SIDE ---------------- */

export async function fetchQueue() {
  const { data, error } = await supabase.from('listings').select('*').eq('status', 'pending').order('created_at');
  if (error) throw error;
  return data;
}

export async function approveListing(id) {
  const { error } = await supabase.from('listings').update({ status: 'live' }).eq('id', id);
  if (error) throw error;
}

export async function rejectListing(id, reason) {
  const { error } = await supabase.from('listings').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
  if (error) throw error;
}

export async function fetchOpenReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*, listings(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolveReport(id) {
  const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
  if (error) throw error;
}

export async function fetchAllSupportThreads() {
  const [{ data: messages, error: e1 }, { data: providers, error: e2 }] = await Promise.all([
    supabase.from('support_messages').select('*').order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, email').eq('role', 'provider'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const emailFor = Object.fromEntries((providers || []).map((p) => [p.id, p.email]));
  const grouped = {};
  for (const m of messages || []) {
    if (!grouped[m.provider_id]) {
      grouped[m.provider_id] = { provider_id: m.provider_id, provider_email: emailFor[m.provider_id] || 'Prestataire', thread: [] };
    }
    grouped[m.provider_id].thread.push(m);
  }
  return Object.values(grouped);
}

/* ---------------- STORAGE (listing photos) ---------------- */

// Uploads a File to the 'listing-photos' bucket under the provider's
// own folder (required by the RLS policy) and returns its public URL.
export async function uploadListingPhoto(providerId, file) {
  const ext = file.name.split('.').pop();
  const path = `${providerId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- REALTIME ---------------- */

// Call this from the admin dashboard so the validation queue and
// support inbox update live without a manual refresh.
export function subscribeToAdminUpdates({ onQueueChange, onSupportChange, onReportChange }) {
  const channel = supabase
    .channel('admin-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, onQueueChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, onSupportChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, onReportChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// Call this from a provider's support screen for live admin replies.
export function subscribeToProviderThread(providerId, onMessage) {
  const channel = supabase
    .channel('provider-thread-' + providerId)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `provider_id=eq.${providerId}` },
      onMessage
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
