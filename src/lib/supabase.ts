import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjhoavcazbhxvsvybvoe.supabase.co';
const supabaseAnonKey = 'sb_publishable_aDeGzX7OmGVWDlMezbsKLQ_9zkgam9p';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
