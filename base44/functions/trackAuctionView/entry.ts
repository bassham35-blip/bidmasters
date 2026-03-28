import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { auction_id, seller_email, category, clicked_bid } = await req.json();

    if (!auction_id || !seller_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let viewer_email = null;
    try {
      const user = await base44.auth.me();
      viewer_email = user?.email || null;
    } catch (_) {
      // anonymous viewer
    }

    await base44.asServiceRole.entities.AuctionView.create({
      auction_id,
      seller_email,
      category: category || 'other',
      viewer_email,
      clicked_bid: clicked_bid || false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});