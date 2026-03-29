import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const now = new Date();

  // Activate scheduled auctions whose start_time has passed
  const scheduledAuctions = await base44.asServiceRole.entities.Auction.filter({ status: 'scheduled' });
  const toActivate = scheduledAuctions.filter(a => a.start_time && new Date(a.start_time) <= now);
  await Promise.all(
    toActivate.map(a => base44.asServiceRole.entities.Auction.update(a.id, { status: 'active' }))
  );

  // End active auctions whose end_time has passed
  const activeAuctions = await base44.asServiceRole.entities.Auction.filter({ status: 'active' });
  const expired = activeAuctions.filter(a => new Date(a.end_time) <= now);
  const results = await Promise.all(
    expired.map(a =>
      base44.asServiceRole.entities.Auction.update(a.id, {
        status: a.current_bidder ? 'pending_payment' : 'ended'
      })
    )
  );

  return Response.json({ activated: toActivate.length, ended: results.length });
});