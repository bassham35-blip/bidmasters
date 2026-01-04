import React from 'react';
import { format } from "date-fns";
import { User, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function BidHistory({ bids }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No bids yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map((bid, index) => (
        <motion.div
          key={bid.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center justify-between p-3 rounded-lg ${
            index === 0 
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
              : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index === 0 ? 'bg-amber-500/30' : 'bg-slate-700'
            }`}>
              <User className={`w-4 h-4 ${index === 0 ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className={`font-medium ${index === 0 ? 'text-amber-300' : 'text-white'}`}>
                {bid.bidder_name || "Anonymous"}
                {index === 0 && <span className="ml-2 text-xs text-amber-400">Highest</span>}
              </p>
              <p className="text-xs text-slate-500">
                {format(new Date(bid.created_date), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
          <p className={`font-bold ${index === 0 ? 'text-amber-400' : 'text-white'}`}>
            ${bid.amount.toLocaleString()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}