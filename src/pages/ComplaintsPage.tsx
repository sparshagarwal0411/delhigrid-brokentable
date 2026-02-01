import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Droplets,
  Volume2,
  Car,
  TreeDeciduous,
  MapPin,
  Wind,
  Bot,
  Send,
  ImagePlus,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { analyzeComplaint, isGeminiConfigured, type ComplaintCategory, type GeminiAnalysis } from "@/lib/gemini";

const CATEGORY_CONFIG: Record<
  ComplaintCategory,
  { label: string; icon: typeof Wind; color: string }
> = {
  air: { label: "Air", icon: Wind, color: "bg-sky-500/20 text-sky-700 dark:text-sky-300" },
  water: { label: "Water", icon: Droplets, color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  noise: { label: "Noise", icon: Volume2, color: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
  transport: { label: "Transport", icon: Car, color: "bg-orange-500/20 text-orange-700 dark:text-orange-300" },
  soil: { label: "Soil", icon: TreeDeciduous, color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" },
  land: { label: "Land", icon: MapPin, color: "bg-stone-500/20 text-stone-700 dark:text-stone-300" },
};

interface UserData {
  id: string;
  ward_number: number;
  role: "citizen" | "admin";
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) reject(new Error("Failed to read file"));
      else resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ComplaintsPage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const geminiOk = isGeminiConfigured();

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image (JPG, PNG, WebP)", variant: "destructive" });
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, [toast]);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }, [photoPreview]);

  const handleAnalyze = async () => {
    if (analysis) {
      setSuggestionOpen(true);
      return;
    }
    const trimmed = description.trim();
    if (!trimmed && !photo) {
      toast({ title: "Empty complaint", description: "Describe the problem or upload a photo.", variant: "destructive" });
      return;
    }
    if (!geminiOk) {
      toast({ title: "AI not configured", description: "Add VITE_GEMINI_API_KEY to .env", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setSuggestionOpen(false);
    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (photo) {
        const { base64, mimeType } = await fileToBase64(photo);
        imageBase64 = base64;
        imageMimeType = mimeType;
      }
      const result = await analyzeComplaint(
        trimmed || "See attached image for the environmental issue.",
        imageBase64,
        imageMimeType,
        location.trim() || undefined,
        userData?.ward_number
      );
      setAnalysis(result);
      setSuggestionOpen(true);
      toast({ title: "Analysis complete", description: "Review the suggestion in the popup." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReportComplaint = async () => {
    if (!userData || !analysis) return;
    const trimmed = description.trim();
    if (!trimmed) {
      toast({ title: "Description required", description: "Add a short description before reporting.", variant: "destructive" });
      return;
    }

    setReporting(true);
    try {
      let photoUrl: string | null = null;
      if (photo && userData) {
        const fileExt = photo.name.split(".").pop() || "jpg";
        const fileName = `complaints/${userData.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("task-verifications")
          .upload(fileName, photo);

        if (!uploadError) {
          const { data } = supabase.storage.from("task-verifications").getPublicUrl(fileName);
          photoUrl = data.publicUrl;
        }
      }

      const { error } = await (supabase.from("complaints") as any).insert({
        user_id: userData.id,
        ward_number: analysis.wardId,
        location_text: location.trim() ? location.trim() : null,
        description: trimmed,
        photo_url: photoUrl,
        category: analysis.category,
        ai_suggestion: analysis.suggestion,
        status: "received",
      });

      if (error) throw error;

      toast({ title: "Complaint reported", description: "Authorities will review it shortly." });
      setDescription("");
      setLocation("");
      removePhoto();
      setAnalysis(null);
      setSuggestionOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to report";
      toast({ title: "Report failed", description: msg, variant: "destructive" });
    } finally {
      setReporting(false);
    }
  };

  const handleCloseSuggestion = () => {
    setSuggestionOpen(false);
  };

  const handleStartOver = () => {
    setAnalysis(null);
    setDescription("");
    setLocation("");
    removePhoto();
    setSuggestionOpen(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("users")
        .select("id, ward_number, role")
        .eq("id", session.user.id);

      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      if (profileError || !profile) {
        setLoading(false);
        return;
      }

      const role = (profile as { role: string }).role;
      if (role !== "citizen") {
        toast({ title: "Access denied", description: "This page is for citizens only.", variant: "destructive" });
        navigate("/");
        return;
      }

      setUserData(profile as unknown as UserData);
      setLoading(false);
    };

    init();
  }, [navigate, toast]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const catConfig = analysis ? CATEGORY_CONFIG[analysis.category] : null;
  const CatIcon = catConfig?.icon ?? Wind;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 relative overflow-hidden p-8 rounded-[2rem] bg-glass premium-gradient border-none shadow-2xl group"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black font-heading tracking-tighter">File a Complaint</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-3 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20 uppercase tracking-widest">
                    AI Enabled
                  </div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xl">
              Report environmental concerns in your neighborhood. AI will automatically identify the correct <span className="text-primary font-bold">Ward (1-250)</span> and suggest immediate actions.
            </p>
          </div>
        </motion.div>

        {!userData ? (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-lg font-semibold">Login to Report</h3>
                <p className="text-muted-foreground text-sm">You need to be logged in to file a new complaint. You can still view community issues in the side panel.</p>
              </div>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In / Register
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {!geminiOk && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Alert variant="destructive" className="mb-6 shadow-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add <code className="text-xs bg-destructive/20 px-1 rounded">VITE_GEMINI_API_KEY</code> to your <code className="text-xs bg-destructive/20 px-1 rounded">.env</code> for AI analysis.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-2xl bg-glass backdrop-blur-xl relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Bot className="h-32 w-32" />
                </div>
                <CardHeader className="relative pb-6 border-b border-border/10">
                  <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    Problem Details
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    Provide location and description for the AI assistant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-8 pt-8 px-8 pb-10">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="complaint-location" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Physical Location</Label>
                    <div className="relative group/input">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                      <Input
                        id="complaint-location"
                        placeholder="e.g. Near Rohini Metro Stn, Sector 5..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-14 pl-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/10 rounded-2xl transition-all shadow-sm group-hover/input:shadow-md font-medium"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="complaint-desc" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Issue Description</Label>
                    <Textarea
                      id="complaint-desc"
                      placeholder="Be specific about what you see (e.g., 'Illegal garbage burning...', 'Burst water pipe...')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="resize-none bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/10 rounded-2xl transition-all shadow-sm hover:shadow-md font-medium p-4"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Upload Proof (Recommended)</Label>
                    <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-border/50 rounded-[1.5rem] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group/upload relative overflow-hidden shadow-inner">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      {photoPreview ? (
                        <div className="relative w-full h-full min-h-[160px] rounded-[1.5rem] overflow-hidden">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform group-hover/upload:scale-105 duration-700"
                          />
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-4"
                          >
                            <Button
                              type="button"
                              variant="destructive"
                              className="h-12 w-12 rounded-full shadow-2xl"
                              onClick={(e) => { e.preventDefault(); removePhoto(); }}
                            >
                              <X className="h-6 w-6" />
                            </Button>
                          </motion.div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground group-hover/upload:text-primary transition-all">
                          <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center group-hover/upload:bg-primary/10 group-hover/upload:scale-110 transition-all duration-500">
                            <ImagePlus className="h-8 w-8" />
                          </div>
                          <div className="text-center">
                            <span className="block text-sm font-bold">Tap to upload photo</span>
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-60 mt-1">PNG, JPG, HEIC up to 10MB</span>
                          </div>
                        </div>
                      )}
                    </label>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-4"
                  >
                    <Button
                      size="lg"
                      className="w-full h-16 text-lg font-black rounded-2xl gap-3 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1 bg-primary text-white"
                      onClick={handleAnalyze}
                      disabled={analyzing || (!analysis && !description.trim() && !photo) || !geminiOk}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Analyzing Situation...
                        </>
                      ) : analysis ? (
                        <>
                          <Bot className="h-6 w-6" />
                          Review Diagnostic
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6" />
                          Analyze with Gemini AI
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <Dialog open={suggestionOpen && !!analysis} onOpenChange={(open) => !open && handleCloseSuggestion()}>
              <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0 border-2">
                <AnimatePresence>
                  {analysis && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6"
                    >
                      <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <DialogTitle className="text-lg">AI Suggestion</DialogTitle>
                            <DialogDescription>Review and take action</DialogDescription>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge className={catConfig?.color}>
                            <CatIcon className="h-3 w-3 mr-1" />
                            {catConfig?.label}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            Ward {analysis.wardId}: {analysis.wardName}
                          </Badge>
                        </div>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {analysis.suggestion}
                        </p>
                      </div>
                      <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={handleStartOver}>
                          Start over
                        </Button>
                        <Button
                          className="w-full sm:w-auto gap-2"
                          onClick={handleReportComplaint}
                          disabled={reporting || !description.trim()}
                        >
                          {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Report complaint
                        </Button>
                      </DialogFooter>
                      <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                        Use &quot;Report complaint&quot; when the AI suggestion doesn&apos;t help — your complaint will be sent to authorities.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ComplaintsPage;