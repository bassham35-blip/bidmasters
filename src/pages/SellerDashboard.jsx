import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, TrendingUp, CheckCircle, DollarSign, BarChart2, Clock, PackageCheck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import SellerStats from "../components/seller/SellerStats";
import SellerAuctionCard from "../components/seller/SellerAuctionCard";
import SellerGate from "../components/seller/SellerGate";
import SellerAnalytics from "../components/seller/SellerAnalytics";
import TaxRateSetting from "../components/seller/TaxRateSetting";

export default function SellerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myAuctions = [], refetch } = useQuery({
    queryKey: ['sellerAuctions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Auction.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: allBids = [] } = useQuery({
    queryKey: ['allBids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 1000),
  });

  const activeAuctions = myAuctions.filter(a =>
    a.status === 'active' && new Date(a.end_time) > new Date()
  );

  const pendingPaymentAuctions = myAuctions.filter(a =>
    a.status === 'pending_payment'
  );

  const soldAuctions = myAuctions.filter(a =>
    a.status === 'paid'
  );

  const endedAuctions = myAuctions.filter(a =>
    (a.status === 'ended' || (a.status !== 'active' && a.status !== 'cancelled' && a.status !== 'pending_payment' && a.status !== 'paid' && new Date(a.end_time) <= new Date()))
  );

  const totalRevenue = soldAuctions.reduce((sum, a) => sum + (a.current_bid || a.starting_price), 0);
  const pendingRevenue = pendingPaymentAuctions.reduce((sum, a) => sum + (a.current_bid || a.starting_price), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user.is_seller) {
    return <SellerGate />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Seller Dashboard</h1>
                <p className="text-slate-400">Manage your auctions and track performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 flex-wrap">
          <Link to="/SellerAnalyticsDashboard">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium">
              <BarChart2 className="w-4 h-4" /> Analytics Dashboard
            </button>
          </Link>
          <Link to="/SellerPayouts">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium">
              <Wallet className="w-4 h-4" /> Payout Dashboard
            </button>
          </Link>
        </div>

        <TaxRateSetting user={user} onUpdate={setUser} />

        <SellerStats 
          activeCount={activeAuctions.length}
          endedCount={endedAuctions.length}
          totalRevenue={totalRevenue}
          pendingRevenue={pendingRevenue}
          soldCount={soldAuctions.length}
          pendingCount={pendingPaymentAuctions.length}
          totalBids={myAuctions.reduce((sum, a) => sum + (a.bid_count || 0), 0)}
        />

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 flex flex-wrap gap-1 h-auto">
            {[
              { value: "active", label: `Active (${activeAuctions.length})`, icon: TrendingUp },
              { value: "pending", label: `Pending Payment (${pendingPaymentAuctions.length})`, icon: Clock },
              { value: "sold", label: `Sold (${soldAuctions.length})`, icon: PackageCheck },
              { value: "ended", label: `Ended (${endedAuctions.length})`, icon: CheckCircle },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white flex items-center gap-1.5"
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white flex items-center gap-1.5"
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Active */}
          <TabsContent value="active">
            {activeAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No active auctions</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeAuctions.map(auction => (
                  <SellerAuctionCard key={auction.id} auction={auction} bids={allBids.filter(b => b.auction_id === auction.id)} onUpdate={refetch} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Payment */}
          <TabsContent value="pending">
            {pendingPaymentAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No auctions awaiting payment</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-amber-400 font-medium">
                    {pendingPaymentAuctions.length} auction{pendingPaymentAuctions.length !== 1 ? 's' : ''} awaiting payment — potential revenue: <span className="text-amber-300 font-bold">${pendingRevenue.toLocaleString()}</span>
                  </p>
                </div>
                <div className="grid gap-4">
                  {pendingPaymentAuctions.map(auction => (
                    <SellerAuctionCard key={auction.id} auction={auction} bids={allBids.filter(b => b.auction_id === auction.id)} onUpdate={refetch} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sold */}
          <TabsContent value="sold">
            {soldAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <PackageCheck className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No sold auctions yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <PackageCheck className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-400 font-medium">
                    {soldAuctions.length} auction{soldAuctions.length !== 1 ? 's' : ''} sold — total revenue: <span className="text-green-300 font-bold">${totalRevenue.toLocaleString()}</span>
                  </p>
                </div>
                <div className="grid gap-4">
                  {soldAuctions.map(auction => (
                    <SellerAuctionCard key={auction.id} auction={auction} bids={allBids.filter(b => b.auction_id === auction.id)} onUpdate={refetch} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Ended */}
          <TabsContent value="ended">
            {endedAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No ended auctions</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {endedAuctions.map(auction => (
                  <SellerAuctionCard key={auction.id} auction={auction} bids={allBids.filter(b => b.auction_id === auction.id)} onUpdate={refetch} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <SellerAnalytics sellerEmail={user.email} auctions={myAuctions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}