
import { createClient } from '@supabase/supabase-js';

// Accessing variables via import.meta.env

const supabaseUrl = 'https://nexqocjyytqsygkstyhv.supabase.co'
const supabaseKey = 'sb_publishable_w6FW8B21riRhcwSBuOwqAA_FgDuOuOS'
// Initializing the shared client
export const client = createClient(supabaseUrl, supabaseKey);
