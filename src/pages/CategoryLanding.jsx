import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CATEGORY_CONFIG } from "@/lib/categoryConfig";
import CategoryHero from "@/components/category/CategoryHero";
import TrendingItems from "@/components/category/TrendingItems";
import AuctionCard from "@/components/auctions/AuctionCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowUpDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CategoryLanding() {
  const { category } = useParams();
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("ending_soon");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const config = CATEGORY_CONFIG[category];

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions-category', category],
    queryFn: () => base44.entities.Auction.filter({ category }),
    enabled: !!category,
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <p className="text-2xl font-bold mb-4">Category not found</p>
        <Link to="/Auctions">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Auctions
          </Button>
        </Link>
      </div>
    );
  }

  const activeAuctions = auctions.filter(a => a.status === 'active' && new Date(a.end_time) > new Date());

  const sortedAuctions = [...activeAuctions].sort((a, b) => {
    const aPrice = a.current_bid || a.starting_price;
    const bPrice = b.current_bid || b.starting_price;
    const aIsBoosted = a.is_boosted && a.boost_expires_at && new Date(a.boost_expires_at) > new Date();
    const bIsBoosted = b.is_boosted && b.boost_expires_at && new Date(b.boost_expires_at) > new Date();

    if (sortBy === "ending_soon" || sortBy === "newly_listed") {
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
    }

    switch (sortBy) {
      case "ending_soon": return new Date(a.end_time) - new Date(b.end_time);
      case "newly_listed": return new Date(b.created_date) - new Date(a.created_date);
      case "price_low_high": return aPrice - bPrice;
      case "price_high_low": return bPrice - aPrice;
      case "most_bids": return (b.bid_count || 0) - (a.bid_count || 0);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link to="/Auctions">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Auctions
          </Button>
        </Link>
      </div>

      {/* Hero */}
      <CategoryHero config={config} auctions={auctions} />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Trending */}
        <TrendingItems auctions={auctions} gradient={config.gradient} />

        {/* All listings header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">All {config.label} Listings</h2>
            <p className="text-slate-500 text-sm mt-1">{sortedAuctions.length} active auction{sortedAuctions.length !== 1 ? 's' : ''}</p>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-52 bg-slate-800/60 border-slate-700 text-white h-10">
              <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="ending_soon" className="text-white hover:bg-slate-700">Ending Soon</SelectItem>
              <SelectItem value="newly_listed" className="text-white hover:bg-slate-700">Newly Listed</SelectItem>
              <SelectItem value="price_low_high" className="text-white hover:bg-slate-700">Price: Low → High</SelectItem>
              <SelectItem value="price_high_low" className="text-white hover:bg-slate-700">Price: High → Low</SelectItem>
              <SelectItem value="most_bids" className="text-white hover:bg-slate-700">Most Bids</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-slate-800/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sortedAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">No Active Listings</h3>
            <p className="text-slate-500">Check back soon for new {config.label.toLowerCase()} auctions</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAuctions.map((auction, index) => (
              <AuctionCard key={auction.id} auction={auction} index={index} currentUserEmail={user?.email} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}