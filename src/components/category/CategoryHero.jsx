import React from 'react';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Gavel, TrendingUp, DollarSign, Users } from "lucide-react";

export default function CategoryHero({ config, auctions }) {
  const Icon = config.icon;

  const activeAuctions = auctions.filter(a => a.status === 'active' && new Date(a.end_time) > new Date());
  const totalBids = auctions.reduce((sum, a) => sum + (a.bid_count || 0), 0);
  const avgBid = activeAuctions.length
    ? Math.round(activeAuctions.reduce((s, a) => s + (a.current_bid || a.starting_price), 0) / activeAuctions.length)
    : 0;
  const highestBid = activeAuctions.length
    ? Math.max(...activeAuctions.map(a => a.current_bid || a.starting_price))
    : 0;

  const stats = [
    { label: "Active Listings", value: activeAuctions.length, icon: TrendingUp },
    { label: "Total Bids", value: totalBids.toLocaleString(), icon: Gavel },
    { label: "Avg. Bid", value: `$${avgBid.toLocaleString()}`, icon: Users },
    { label: "Highest Bid", value: `$${highestBid.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${config.image})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${config.heroBg} opacity-95`} />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 shadow-2xl`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <span className="text-5xl mb-4">{config.emoji}</span>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
            {config.label}
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">{config.description}</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map(({ label, value, icon: SIcon }) => (
            <div key={label} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center">
              <SIcon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}