import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import AuctionCard from "../components/auctions/AuctionCard";
import CreateAuctionModal from "../components/auctions/CreateAuctionModal";
import CategoryFilter from "../components/auctions/CategoryFilter";
import SearchAndFilter from "../components/auctions/SearchAndFilter";

export default function Auctions() {
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filters, setFilters] = useState({
    search: "",
    priceMin: 0,
    priceMax: 10000,
    timeFilter: "all",
    seller: ""
  });
  const [sortBy, setSortBy] = useState("ending_soon");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: auctions = [], isLoading, refetch } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => base44.entities.Auction.list(),
    initialData: []
  });

  // Apply filters and sorting
  const filteredAuctions = auctions
    .filter(auction => {
      // Category filter
      if (selectedCategory !== "all" && auction.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = auction.title?.toLowerCase().includes(searchLower);
        const matchesDesc = auction.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Price filter
      const currentPrice = auction.current_bid || auction.starting_price;
      if (currentPrice < filters.priceMin || currentPrice > filters.priceMax) {
        return false;
      }

      // Time filter
      if (filters.timeFilter !== "all") {
        const now = new Date();
        const endTime = new Date(auction.end_time);
        const hoursLeft = (endTime - now) / (1000 * 60 * 60);
        
        if (filters.timeFilter === "1h" && hoursLeft > 1) return false;
        if (filters.timeFilter === "6h" && hoursLeft > 6) return false;
        if (filters.timeFilter === "24h" && hoursLeft > 24) return false;
        if (filters.timeFilter === "3d" && hoursLeft > 72) return false;
      }

      // Seller filter
      if (filters.seller && !auction.seller_name?.toLowerCase().includes(filters.seller.toLowerCase())) {
        return false;
      }

      // Only show active auctions
      if (auction.status !== "active") return false;

      return true;
    })
    .sort((a, b) => {
      const aPrice = a.current_bid || a.starting_price;
      const bPrice = b.current_bid || b.starting_price;
      const aTime = new Date(a.end_time).getTime();
      const bTime = new Date(b.end_time).getTime();

      switch (sortBy) {
        case "ending_soon":
          return aTime - bTime;
        case "newly_listed":
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
        case "price_low_high":
          return aPrice - bPrice;
        case "price_high_low":
          return bPrice - aPrice;
        case "most_bids":
          return (b.bid_count || 0) - (a.bid_count || 0);
        case "least_bids":
          return (a.bid_count || 0) - (b.bid_count || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=1200')] opacity-5 bg-cover bg-center" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Live Auctions
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Discover unique items, place your bids, and win incredible deals
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <SearchAndFilter
              onFilterChange={setFilters}
              onSortChange={setSortBy}
            />
          </motion.div>

          {/* Create Auction Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end mb-6"
          >
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Auction
            </Button>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </motion.div>
        </div>
      </div>

      {/* Auctions Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-slate-800/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">No Auctions Found</h3>
            <p className="text-slate-500 mb-6">
              {selectedCategory !== "all" || filters.search || filters.seller
                ? "Try adjusting your filters"
                : "Be the first to create an auction!"}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Auction
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="mb-4 text-slate-400 text-sm">
              Showing {filteredAuctions.length} auction{filteredAuctions.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuctions.map((auction, index) => (
                <AuctionCard key={auction.id} auction={auction} index={index} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Auction Modal */}
      <CreateAuctionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        user={user}
        onSuccess={refetch}
      />
    </div>
  );
}