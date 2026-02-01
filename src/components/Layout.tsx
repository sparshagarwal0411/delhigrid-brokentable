import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  ClipboardList,
  X,
  MapPin,
  Loader2,
  Lock,
  CheckCircle2
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  const navigate = useNavigate();
  
  // --- Sidebar Global State ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [communityComplaints, setCommunityComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // --- Fetch Data for Sidebar ---
  useEffect(() => {
    const initSidebar = async () => {
      // 1. Fetch Community Complaints (Public)
      const { data: commComplaints } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (commComplaints) setCommunityComplaints(commComplaints);

      // 2. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 3. Fetch User Data
      const { data: profiles } = await supabase
        .from("users")
        .select("id, ward_number, role")
        .eq("id", session.user.id);
      
      if (profiles && profiles[0]) {
        setUserData(profiles[0]);
        
        // 4. Fetch User Complaints if logged in
        setLoadingComplaints(true);
        const { data: complaints } = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
          
        if (complaints) setUserComplaints(complaints);
        setLoadingComplaints(false);
      }
    };

    initSidebar();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Main Layout Container (Below Fixed Navbar) 
        Uses 'items-start' to ensure sidebar stays at top while content scrolls
      */}
      <div className="pt-16 flex flex-1 items-start">
        
        {/* --- Sidebar Handle (Visible only when closed) --- */}
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="fixed left-0 top-32 z-40 hidden md:block"
            >
              <Button
                onClick={() => setSidebarOpen(true)}
                className="h-16 w-6 rounded-l-none rounded-r-xl border border-l-0 shadow-md p-0 flex items-center justify-center hover:w-10 transition-all group 
                
                /* LIGHT MODE: Dark Greyish Blue background, White text */
                bg-slate-700 text-white hover:bg-slate-800
                
                /* DARK MODE: White background, Dark Slate text */
                dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200"
              >
                <ChevronRight className="h-4 w-4 transition-colors" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Sidebar (Shift Mode) --- */}
        {/* - sticky top-16: Keeps it pinned under the navbar while page scrolls
           - h-[calc(100vh-4rem)]: Fills the exact height of viewport minus navbar
           - width animate: Smoothly resizes to push content
        */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: sidebarOpen ? 400 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-background border-r overflow-hidden z-30"
        >
          {/* Inner container with fixed width prevents content squishing during animation */}
          <div className="w-[400px] h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold text-lg">Complaints Tracker</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="community" className="flex-1 flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="community">Community</TabsTrigger>
                    <TabsTrigger value="my">My Complaints</TabsTrigger>
                  </TabsList>
                </div>

                {/* Community Tab */}
                <TabsContent value="community" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
                  {communityComplaints.length > 0 ? (
                    communityComplaints.map((comp) => (
                      <Card key={comp.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="capitalize">{comp.category}</Badge>
                            <Badge variant="secondary" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              Ward {comp.ward_number}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium line-clamp-2 mb-3">{comp.description}</p>
                          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                            <span className="capitalize font-semibold text-primary/80 px-2 py-0.5 bg-primary/5 rounded-full">
                              {comp.status}
                            </span>
                            <span>{new Date(comp.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">No community reports yet.</div>
                  )}
                </TabsContent>

                {/* My Complaints Tab */}
                <TabsContent value="my" className="flex-1 flex flex-col m-0 overflow-hidden relative">
                  {!userData && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-center justify-center p-6">
                      <div className="bg-background border shadow-lg rounded-xl p-6 text-center max-w-xs">
                        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">Login Required</h3>
                        <p className="text-xs text-muted-foreground mb-4">Sign in to track your personal complaints.</p>
                        <Button size="sm" onClick={() => { setSidebarOpen(false); navigate("/auth"); }} className="w-full">Login</Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingComplaints ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : userComplaints.length > 0 ? (
                      userComplaints.map((comp) => (
                        <Card key={comp.id} className="overflow-hidden border border-border/50 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="capitalize">{comp.category}</Badge>
                              {comp.status === 'solved' && (
                                <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Solved</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-3">{comp.description}</p>
                            {comp.admin_feedback && (
                              <div className="p-2 bg-muted rounded text-xs mb-3">
                                <span className="font-semibold">Admin:</span> {comp.admin_feedback}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground text-right">{new Date(comp.created_at).toLocaleDateString()}</div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">You haven't submitted any complaints.</div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t bg-muted/10">
                    <Button className="w-full" onClick={() => { setSidebarOpen(false); navigate("/complaints"); }}>
                      File New Complaint
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>

        {/* --- Main Content Area --- */}
        {/* flex-1 allows it to fill remaining width. min-w-0 prevents flexbox overflow issues */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <main className="flex-1">
            {children}
          </main>
          {showFooter && <Footer />}
        </div>

      </div>
      
      <FloatingActionButtons />
    </div>
  );
}