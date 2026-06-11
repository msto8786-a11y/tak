// Runtime Supabase configuration.
// Reads from window.APP_CONFIG (set in /public/config.js) so the user can edit
// these values directly on the host (Plesk File Manager) without rebuilding.
import { createClient } from '@supabase/supabase-js';

function getRuntimeConfig() {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    return {
      url: window.APP_CONFIG.SUPABASE_URL || '',
      anonKey: window.APP_CONFIG.SUPABASE_ANON_KEY || '',
    };
  }
  return { url: '', anonKey: '' };
}

let _client = null;
let _configured = false;

export function isSupabaseConfigured() {
  const { url, anonKey } = getRuntimeConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

export function getSupabase() {
  if (_client) return _client;
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getRuntimeConfig();
  _client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  _configured = true;
  return _client;
}

export function supabaseStatus() {
  return { configured: _configured || isSupabaseConfigured() };
}

// ===== Sessions API =====

const TABLE = 'lab_sessions';

export async function listSessions() {
  const c = getSupabase();
  if (!c) throw new Error('Supabase not configured');
  const { data, error } = await c
    .from(TABLE)
    .select('id,name,student_name,updated_at,components,wires')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    student_name: d.student_name || '',
    updated_at: d.updated_at,
    component_count: Array.isArray(d.components) ? d.components.length : 0,
    wire_count: Array.isArray(d.wires) ? d.wires.length : 0,
  }));
}

export async function getSession(id) {
  const c = getSupabase();
  if (!c) throw new Error('Supabase not configured');
  const { data, error } = await c
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSession({ name, student_name, components, wires }) {
  const c = getSupabase();
  if (!c) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const { data, error } = await c
    .from(TABLE)
    .insert({
      name,
      student_name: student_name || '',
      components: components || [],
      wires: wires || [],
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id) {
  const c = getSupabase();
  if (!c) throw new Error('Supabase not configured');
  const { error } = await c.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
