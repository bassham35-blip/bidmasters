import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import SellerStats from "../components/seller/SellerStats";
import SellerAuctionCard from "../components/seller/SellerAuctionCard";

export default function SellerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myAuctions = [], refetch } = useQuery({
    queryKey: ['sellerAuctions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Auction.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: allBids = [] } = useQuery({
    queryKey: ['allBids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 1000),
  });

  const activeAuctions = myAuctions.filter(a => 
    a.status === 'active' && new Date(a.end_time) > new Date()
  );

  const endedAuctions = myAuctions.filter(a => 
    a.status === 'ended' || new Date(a.end_time) <= new Date()
  );

  const totalRevenue = endedAuctions.reduce((sum, a) => sum + (a.current_bid || a.starting_price), 0);

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
        <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Seller Dashboard</h1>
                <p className="text-slate-400">Manage your auctions and track performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SellerStats 
          activeCount={activeAuctions.length}
          endedCount={endedAuctions.length}
          totalRevenue={totalRevenue}
          totalBids={myAuctions.reduce((sum, a) => sum + (a.bid_count || 0), 0)}
        />

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              Active Auctions ({activeAuctions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="ended"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              Ended Auctions ({endedAuctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No active auctions</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeAuctions.map(auction => (
                  <SellerAuctionCard 
                    key={auction.id} 
                    auction={auction} 
                    bids={allBids.filter(b => b.auction_id === auction.id)}
                    onUpdate={refetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended">
            {endedAuctions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No ended auctions</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {endedAuctions.map(auction => (
                  <SellerAuctionCard 
                    key={auction.id} 
                    auction={auction} 
                    bids={allBids.filter(b => b.auction_id === auction.id)}
                    onUpdate={refetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}