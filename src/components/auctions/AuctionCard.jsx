import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Gavel, User, Zap, Star, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import FollowSellerButton from "./FollowSellerButton";

const categoryColors = {
  electronics: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  fashion: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  art: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  collectibles: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  home: "bg-green-500/20 text-green-300 border-green-500/30",
  vehicles: "bg-red-500/20 text-red-300 border-red-500/30",
  jewelry: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  sports: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30"
};

const boostStyles = {
  premium: { icon: Crown, label: "Premium", className: "bg-purple-600/90 text-white" },
  featured: { icon: Star, label: "Featured", className: "bg-amber-500/90 text-white" },
  basic: { icon: Zap, label: "Boosted", className: "bg-blue-500/90 text-white" }
};

export default function AuctionCard({ auction, index = 0, currentUserEmail }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isEnded, setIsEnded] = useState(false);

  const isBoosted = auction.is_boosted && auction.boost_expires_at && new Date(auction.boost_expires_at) > new Date();
  const boostStyle = isBoosted ? boostStyles[auction.boost_tier] || boostStyles.basic : null;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(auction.end_time);
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft("Ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [auction.end_time]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`}>
        <Card className={`group bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden transition-all duration-500 hover:shadow-2xl ${
          isBoosted && auction.boost_tier === 'premium'
            ? 'border-2 border-purple-500/60 hover:border-purple-400 hover:shadow-purple-500/20'
            : isBoosted && auction.boost_tier === 'featured'
            ? 'border-2 border-amber-500/60 hover:border-amber-400 hover:shadow-amber-500/20'
            : 'border-slate-700/50 hover:border-amber-500/50 hover:shadow-amber-500/10'
        }`}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <Badge className={`${categoryColors[auction.category] || categoryColors.other} border backdrop-blur-sm`}>
                {auction.category?.replace(/_/g, ' ')}
              </Badge>
              {boostStyle && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${boostStyle.className}`}>
                  <boostStyle.icon className="w-3 h-3" />
                  {boostStyle.label}
                </span>
              )}
            </div>

            <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md ${
              isEnded ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{timeLeft}</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-semibold text-lg truncate mb-1">{auction.title}</h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm min-w-0">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{auction.seller_name || "Anonymous"}</span>
                </div>
                {currentUserEmail && (
                  <FollowSellerButton
                    sellerEmail={auction.created_by}
                    sellerName={auction.seller_name}
                    currentUserEmail={currentUserEmail}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Current Bid</p>
                <p className="text-2xl font-bold text-white">
                  ${(auction.current_bid || auction.starting_price).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Gavel className="w-4 h-4" />
                  <span className="text-sm">{auction.bid_count || 0}</span>
                </div>
                <Button 
                  size="sm" 
                  className={`${isEnded 
                    ? 'bg-slate-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                  } text-white border-0`}
                  disabled={isEnded}
                >
                  {isEnded ? 'Ended' : 'Bid Now'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}