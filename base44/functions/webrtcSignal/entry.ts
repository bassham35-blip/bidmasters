import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// In-memory store for WebRTC signaling (offers, answers, ICE candidates)
// Keyed by auctionId
const signals = {};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, auction_id, data } = body;

  if (!auction_id) return Response.json({ error: 'auction_id required' }, { status: 400 });

  if (!signals[auction_id]) {
    signals[auction_id] = { offer: null, answer: null, iceCandidates: [], viewerCandidates: [] };
  }

  const room = signals[auction_id];

  if (action === 'set_offer') {
    room.offer = data;
    room.answer = null;
    room.iceCandidates = [];
    room.viewerCandidates = [];
    return Response.json({ ok: true });
  }

  if (action === 'get_offer') {
    return Response.json({ offer: room.offer });
  }

  if (action === 'set_answer') {
    room.answer = data;
    return Response.json({ ok: true });
  }

  if (action === 'get_answer') {
    return Response.json({ answer: room.answer });
  }

  if (action === 'add_broadcaster_ice') {
    room.iceCandidates.push(data);
    return Response.json({ ok: true });
  }

  if (action === 'get_broadcaster_ice') {
    return Response.json({ candidates: room.iceCandidates });
  }

  if (action === 'add_viewer_ice') {
    room.viewerCandidates.push(data);
    return Response.json({ ok: true });
  }

  if (action === 'get_viewer_ice') {
    return Response.json({ candidates: room.viewerCandidates });
  }

  if (action === 'clear') {
    delete signals[auction_id];
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});