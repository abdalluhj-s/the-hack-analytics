import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SurveyRecord } from '../types/survey';

const STORAGE_URL_KEY = 'the_hack_supabase_url';
const STORAGE_KEY_KEY = 'the_hack_supabase_key';

let cachedClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_URL_KEY) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
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
 * Loads surveys from Supabase table
 */
export async function fetchSurveysFromSupabase(): Promise<SurveyRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      branch: row.branch || '',
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
 * Syncs an entire batch of records or single record to Supabase
 */
export async function syncSurveysToSupabase(records: SurveyRecord[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = records.map((r) => ({
      id: r.id,
      branch: r.branch,
      product: r.product,
      call_status: r.callStatus,
      satisfaction: r.satisfaction,
      agent: r.agent,
      technician: r.technician,
      salesperson: r.salesperson,
      customer_notes: r.customerNotes,
      branch_notes: r.branchNotes,
      customer_name: r.customerName,
      phone: r.phone,
      action_taken: r.actionTaken || false,
      action_notes: r.actionNotes || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('surveys').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('Failed to upsert to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase sync exception:', err);
    return false;
  }
}
