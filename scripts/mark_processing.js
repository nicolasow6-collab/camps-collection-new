require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('orders').update({ status: 'processing' }).in('id', [1, 5, 8]);
  if (error) console.error(error);
  else console.log("Marked 3 orders as processing");
}
run();
