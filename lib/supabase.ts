import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcoqlbykfukrqfycyldd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjb3FsYnlrZnVrcnFmeWN5bGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjczNDgsImV4cCI6MjA4MDYwMzM0OH0.F4tU2kgi8QhjxhX_dcoQWyIT8Gv4OcnltBJ4GWjTaNE';

export const supabase = createClient(supabaseUrl, supabaseKey);
