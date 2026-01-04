import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Gavel } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function MyAuctionsList({ auctions }) {
  if (!auctions || auctions.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-8 text-center">
        <Gavel className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">You haven't created any auctions yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {auctions.map((auction, index) => {
        const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date();
        const isEnded = auction.status === 'ended' || new Date(auction.end_time) <= new Date();

        return (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`}>
              <Card className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 overflow-hidden group">
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
                      <Badge className={`flex-shrink-0 ${
                        isActive 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                          : isEnded
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      } border`}>
                        {isActive ? 'Active' : isEnded ? 'Ended' : auction.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Current: <span className="text-white font-semibold">${(auction.current_bid || auction.starting_price).toLocaleString()}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Gavel className="w-4 h-4" />
                        <span>{auction.bid_count || 0} bids</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      {isEnded 
                        ? `Ended ${format(new Date(auction.end_time), "MMM d, yyyy")}`
                        : `Ends ${format(new Date(auction.end_time), "MMM d, yyyy")}`
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