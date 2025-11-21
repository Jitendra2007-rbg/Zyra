import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tbibgmnqsfyhmolckvqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWJnbW5xc2Z5aG1vbGNrdnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTc4ODUsImV4cCI6MjA3NzYzMzg4NX0.6tzsKjHg_kFaFLGlST3ldR4cfbzGnmrXFE_BdFLGPeg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
