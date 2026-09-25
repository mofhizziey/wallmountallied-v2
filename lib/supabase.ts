import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing from environment variables.');
}

// We use the service role key if available for admin operations (like bypassing RLS),
// otherwise fallback to anon key for client-side operations.
export const supabase = createClient(supabaseUrl, supabaseKey);
