import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "art", label: "Art" },
  { value: "collectibles", label: "Collectibles" },
  { value: "home", label: "Home & Garden" },
  { value: "vehicles", label: "Vehicles" },
  { value: "jewelry", label: "Jewelry" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" }
];

export default function CreateAuctionModal({ open, onOpenChange, user, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    starting_price: "",
    category: "other",
    duration: "24"
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: result.file_url }));
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + parseInt(formData.duration));

    await base44.entities.Auction.create({
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url,
      starting_price: parseFloat(formData.starting_price),
      current_bid: parseFloat(formData.starting_price),
      category: formData.category,
      end_time: endTime.toISOString(),
      status: "active",
      seller_name: user?.full_name || "Anonymous",
      bid_count: 0
    });

    toast.success("Auction created successfully!");
    setFormData({
      title: "",
      description: "",
      image_url: "",
      starting_price: "",
      category: "other",
      duration: "24"
    });
    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Create New Auction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Item Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter item title"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your item..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Item Image</Label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-slate-400 text-sm">
                  {formData.image_url ? "Change image" : "Upload image"}
                </span>
              </label>
              {formData.image_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Starting Price ($)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={formData.starting_price}
                onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                placeholder="0.00"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-700">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="1" className="text-white hover:bg-slate-700">1 hour</SelectItem>
                <SelectItem value="6" className="text-white hover:bg-slate-700">6 hours</SelectItem>
                <SelectItem value="12" className="text-white hover:bg-slate-700">12 hours</SelectItem>
                <SelectItem value="24" className="text-white hover:bg-slate-700">24 hours</SelectItem>
                <SelectItem value="48" className="text-white hover:bg-slate-700">2 days</SelectItem>
                <SelectItem value="72" className="text-white hover:bg-slate-700">3 days</SelectItem>
                <SelectItem value="168" className="text-white hover:bg-slate-700">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Auction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}