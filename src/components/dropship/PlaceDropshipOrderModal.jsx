import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PlaceDropshipOrderModal({ product, supplier, user, onClose }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    buyer_name: user?.full_name || "",
    buyer_email: user?.email || "",
    shipping_address: "",
    quantity: 1,
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const unitPrice = product.suggested_retail_price || product.supplier_price;
  const total = unitPrice * form.quantity;
  const profit = (unitPrice - product.supplier_price) * form.quantity;

  const handleSubmit = async () => {
    if (!form.shipping_address) {
      toast({ title: "Please enter a shipping address", variant: "destructive" });
      return;
    }
    setLoading(true);
    await base44.entities.DropshipOrder.create({
      product_id: product.id,
      supplier_id: product.supplier_id,
      seller_email: user?.email || "",
      buyer_email: form.buyer_email,
      buyer_name: form.buyer_name,
      product_title: product.title,
      quantity: form.quantity,
      unit_price: unitPrice,
      supplier_cost: product.supplier_price,
      profit_margin: profit,
      shipping_address: form.shipping_address,
      notes: form.notes,
      status: "pending",
    });
    setLoading(false);
    toast({ title: "Order placed!", description: "The supplier will be notified." });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-violet-400" /> Place Dropship Order
          </DialogTitle>
        </DialogHeader>

        {/* Product summary */}
        <div className="bg-slate-800/60 rounded-lg p-3 flex gap-3 mb-2">
          {product.image_url && <img src={product.image_url} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm line-clamp-2">{product.title}</p>
            {supplier && <p className="text-slate-400 text-xs mt-0.5">by {supplier.name}</p>}
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                <Package className="w-3 h-3 mr-1" /> {product.stock_status?.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Buyer Name</Label>
              <Input value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Buyer Email</Label>
              <Input value={form.buyer_email} onChange={e => setForm({ ...form, buyer_email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Quantity</Label>
            <Input type="number" min="1" value={form.quantity}
              onChange={e => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="bg-slate-800 border-slate-700 text-white h-9 mt-1 w-24" />
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Shipping Address *</Label>
            <Textarea value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })}
              placeholder="Full shipping address..."
              className="bg-slate-800 border-slate-700 text-white mt-1 resize-none h-20" />
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Notes (optional)</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Special instructions..."
              className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-slate-800/60 rounded-lg p-3 space-y-1.5 text-sm mt-1">
          <div className="flex justify-between text-slate-400">
            <span>Unit price × {form.quantity}</span>
            <span>${(unitPrice * form.quantity).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Supplier cost</span>
            <span>-${(product.supplier_price * form.quantity).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-400 font-semibold border-t border-slate-700 pt-1.5">
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Your profit</span>
            <span>${profit.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
            {loading ? "Placing..." : "Confirm Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}