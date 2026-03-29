import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Clock, CheckCircle2, XCircle, ArrowLeft, TrendingUp, Wallet, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import RequestPayoutModal from '@/components/payouts/RequestPayoutModal';

const PLATFORM_FEE = 0.03;

const statusConfig = {
  pending:  { label: 'Pending',  color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  approved: { label: 'Approved', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  paid:     { label: 'Paid',     color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export default function SellerPayouts() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: paidAuctions = [], refetch: refetchAuctions } = useQuery({
    queryKey: ['seller-paid-auctions', user?.email],
    queryFn: () => base44.entities.Auction.filter({ created_by: user.email, status: 'paid' }),
    enabled: !!user,
  });

  const { data: payoutRequests = [], refetch: refetchPayouts } = useQuery({
    queryKey: ['seller-payout-requests', user?.email],
    queryFn: () => base44.entities.PayoutRequest.filter({ seller_email: user.email }),
    enabled: !!user,
  });

  const refetch = () => { refetchAuctions(); refetchPayouts(); };

  // Calculate total earned (after platform fee)
  const totalEarned = paidAuctions.reduce((sum, a) => sum + (a.current_bid || 0) * (1 - PLATFORM_FEE), 0);

  // IDs of auctions already included in a payout request
  const claimedAuctionIds = new Set(payoutRequests.flatMap(p => p.auction_ids || []));

  // Auctions not yet claimed
  const unclaimedAuctions = paidAuctions.filter(a => !claimedAuctionIds.has(a.id));
  const availableBalance = unclaimedAuctions.reduce((sum, a) => sum + (a.current_bid || 0) * (1 - PLATFORM_FEE), 0);

  const totalPaidOut = payoutRequests.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = payoutRequests.filter(p => p.status === 'pending' || p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link to="/SellerDashboard">
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Seller Payouts</h1>
              <p className="text-slate-400 text-sm">Track earnings and request payouts</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            disabled={availableBalance <= 0}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {([
            { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, icon: Wallet, color: 'text-amber-400' },
            { label: 'Pending Payout', value: `$${pendingPayout.toFixed(2)}`, icon: Clock, color: 'text-blue-400' },
            { label: 'Total Paid Out', value: `$${totalPaidOut.toFixed(2)}`, icon: CheckCircle2, color: 'text-slate-400' },
          ]).map(({ label, value, icon: StatIcon, color }) => (
            <Card key={label} className="bg-slate-900 border-slate-700">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <StatIcon className={`w-4 h-4 ${color}`} />
                  <span className="text-slate-400 text-xs">{label}</span>
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transaction History — Paid Auctions */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" /> Auction Earnings
              </CardTitle>
              <p className="text-slate-500 text-xs">After {(PLATFORM_FEE * 100)}% platform fee</p>
            </CardHeader>
            <CardContent>
              {paidAuctions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No paid auctions yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {paidAuctions.map(auction => {
                    const net = (auction.current_bid || 0) * (1 - PLATFORM_FEE);
                    const claimed = claimedAuctionIds.has(auction.id);
                    return (
                      <div key={auction.id} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-white text-sm font-medium truncate">{auction.title}</p>
                          <p className="text-slate-500 text-xs">
                            {auction.payment_date ? format(new Date(auction.payment_date), 'MMM d, yyyy') : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold text-sm">${net.toFixed(2)}</p>
                          {claimed ? (
                            <span className="text-xs text-slate-500">Claimed</span>
                          ) : (
                            <span className="text-xs text-amber-400">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Requests */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Payout Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No payout requests yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {[...payoutRequests].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(req => {
                    const cfg = statusConfig[req.status] || statusConfig.pending;
                    return (
                      <div key={req.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white font-semibold">${req.amount.toFixed(2)}</span>
                          <Badge className={`border text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-xs capitalize">{req.method.replace('_', ' ')}</span>
                          <span className="text-slate-500 text-xs">
                            {format(new Date(req.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {req.notes && (
                          <p className="text-slate-400 text-xs mt-1.5 italic">"{req.notes}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showModal && (
        <RequestPayoutModal
          open={showModal}
          onClose={() => setShowModal(false)}
          availableBalance={availableBalance}
          seller={user}
          eligibleAuctionIds={unclaimedAuctions.map(a => a.id)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}