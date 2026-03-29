import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const activeAuctions = await base44.asServiceRole.entities.Auction.filter({ status: 'active' });
  const now = new Date();

  const expired = activeAuctions.filter(a => new Date(a.end_time) <= now);

  const results = await Promise.all(
    expired.map(a =>
      base44.asServiceRole.entities.Auction.update(a.id, {
        status: a.current_bidder ? 'pending_payment' : 'ended'
      })
    )
  );

  return Response.json({ ended: results.length, ids: expired.map(a => a.id) });
});