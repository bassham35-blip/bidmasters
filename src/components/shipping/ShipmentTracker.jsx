import React from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

const STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "label_created", label: "Label Created", icon: Package },
  { key: "shipped", label: "Shipped", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const stepIndex = (status) => STEPS.findIndex(s => s.key === status);

export default function ShipmentTracker({ shipment }) {
  const currentIndex = stepIndex(shipment.status);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-700" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
          style={{ width: currentIndex === 0 ? '0%' : `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx <= currentIndex;
          const active = idx === currentIndex;
          return (
            <div key={step.key} className="relative flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500'
                  : 'bg-slate-800 border-slate-600'
              } ${active ? 'ring-2 ring-amber-500/40 ring-offset-2 ring-offset-slate-900' : ''}`}>
                <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span className={`text-xs font-medium text-center hidden sm:block ${done ? 'text-amber-300' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Details */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        {shipment.carrier && shipment.tracking_number && (
          <div className="col-span-2 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Tracking Number</p>
            <p className="text-white font-mono font-semibold">{shipment.tracking_number}</p>
            <p className="text-slate-400 text-xs mt-1">via {shipment.carrier}</p>
          </div>
        )}
        {shipment.estimated_delivery && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Est. Delivery</p>
            <p className="text-white font-semibold">{format(new Date(shipment.estimated_delivery), "MMM d, yyyy")}</p>
          </div>
        )}
        {shipment.notes && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Note from Seller</p>
            <p className="text-white text-xs">{shipment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}