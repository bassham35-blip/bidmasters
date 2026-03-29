import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Globe, Mail, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const statusColors = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function SupplierTable({ suppliers, onRefresh }) {
  const { toast } = useToast();

  const handleStatusChange = async (supplier, status) => {
    await base44.entities.DropshipSupplier.update(supplier.id, { status });
    onRefresh();
    toast({ title: "Status updated" });
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;
    await base44.entities.DropshipSupplier.delete(supplier.id);
    onRefresh();
    toast({ title: "Supplier removed" });
  };

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No suppliers yet. Add your first supplier to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suppliers.map(s => (
        <div key={s.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-violet-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-white">{s.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                {s.country && <span>{s.country}</span>}
                {s.processing_days && <span>{s.processing_days} day processing</span>}
                {s.commission_rate && <span>{s.commission_rate}% commission</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={statusColors[s.status]}>{s.status}</Badge>
            <Select value={s.status} onValueChange={val => handleStatusChange(s, val)}>
              <SelectTrigger className="w-28 h-8 bg-slate-700 border-slate-600 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="active" className="text-white text-xs">Active</SelectItem>
                <SelectItem value="inactive" className="text-white text-xs">Inactive</SelectItem>
                <SelectItem value="pending" className="text-white text-xs">Pending</SelectItem>
              </SelectContent>
            </Select>
            {s.website && (
              <a href={s.website} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white w-8 h-8">
                  <Globe className="w-4 h-4" />
                </Button>
              </a>
            )}
            <Button size="icon" variant="ghost" onClick={() => handleDelete(s)}
              className="text-slate-500 hover:text-red-400 w-8 h-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}