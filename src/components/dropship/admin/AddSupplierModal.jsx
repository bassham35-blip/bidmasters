import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AddSupplierModal({ onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", website: "", description: "", country: "", processing_days: "", commission_rate: "", logo_url: "" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    await base44.entities.DropshipSupplier.create({
      ...form,
      processing_days: form.processing_days ? Number(form.processing_days) : undefined,
      commission_rate: form.commission_rate ? Number(form.commission_rate) : undefined,
      status: "active",
    });
    setLoading(false);
    toast({ title: "Supplier added!" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" /> Add Supplier
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Email *</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Country</Label>
              <Input value={form.country} onChange={e => set("country", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Website</Label>
              <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://" className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Processing Days</Label>
              <Input type="number" value={form.processing_days} onChange={e => set("processing_days", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Commission %</Label>
              <Input type="number" value={form.commission_rate} onChange={e => set("commission_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Logo URL</Label>
            <Input value={form.logo_url} onChange={e => set("logo_url", e.target.value)} placeholder="https://..." className="bg-slate-800 border-slate-700 text-white h-9 mt-1" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 resize-none h-16" />
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
            {loading ? "Saving..." : "Add Supplier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}