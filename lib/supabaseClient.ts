
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zororudkzwpnddgobsbl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcm9ydWRrendwbmRkZ29ic2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTM1MDUsImV4cCI6MjA4NDIyOTUwNX0.PuBslFoU7zN41QWwKI9oDT4xmVcRaPKnrdu7ibdZMu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
