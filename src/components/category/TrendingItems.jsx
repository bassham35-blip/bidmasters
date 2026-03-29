import React from 'react';
import { motion } from "framer-motion";
import { Flame, Clock, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrendingItems({ auctions, gradient }) {
  // Top 3 by bid count among active auctions
  const trending = [...auctions]
    .filter(a => a.status === 'active' && new Date(a.end_time) > new Date())
    .sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0))
    .slice(0, 3);

  if (trending.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Trending Now</h2>
        <span className="text-slate-500 text-sm">— most active listings</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trending.map((auction, i) => {
          const endTime = new Date(auction.end_time);
          const now = new Date();
          const diff = endTime - now;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const timeLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          return (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`}>
                <div className="group relative rounded-xl overflow-hidden border border-slate-700/50 hover:border-orange-500/40 transition-all duration-300 bg-slate-900">
                  {/* Rank badge */}
                  <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-sm shadow-lg`}>
                    {i + 1}
                  </div>

                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-semibold truncate mb-2">{auction.title}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Current Bid</p>
                        <p className="text-lg font-bold text-white">${(auction.current_bid || auction.starting_price).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 border text-xs flex items-center gap-1">
                          <Gavel className="w-3 h-3" />
                          {auction.bid_count || 0} bids
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeLeft} left
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}