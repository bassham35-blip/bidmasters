import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = [
  { value: "pending", label: "Awaiting Shipment" },
  { value: "label_created", label: "Label Created" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

export default function AddShipmentModal({ open, onOpenChange, auction, sellerEmail, onSuccess }) {
  const [form, setForm] = useState({
    tracking_number: "",
    carrier: "UPS",
    status: "shipped",
    estimated_delivery: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Shipment.create({
      auction_id: auction.id,
      buyer_email: auction.current_bidder,
      seller_email: sellerEmail,
      ...form,
    });
    setSaving(false);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Shipping Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Carrier</Label>
            <Select value={form.carrier} onValueChange={v => setForm(f => ({ ...f, carrier: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {["UPS", "FedEx", "USPS", "DHL", "Other"].map(c => (
                  <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Tracking Number</Label>
            <Input
              value={form.tracking_number}
              onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="e.g. 1Z999AA10123456784"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Estimated Delivery</Label>
            <Input
              type="date"
              value={form.estimated_delivery}
              onChange={e => setForm(f => ({ ...f, estimated_delivery: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Note for Buyer (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white resize-none"
              rows={2}
              placeholder="Any extra info..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            >
              {saving ? "Saving..." : "Save Shipment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}