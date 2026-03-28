import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  DollarSign, 
  Gavel, 
  Edit, 
  Trash2, 
  RotateCcw,
  Users,
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import EditAuctionModal from "./EditAuctionModal";
import BidderHistoryList from "./BidderHistoryList";
import BoostAuctionModal from "./BoostAuctionModal";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SellerAuctionCard({ auction, bids, onUpdate }) {
  const [showBids, setShowBids] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const isBoosted = auction.is_boosted && auction.boost_expires_at && new Date(auction.boost_expires_at) > new Date();

  const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date();
  const hasBids = (auction.bid_count || 0) > 0;
  const canEdit = !hasBids && isActive;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this auction?')) return;
    
    await base44.entities.Auction.update(auction.id, { status: 'cancelled' });
    toast.success('Auction cancelled');
    onUpdate();
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this auction early?')) return;
    
    await base44.entities.Auction.update(auction.id, { 
      status: 'ended',
      end_time: new Date().toISOString()
    });
    toast.success('Auction ended');
    onUpdate();
  };

  const handleRelist = async () => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24);

    await base44.entities.Auction.create({
      title: auction.title,
      description: auction.description,
      image_url: auction.image_url,
      starting_price: auction.starting_price,
      current_bid: auction.starting_price,
      category: auction.category,
      end_time: endTime.toISOString(),
      status: 'active',
      seller_name: auction.seller_name,
      bid_count: 0
    });

    toast.success('Auction relisted successfully');
    onUpdate();
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        <div className="p-6">
          <div className="flex gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{auction.title}</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={`${
                    isActive 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : auction.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  } border`}>
                    {auction.status === 'cancelled' ? 'Cancelled' : isActive ? 'Active' : 'Ended'}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border">
                    {auction.category?.replace(/_/g, ' ')}
                  </Badge>
                  {isBoosted && (
                    <Badge className={`border ${
                      auction.boost_tier === 'premium' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      auction.boost_tier === 'featured' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {auction.boost_tier === 'premium' ? '👑 Premium' : auction.boost_tier === 'featured' ? '⭐ Featured' : '⚡ Boosted'}
                    </Badge>
                  )}
                </div>
              </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBoostModal(true)}
                      className={`${isBoosted ? 'bg-amber-900/20 border-amber-700/50 text-amber-300' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-amber-900/20 hover:border-amber-700/50 hover:text-amber-300'}`}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      {isBoosted ? 'Boosted' : 'Boost'}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {isActive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnd}
                        className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        End Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="bg-red-900/20 border-red-700/50 text-red-300 hover:bg-red-900/40"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {!isActive && auction.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRelist}
                      className="bg-amber-900/20 border-amber-700/50 text-amber-300 hover:bg-amber-900/40"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Relist
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Current Bid</p>
                    <p className="text-lg font-bold text-white">
                      ${(auction.current_bid || auction.starting_price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Total Bids</p>
                    <p className="text-lg font-bold text-white">{auction.bid_count || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">
                      {isActive ? 'Ends' : 'Ended'}
                    </p>
                    <p className="text-sm font-medium text-white">
                      {format(new Date(auction.end_time), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              {hasBids && (
                <Button
                  variant="ghost"
                  onClick={() => setShowBids(!showBids)}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    View Bidder History ({bids.length})
                  </span>
                  {showBids ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showBids && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-700"
              >
                <BidderHistoryList bids={bids} currentWinner={auction.current_bidder} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <EditAuctionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        auction={auction}
        onSuccess={onUpdate}
      />
      <BoostAuctionModal
        open={showBoostModal}
        onOpenChange={setShowBoostModal}
        auction={auction}
        onSuccess={onUpdate}
      />
    </>
  );
}