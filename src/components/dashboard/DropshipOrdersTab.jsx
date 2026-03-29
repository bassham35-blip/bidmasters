import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: Clock,         class: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2,  class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  shipped:   { label: 'Shipped',   icon: Truck,         class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  delivered: { label: 'Delivered', icon: CheckCircle2,  class: 'bg-green-500/20 text-green-300 border-green-500/30' },
  cancelled: { label: 'Cancelled', icon: XCircle,       class: 'bg-red-500/20 text-red-300 border-red-500/30' },
  refunded:  { label: 'Refunded',  icon: XCircle,       class: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

const FILTERS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function DropshipOrdersTab({ orders }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (orders.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">You have no dropship orders yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 p-6 text-center">
          <p className="text-slate-400">No orders with status "{filter}"</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={order.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{order.product_title || 'Product'}</h3>
                      <Badge className={`${cfg.class} border flex items-center gap-1 flex-shrink-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span>Qty: <span className="text-white">{order.quantity || 1}</span></span>
                      <span>Total: <span className="text-amber-400 font-semibold">${(order.unit_price || 0).toLocaleString()}</span></span>
                      {order.tracking_number && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          <span className="text-white font-mono text-xs">{order.tracking_number}</span>
                        </span>
                      )}
                    </div>
                    {order.created_date && (
                      <p className="text-xs text-slate-500 mt-1">
                        Ordered {format(new Date(order.created_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}