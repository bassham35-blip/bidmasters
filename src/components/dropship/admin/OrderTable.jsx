import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  refunded: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function OrderTable({ orders, products, suppliers, onRefresh }) {
  const { toast } = useToast();
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const handleStatusChange = async (order, status) => {
    await base44.entities.DropshipOrder.update(order.id, { status });
    onRefresh();
    toast({ title: "Order status updated" });
  };

  const handleTrackingUpdate = async (order, tracking_number) => {
    await base44.entities.DropshipOrder.update(order.id, { tracking_number, status: "shipped" });
    onRefresh();
    toast({ title: "Tracking number saved" });
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-white">{order.product_title}</p>
                <Badge className={statusColors[order.status]}>{order.status}</Badge>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>Buyer: <span className="text-slate-400">{order.buyer_name || order.buyer_email}</span></p>
                <p>Supplier: <span className="text-slate-400">{supplierMap[order.supplier_id]?.name || "—"}</span></p>
                <p>Qty: <span className="text-slate-400">{order.quantity}</span> · Unit: <span className="text-slate-400">${order.unit_price?.toFixed(2)}</span> · Profit: <span className="text-green-400">${order.profit_margin?.toFixed(2)}</span></p>
                {order.shipping_address && <p>Ship to: <span className="text-slate-400">{order.shipping_address}</span></p>}
                {order.created_date && <p>Placed: <span className="text-slate-400">{format(new Date(order.created_date), "MMM d, yyyy")}</span></p>}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
              <Select value={order.status} onValueChange={val => handleStatusChange(order, val)}>
                <SelectTrigger className="w-full sm:w-36 h-8 bg-slate-700 border-slate-600 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {["pending","confirmed","shipped","delivered","cancelled","refunded"].map(s => (
                    <SelectItem key={s} value={s} className="text-white text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <TrackingInput order={order} onSave={handleTrackingUpdate} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingInput({ order, onSave }) {
  const [value, setValue] = React.useState(order.tracking_number || "");
  return (
    <div className="flex gap-1">
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Tracking #"
        className="h-8 bg-slate-700 border-slate-600 text-white text-xs placeholder:text-slate-500 flex-1"
      />
      <button
        onClick={() => onSave(order, value)}
        className="px-2 h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-md transition-colors whitespace-nowrap"
      >
        Save
      </button>
    </div>
  );
}