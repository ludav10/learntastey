import { createClient } from '@supabase/supabase-js';

const URL = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(URL, KEY);
