import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data: auction } = payload;

    if (auction?.status !== 'ended') {
      return Response.json({ skipped: 'auction not ended' });
    }
    if (!auction?.current_bidder) {
      return Response.json({ skipped: 'no winner' });
    }

    const winnerEmail = auction.current_bidder;
    const winnerName = auction.current_bidder_name || 'Winner';
    const finalBid = auction.current_bid;
    const auctionTitle = auction.title;
    const auctionId = auction.id;

    // Notify the winner
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: winnerEmail,
      subject: `🏆 You won "${auctionTitle}"!`,
      body: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f59e0b; font-size: 32px; margin: 0;">🏆 Congratulations!</h1>
          </div>
          <p style="font-size: 16px;">Hi ${winnerName},</p>
          <p style="font-size: 16px;">You won the auction for <strong style="color: #f59e0b;">${auctionTitle}</strong>!</p>
          <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Your Winning Bid</p>
            <p style="margin: 8px 0 0; color: #22c55e; font-size: 32px; font-weight: bold;">$${finalBid?.toFixed(2)}</p>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">The seller will be in touch with shipping details soon. You can track your item in your purchases.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${Deno.env.get('APP_URL') || 'https://your-app.base44.app'}/MyPurchases"
               style="display: inline-block; background: #22c55e; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
              View My Purchases →
            </a>
          </div>
          <p style="font-size: 12px; color: #475569; margin-top: 24px; text-align: center;">BidLive Auction Platform</p>
        </div>
      `,
    });

    // Also notify the seller
    const sellerId = auction.created_by;
    if (sellerId) {
      const sellerName = auction.seller_name || 'Seller';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sellerId,
        subject: `🎉 Your auction "${auctionTitle}" has ended`,
        body: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">🎉 Auction Ended</h1>
            </div>
            <p style="font-size: 16px;">Hi ${sellerName},</p>
            <p style="font-size: 16px;">Your auction <strong style="color: #f59e0b;">${auctionTitle}</strong> has ended successfully!</p>
            <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">Final Sale Price</p>
              <p style="margin: 8px 0 0; color: #22c55e; font-size: 32px; font-weight: bold;">$${finalBid?.toFixed(2)}</p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Won by: ${winnerName}</p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">Please arrange shipping for the buyer as soon as possible.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${Deno.env.get('APP_URL') || 'https://your-app.base44.app'}/SellerDashboard"
                 style="display: inline-block; background: #f59e0b; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                Go to Seller Dashboard →
              </a>
            </div>
            <p style="font-size: 12px; color: #475569; margin-top: 24px; text-align: center;">BidLive Auction Platform</p>
          </div>
        `,
      });
    }

    return Response.json({ success: true, notified: winnerEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});