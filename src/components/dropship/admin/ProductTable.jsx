import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const stockColors = {
  in_stock: "bg-green-500/20 text-green-400 border-green-500/30",
  low_stock: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  out_of_stock: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ProductTable({ products, suppliers, onRefresh }) {
  const { toast } = useToast();
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const handleStockChange = async (product, stock_status) => {
    await base44.entities.DropshipProduct.update(product.id, { stock_status });
    onRefresh();
  };

  const handleStatusChange = async (product, status) => {
    await base44.entities.DropshipProduct.update(product.id, { status });
    onRefresh();
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.title}"?`)) return;
    await base44.entities.DropshipProduct.delete(product.id);
    onRefresh();
    toast({ title: "Product removed" });
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No products yet. Add products to the catalog.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-700/50 text-left">
            <th className="pb-3 font-medium pr-4">Product</th>
            <th className="pb-3 font-medium pr-4">Supplier</th>
            <th className="pb-3 font-medium pr-4">Cost</th>
            <th className="pb-3 font-medium pr-4">SRP</th>
            <th className="pb-3 font-medium pr-4">Stock</th>
            <th className="pb-3 font-medium pr-4">Status</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {products.map(p => (
            <tr key={p.id} className="text-slate-300">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium line-clamp-1 max-w-[180px]">{p.title}</p>
                    {p.sku && <p className="text-slate-500 text-xs">SKU: {p.sku}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-slate-400">{supplierMap[p.supplier_id]?.name || "—"}</td>
              <td className="py-3 pr-4">${p.supplier_price?.toFixed(2)}</td>
              <td className="py-3 pr-4">{p.suggested_retail_price ? `$${p.suggested_retail_price.toFixed(2)}` : "—"}</td>
              <td className="py-3 pr-4">
                <Select value={p.stock_status} onValueChange={val => handleStockChange(p, val)}>
                  <SelectTrigger className="w-32 h-7 bg-slate-700 border-slate-600 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="in_stock" className="text-white text-xs">In Stock</SelectItem>
                    <SelectItem value="low_stock" className="text-white text-xs">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock" className="text-white text-xs">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-3 pr-4">
                <Select value={p.status} onValueChange={val => handleStatusChange(p, val)}>
                  <SelectTrigger className="w-24 h-7 bg-slate-700 border-slate-600 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="active" className="text-white text-xs">Active</SelectItem>
                    <SelectItem value="inactive" className="text-white text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-3">
                <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}
                  className="text-slate-500 hover:text-red-400 w-7 h-7">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}