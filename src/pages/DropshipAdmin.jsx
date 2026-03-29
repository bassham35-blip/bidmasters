import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Truck, ShoppingCart, Building2 } from "lucide-react";
import SupplierTable from "@/components/dropship/admin/SupplierTable";
import ProductTable from "@/components/dropship/admin/ProductTable";
import OrderTable from "@/components/dropship/admin/OrderTable";
import AddSupplierModal from "@/components/dropship/admin/AddSupplierModal";
import AddProductModal from "@/components/dropship/admin/AddProductModal";

export default function DropshipAdmin() {
  const [tab, setTab] = useState("suppliers");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["dropship-suppliers-all"],
    queryFn: () => base44.entities.DropshipSupplier.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["dropship-products-all"],
    queryFn: () => base44.entities.DropshipProduct.list(),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["dropship-orders-all"],
    queryFn: () => base44.entities.DropshipOrder.list(),
  });

  const stats = [
    { label: "Suppliers", value: suppliers.length, icon: Building2, color: "text-violet-400" },
    { label: "Products", value: products.length, icon: Package, color: "text-blue-400" },
    { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-green-400" },
    { label: "Pending Orders", value: orders.filter(o => o.status === "pending").length, icon: Truck, color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Admin</Badge>
          </div>
          <h1 className="text-3xl font-bold text-white">Dropship Management</h1>
          <p className="text-slate-400 mt-1">Manage suppliers, products, and fulfillment orders.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-slate-400 text-sm">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <TabsList className="bg-slate-800/60 border border-slate-700">
              <TabsTrigger value="suppliers" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
                <Building2 className="w-4 h-4 mr-1.5" /> Suppliers
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
                <Package className="w-4 h-4 mr-1.5" /> Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
                <ShoppingCart className="w-4 h-4 mr-1.5" /> Orders
              </TabsTrigger>
            </TabsList>

            {tab === "suppliers" && (
              <Button onClick={() => setShowAddSupplier(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Supplier
              </Button>
            )}
            {tab === "products" && (
              <Button onClick={() => setShowAddProduct(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            )}
          </div>

          <TabsContent value="suppliers">
            <SupplierTable suppliers={suppliers} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["dropship-suppliers-all"] })} />
          </TabsContent>
          <TabsContent value="products">
            <ProductTable products={products} suppliers={suppliers} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["dropship-products-all"] })} />
          </TabsContent>
          <TabsContent value="orders">
            <OrderTable orders={orders} products={products} suppliers={suppliers} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["dropship-orders-all"] })} />
          </TabsContent>
        </Tabs>
      </div>

      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onSaved={() => { setShowAddSupplier(false); queryClient.invalidateQueries({ queryKey: ["dropship-suppliers-all"] }); }}
        />
      )}
      {showAddProduct && (
        <AddProductModal
          suppliers={suppliers}
          onClose={() => setShowAddProduct(false)}
          onSaved={() => { setShowAddProduct(false); queryClient.invalidateQueries({ queryKey: ["dropship-products-all"] }); }}
        />
      )}
    </div>
  );
}