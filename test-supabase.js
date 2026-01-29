const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://inquvsymyujundkwxzju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucXV2c3lteXVqdW5ka3d4emp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzg0NjYsImV4cCI6MjA4NTIxNDQ2Nn0.jgRCiEgGpoXcidRLsHsVw0ydDLKMz_qKms1-N434uKw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('1. Testing anonymous sign in...');

  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return;
  }

  console.log('✅ Signed in! User ID:', authData.user?.id);

  console.log('\n2. Checking profiles table...');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user?.id)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError.message);
    console.log('\n   This might mean:');
    console.log('   - profiles table does not exist (run schema.sql)');
    console.log('   - RLS policy is blocking access');
    console.log('   - trigger did not create profile automatically');
  } else {
    console.log('✅ Profile found:', profile);
  }

  console.log('\n3. Testing profile update...');

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ name: 'Test User' })
    .eq('id', authData.user?.id);

  if (updateError) {
    console.error('❌ Update error:', updateError.message);
  } else {
    console.log('✅ Profile updated successfully!');
  }

  // Clean up - sign out
  await supabase.auth.signOut();
  console.log('\n✅ Test complete!');
}

test().catch(console.error);
