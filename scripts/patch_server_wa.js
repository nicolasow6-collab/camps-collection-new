const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

const oldPutStatus = `app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'awaiting_payment', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { error } = await supabase.from('orders').update({ status }).eq('id', req.params.id);`;

const newPutStatus = `app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  const { status, tracking_number } = req.body;
  const validStatuses = ['pending', 'processing', 'awaiting_payment', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  let updatePayload = { status };

  if (tracking_number && tracking_number.trim() !== '') {
    // Fetch the current order to get existing notes
    const { data: order } = await supabase.from('orders').select('notes').eq('id', req.params.id).single();
    let currentNotes = order && order.notes ? order.notes : '';
    let newNotes = currentNotes + (currentNotes ? '\\n' : '') + '[Resi: ' + tracking_number.trim() + ']';
    updatePayload.notes = newNotes;
  }

  const { error } = await supabase.from('orders').update(updatePayload).eq('id', req.params.id);`;

if (content.includes(oldPutStatus)) {
  content = content.replace(oldPutStatus, newPutStatus);
  fs.writeFileSync('server.js', content);
  console.log('Patched server.js');
} else {
  console.log('Could not find old put status block');
}
