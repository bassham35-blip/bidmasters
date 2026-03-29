import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Percent, Save, Info } from "lucide-react";
import { toast } from "sonner";

export default function TaxRateSetting({ user, onUpdate }) {
  const [taxRate, setTaxRate] = useState(user?.tax_rate ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Please enter a valid tax rate between 0 and 100.");
      return;
    }
    setSaving(true);
    await base44.auth.updateMe({ tax_rate: rate });
    setSaving(false);
    toast.success("Tax rate saved!");
    onUpdate?.({ ...user, tax_rate: rate });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Percent className="w-4 h-4 text-amber-400" />
          Tax Rate Setting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-blue-300 text-xs">
            This tax rate will be added to your auction checkout totals. Set to 0 for no tax.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[200px]">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white pr-8 focus:border-amber-500"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
        {parseFloat(taxRate) > 0 && (
          <p className="text-slate-400 text-xs">
            Example: A $100 item will have <span className="text-amber-400 font-semibold">${(100 * parseFloat(taxRate) / 100).toFixed(2)}</span> in tax added at checkout.
          </p>
        )}
      </CardContent>
    </Card>
  );
}