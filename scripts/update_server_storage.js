const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Replace Multer diskStorage with memoryStorage
code = code.replace(
  /const storage = multer\.diskStorage\(\{[\s\S]*?\}\);/,
  `const storage = multer.memoryStorage();`
);

// 2. Add an uploadToSupabase helper function after multer config
const uploadHelper = `
async function uploadToSupabase(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueName = Date.now() + '-' + crypto.randomBytes(8).toString('hex') + ext;
  
  const { data, error } = await supabase.storage
    .from('cards-images')
    .upload(uniqueName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload image to storage');
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('cards-images')
    .getPublicUrl(uniqueName);
    
  return publicUrlData.publicUrl;
}
`;

if (!code.includes('async function uploadToSupabase')) {
  code = code.replace(/(const upload = multer\(\{[\s\S]*?\}\);)/, `$1\n\n${uploadHelper}`);
}

// 3. Update POST /api/admin/cards
const oldPost = `  const image_url = req.file ? \`/uploads/\${req.file.filename}\` : '';
  const { data, error } = await supabase.from('cards').insert({`;
  
const newPost = `  let image_url = '';
  if (req.file) {
    try {
      image_url = await uploadToSupabase(req.file);
    } catch (err) {
      return res.status(500).json({ error: 'Image upload failed' });
    }
  }
  
  const { data, error } = await supabase.from('cards').insert({`;
code = code.replace(oldPost, newPost);

// 4. Update PUT /api/admin/cards/:id
const oldPut = `  let image_url = existing.image_url;
  if (req.file) {
    if (existing.image_url) {
      const oldPath = path.join(__dirname, 'public', existing.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image_url = \`/uploads/\${req.file.filename}\`;
  }`;
  
const newPut = `  let image_url = existing.image_url;
  if (req.file) {
    try {
      image_url = await uploadToSupabase(req.file);
      // We could optionally delete the old image from Supabase here
    } catch (err) {
      return res.status(500).json({ error: 'Image upload failed' });
    }
  }`;
code = code.replace(oldPut, newPut);

// 5. Export app for Vercel at the end
if (!code.includes('module.exports = app;')) {
  code += `\nmodule.exports = app;\n`;
}

fs.writeFileSync('server.js', code);
console.log('server.js successfully updated for Supabase Storage and Vercel.');
