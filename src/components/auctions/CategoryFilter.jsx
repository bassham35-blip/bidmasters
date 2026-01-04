import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Shirt, 
  Palette, 
  Star, 
  Home, 
  Car, 
  Gem, 
  Trophy,
  MoreHorizontal,
  LayoutGrid
} from "lucide-react";

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
          <Button
            key={cat.value}
            variant="ghost"
            onClick={() => onSelect(cat.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
}