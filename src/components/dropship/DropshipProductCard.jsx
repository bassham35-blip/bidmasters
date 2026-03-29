import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Tag, TrendingUp, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const stockColors = {
  in_stock: "bg-green-500/20 text-green-400 border-green-500/30",
  low_stock: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  out_of_stock: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DropshipProductCard({ product, supplier, onOrder }) {
  const margin = product.suggested_retail_price
    ? ((product.suggested_retail_price - product.supplier_price) / product.suggested_retail_price * 100).toFixed(0)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-square bg-slate-900">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 text-xs ${stockColors[product.stock_status]}`}>
          {product.stock_status?.replace("_", " ")}
        </Badge>
        {product.category && (
          <Badge className="absolute top-2 left-2 bg-slate-900/80 text-slate-300 border-slate-600 capitalize text-xs">
            {product.category}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-white mb-1 line-clamp-2 text-sm">{product.title}</h3>

        {supplier && (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
            <Building2 className="w-3 h-3" /> {supplier.name}
          </div>
        )}

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Supplier cost
              </div>
              <div className="text-slate-300 font-medium">${product.supplier_price?.toFixed(2)}</div>
            </div>
            {product.suggested_retail_price && (
              <div className="text-right">
                <div className="text-xs text-slate-500">Suggested price</div>
                <div className="text-white font-semibold">${product.suggested_retail_price?.toFixed(2)}</div>
              </div>
            )}
          </div>

          {margin && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3" /> Up to {margin}% margin
            </div>
          )}

          <Button
            onClick={onOrder}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm h-8"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Place Order
          </Button>
        </div>
      </div>
    </motion.div>
  );
}