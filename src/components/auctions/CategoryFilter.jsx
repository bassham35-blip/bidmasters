import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, Smartphone, Shirt, Palette, Star, Home, Car, Gem, Trophy, MoreHorizontal, LayoutGrid } from "lucide-react";

const categories = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "electronics", label: "Electronics", icon: Smartphone },
  { value: "fashion", label: "Fashion", icon: Shirt },
  { value: "art", label: "Art", icon: Palette },
  { value: "collectibles", label: "Collectibles", icon: Star },
  { value: "home", label: "Home", icon: Home },
  { value: "vehicles", label: "Vehicles", icon: Car },
  { value: "jewelry", label: "Jewelry", icon: Gem },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "other", label: "Other", icon: MoreHorizontal }
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(cat => {
        const Icon = cat.icon;
        const isActive = selected === cat.value;

        return (
          <div key={cat.value} className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => onSelect(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              } ${cat.value !== "all" ? "rounded-r-none pr-2" : ""}`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </Button>

            {cat.value !== "all" && (
              <Link
                to={`/category/${cat.value}`}
                title={`${cat.label} category page`}
                className={`flex items-center justify-center w-7 h-[38px] rounded-r-full transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white/80 hover:text-white'
                    : 'bg-slate-800/50 text-slate-600 hover:bg-slate-700 hover:text-amber-400'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}