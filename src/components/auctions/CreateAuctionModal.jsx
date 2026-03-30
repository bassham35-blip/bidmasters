import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Clock, X, ImageIcon } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    starting_price: "",
    category: "other",
    duration: "0.00833",
    startType: "now",
    start_time: ""
  });

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setIsUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: result.file_url }));
    setIsUploading(false);
  };

  const handleImageUpload = (e) => uploadFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isScheduled = formData.startType === "scheduled" && formData.start_time;
    const startTime = isScheduled ? new Date(formData.start_time) : new Date();
    const endTime = new Date(startTime);
    endTime.setTime(endTime.getTime() + parseFloat(formData.duration) * 60 * 60 * 1000);

    await base44.entities.Auction.create({
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url,
      starting_price: parseFloat(formData.starting_price),
      current_bid: parseFloat(formData.starting_price),
      category: formData.category,
      start_time: isScheduled ? startTime.toISOString() : null,
      end_time: endTime.toISOString(),
      status: isScheduled ? "scheduled" : "active",
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
      duration: "0.00833",
      startType: "now",
      start_time: ""
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
            {formData.image_url ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Upload className="w-4 h-4" /> Replace
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                    className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  </div>
                )}
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 bg-slate-800 hover:border-amber-500 hover:bg-slate-700/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-300 text-sm font-medium">Drop image here or <span className="text-amber-400">browse</span></p>
                      <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </>
                )}
              </label>
            )}
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
                <SelectItem value="0.00833" className="text-white hover:bg-slate-700">⚡ 30 seconds</SelectItem>
                <SelectItem value="0.0833" className="text-white hover:bg-slate-700">5 minutes</SelectItem>
                <SelectItem value="0.5" className="text-white hover:bg-slate-700">30 minutes</SelectItem>
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

          <div className="space-y-2">
            <Label className="text-slate-300">Start Time</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, startType: "now" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${formData.startType === "now" ? "bg-amber-500 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500"}`}
              >
                Go Live Now
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, startType: "scheduled" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${formData.startType === "scheduled" ? "bg-amber-500 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500"}`}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Schedule
              </button>
            </div>
            {formData.startType === "scheduled" && (
              <Input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white focus:border-amber-500"
                required
              />
            )}
            {formData.startType === "scheduled" && formData.start_time && (
              <p className="text-xs text-slate-400">
                Auction will go live on {new Date(formData.start_time).toLocaleString()} and run for {parseFloat(formData.duration) < 1 ? `${Math.round(parseFloat(formData.duration) * 60)} minutes` : `${formData.duration} hours`}.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (formData.startType === "scheduled" && !formData.start_time)}
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