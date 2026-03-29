import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronDown, ChevronUp, Package, CreditCard, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import ShipmentTracker from "../shipping/ShipmentTracker";
import ShippingStatusBadge from "../shipping/ShippingStatusBadge";
import { Button } from "@/components/ui/button";

export default function WonItemCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const auction = item.auction;

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipment', auction?.id],
    queryFn: () => base44.entities.Shipment.filter({ auction_id: auction.id }),
    enabled: !!auction?.id,
  });

  const shipment = shipments[0];

  if (!auction) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 overflow-hidden">
        <div className="flex gap-4 p-4">
          <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`} className="flex-shrink-0">
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              <img
                src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link to={createPageUrl("AuctionDetail") + `?id=${auction.id}`}>
                <h3 className="font-semibold text-white truncate hover:text-amber-300 transition-colors">{auction.title}</h3>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Won
                </Badge>
                {shipment ? (
                  <ShippingStatusBadge status={shipment.status} />
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-500/20 text-slate-400 border-slate-500/30">
                    <Package className="w-3 h-3" />
                    No Tracking
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-slate-400">
                Winning bid: <span className="text-white font-semibold">${(auction.current_bid || auction.starting_price).toLocaleString()}</span>
                <span className="ml-3 text-xs">· {format(new Date(auction.end_time), "MMM d, yyyy")}</span>
              </p>

              <div className="flex items-center gap-2">
                {/* Payment status / action */}
                {auction.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <Link to={`/Checkout?auction_id=${auction.id}`}>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs px-3 gap-1">
                      <CreditCard className="w-3 h-3" /> Pay Now
                    </Button>
                  </Link>
                )}

                {shipment && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expanded ? "Hide" : "Track"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && shipment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-green-500/20"
            >
              <div className="p-4 pt-5">
                <ShipmentTracker shipment={shipment} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}