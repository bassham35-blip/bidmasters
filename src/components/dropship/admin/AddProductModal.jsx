import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["electronics", "fashion", "art", "collectibles", "home", "vehicles", "jewelry", "sports", "other"];

export default function AddProductModal({ suppliers, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    supplier_id: "", title: "", description: "", image_url: "", category: "other",
    supplier_price: "", suggested_retail_price: "", sku: "", weight_kg: "", stock_status: "in_stock",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.supplier_id || !form.title || !form.supplier_price) {
      toast({ title: "Supplier, title, and cost price are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    await base44.entities.DropshipProduct.create({
      ...form,
      supplier_price: Number(form.supplier_price),
      suggested_retail_price: form.suggested_retail_price ? Number(form.suggested_retail_price) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      status: "active",
    });
    setLoading(false);
    toast({ title: "Product added to catalog!" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-400" /> Add Product
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-400 text-xs">Supplier *</Label>
            <Select value={form.supplier_id} onValueChange={v => set("supplier_id", v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 mt-1">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {suppliers.filter(s => s.status === "active").map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Product Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">SKU</Label>
              <Input value={form.sku} onChange={e => set("sku", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Supplier Cost * ($)</Label>
              <Input type="number" value={form.supplier_price} onChange={e => set("supplier_price", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Suggested Retail ($)</Label>
              <Input type="number" value={form.suggested_retail_price} onChange={e => set("suggested_retail_price", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Image URL</Label>
            <Input value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="https://..." className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 resize-none h-16" />
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
            {loading ? "Saving..." : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}