import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, ArrowRight, Gavel, TrendingUp, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Shown inside SellerDashboard when the user is not yet a seller.
 */
export default function SellerGate() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-slate-900 border-slate-700 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardContent className="p-10 text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Store className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-3">Seller Area</h2>
              <p className="text-slate-400 leading-relaxed">
                You haven't registered as a seller yet. It only takes a minute to set up your store and start listing items.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Store, label: "Free setup" },
                { icon: Gavel, label: "Live auctions" },
                { icon: TrendingUp, label: "Real-time bids" }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <Icon className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <p className="text-slate-300 text-xs font-medium">{label}</p>
                </div>
              ))}
            </div>

            <Link to="/SellerOnboarding">
              <Button className="w-full py-6 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25">
                Become a Seller
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <p className="text-slate-600 text-xs">
              Already listed items? Make sure you're signed in with the correct account.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}