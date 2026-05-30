require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // Add the email user
  const { data, error } = await supabase.from('users').insert({
    username: 'nicolasow6@gmail.com',
    password: hash,
    role: 'admin'
  });
  
  // Also update the original admin user password to admin123
  await supabase.from('users').update({ password: hash }).eq('username', 'admin');
  
  if (error) console.error(error);
  else console.log("Added user and updated admin password!");
}
run();
