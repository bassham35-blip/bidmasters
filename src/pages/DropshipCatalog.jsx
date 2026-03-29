import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck } from "lucide-react";
import DropshipProductCard from "@/components/dropship/DropshipProductCard";
import PlaceDropshipOrderModal from "@/components/dropship/PlaceDropshipOrderModal";

const CATEGORIES = ["all", "electronics", "fashion", "art", "collectibles", "home", "vehicles", "jewelry", "sports", "other"];

export default function DropshipCatalog() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["dropship-products"],
    queryFn: () => base44.entities.DropshipProduct.filter({ status: "active" }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["dropship-suppliers"],
    queryFn: () => base44.entities.DropshipSupplier.filter({ status: "active" }),
  });

  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat && p.stock_status !== "out_of_stock";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-500/20 rounded-xl">
              <Truck className="w-6 h-6 text-violet-400" />
            </div>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Dropship Catalog</Badge>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Source Products to Sell</h1>
          <p className="text-slate-400 text-lg">Browse our supplier catalog — list products in your auctions with no inventory required.</p>
          <div className="flex gap-4 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-violet-400" /> {products.length} products</span>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-violet-400" /> {suppliers.length} suppliers</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48 bg-slate-800/60 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="text-white capitalize">{c === "all" ? "All Categories" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(product => (
              <DropshipProductCard
                key={product.id}
                product={product}
                supplier={supplierMap[product.supplier_id]}
                onOrder={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <PlaceDropshipOrderModal
          product={selectedProduct}
          supplier={supplierMap[selectedProduct.supplier_id]}
          user={user}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}