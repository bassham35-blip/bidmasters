import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "art", label: "Art" },
  { value: "collectibles", label: "Collectibles" },
  { value: "home", label: "Home" },
  { value: "vehicles", label: "Vehicles" },
  { value: "jewelry", label: "Jewelry" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const PRICE_PRESETS = [
  { label: "Any Price", min: 0, max: 10000 },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 – $500", min: 100, max: 500 },
  { label: "$500 – $2,000", min: 500, max: 2000 },
  { label: "$2,000+", min: 2000, max: 10000 },
];

export default function SearchAndFilter({ onFilterChange, onSortChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [pricePreset, setPricePreset] = useState("Any Price");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const emit = (overrides = {}) => {
    onFilterChange({
      search: searchTerm,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      timeFilter,
      seller: "",
      category,
      ...overrides,
    });
  };

  const handleSearch = (val) => {
    setSearchTerm(val);
    emit({ search: val });
  };

  const handleCategory = (val) => {
    setCategory(val);
    emit({ category: val });
  };

  const handlePricePreset = (label) => {
    const preset = PRICE_PRESETS.find(p => p.label === label);
    if (!preset) return;
    setPricePreset(label);
    setPriceRange([preset.min, preset.max]);
    emit({ priceMin: preset.min, priceMax: preset.max });
  };

  const handleSlider = (val) => {
    setPriceRange(val);
    setPricePreset("Custom");
    emit({ priceMin: val[0], priceMax: val[1] });
  };

  const handleTimeFilter = (val) => {
    setTimeFilter(val);
    emit({ timeFilter: val });
  };

  const handleSort = (val) => {
    setSortBy(val);
    onSortChange(val);
  };

  const clearAll = () => {
    setSearchTerm("");
    setCategory("all");
    setPricePreset("Any Price");
    setPriceRange([0, 10000]);
    setTimeFilter("all");
    setSortBy("ending_soon");
    onSortChange("ending_soon");
    onFilterChange({ search: "", priceMin: 0, priceMax: 10000, timeFilter: "all", seller: "", category: "all" });
  };

  const hasActiveFilters = searchTerm || category !== "all" || pricePreset !== "Any Price" || timeFilter !== "all";

  return (
    <div className="space-y-3">
      {/* Primary search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by title, seller, or description…"
            className="pl-10 pr-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 h-11"
          />
          {searchTerm && (
            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category dropdown */}
        <Select value={category} onValueChange={handleCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800/60 border-slate-700 text-white h-11 focus:border-amber-500">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-white hover:bg-slate-700 focus:bg-slate-700">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`w-full sm:w-44 h-11 bg-slate-800/60 border-slate-700 text-white hover:bg-slate-700 justify-between ${pricePreset !== "Any Price" ? "border-amber-500/60 text-amber-300" : ""}`}>
              <span className="text-sm truncate">{pricePreset === "Any Price" ? "Price Range" : pricePreset}</span>
              <SlidersHorizontal className="w-4 h-4 shrink-0 ml-2 text-slate-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white p-5 space-y-4">
            <p className="font-semibold text-sm text-slate-300">Price Range</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => handlePricePreset(p.label)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${pricePreset === p.label ? "bg-amber-500 border-amber-500 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Slider value={priceRange} onValueChange={handleSlider} max={10000} step={50} className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>${priceRange[0].toLocaleString()}</span>
                <span>${priceRange[1].toLocaleString()}{priceRange[1] === 10000 ? "+" : ""}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select value={sortBy} onValueChange={handleSort}>
          <SelectTrigger className="w-full sm:w-52 bg-slate-800/60 border-slate-700 text-white h-11">
            <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="ending_soon" className="text-white hover:bg-slate-700">Ending Soon</SelectItem>
            <SelectItem value="newly_listed" className="text-white hover:bg-slate-700">Newly Listed</SelectItem>
            <SelectItem value="price_low_high" className="text-white hover:bg-slate-700">Price: Low → High</SelectItem>
            <SelectItem value="price_high_low" className="text-white hover:bg-slate-700">Price: High → Low</SelectItem>
            <SelectItem value="most_bids" className="text-white hover:bg-slate-700">Most Bids</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Secondary row: time filter + active chips */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "1h", "6h", "24h", "3d"].map(t => (
          <button
            key={t}
            onClick={() => handleTimeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${timeFilter === t ? "bg-amber-500 border-amber-500 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"}`}
          >
            {t === "all" ? "All Time" : t === "1h" ? "< 1h" : t === "6h" ? "< 6h" : t === "24h" ? "< 24h" : "< 3 days"}
          </button>
        ))}

        {hasActiveFilters && (
          <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 gap-1">
              "{searchTerm}"
              <button onClick={() => handleSearch("")}><X className="w-3 h-3 hover:text-amber-400" /></button>
            </Badge>
          )}
          {category !== "all" && (
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 gap-1">
              {CATEGORIES.find(c => c.value === category)?.label}
              <button onClick={() => handleCategory("all")}><X className="w-3 h-3 hover:text-white" /></button>
            </Badge>
          )}
          {pricePreset !== "Any Price" && (
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 gap-1">
              {pricePreset}
              <button onClick={() => handlePricePreset("Any Price")}><X className="w-3 h-3 hover:text-white" /></button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}