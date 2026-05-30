require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  const bucketName = 'cards-images';
  const exists = buckets.find(b => b.name === bucketName);
  
  if (!exists) {
    console.log(`Creating bucket ${bucketName}...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, { public: true });
    if (error) {
      console.error('Failed to create bucket:', error);
    } else {
      console.log('Bucket created successfully!');
    }
  } else {
    console.log(`Bucket ${bucketName} already exists.`);
  }
}

setupBucket();
