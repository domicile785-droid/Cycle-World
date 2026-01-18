import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

/**
 * SERVER-ONLY Supabase client
 * ⚠️ NEVER import this file in frontend
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

/**
 * POST /api/admin/order/action
 * body: { orderId: string, action: 'approve' | 'reject' }
 */
router.post('/action', async (req, res) => {
  const { orderId, action } = req.body as {
    orderId?: string;
    action?: 'approve' | 'reject';
  };

  if (!orderId || !action) {
    return res.status(400).json({ error: 'orderId and action are required' });
  }

  try {
    // 1) Basic guard: fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent double action
    if (order.status !== 'pending') {
      return res.status(409).json({ error: 'Order already processed' });
    }

    if (action === 'approve') {
      // 2) Fetch order items (for stock reduction)
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (itemsErr) throw itemsErr;

      // 3) Update order + payment status
      const { error: updOrderErr } = await supabaseAdmin
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', orderId);

      if (updOrderErr) throw updOrderErr;

      const { error: updPayErr } = await supabaseAdmin
        .from('payments')
        .update({ status: 'verified' })
        .eq('order_id', orderId);

      if (updPayErr) throw updPayErr;

      // 4) Reduce stock safely
      for (const item of items || []) {
        const { data: product, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (!prodErr && product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabaseAdmin
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }

      return res.json({ success: true, action: 'approved' });
    }

    // action === 'reject'
    if (action === 'reject') {
      const { error: rejOrderErr } = await supabaseAdmin
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (rejOrderErr) throw rejOrderErr;

      const { error: rejPayErr } = await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('order_id', orderId);

      if (rejPayErr) throw rejPayErr;

      return res.json({ success: true, action: 'rejected' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Order action failed' });
  }
});

export default router;
