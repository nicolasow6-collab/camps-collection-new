require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}
const PORT = process.env.PORT || 3000;


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rate limiting store (in-memory, reset on restart)
const loginAttempts = new Map();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recent = attempts.filter(t => now - t < LOGIN_WINDOW_MS);
  loginAttempts.set(ip, recent);
  if (recent.length >= LOGIN_MAX_ATTEMPTS) {
    return false;
  }
  recent.push(now);
  return true;
}

// Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Dynamically resolve supabase hostname for CSP
  try {
    const sbHost = new URL(SUPABASE_URL).hostname;
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self' ${SUPABASE_URL} wss://${sbHost}; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ${SUPABASE_URL} wss://${sbHost};`
    );
  } catch (e) {
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https:; img-src 'self' data: blob: https:; connect-src 'self' https:;");
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public', { maxAge: 0, etag: false }));
app.use('/uploads', express.static('public/uploads'));

// Multer config for image uploads
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpe?g|png|gif|webp)$/;
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});


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




// ========== CONFIG ROUTE ==========
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

// ========== AUTH MIDDLEWARE ==========
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Assuming any authenticated Supabase Auth user is an admin for this app
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ========== AUTH ROUTES ==========
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: 'admin' });
});

// ========== CATEGORY ROUTES ==========
app.get('/api/categories', async (req, res) => {
  const { all } = req.query;
  try {
    if (all === 'true') {
      const { data } = await supabase.from('categories').select('*').order('name');
      return res.json(data);
    } else {
      const { data: cards } = await supabase.from('cards').select('category').eq('status', 'active');
      const uniqueCats = [...new Set(cards.map(c => c.category))].sort();
      const catObjs = uniqueCats.map((name, i) => ({ id: i, name }));
      return res.json(catObjs);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/admin/categories', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  const { data, error } = await supabase.from('categories').insert({ name }).select().single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Category already exists' });
    return res.status(500).json({ error: 'Failed to create category' });
  }
  res.json(data);
});

app.put('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from('categories').update({ name }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Failed to update category' });
  res.json(data);
});

app.delete('/api/admin/categories/:id', authenticateToken, async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete category' });
  res.json({ message: 'Category deleted' });
});

// ========== ORDER ROUTES ==========
app.post('/api/orders', async (req, res) => {
  const { customer, items, payment_method, notes, unique_code } = req.body;

  if (!customer || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer info and items required' });
  }

  const nameRegex = /^[a-zA-Z0-9\s.'\-]{2,50}$/;
  if (!customer.name || !nameRegex.test(customer.name)) return res.status(400).json({ error: 'Invalid customer name' });
  if (!customer.email || !customer.email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  let total = items.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, '')) || 0), 0);
  if (unique_code) total += parseInt(unique_code) || 0;

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const randomSuffix = String(Math.floor(Math.random() * 900) + 100);
  const orderId = `purchase#${dd}${mm}${yy}${randomSuffix}`;

  const { error } = await supabase.from('orders').insert({
    order_id: orderId,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_ig: customer.instagram || '',
    address: customer.address,
    city: customer.city,
    province: customer.province,
    postal_code: customer.postal_code,
    items: JSON.stringify(items),
    total,
    payment_method,
    notes: notes || ''
  });

  if (error) {
    console.error('Order create error:', error);
    return res.status(500).json({ error: 'Failed to place order' });
  }
  res.json({ order_id: orderId, message: 'Order placed successfully' });
});

app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch orders' });
  data.forEach(o => { try { o.items = JSON.parse(o.items); } catch(e) { o.items = []; }});
  res.json(data);
});

app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  const { status, tracking_number } = req.body;
  const validStatuses = ['pending', 'processing', 'awaiting_payment', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  let updatePayload = { status };

  if (tracking_number && tracking_number.trim() !== '') {
    // Fetch the current order to get existing notes
    const { data: order } = await supabase.from('orders').select('notes').eq('id', req.params.id).single();
    let currentNotes = order && order.notes ? order.notes : '';
    let newNotes = currentNotes + (currentNotes ? '\n' : '') + '[Resi: ' + tracking_number.trim() + ']';
    updatePayload.notes = newNotes;
  }

  const { error } = await supabase.from('orders').update(updatePayload).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to update order status' });

  if (status === 'completed') {
    const { data: order } = await supabase.from('orders').select('items').eq('id', req.params.id).single();
    if (order) {
      try {
        const items = JSON.parse(order.items);
        let soldCount = 0;
        for (const item of items) {
          if (item.id) {
            const { data: updatedCard } = await supabase.from('cards')
              .update({ status: 'sold', updated_at: new Date().toISOString() })
              .eq('id', item.id)
              .neq('status', 'sold')
              .select();
            if (updatedCard && updatedCard.length > 0) soldCount++;
          }
        }
        return res.json({ message: soldCount > 0 ? `Order status updated — ${soldCount} card(s) marked as sold` : 'Order status updated' });
      } catch (err) {
        console.error('Failed to auto-mark cards as sold:', err.message);
      }
    }
  } else if (status === 'cancelled') {
    const { data: order } = await supabase.from('orders').select('items').eq('id', req.params.id).single();
    if (order) {
      try {
        const items = JSON.parse(order.items);
        let activeCount = 0;
        for (const item of items) {
          if (item.id) {
            const { data: updatedCard } = await supabase.from('cards')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', item.id)
              .select();
            if (updatedCard && updatedCard.length > 0) activeCount++;
          }
        }
        return res.json({ message: activeCount > 0 ? `Order cancelled — ${activeCount} card(s) returned to vault` : 'Order status updated' });
      } catch (err) {
        console.error('Failed to auto-revert cards to active:', err.message);
      }
    }
  }
  res.json({ message: 'Order status updated' });
});

app.get('/api/recent-buyers', async (req, res) => {
  const { data: orders, error } = await supabase.from('orders').select('order_id, customer_name, items, status, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(12);
  if (error) return res.status(500).json({ error: 'Failed to load recent buyers' });

  const buyers = orders.map(o => {
    let items = [];
    try { items = JSON.parse(o.items); } catch(e) {}
    const name = o.customer_name;
    const blurred = name.length > 2 ? name.charAt(0) + '***' + name.charAt(name.length - 1) : name.charAt(0) + '***';
    return {
      order_id: o.order_id.replace(/(\d{6})\d{3}/, '$1###'),
      customer_name: blurred,
      item_names: items.map(i => i.name),
      date: new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  });
  res.json(buyers);
});

app.get('/api/active-orders', async (req, res) => {
  const { data: orders, error } = await supabase.from('orders')
    .select('order_id, customer_name, items, total, status, payment_method, created_at')
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) return res.status(500).json({ error: 'Failed to load active orders' });

  const activeOrders = orders.map(o => {
    let items = [];
    try { items = JSON.parse(o.items); } catch(e) {}
    const name = o.customer_name;
    const blurred = name.length > 2 ? name.charAt(0) + '***' + name.charAt(name.length - 1) : name.charAt(0) + '***';
    const statusLabels = { 'pending': 'Awaiting Payment', 'processing': 'Processing', 'shipped': 'Shipped', 'awaiting_payment': 'Awaiting Payment' };
    const statusColors = { 'pending': 'orange', 'processing': 'blue', 'shipped': 'purple', 'awaiting_payment': 'orange' };
    return {
      order_id: o.order_id.replace(/(\d{6})\d{3}/, '$1###'),
      customer_name: blurred,
      item_names: items.map(i => i.name),
      total: o.total,
      status: o.status,
      status_label: statusLabels[o.status] || o.status,
      status_color: statusColors[o.status] || 'gray',
      date: new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  });
  res.json(activeOrders);
});

app.delete('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  const { data: order } = await supabase.from('orders').select('items').eq('id', req.params.id).single();
  if (order) {
    try {
      const items = JSON.parse(order.items);
      for (const item of items) {
        if (item.id) {
          await supabase.from('cards').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', item.id);
        }
      }
    } catch (err) {
      console.error('Failed to revert cards on deletion:', err.message);
    }
  }

  const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete order' });
  res.json({ message: 'Order deleted and items reverted' });
});

app.delete('/api/admin/orders', authenticateToken, async (req, res) => {
  const { data: orders } = await supabase.from('orders').select('items');
  if (orders) {
    try {
      for (const order of orders) {
        const items = JSON.parse(order.items);
        for (const item of items) {
          if (item.id) {
            await supabase.from('cards').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', item.id);
          }
        }
      }
    } catch (err) {}
  }

  const { error } = await supabase.from('orders').delete().neq('id', 0); // delete all
  if (error) return res.status(500).json({ error: 'Failed to clear orders' });
  res.json({ message: 'All orders cleared and items reverted' });
});

// ========== CARD ROUTES ==========
app.get('/api/cards', async (req, res) => {
  const { category, status } = req.query;
  let query = supabase.from('cards').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load cards' });
  res.json(data);
});

app.get('/api/cards/:id', async (req, res) => {
  const { data, error } = await supabase.from('cards').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Card not found' });
  res.json(data);
});

app.post('/api/admin/cards', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, category, price, set_name, origin, status } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'Name, category, and price required' });

  let image_url = '';
  if (req.file) {
    try {
      image_url = await uploadToSupabase(req.file);
    } catch (err) {
      return res.status(500).json({ error: 'Image upload failed' });
    }
  }
  
  const { data, error } = await supabase.from('cards').insert({
    name, category, price, set_name: set_name || '', image_url, origin: origin || 'JP', status: status || 'active'
  }).select().single();

  if (error) return res.status(500).json({ error: 'Failed to insert card' });
  res.status(201).json(data);
});

app.put('/api/admin/cards/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, category, price, set_name, origin, status } = req.body;
  const { data: existing, error: fetchErr } = await supabase.from('cards').select('*').eq('id', req.params.id).single();
  if (fetchErr || !existing) return res.status(404).json({ error: 'Card not found' });

  let image_url = existing.image_url;
  if (req.file) {
    try {
      image_url = await uploadToSupabase(req.file);
      // We could optionally delete the old image from Supabase here
    } catch (err) {
      return res.status(500).json({ error: 'Image upload failed' });
    }
  }

  const { data, error } = await supabase.from('cards').update({
    name: name || existing.name,
    category: category || existing.category,
    price: price || existing.price,
    set_name: set_name !== undefined ? set_name : existing.set_name,
    image_url,
    origin: origin || existing.origin,
    status: status || existing.status,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: 'Failed to update card' });
  res.json(data);
});

app.delete('/api/admin/cards/:id', authenticateToken, async (req, res) => {
  const { data: card, error: fetchErr } = await supabase.from('cards').select('*').eq('id', req.params.id).single();
  if (fetchErr || !card) return res.status(404).json({ error: 'Card not found' });

  if (card.image_url) {
    const imgPath = path.join(__dirname, 'public', card.image_url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  const { error } = await supabase.from('cards').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete card' });
  res.json({ message: 'Card deleted' });
});

// ========== STATS ROUTE ==========
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  const { count: total, error: errTotal } = await supabase.from('cards').select('*', { count: 'exact', head: true });
  const { count: active, error: errActive } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: sold, error: errSold } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'sold');
  
  if (errTotal || errActive || errSold) {
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
  res.json({ total, active, sold });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Campt's Collection server running on http://localhost:${PORT}`);
  console.log(`📦 Admin panel: http://localhost:${PORT}/admin.html`);
});

module.exports = app;
