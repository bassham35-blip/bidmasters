import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This runs on a schedule every 5 minutes and emails active bidders on auctions ending in < 1 hour
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Get all active auctions
    const auctions = await base44.asServiceRole.entities.Auction.filter({ status: 'active' });

    // Filter auctions ending within the next hour (and not already ended)
    const endingSoon = auctions.filter(a => {
      const endTime = new Date(a.end_time);
      return endTime > now && endTime <= oneHourFromNow;
    });

    let notified = 0;

    for (const auction of endingSoon) {
      if (!auction.current_bidder) continue;

      const endTime = new Date(auction.end_time);
      const minutesLeft = Math.round((endTime - now) / 60000);

      // Only send once per "window": 60min, 30min, 15min, 5min
      const windows = [60, 30, 15, 5];
      const inWindow = windows.some(w => minutesLeft <= w && minutesLeft > w - 5);
      if (!inWindow) continue;

      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: auction.current_bidder,
        type: 'ending_soon',
        title: 'Auction ending soon!',
        message: `"${auction.title}" ends in ${minutesLeft} minutes. Current bid: $${auction.current_bid?.toFixed(2)}`,
        auction_id: auction.id,
        is_read: false,
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: auction.current_bidder,
        subject: `⏰ "${auction.title}" ends in ${minutesLeft} minutes!`,
        body: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">⏰ Ending Soon!</h1>
            </div>
            <p style="font-size: 16px;">You're currently winning <strong style="color: #f59e0b;">${auction.title}</strong>.</p>
            <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #ef4444; font-size: 24px; font-weight: bold;">⏱ ${minutesLeft} minutes left!</p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Current bid: <strong style="color: #f59e0b;">$${auction.current_bid?.toFixed(2)}</strong></p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">Make sure no one snatches it at the last second!</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${Deno.env.get('APP_URL') || 'https://your-app.base44.app'}/AuctionDetail?id=${auction.id}"
                 style="display: inline-block; background: #ef4444; color: #fff; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                View Auction →
              </a>
            </div>
            <p style="font-size: 12px; color: #475569; margin-top: 24px; text-align: center;">BidLive Auction Platform</p>
          </div>
        `,
      });

      notified++;
    }

    return Response.json({ success: true, notified, checked: endingSoon.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});