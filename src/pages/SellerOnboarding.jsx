import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  User,
  MapPin,
  Phone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Gavel,
  TrendingUp,
  Upload,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const STEPS = [
  { id: 1, label: "Welcome", icon: Sparkles },
  { id: 2, label: "Store Info", icon: Store },
  { id: 3, label: "Contact", icon: Phone },
  { id: 4, label: "Terms", icon: Shield },
  { id: 5, label: "Done", icon: CheckCircle }
];

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    store_name: "",
    store_description: "",
    phone: "",
    location: "",
    avatar_url: "",
    accepted_terms: false
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.is_seller) navigate('/SellerDashboard');
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, avatar_url: result.file_url }));
    setIsUploading(false);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    await base44.auth.updateMe({
      is_seller: true,
      store_name: formData.store_name,
      store_description: formData.store_description,
      phone: formData.phone,
      location: formData.location,
      avatar_url: formData.avatar_url,
      accepted_terms: true,
      seller_since: new Date().toISOString()
    });
    setIsSubmitting(false);
    setStep(5);
  };

  const canAdvanceStep2 = formData.store_name.trim().length >= 2;
  const canAdvanceStep3 = true; // phone & location optional
  const canAdvanceStep4 = formData.accepted_terms;

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Progress Steps */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.slice(0, 4).map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone ? 'bg-amber-500 text-white' :
                      isActive ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400' :
                      'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}>
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs hidden sm:block ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-px max-w-16 transition-all duration-500 ${
                      s.id < step ? 'bg-amber-500' : 'bg-slate-700'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Step Cards */}
        <AnimatePresence mode="wait">

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardContent className="p-10 text-center space-y-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Gavel className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-3">Become a Seller</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                      Join thousands of sellers reaching buyers worldwide. List items, set your price, and watch the bids roll in.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { icon: Store, label: "Create your store", desc: "Free setup" },
                      { icon: TrendingUp, label: "List auctions", desc: "Any category" },
                      { icon: CheckCircle, label: "Get paid", desc: "Win-win deals" }
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <Icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">{label}</p>
                        <p className="text-slate-500 text-xs mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2 — Store Info */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '50%' }} />
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Set Up Your Store</h2>
                    <p className="text-slate-400">Tell buyers who you are and what you sell.</p>
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer group">
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 group-hover:border-amber-500 flex items-center justify-center overflow-hidden transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        ) : formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400" />
                        )}
                      </div>
                    </label>
                    <div>
                      <p className="text-white font-medium">{user?.full_name}</p>
                      <p className="text-slate-500 text-sm">{user?.email}</p>
                      <p className="text-slate-500 text-xs mt-1">Click avatar to upload a photo</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Store Name <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.store_name}
                      onChange={e => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="e.g. Vintage Vault, TechTreasures..."
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                    />
                    {formData.store_name.length > 0 && formData.store_name.length < 2 && (
                      <p className="text-red-400 text-xs">Store name must be at least 2 characters</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Store Description</Label>
                    <Textarea
                      value={formData.store_description}
                      onChange={e => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                      placeholder="Tell buyers what you specialize in, your experience, return policy..."
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canAdvanceStep2}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-40"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '75%' }} />
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Contact Details</h2>
                    <p className="text-slate-400">Optional but helps buyers trust you more.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(2)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4 — Terms */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '90%' }} />
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Seller Agreement</h2>
                    <p className="text-slate-400">Please read and accept the following terms.</p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4 text-sm text-slate-300 max-h-56 overflow-y-auto leading-relaxed">
                    <p className="font-semibold text-white">Seller Terms & Conditions</p>
                    <p>By registering as a seller you agree to list only items you own or have the right to sell. Misrepresenting items is grounds for immediate account suspension.</p>
                    <p>All winning bids are binding. You are responsible for completing each sale in a timely manner and communicating with buyers professionally.</p>
                    <p>Prohibited items include counterfeit goods, stolen property, weapons, or any item illegal under applicable law. Violations will result in permanent bans and may be reported to authorities.</p>
                    <p>The platform reserves the right to remove listings, suspend accounts, or modify fees at any time with reasonable notice.</p>
                    <p>You grant the platform a non-exclusive licence to display your listing images and descriptions for the purpose of facilitating sales.</p>
                    <p>Disputes between buyers and sellers should first be resolved directly. The platform may step in as mediator but is not liable for the outcome of any transaction.</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.accepted_terms}
                      onCheckedChange={val => setFormData(prev => ({ ...prev, accepted_terms: !!val }))}
                      className="mt-1 border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <label htmlFor="terms" className="text-slate-300 text-sm cursor-pointer">
                      I have read and agree to the Seller Terms & Conditions and confirm all information I provide will be accurate and truthful.
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(3)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleFinish}
                      disabled={!canAdvanceStep4 || isSubmitting}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-40"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Activate Seller Account</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5 — Done */}
          {step === 5 && (
            <motion.div key="step5" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardContent className="p-10 text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">You're a Seller! 🎉</h2>
                    <p className="text-slate-400 text-lg">
                      Welcome aboard, <span className="text-amber-400 font-semibold">{formData.store_name}</span>. Your seller account is now live.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left">
                      <Store className="w-5 h-5 text-amber-400 mb-2" />
                      <p className="text-white font-medium text-sm">Store ready</p>
                      <p className="text-slate-500 text-xs">{formData.store_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left">
                      <Shield className="w-5 h-5 text-amber-400 mb-2" />
                      <p className="text-white font-medium text-sm">Terms accepted</p>
                      <p className="text-slate-500 text-xs">All good to go</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/SellerDashboard" className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-5 text-base font-semibold">
                        <Store className="w-5 h-5 mr-2" />
                        Go to Seller Dashboard
                      </Button>
                    </Link>
                    <Link to="/Auctions" className="flex-1">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 py-5">
                        <Gavel className="w-5 h-5 mr-2" />
                        Browse Auctions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}