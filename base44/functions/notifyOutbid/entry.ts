import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data: auction, old_data } = payload;

    // Only notify if the bidder actually changed (someone new placed a bid)
    if (!old_data?.current_bidder || !auction?.current_bidder) {
      return Response.json({ skipped: true });
    }
    if (old_data.current_bidder === auction.current_bidder) {
      return Response.json({ skipped: 'same bidder' });
    }

    const outbidEmail = old_data.current_bidder;
    const outbidName = old_data.current_bidder_name || 'Bidder';
    const newBid = auction.current_bid;
    const auctionTitle = auction.title;
    const auctionId = auction.id;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: outbidEmail,
      type: 'outbid',
      title: "You've been outbid!",
      message: `Someone outbid you on "${auctionTitle}". Current bid: $${newBid?.toFixed(2)}`,
      auction_id: auctionId,
      is_read: false,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: outbidEmail,
      subject: `⚡ You've been outbid on "${auctionTitle}"`,
      body: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">⚡ Outbid Alert</h1>
          </div>
          <p style="font-size: 16px;">Hi ${outbidName},</p>
          <p style="font-size: 16px;">Someone just outbid you on <strong style="color: #f59e0b;">${auctionTitle}</strong>.</p>
          <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Current Highest Bid</p>
            <p style="margin: 8px 0 0; color: #f59e0b; font-size: 32px; font-weight: bold;">$${newBid?.toFixed(2)}</p>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Don't let it slip away — place a new bid now to stay in the lead!</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${Deno.env.get('APP_URL') || 'https://your-app.base44.app'}/AuctionDetail?id=${auctionId}"
               style="display: inline-block; background: #f59e0b; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
              Bid Again →
            </a>
          </div>
          <p style="font-size: 12px; color: #475569; margin-top: 24px; text-align: center;">BidLive Auction Platform</p>
        </div>
      `,
    });

    return Response.json({ success: true, notified: outbidEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});