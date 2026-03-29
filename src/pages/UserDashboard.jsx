import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gavel, Trophy, Eye, Package, TrendingUp, User,
  DollarSign, Clock, Truck, Star
} from "lucide-react";
import MyBidsList from "@/components/profile/MyBidsList";
import WonItemCard from "@/components/profile/WonItemCard";
import WatchlistSection from "@/components/profile/WatchlistSection";
import DropshipOrdersTab from "@/components/dashboard/DropshipOrdersTab";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myBids = [] } = useQuery({
    queryKey: ['dashBids', user?.email],
    queryFn: () => base44.entities.Bid.filter({ bidder_email: user.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  const { data: allAuctions = [] } = useQuery({
    queryKey: ['dashAuctions'],
    queryFn: () => base44.entities.Auction.list('-created_date', 1000),
    enabled: !!user?.email,
  });

  const { data: watchlistRaw = [] } = useQuery({
    queryKey: ['dashWatchlist', user?.email],
    queryFn: () => base44.entities.Watchlist.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: dropshipOrders = [] } = useQuery({
    queryKey: ['dashDropshipOrders', user?.email],
    queryFn: () => base44.entities.DropshipOrder.filter({ buyer_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const auctionMap = useMemo(() => Object.fromEntries(allAuctions.map(a => [a.id, a])), [allAuctions]);

  const bidsWithAuctions = useMemo(() =>
    myBids.map(bid => ({ bid, auction: auctionMap[bid.auction_id] })).filter(i => i.auction),
    [myBids, auctionMap]
  );

  const wonItems = useMemo(() =>
    bidsWithAuctions.filter(({ bid, auction }) => {
      const isEnded = auction.status !== 'active' || new Date(auction.end_time) <= new Date();
      return isEnded && auction.current_bidder === user?.email;
    }),
    [bidsWithAuctions, user]
  );

  const activeBids = useMemo(() =>
    bidsWithAuctions.filter(({ auction }) =>
      auction.status === 'active' && new Date(auction.end_time) > new Date()
    ),
    [bidsWithAuctions]
  );

  const watchlistItems = useMemo(() =>
    watchlistRaw.map(w => ({ watchlist: w, auction: auctionMap[w.auction_id] })).filter(i => i.auction),
    [watchlistRaw, auctionMap]
  );

  const activeDropshipOrders = useMemo(() =>
    dropshipOrders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status)),
    [dropshipOrders]
  );

  const stats = [
    { label: 'Active Bids', value: activeBids.length, icon: Gavel, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Auctions Won', value: wonItems.length, icon: Trophy, gradient: 'from-green-500 to-emerald-500' },
    { label: 'Watchlist', value: watchlistItems.length, icon: Eye, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Active Orders', value: activeDropshipOrders.length, icon: Package, gradient: 'from-violet-500 to-purple-500' },
  ];

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Dashboard</h1>
              <p className="text-slate-400 text-sm">{user.full_name || user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, gradient }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bids">
          <TabsList className="bg-slate-800/60 border border-slate-700/50 w-full sm:w-auto">
            <TabsTrigger value="bids" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white gap-1.5">
              <Gavel className="w-4 h-4" /> My Bids
              {activeBids.length > 0 && (
                <span className="ml-1 bg-amber-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{activeBids.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="won" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-1.5">
              <Trophy className="w-4 h-4" /> Won
              {wonItems.length > 0 && (
                <span className="ml-1 bg-green-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{wonItems.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-1.5">
              <Eye className="w-4 h-4" /> Watchlist
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-1.5">
              <Package className="w-4 h-4" /> Orders
              {activeDropshipOrders.length > 0 && (
                <span className="ml-1 bg-violet-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{activeDropshipOrders.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bids" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">All My Bids</h2>
              <Badge className="bg-slate-700 text-slate-300 border-slate-600">{bidsWithAuctions.length} total</Badge>
            </div>
            <MyBidsList bidsWithAuctions={bidsWithAuctions} />
          </TabsContent>

          <TabsContent value="won" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Auctions Won</h2>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">{wonItems.length}</Badge>
            </div>
            {wonItems.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50 p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">You haven't won any auctions yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {wonItems.map((item, index) => (
                  <WonItemCard key={item.bid.id} item={item} index={index} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Watchlist</h2>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border">{watchlistItems.length}</Badge>
            </div>
            <WatchlistSection
              watchlistItems={watchlistItems}
              onRemove={() => queryClient.invalidateQueries({ queryKey: ['dashWatchlist'] })}
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Dropship Orders</h2>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 border">{dropshipOrders.length} total</Badge>
            </div>
            <DropshipOrdersTab orders={dropshipOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}