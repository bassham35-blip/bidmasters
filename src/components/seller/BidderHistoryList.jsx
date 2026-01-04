import React from 'react';
import { format } from "date-fns";
import { User, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BidderHistoryList({ bids, currentWinner }) {
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-400 mb-3">Bidder History</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedBids.map((bid, index) => {
          const isWinner = bid.bidder_email === currentWinner;
          
          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isWinner
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                  : 'bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isWinner ? 'bg-amber-500/30' : 'bg-slate-700'
                }`}>
                  {isWinner ? (
                    <Crown className="w-4 h-4 text-amber-400" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className={`font-medium text-sm ${isWinner ? 'text-amber-300' : 'text-white'}`}>
                    {bid.bidder_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(bid.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isWinner ? 'text-amber-400' : 'text-white'}`}>
                  ${bid.amount.toLocaleString()}
                </p>
                {index === 0 && isWinner && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border text-xs mt-1">
                    Winning
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}