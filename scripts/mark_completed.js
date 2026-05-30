require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('orders').update({ status: 'completed' }).neq('status', 'completed');
  if (error) console.error(error);
  else console.log("Marked all as completed");
}
run();
