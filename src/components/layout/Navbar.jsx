import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Gavel, Store, User, Menu, X, LayoutGrid, ShoppingBag } from "lucide-react";

const navLinks = [
  { path: "/Auctions", label: "Auctions", icon: LayoutGrid },
  { path: "/MyPurchases", label: "My Purchases", icon: ShoppingBag },
  { path: "/SellerDashboard", label: "Sell", icon: Store },
  { path: "/Profile", label: "Profile", icon: User }
];

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/Auctions" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">BidLive</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path || location.pathname === path.replace('/', '');
              return (
                <Link key={path} to={path}>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                </Link>
              );
            })}
            {!user?.is_seller && (
              <Link to="/SellerOnboarding">
                <Button
                  size="sm"
                  className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  Become a Seller
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-800 py-3 space-y-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            ))}
            {!user?.is_seller && (
              <Link to="/SellerOnboarding" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors font-medium">
                  <Store className="w-4 h-4" />
                  Become a Seller
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}