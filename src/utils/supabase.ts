import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyRecord } from '../types/survey';

const STORAGE_URL_KEY = 'the_hack_supabase_url';
const STORAGE_KEY_KEY = 'the_hack_supabase_key';

let cachedClient: SupabaseClient | null = null;

const DEFAULT_URL = 'https://drrlngaxzgsjuxzzyyzc.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmxuZ2F4emdzanV4enp5eXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMzc0OTQsImV4cCI6MjEwNTYxMzQ5NH0.vnGhWsI0_3GLPEOTT3bVPJ11l50VV23qAIs2-Vqo3RI';

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_URL_KEY) || (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_URL_KEY, url);
  localStorage.setItem(STORAGE_KEY_KEY, anonKey);
  cachedClient = null; // reset client
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return null;

  try {
    cachedClient = createClient(url, anonKey);
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

/**
 * Tests connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'يرجى إدخال رابط المشروع والمفتاح العام (Anon Key)' };
  }

  try {
    const { error } = await client.from('surveys').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { success: false, message: `فشل الاتصال: ${error.message}` };
    }
    return { success: true, message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح!' };
  } catch (err: any) {
    return { success: false, message: `خطأ في الاتصال: ${err.message || 'تعذر الوصول'}` };
  }
}

/**
 * Loads surveys from Supabase table with pagination to retrieve all records
 */
export async function fetchSurveysFromSupabase(): Promise<SurveyRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let allRows: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    // Supabase default max limit is 1000 per request, so we paginate to fetch all records
    while (hasMore) {
      const { data, error } = await client
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + step - 1);

      if (error) {
        console.warn('Supabase fetch error:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(data);
        if (data.length < step || allRows.length >= 15000) {
          hasMore = false;
        } else {
          from += step;
        }
      }
    }

    if (allRows.length === 0) return null;

    return allRows.map((row: any) => ({
      id: row.id,
      branch: row.branch || '',
      date: row.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      sheetName: row.sheet_name || '',
      product: row.product || '',
      callStatus: row.call_status || '',
      satisfaction: row.satisfaction || '',
      agent: row.agent || '',
      technician: row.technician || '',
      salesperson: row.salesperson || '',
      customerNotes: row.customer_notes || '',
      branchNotes: row.branch_notes || '',
      customerName: row.customer_name || '',
      phone: row.phone || '',
      actionTaken: !!row.action_taken,
      actionNotes: row.action_notes || '',
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('Failed to query Supabase:', err);
    return null;
  }
}

/**
 * Clears all survey records in Supabase
 */
export async function clearAllSurveysInSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('surveys').delete().neq('id', '___NON_EXISTENT_ID___');
    if (error) {
      console.warn('Failed to clear Supabase surveys:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Clear Supabase exception:', err);
    return false;
  }
}

/**
 * Syncs an entire batch of records or single record to Supabase
 * Uses chunked batches of 150 items to ensure zero timeouts or payload errors
 */
export async function syncSurveysToSupabase(
  records: SurveyRecord[],
  options?: { clearFirst?: boolean }
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    if (options?.clearFirst) {
      await clearAllSurveysInSupabase();
    }

    if (records.length === 0) return true;

    const rows = records.map((r) => ({
      id: r.id,
      branch: r.branch || '',
      date: r.date || new Date().toISOString().split('T')[0],
      sheet_name: r.sheetName || '',
      product: r.product || '',
      call_status: r.callStatus || '',
      satisfaction: r.satisfaction || '',
      agent: r.agent || '',
      technician: r.technician || '',
      salesperson: r.salesperson || '',
      customer_notes: r.customerNotes || '',
      branch_notes: r.branchNotes || '',
      customer_name: r.customerName || '',
      phone: r.phone || '',
      action_taken: r.actionTaken || false,
      action_notes: r.actionNotes || '',
      updated_at: new Date().toISOString(),
    }));

    // Chunk into batches of 150 records
    const CHUNK_SIZE = 150;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await client.from('surveys').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`Failed to upsert chunk ${i} to ${i + chunk.length}:`, error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Supabase sync exception:', err);
    return false;
  }
}

