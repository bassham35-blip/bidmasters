import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SearchAndFilter({ onFilterChange, onSortChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [
    priceRange[0] > 0 || priceRange[1] < 10000,
    timeFilter !== "all",
    sellerFilter !== ""
  ].filter(Boolean).length;

  const applyFilters = () => {
    onFilterChange({
      search: searchTerm,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      timeFilter,
      seller: sellerFilter
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 10000]);
    setTimeFilter("all");
    setSellerFilter("");
    onFilterChange({
      search: "",
      priceMin: 0,
      priceMax: 10000,
      timeFilter: "all",
      seller: ""
    });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSortChange(value);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onFilterChange({
                search: e.target.value,
                priceMin: priceRange[0],
                priceMax: priceRange[1],
                timeFilter,
                seller: sellerFilter
              });
            }}
            placeholder="Search auctions by title, description..."
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
          />
        </div>

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-white p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Advanced Filters</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-slate-300">Price Range</Label>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    step={100}
                    className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">${priceRange[0]}</span>
                  <span className="text-slate-400">${priceRange[1]}</span>
                </div>
              </div>

              {/* Time Filter */}
              <div className="space-y-2">
                <Label className="text-slate-300">Ending Time</Label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Auctions</SelectItem>
                    <SelectItem value="1h" className="text-white hover:bg-slate-700">Ending in 1 hour</SelectItem>
                    <SelectItem value="6h" className="text-white hover:bg-slate-700">Ending in 6 hours</SelectItem>
                    <SelectItem value="24h" className="text-white hover:bg-slate-700">Ending in 24 hours</SelectItem>
                    <SelectItem value="3d" className="text-white hover:bg-slate-700">Ending in 3 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seller Filter */}
              <div className="space-y-2">
                <Label className="text-slate-300">Seller Name</Label>
                <Input
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  placeholder="Filter by seller..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700 text-white">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="ending_soon" className="text-white hover:bg-slate-700">Ending Soon</SelectItem>
            <SelectItem value="newly_listed" className="text-white hover:bg-slate-700">Newly Listed</SelectItem>
            <SelectItem value="price_low_high" className="text-white hover:bg-slate-700">Price: Low to High</SelectItem>
            <SelectItem value="price_high_low" className="text-white hover:bg-slate-700">Price: High to Low</SelectItem>
            <SelectItem value="most_bids" className="text-white hover:bg-slate-700">Most Bids</SelectItem>
            <SelectItem value="least_bids" className="text-white hover:bg-slate-700">Least Bids</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || activeFiltersCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge className="bg-slate-800 text-white border-slate-700 px-3 py-1">
              Search: "{searchTerm}"
              <button
                onClick={() => {
                  setSearchTerm("");
                  onFilterChange({
                    search: "",
                    priceMin: priceRange[0],
                    priceMax: priceRange[1],
                    timeFilter,
                    seller: sellerFilter
                  });
                }}
                className="ml-2 hover:text-amber-400"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 10000) && (
            <Badge className="bg-slate-800 text-white border-slate-700 px-3 py-1">
              ${priceRange[0]} - ${priceRange[1]}
            </Badge>
          )}
          {timeFilter !== "all" && (
            <Badge className="bg-slate-800 text-white border-slate-700 px-3 py-1">
              Ending: {timeFilter}
            </Badge>
          )}
          {sellerFilter && (
            <Badge className="bg-slate-800 text-white border-slate-700 px-3 py-1">
              Seller: {sellerFilter}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}