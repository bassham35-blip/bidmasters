import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function MyBidsList({ bidsWithAuctions, showOnlyActive = false }) {
  if (!bidsWithAuctions || bidsWithAuctions.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">
          {showOnlyActive ? "You don't have any active bids" : "You haven't placed any bids yet"}
        </p>
      </Card>
    );
  }

  const filteredBids = showOnlyActive 
    ? bidsWithAuctions.filter(item => item.auction?.status === 'active' && new Date(item.auction?.end_time) > new Date())
    : bidsWithAuctions;

  if (filteredBids.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">
          {showOnlyActive ? "You don't have any active bids" : "You haven't placed any bids yet"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredBids.map((item, index) => {
        const auction = item.auction;
        if (!auction) return null;

        const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date();
        const isWinning = auction.current_bidder === item.bid.bidder_email;
        const hasWon = !isActive && isWinning;

        return (
          <motion.div
            key={item.bid.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`}>
              <Card className={`border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 overflow-hidden group ${
                hasWon 
                  ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30' 
                  : isWinning && isActive
                  ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30'
                  : 'bg-slate-800/50'
              }`}>
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-white truncate">{auction.title}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        {hasWon && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Won
                          </Badge>
                        )}
                        {isWinning && isActive && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border">
                            Winning
                          </Badge>
                        )}
                        {!isWinning && isActive && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 border">
                            Outbid
                          </Badge>
                        )}
                        {!isActive && !hasWon && (
                          <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 border">
                            Ended
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Your bid: <span className="text-white font-semibold">${item.bid.amount.toLocaleString()}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>Current: <span className="text-white font-semibold">${(auction.current_bid || auction.starting_price).toLocaleString()}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      {isActive 
                        ? `Ends ${format(new Date(auction.end_time), "MMM d, h:mm a")}`
                        : `Ended ${format(new Date(auction.end_time), "MMM d, yyyy")}`
                      }
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}