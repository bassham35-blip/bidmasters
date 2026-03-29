import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Gavel, Clock, PackageCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function SellerStats({ activeCount, endedCount, totalRevenue, pendingRevenue, soldCount, pendingCount, totalBids }) {
  const stats = [
    {
      label: "Active Auctions",
      value: activeCount,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Pending Payment",
      value: pendingCount ?? 0,
      sub: pendingRevenue > 0 ? `$${pendingRevenue.toLocaleString()} potential` : null,
      icon: Clock,
      color: "from-amber-500 to-yellow-500"
    },
    {
      label: "Total Revenue",
      value: `$${(totalRevenue ?? 0).toLocaleString()}`,
      sub: soldCount ? `${soldCount} item${soldCount !== 1 ? 's' : ''} sold` : null,
      icon: PackageCheck,
      color: "from-green-500 to-emerald-500"
    },
    {
      label: "Total Bids",
      value: totalBids,
      icon: Gavel,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
                {stat.sub && <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}