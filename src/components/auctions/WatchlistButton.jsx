import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function WatchlistButton({ auctionId, user }) {
  const [isWatching, setIsWatching] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user?.email) return;
      
      const items = await base44.entities.Watchlist.filter({
        auction_id: auctionId,
        user_email: user.email
      });
      
      if (items.length > 0) {
        setIsWatching(true);
        setWatchlistId(items[0].id);
      }
    };
    
    checkWatchlist();
  }, [auctionId, user]);

  const handleToggle = async () => {
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
        user_email: user.email
      });
      setIsWatching(true);
      setWatchlistId(newItem.id);
      toast.success("Added to watchlist");
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${
        isWatching 
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30' 
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
      } transition-all duration-300`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isWatching ? (
        <EyeOff className="w-4 h-4 mr-2" />
      ) : (
        <Eye className="w-4 h-4 mr-2" />
      )}
      {isWatching ? 'Watching' : 'Watch'}
    </Button>
  );
}