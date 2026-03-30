import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Gavel, 
  User, 
  ArrowLeft, 
  TrendingUp,
  DollarSign,
  Calendar,
  Tag,
  AlertCircle,
  CreditCard,
  Trophy,
  CheckCircle2,
  Radio
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BidHistory from "../components/auctions/BidHistory";
import LiveBroadcaster from "../components/auctions/LiveBroadcaster";
import LiveViewer from "../components/auctions/LiveViewer";
import AuctionChat from "../components/auctions/AuctionChat";
import SellerRating from "../components/reviews/SellerRating";

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

export default function AuctionDetail() {
  const [user, setUser] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [isEnded, setIsEnded] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Track view when auction loads
  useEffect(() => {
    if (!auction) return;
    base44.functions.invoke('trackAuctionView', {
      auction_id: auction.id,
      seller_email: auction.created_by,
      category: auction.category,
      clicked_bid: false,
    }).catch(() => {});
  }, [auction?.id]);

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => base44.entities.Auction.filter({ id: auctionId }).then(res => res[0]),
    enabled: !!auctionId
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids', auctionId],
    queryFn: () => base44.entities.Bid.filter({ auction_id: auctionId }, '-created_date'),
    enabled: !!auctionId,
    refetchInterval: 5000
  });

  const placeBidMutation = useMutation({
    mutationFn: async (amount) => {
      const bid = await base44.entities.Bid.create({
        auction_id: auctionId,
        amount: parseFloat(amount),
        bidder_name: user?.full_name || "Anonymous",
        bidder_email: user?.email
      });

      await base44.entities.Auction.update(auctionId, {
        current_bid: parseFloat(amount),
        current_bidder: user?.email,
        current_bidder_name: user?.full_name || "Anonymous",
        bid_count: (auction?.bid_count || 0) + 1
      });

      return bid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['bids', auctionId] });
      setBidAmount("");
      toast.success("Bid placed successfully!");
    },
    onError: (error) => {
      toast.error("Failed to place bid. Please try again.");
    }
  });

  useEffect(() => {
    if (!auction) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(auction.end_time);
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft("Auction Ended");
        // Refetch so UI reflects the ended status from the server
        queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const currentBid = auction?.current_bid || auction?.starting_price || 0;

    if (!amount || amount <= currentBid) {
      toast.error(`Bid must be higher than $${currentBid.toLocaleString()}`);
      return;
    }

    // Track bid click-through
    base44.functions.invoke('trackAuctionView', {
      auction_id: auctionId,
      seller_email: auction?.created_by,
      category: auction?.category,
      clicked_bid: true,
    }).catch(() => {});
    placeBidMutation.mutate(amount);
  };

  const minBidAmount = auction ? (auction.current_bid || auction.starting_price) + 1 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Auction Not Found</h2>
          <Link to={createPageUrl("Auctions")}>
            <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Auctions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link to={createPageUrl("Auctions")}>
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image / Stream */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Live stream — broadcaster or viewer */}
            {!isEnded && (
              <div className="mb-4">
                {user && auction.created_by === user.email ? (
                  <LiveBroadcaster auctionId={auctionId} />
                ) : (
                  <LiveViewer auctionId={auctionId} />
                )}
              </div>
            )}

            <Card className="bg-slate-900 border-slate-700 overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${categoryColors[auction.category] || categoryColors.other} border backdrop-blur-sm`}>
                    {auction.category?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Auction Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <User className="w-4 h-4" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">Seller: <span className="text-white">{auction.seller_name || "Anonymous"}</span></span>
                    <SellerRating sellerEmail={auction.created_by} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Listed: <span className="text-white">{format(new Date(auction.created_date), "MMM d, yyyy 'at' h:mm a")}</span></span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Ends: <span className="text-white">{format(new Date(auction.end_time), "MMM d, yyyy 'at' h:mm a")}</span></span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Bidding */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Title and Description */}
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-3xl font-bold text-white flex-1">{auction.title}</h1>
                {!isEnded && (
                  <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-1">
                    <Radio className="w-3 h-3" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-slate-400 leading-relaxed">{auction.description || "No description provided."}</p>
            </Card>

            {/* Bidding Section */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/30 p-6">
              <div className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${
                isEnded ? 'bg-red-500/20' : 'bg-amber-500/20'
              }`}>
                <Clock className={`w-5 h-5 ${isEnded ? 'text-red-400' : 'text-amber-400'}`} />
                <span className={`font-semibold ${isEnded ? 'text-red-400' : 'text-amber-400'}`}>
                  {timeLeft}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-2">Current Bid</p>
                <p className="text-4xl font-bold text-white mb-1">
                  ${(auction.current_bid || auction.starting_price).toLocaleString()}
                </p>
                <p className="text-slate-500 text-sm">
                  Starting bid: ${auction.starting_price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-6 text-slate-400">
                <Gavel className="w-4 h-4" />
                <span className="text-sm">{auction.bid_count || 0} bid{auction.bid_count !== 1 ? 's' : ''}</span>
              </div>

              {!isEnded && (
                <>
                  <Separator className="bg-slate-700 mb-6" />
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Your Bid Amount</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            type="number"
                            min={minBidAmount}
                            step="1"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={minBidAmount.toString()}
                            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                          />
                        </div>
                        <Button
                          onClick={handlePlaceBid}
                          disabled={placeBidMutation.isPending}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8"
                        >
                          {placeBidMutation.isPending ? "Placing..." : "Place Bid"}
                        </Button>
                      </div>
                      <p className="text-slate-500 text-xs mt-2">
                        Minimum bid: ${minBidAmount.toLocaleString()}
                      </p>
                    </div>

                    {auction.current_bidder && (
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <p className="text-slate-400 text-sm mb-1">Current Highest Bidder</p>
                        <p className="text-white font-semibold">{auction.current_bidder_name || "Anonymous"}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isEnded && (
                <>
                  {/* Winner — unpaid */}
                  {user && auction.current_bidder === user.email && auction.status !== 'paid' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl p-5 text-center space-y-3"
                    >
                      <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-amber-300 font-bold text-lg">🎉 You Won This Auction!</p>
                      <p className="text-slate-400 text-sm">Complete your purchase to claim your item.</p>
                      <Link to={`/Checkout?auction_id=${auction.id}`}>
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11 font-semibold text-base gap-2">
                          <CreditCard className="w-5 h-5" />
                          Pay ${(auction.current_bid || auction.starting_price).toLocaleString()} Now
                        </Button>
                      </Link>
                    </motion.div>
                  )}

                  {/* Winner — already paid */}
                  {user && auction.current_bidder === user.email && auction.status === 'paid' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto" />
                      <p className="text-green-300 font-semibold">Payment Complete</p>
                      <p className="text-slate-400 text-sm">Check your profile for shipping updates.</p>
                    </div>
                  )}

                  {/* Non-winner ended state */}
                  {(!user || auction.current_bidder !== user.email) && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                      <p className="text-red-400 font-semibold">This auction has ended</p>
                      {auction.current_bidder_name && (
                        <p className="text-slate-400 text-sm mt-2">
                          Winner: <span className="text-white">{auction.current_bidder_name}</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Bid History */}
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">Bid History</h2>
              </div>
              <BidHistory bids={bids} />
            </Card>

            {/* Q&A Chat */}
            <AuctionChat
              auctionId={auctionId}
              sellerEmail={auction.created_by}
              user={user}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}