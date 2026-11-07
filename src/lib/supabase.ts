import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rdzaqndquqvqcudwdlrj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Lv7HSZnVLJkJqRENFnMSAw_azMwTSdQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
