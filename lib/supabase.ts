import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://inquvsymyujundkwxzju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucXV2c3lteXVqdW5ka3d4emp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzg0NjYsImV4cCI6MjA4NTIxNDQ2Nn0.jgRCiEgGpoXcidRLsHsVw0ydDLKMz_qKms1-N434uKw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
