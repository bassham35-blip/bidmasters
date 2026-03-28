import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Package, Truck, CheckCircle, Clock, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import WonItemCard from "../components/profile/WonItemCard";

const STAT_CARDS = [
  { key: 'total', label: 'Total Won', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'pending', label: 'Awaiting Shipment', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { key: 'shipped', label: 'In Transit', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
];

export default function MyPurchases() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myBids = [] } = useQuery({
    queryKey: ['myBids', user?.email],
    queryFn: () => base44.entities.Bid.filter({ bidder_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: allAuctions = [] } = useQuery({
    queryKey: ['allAuctions'],
    queryFn: () => base44.entities.Auction.list('-created_date', 1000),
    enabled: !!user?.email,
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['myShipments', user?.email],
    queryFn: () => base44.entities.Shipment.filter({ buyer_email: user.email }),
    enabled: !!user?.email,
  });

  const wonItems = myBids
    .map(bid => {
      const auction = allAuctions.find(a => a.id === bid.auction_id);
      return { bid, auction };
    })
    .filter(item => {
      if (!item.auction) return false;
      const isEnded = item.auction.status === 'ended' || new Date(item.auction.end_time) <= new Date();
      return isEnded && item.auction.current_bidder === user?.email;
    });

  const shipmentMap = Object.fromEntries(shipments.map(s => [s.auction_id, s]));

  const stats = {
    total: wonItems.length,
    pending: wonItems.filter(i => !shipmentMap[i.auction?.id]).length,
    shipped: wonItems.filter(i => {
      const s = shipmentMap[i.auction?.id];
      return s && ['shipped', 'in_transit', 'out_for_delivery', 'label_created'].includes(s.status);
    }).length,
    delivered: wonItems.filter(i => shipmentMap[i.auction?.id]?.status === 'delivered').length,
  };

  const filteredItems = wonItems.filter(item => {
    if (filter === 'all') return true;
    const s = shipmentMap[item.auction?.id];
    if (filter === 'pending') return !s;
    if (filter === 'shipped') return s && ['shipped', 'in_transit', 'out_for_delivery', 'label_created'].includes(s.status);
    if (filter === 'delivered') return s?.status === 'delivered';
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">My Purchases</h1>
          </div>
          <p className="text-slate-400 ml-11">Track all your won auction items and shipments</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                onClick={() => setFilter(stat.key)}
                className={`cursor-pointer border transition-all ${
                  filter === stat.key
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats[stat.key]}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'pending', label: 'Awaiting Shipment' },
            { key: 'shipped', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Items list */}
        {filteredItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No items found</p>
            <p className="text-slate-500 text-sm mt-1">
              {filter === 'all' ? "You haven't won any auctions yet." : "No items in this category."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <WonItemCard key={item.bid.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}