import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuctionStats from "../components/profile/AuctionStats";
import MyAuctionsList from "../components/profile/MyAuctionsList";
import MyBidsList from "../components/profile/MyBidsList";
import WatchlistSection from "../components/profile/WatchlistSection";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myAuctions = [], refetch: refetchAuctions } = useQuery({
    queryKey: ['myAuctions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Auction.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: myBids = [], refetch: refetchBids } = useQuery({
    queryKey: ['myBids', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Bid.filter({ bidder_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: allAuctions = [] } = useQuery({
    queryKey: ['allAuctions'],
    queryFn: () => base44.entities.Auction.list('-created_date', 1000),
  });

  const { data: watchlist = [], refetch: refetchWatchlist } = useQuery({
    queryKey: ['watchlist', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Watchlist.filter({ user_email: user.email });
    },
    enabled: !!user?.email,
  });

  // Combine bids with auction data
  const bidsWithAuctions = myBids.map(bid => {
    const auction = allAuctions.find(a => a.id === bid.auction_id);
    return { bid, auction };
  }).filter(item => item.auction);

  // Combine watchlist with auction data
  const watchlistWithAuctions = watchlist.map(w => {
    const auction = allAuctions.find(a => a.id === w.auction_id);
    return { watchlist: w, auction };
  }).filter(item => item.auction);

  // Calculate items won
  const wonItems = bidsWithAuctions.filter(item => {
    const isEnded = item.auction.status === 'ended' || new Date(item.auction.end_time) <= new Date();
    const isWinner = item.auction.current_bidder === user?.email;
    return isEnded && isWinner;
  });

  // Get active bids
  const activeBids = bidsWithAuctions.filter(item => {
    return item.auction.status === 'active' && new Date(item.auction.end_time) > new Date();
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{user.full_name}</h1>
                  <p className="text-slate-400">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.role === 'admin' ? '👑 Admin' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <AuctionStats 
          myAuctions={myAuctions}
          myBids={activeBids}
          watchlistCount={watchlist.length}
        />

        {/* Tabs */}
        <Tabs defaultValue="auctions" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger 
              value="auctions" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              My Auctions
            </TabsTrigger>
            <TabsTrigger 
              value="bids"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              My Bids
            </TabsTrigger>
            <TabsTrigger 
              value="won"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              Items Won
            </TabsTrigger>
            <TabsTrigger 
              value="watchlist"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              Watchlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auctions">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Auctions I Created</CardTitle>
              </CardHeader>
              <CardContent>
                <MyAuctionsList auctions={myAuctions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bids">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">All My Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <MyBidsList bidsWithAuctions={bidsWithAuctions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="won">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Items I Won
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MyBidsList bidsWithAuctions={wonItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">My Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <WatchlistSection 
                  watchlistItems={watchlistWithAuctions}
                  onRemove={() => {
                    refetchWatchlist();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}