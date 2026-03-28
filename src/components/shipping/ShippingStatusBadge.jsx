import React from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, PackageCheck } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Awaiting Shipment", icon: Clock, color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  label_created: { label: "Label Created", icon: Package, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  shipped: { label: "Shipped", icon: Package, color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  in_transit: { label: "In Transit", icon: Truck, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  out_for_delivery: { label: "Out for Delivery", icon: MapPin, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-500/20 text-green-300 border-green-500/30" },
};

export default function ShippingStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };