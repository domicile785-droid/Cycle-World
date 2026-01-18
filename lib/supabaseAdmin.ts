
import { createClient } from '@supabase/supabase-js';

// PLACEHOLDERS: Replace with your actual values in a secure server-side environment variable.
const supabaseUrl = 'https://zororudkzwpnddgobsbl.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcm9ydWRrendwbmRkZ29ic2JsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY1MzUwNSwiZXhwIjoyMDg0MjI5NTA1fQ.uQRrapqVpF-stRT_yRZGRRgCV1lId74YZhKanF2ko4I';

/**
 * WARNING: This client uses the service_role key. 
 * NEVER expose this file or the key to the browser.
 * This should ONLY be used in API routes or Edge Functions.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
