import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function WatchlistButton({ auctionId, user, className = "" }) {
  const [isWatching, setIsWatching] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Watchlist.filter({ auction_id: auctionId, user_email: user.email }).then(items => {
      if (items.length > 0) {
        setIsWatching(true);
        setWatchlistId(items[0].id);
      }
    });
  }, [auctionId, user?.email]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to use watchlist");
      return;
    }

    setIsLoading(true);
    if (isWatching) {
      await base44.entities.Watchlist.delete(watchlistId);
      setIsWatching(false);
      setWatchlistId(null);
      toast.success("Removed from watchlist");
    } else {
      const newItem = await base44.entities.Watchlist.create({
        auction_id: auctionId,
        user_email: user.email,
      });
      setIsWatching(true);
      setWatchlistId(newItem.id);
      toast.success("Added to watchlist ❤️");
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-all duration-200 ${
        isWatching
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110'
          : 'bg-slate-900/60 text-slate-300 hover:bg-red-500/80 hover:text-white hover:scale-110'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Heart className={`w-3.5 h-3.5 ${isWatching ? 'fill-current' : ''}`} />
      )}
    </button>
  );
}