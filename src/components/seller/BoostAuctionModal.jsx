import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Crown, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const BOOST_TIERS = [
  {
    id: "basic",
    name: "Basic Boost",
    icon: Zap,
    duration: 24,
    color: "from-blue-500 to-cyan-500",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    price: "$2.99",
    perks: ["Highlighted listing", "24 hours of promotion", "Priority in search results"]
  },
  {
    id: "featured",
    name: "Featured",
    icon: Star,
    duration: 72,
    color: "from-amber-500 to-orange-500",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    price: "$6.99",
    perks: ["Gold 'Featured' badge", "3 days of promotion", "Top of listings", "Bold title"],
    popular: true
  },
  {
    id: "premium",
    name: "Premium Spotlight",
    icon: Crown,
    duration: 168,
    color: "from-purple-500 to-pink-500",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    price: "$14.99",
    perks: ["Premium crown badge", "7 days of promotion", "Pinned to top", "Bold + animated border", "Email blast to watchers"]
  }
];

export default function BoostAuctionModal({ open, onOpenChange, auction, onSuccess }) {
  const [selected, setSelected] = useState("featured");
  const [loading, setLoading] = useState(false);

  const handleBoost = async () => {
    setLoading(true);
    const tier = BOOST_TIERS.find(t => t.id === selected);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + tier.duration);

    await base44.entities.Auction.update(auction.id, {
      is_boosted: true,
      boost_tier: selected,
      boost_expires_at: expiresAt.toISOString()
    });

    toast.success(`🚀 Auction boosted as "${tier.name}"!`);
    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  const selectedTier = BOOST_TIERS.find(t => t.id === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Boost Your Auction
          </DialogTitle>
          <p className="text-slate-400 text-sm">
            Promote <span className="text-white font-medium">"{auction?.title}"</span> to reach more bidders
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {BOOST_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selected === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelected(tier.id)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-white mb-1">{tier.name}</div>
                <div className="text-2xl font-bold text-white mb-3">{tier.price}</div>
                <ul className="space-y-1.5">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      {perk}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className={`flex-1 bg-gradient-to-r ${selectedTier?.color} hover:opacity-90 text-white font-semibold`}
            onClick={handleBoost}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Boost for {selectedTier?.price}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}