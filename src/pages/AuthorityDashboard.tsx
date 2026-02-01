import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wards, getStatusFromScore } from "@/data/wards";
import {
  BarChart3,
  MapPin,
  Users,
  AlertTriangle,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download,
  Filter,
  Building2,
  FileText,
  Bell,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  RefreshCw,
  Target,
  MessageSquare,
  Clock,
  ClipboardList,
  BarChart,
  PieChart as PieChartIcon,
  ChevronRight,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PendingSubmission {
  id: string;
  status: string;
  image_url: string;
  submission_text: string | null;
  submitted_at: string | null;
  created_at: string;
  user_id: string;
  task_id: string;
  tasks: {
    title: string;
    points: number;
    category: string;
  };
  users: {
    first_name: string;
    last_name: string;
    ward_number: number;
    score: number;
  };
}

interface Complaint {
  id: string;
  user_id: string;
  ward_number: number;
  description: string;
  photo_url: string | null;
  category: string;
  status: string;
  admin_feedback: string | null;
  points_rewarded: number;
  timeline: any[];
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
    score: number;
    wallet_balance: number;
  }
}

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// Generate chart data
const zoneData = [
  { zone: "North Delhi", score: 65, trend: -2.3 },
  { zone: "South Delhi", score: 72, trend: 1.5 },
  { zone: "East Delhi", score: 58, trend: -4.1 },
  { zone: "West Delhi", score: 61, trend: 0.8 },
  { zone: "Central Delhi", score: 54, trend: -3.2 },
  { zone: "New Delhi", score: 78, trend: 2.1 },
  { zone: "North West", score: 63, trend: -1.7 },
  { zone: "South West", score: 69, trend: 1.2 },
  { zone: "North East", score: 51, trend: -5.3 },
  { zone: "Shahdara", score: 55, trend: -2.8 },
  { zone: "South East", score: 67, trend: 0.5 },
];

const trendData = [
  { month: "Jul", air: 62, water: 68, waste: 55, noise: 72 },
  { month: "Aug", air: 58, water: 65, waste: 58, noise: 70 },
  { month: "Sep", air: 55, water: 63, waste: 60, noise: 68 },
  { month: "Oct", air: 48, water: 60, waste: 62, noise: 65 },
  { month: "Nov", air: 42, water: 58, waste: 64, noise: 63 },
  { month: "Dec", air: 38, water: 55, waste: 66, noise: 62 },
];

const pollutionBreakdown = [
  { name: "Good", value: 45, color: "hsl(142, 76%, 36%)" },
  { name: "Moderate", value: 82, color: "hsl(45, 93%, 47%)" },
  { name: "Unhealthy", value: 68, color: "hsl(25, 95%, 53%)" },
  { name: "Severe", value: 38, color: "hsl(0, 84%, 60%)" },
  { name: "Hazardous", value: 17, color: "hsl(280, 65%, 45%)" },
];

const alertsData = [
  { id: 1, type: "critical", message: "Ward 156: AQI crossed 400 threshold", time: "2 hours ago" },
  { id: 2, type: "warning", message: "Zone East Delhi: Water quality declining", time: "4 hours ago" },
  { id: 3, type: "info", message: "15 new NGOs registered this week", time: "1 day ago" },
  { id: 4, type: "warning", message: "Ward 89: Waste collection delayed", time: "1 day ago" },
];

const AuthorityDashboard = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [totalActionsCount, setTotalActionsCount] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState<number | null>(null);
  const [customScores, setCustomScores] = useState<Record<string, number>>({});
  const [complaintFeedback, setComplaintFeedback] = useState<Record<string, string>>({});
  const [complaintPoints, setComplaintPoints] = useState<Record<string, number>>({});
  /* Existing state */
  const { toast } = useToast();

  // --- NEW: Admin Verification State ---
  interface PendingAdmin {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
  }
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchPendingAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, created_at")
        .eq("role", "admin")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingAdmins(data as PendingAdmin[]);
    } catch (error: any) {
      console.error("Error fetching pending admins:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleApproveAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_verified: true } as any)
        .eq("id", adminId);

      if (error) throw error;

      toast({
        title: "Admin Approved",
        description: "The user now has full access to the Authority Portal.",
      });

      fetchPendingAdmins();
    } catch (error: any) {
      console.error("Error approving admin:", error);
      toast({
        title: "Error",
        description: "Failed to approve admin request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectAdmin = async (adminId: string) => {
    try {
      // In a real app we might want to just change role or delete profile
      // For now we'll just delete the profile record
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The admin request has been denied.",
      });

      fetchPendingAdmins();
    } catch (error: any) {
      console.error("Error rejecting admin:", error);
      toast({
        title: "Error",
        description: "Failed to reject admin request.",
        variant: "destructive",
      });
    }
  };


  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: 'exact', head: true });

      const { count: actionCount } = await supabase
        .from("user_tasks")
        .select("*", { count: 'exact', head: true });

      setActiveUsersCount(userCount || 0);
      setTotalActionsCount(actionCount || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPendingSubmissions = async () => {
    setLoading(true);
    setLastError(null);
    setRawCount(null);
    try {
      // 1. Fetch user_tasks (The core data)
      const { data: utData, error: utError } = await (supabase
        .from("user_tasks") as any)
        .select("*")
        .in("status", ["submitted", "pending"])
        .order("created_at", { ascending: false });

      if (utError) {
        setLastError(`Database Error: ${utError.message}`);
        throw utError;
      }

      const totalCount = utData?.length || 0;
      setRawCount(totalCount);

      if (totalCount === 0) {
        setPendingSubmissions([]);
        return;
      }

      // 2. Fetch all unique tasks mentioned
      const taskIds = [...new Set(((utData as any[]).map(ut => ut.task_id)) as string[])];
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .in("id", taskIds);

      // 3. Fetch all unique users mentioned
      const userIds = [...new Set(((utData as any[]).map(ut => ut.user_id)) as string[])];
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);

      // 4. Manually Join the data
      const joinedData = (utData as any[]).map(ut => {
        const task = (tasksData as any[] | null)?.find(t => t.id === ut.task_id);
        const user = (usersData as any[] | null)?.find(u => u.id === ut.user_id);
        return {
          ...ut,
          tasks: task || null,
          users: user || null
        };
      });

      setPendingSubmissions(joinedData as any);

      // Initialize custom scores
      const scores: Record<string, number> = {};
      joinedData.forEach(sub => {
        scores[sub.id] = sub.tasks?.points || 10;
      });
      setCustomScores(scores);
    } catch (error) {
      console.error("Error manual fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const { data: compData, error: compError } = await (supabase
        .from("complaints") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (compError) throw compError;

      const userIds = [...new Set(((compData as any[]).map(c => c.user_id)) as string[])];
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);

      const joinedComplaints = (compData as any[]).map(c => {
        const user = (usersData as any[] | null)?.find(u => u.id === c.user_id);
        return {
          ...c,
          users: user || null
        };
      });

      setComplaints(joinedComplaints);

      // Initialize feedback and points state
      const feedback: Record<string, string> = {};
      const points: Record<string, number> = {};
      joinedComplaints.forEach(c => {
        feedback[c.id] = c.admin_feedback || "";
        points[c.id] = c.points_rewarded || 0;
      });
      setComplaintFeedback(feedback);
      setComplaintPoints(points);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchPendingSubmissions();
    fetchComplaints();
    fetchPendingAdmins();
  };

  useEffect(() => {
    fetchStats();
    fetchPendingSubmissions();
    fetchComplaints();
    fetchPendingAdmins();
  }, []);

  const handleApprove = async (submission: PendingSubmission) => {
    try {
      const awardedPoints = customScores[submission.id] || 0;

      // 1. Update user_task
      const { error: utError } = await (supabase
        .from("user_tasks") as any)
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          points_rewarded: awardedPoints
        })
        .eq("id", submission.id);

      if (utError) throw utError;

      // 2. Add points to user score (only if we have the user object)
      if (submission.users) {
        const newScore = (submission.users.score || 0) + awardedPoints;
        const { error: userError } = await (supabase
          .from("users") as any)
          .update({ score: newScore })
          .eq("id", submission.user_id);

        if (userError) throw userError;
      }

      toast({
        title: "Action Approved",
        description: `Awarded ${awardedPoints} points to ${submission.users?.first_name || 'Citizen'}.`,
      });

      fetchPendingSubmissions();
    } catch (error: any) {
      console.error("Error approving:", error);
      toast({
        title: "Error",
        description: `Failed to approve action: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      const { error } = await (supabase
        .from("user_tasks") as any)
        .update({ status: 'rejected' })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Action Rejected",
        description: "The submission has been marked as invalid.",
      });

      fetchPendingSubmissions();
    } catch (error: any) {
      console.error("Error rejecting:", error);
      toast({
        title: "Error",
        description: `Failed to reject action: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateComplaint = async (complaintId: string, newStatus: string) => {
    try {
      setLoadingComplaints(true);
      const feedback = complaintFeedback[complaintId];
      const points = complaintPoints[complaintId];
      const complaint = complaints.find(c => c.id === complaintId);

      const { error: compError } = await (supabase
        .from("complaints") as any)
        .update({
          status: newStatus,
          admin_feedback: feedback,
          points_rewarded: points
        })
        .eq("id", complaintId);

      if (compError) throw compError;

      // Update user score if points are newly awarded or increased
      if (points > (complaint?.points_rewarded || 0) && complaint?.users) {
        const addedPoints = points - (complaint.points_rewarded || 0);
        const { data: profiles } = await supabase
          .from("users")
          .select("score, wallet_balance")
          .eq("id", complaint.user_id);

        const userProfile = profiles && profiles.length > 0 ? profiles[0] : null;

        const currentScore = (userProfile as any)?.score || 0;
        const currentWallet = (userProfile as any)?.wallet_balance || 0;

        await (supabase
          .from("users") as any)
          .update({
            score: currentScore + addedPoints,
            wallet_balance: currentWallet + addedPoints
          })
          .eq("id", complaint.user_id);
      }

      toast({
        title: "Complaint Updated",
        description: `Status changed to ${newStatus}. Feedback and points saved.`,
      });

      await fetchComplaints();
    } catch (error: any) {
      console.error("Error updating complaint:", error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingComplaints(false);
    }
  };

  const avgScore = Math.round(wards.reduce((acc, w) => acc + w.pollutionScore, 0) / wards.length);
  const criticalWards = wards.filter(w => w.pollutionScore < 40).length;
  const improvedWards = wards.filter(w => w.trend30Days < 0).length;

  return (
    <Layout>
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-8 rounded-[2rem] bg-glass premium-gradient mb-10 group shadow-2xl transition-all duration-500 hover:shadow-primary/5"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] group-hover:bg-secondary/20 transition-all duration-1000" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase border border-primary/20 shadow-sm">
                  Authority Management System
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                  SYSTEM SECURE
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-heading mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                City Analytics Portal
              </h1>
              <p className="text-muted-foreground text-lg font-medium max-w-xl line-clamp-2">
                Real-time monitoring and administrative control for Delhi's environmental transformation initiatives.
              </p>
            </div>

            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/50 backdrop-blur-sm border-border/50 hover:bg-white hover:shadow-lg transition-all font-bold gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button className="h-12 px-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all font-bold gap-2">
                <RefreshCw className="h-4 w-4" />
                Live Sync
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <StatCard
            title="City Health Score"
            value={avgScore}
            description="Avg. across 250 wards"
            icon={BarChart}
            variant="glass"
            trend={{ value: 2.3, isPositive: false }}
          />
          <StatCard
            title="Active Citizens"
            value={activeUsersCount}
            description="Registered participants"
            icon={Users}
            variant="glass"
          />
          <StatCard
            title="Completed Actions"
            value={totalActionsCount}
            description="All verified goals"
            icon={Target}
            variant="glass"
          />
          <StatCard
            title="Immediate Alerts"
            value={criticalWards}
            description="Critical severity areas"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatCard
            title="Trend Report"
            value={`${improvedWards}%`}
            description="30-day improvements"
            icon={TrendingUpIcon}
            variant="success"
          />
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="overview" className="space-y-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <TabsList className="p-1.5 bg-muted/40 rounded-2xl h-auto border border-border/50 shadow-inner flex-wrap overflow-x-auto">
              <TabsTrigger value="overview" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all">Overview</TabsTrigger>
              <TabsTrigger value="zones" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all">Zones</TabsTrigger>
              <TabsTrigger value="trends" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all">Analytics</TabsTrigger>
              <TabsTrigger value="alerts" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all">Live Alerts</TabsTrigger>
              <TabsTrigger value="verification" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all gap-2">
                Approval Queue
                {pendingSubmissions.filter(s => s.status === 'submitted').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-black">
                    {pendingSubmissions.filter(s => s.status === 'submitted').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="complaints" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold transition-all gap-2">
                Complaints
                {complaints.filter(c => c.status === 'received').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-black">
                    {complaints.filter(c => c.status === 'received').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search Wards..." className="pl-10 h-11 rounded-xl bg-muted/40 border-border/50 focus:bg-white transition-all shadow-sm" />
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-muted/40 border-border/50">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-glass border-none shadow-xl overflow-hidden h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Zone Performance Matrix</CardTitle>
                      <CardDescription>Average city hygiene score by administrative zone</CardDescription>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/5">
                      <TrendingUpIcon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] mt-4 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zoneData}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis
                          dataKey="zone"
                          tick={{ fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 8 }}
                          contentStyle={{
                            background: 'hsla(var(--glass-background))',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid hsla(var(--glass-border))',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-xl)',
                            fontWeight: 'bold'
                          }}
                        />
                        <Bar
                          dataKey="score"
                          fill="url(#barGradient)"
                          radius={[8, 8, 4, 4]}
                          barSize={32}
                          animationBegin={300}
                          animationDuration={1500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-glass border-none shadow-xl h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">Severity Analysis</CardTitle>
                  <CardDescription>Ward distribution by pollution level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pollutionBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {pollutionBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'hsla(var(--glass-background))',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid hsla(var(--glass-border))',
                            borderRadius: '16px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {pollutionBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 transition-hover border border-transparent hover:border-border/50">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{item.name}</span>
                          <span className="font-extrabold text-sm">{item.value} Wards</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top/Bottom Wards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Top Performing Wards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wards
                      .sort((a, b) => b.pollutionScore - a.pollutionScore)
                      .slice(0, 5)
                      .map((ward, index) => (
                        <div key={ward.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-5">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-medium">Ward {ward.id}</div>
                              <div className="text-xs text-muted-foreground">{ward.zone}</div>
                            </div>
                          </div>
                          <Badge variant="pollution-good">{ward.pollutionScore}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Wards Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wards
                      .sort((a, b) => a.pollutionScore - b.pollutionScore)
                      .slice(0, 5)
                      .map((ward, index) => (
                        <div key={ward.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-destructive w-5">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-medium">Ward {ward.id}</div>
                              <div className="text-xs text-muted-foreground">{ward.zone}</div>
                            </div>
                          </div>
                          <Badge variant={`pollution-${getStatusFromScore(ward.pollutionScore)}` as any}>
                            {ward.pollutionScore}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Zone Analysis Tab */}
          <TabsContent value="zones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Comparison</CardTitle>
                <CardDescription>Detailed breakdown by zone with trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zoneData.map((zone) => (
                    <div key={zone.zone} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{zone.zone}</div>
                        <div className="text-sm text-muted-foreground">
                          {wards.filter(w => w.zone === zone.zone).length} wards
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={`pollution-${getStatusFromScore(zone.score)}` as any}>
                          Score: {zone.score}
                        </Badge>
                        <div className={`flex items-center gap-1 text-sm ${zone.trend < 0 ? 'text-success' : 'text-destructive'
                          }`}>
                          {zone.trend < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          {Math.abs(zone.trend)}%
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pollution Trends Over Time</CardTitle>
                <CardDescription>6-month historical data by pollution type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="air" stroke="hsl(200, 80%, 50%)" strokeWidth={2} name="Air Quality" />
                    <Line type="monotone" dataKey="water" stroke="hsl(210, 70%, 35%)" strokeWidth={2} name="Water Quality" />
                    <Line type="monotone" dataKey="waste" stroke="hsl(35, 90%, 50%)" strokeWidth={2} name="Waste Mgmt" />
                    <Line type="monotone" dataKey="noise" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="Noise Level" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>System notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertsData.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${alert.type === 'critical'
                        ? 'bg-destructive/5 border-l-destructive'
                        : alert.type === 'warning'
                          ? 'bg-warning/5 border-l-warning'
                          : 'bg-info/5 border-l-info'
                        }`}
                    >
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.type === 'critical'
                        ? 'text-destructive'
                        : alert.type === 'warning'
                          ? 'text-warning'
                          : 'text-info'
                        }`} />
                      <div className="flex-1">
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-muted-foreground">{alert.time}</div>
                      </div>
                      <Button variant="ghost" size="sm">Dismiss</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Verification Tab (Submitted Actions only) */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Pending Submissions
                    </CardTitle>
                    <CardDescription>Review citizen proof and award points</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading submissions...</p>
                  </div>
                ) : pendingSubmissions.filter(s => s.status === 'submitted').length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingSubmissions.filter(s => s.status === 'submitted').map((sub) => (
                      <Card key={sub.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                        <div className="aspect-video relative group bg-muted flex items-center justify-center">
                          {sub.image_url ? (
                            <img
                              src={sub.image_url}
                              alt="Verification proof"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
                              <Loader2 className="h-8 w-8 opacity-20" />
                              <p className="text-xs">No proof submitted yet</p>
                            </div>
                          )}
                          {sub.image_url && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="secondary" size="sm" className="gap-2" onClick={() => window.open(sub.image_url!, '_blank')}>
                                <Eye className="h-4 w-4" />
                                View Full Size
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-1">
                              <Badge variant="outline">{sub.tasks?.category || 'Goal'}</Badge>
                              <Badge variant={sub.status === 'submitted' ? "default" : "secondary"} className="text-[10px] h-5">
                                {sub.status === 'submitted' ? 'Evidence Provided' : 'Action Taken'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(sub.status === 'submitted' ? (sub.submitted_at || sub.created_at) : sub.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg mb-1">
                            {sub.task_id === 'custom-goal' ? (sub.submission_text || "Custom Goal") : (sub.tasks?.title || `Task: ${sub.task_id}`)}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Users className="h-3 w-3" />
                            {sub.users ? `${sub.users.first_name} ${sub.users.last_name} (Ward ${sub.users.ward_number})` : `User ID: ${sub.user_id.substring(0, 8)}...`}
                          </div>
                          {sub.submission_text && sub.task_id !== 'custom-goal' && (
                            <p className="text-sm border-l-2 border-primary/20 pl-2 mb-4 italic">
                              "{sub.submission_text}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-4">
                            <Label htmlFor={`score-${sub.id}`} className="text-xs">Points:</Label>
                            <Input
                              id={`score-${sub.id}`}
                              type="number"
                              className="h-8 w-20 text-xs"
                              value={customScores[sub.id] || 0}
                              onChange={(e) => setCustomScores({
                                ...customScores,
                                [sub.id]: parseInt(e.target.value) || 0
                              })}
                            />
                          </div>

                          <div className="flex gap-2 pt-2 border-t">
                            <Button className="flex-1 bg-success hover:bg-success/90 gap-2" size="sm" onClick={() => handleApprove(sub)}>
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleReject(sub.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-1">Queue is Empty</h3>
                    <p className="text-muted-foreground">No pending submissions for verification at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participation/Tracking Tab */}
          <TabsContent value="participation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Citizen Action Tracking
                    </CardTitle>
                    <CardDescription>Track which tasks citizens have chosen and award early points</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                        <th className="py-3 px-4">Citizen</th>
                        <th className="py-3 px-4">Action Chosen</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date Taken</th>
                        <th className="py-3 px-4">Points</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {pendingSubmissions.length > 0 ? (
                        pendingSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              {sub.users ? (
                                <>
                                  <div className="font-medium">{sub.users.first_name} {sub.users.last_name}</div>
                                  <div className="text-xs text-muted-foreground">Ward {sub.users.ward_number}</div>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground font-mono">{sub.user_id}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">
                                {sub.task_id === 'custom-goal' ? (sub.submission_text || "Custom Goal") : (sub.tasks?.title || sub.task_id)}
                              </div>
                              <div className="text-xs text-muted-foreground">{sub.tasks?.category || 'Goal'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={sub.status === 'submitted' ? 'default' : 'secondary'} className="text-[10px]">
                                {sub.status === 'submitted' ? 'Submitted' : 'Pending Proof'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                className="h-8 w-16 text-xs"
                                value={customScores[sub.id] || 0}
                                onChange={(e) => setCustomScores({
                                  ...customScores,
                                  [sub.id]: parseInt(e.target.value) || 0
                                })}
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleApprove(sub)}>
                                  <CheckCircle2 className="h-4 w-4 mr-1 text-success" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => handleReject(sub.id)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-muted-foreground italic">
                            No citizen actions tracked at this time.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {lastError && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                    <p className="text-xs font-mono text-destructive break-all font-bold">
                      DEBUG INFO:
                    </p>
                    <p className="text-xs font-mono text-destructive break-all">
                      Error: {lastError}
                    </p>
                    <p className="text-xs font-mono text-destructive break-all">
                      Raw Row Count: {rawCount !== null ? rawCount : 'Unchecked'}
                    </p>
                    <p className="text-xs font-mono text-destructive break-all">
                      Joined Row Count: {pendingSubmissions.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      If Raw &gt; 0 but Joined = 0, RLS is likely blocking the admin from reading associated User/Task records.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Complaint Management
                    </CardTitle>
                    <CardDescription>View reported problems, update timeline, and reward citizens</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingComplaints}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingComplaints ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="active">Active Issues</TabsTrigger>
                      <TabsTrigger value="closed">Closed / Solved</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="active" className="mt-0">
                    {loadingComplaints ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading complaints...</p>
                      </div>
                    ) : complaints.filter(c => c.status !== 'solved').length > 0 ? (
                      <div className="grid gap-6">
                        {complaints.filter(c => c.status !== 'solved').map((comp) => (
                          <Card key={comp.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                            <div className="flex flex-col md:flex-row">
                              {comp.photo_url && (
                                <div className="md:w-64 h-48 md:h-auto bg-muted">
                                  <img
                                    src={comp.photo_url}
                                    alt="Complaint"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{comp.category}</Badge>
                                    <Badge variant="secondary" className="gap-1">
                                      <MapPin className="h-3 w-3" />
                                      Ward {comp.ward_number}
                                    </Badge>
                                    <Badge className={
                                      comp.status === 'solved' ? "bg-success" :
                                        comp.status === 'working' ? "bg-warning" :
                                          comp.status === 'reported' ? "bg-info" : "bg-primary"
                                    }>
                                      {comp.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comp.created_at).toLocaleDateString()}
                                  </span>
                                </div>

                                <h4 className="font-bold text-lg mb-2 capitalize">{comp.category} Issue</h4>
                                <p className="text-sm text-muted-foreground mb-4">{comp.description}</p>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                  <Users className="h-3 w-3" />
                                  By {comp.users ? `${comp.users.first_name} ${comp.users.last_name}` : `User ${comp.user_id.substring(0, 8)}`}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 items-end pt-4 border-t">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">Internal Feedback / Notes</Label>
                                    <textarea
                                      className="w-full min-h-[80px] p-3 rounded-md border text-sm bg-background resize-none"
                                      placeholder="Provide feedback to the citizen..."
                                      value={complaintFeedback[comp.id] || ""}
                                      onChange={(e) => setComplaintFeedback({
                                        ...complaintFeedback,
                                        [comp.id]: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs">Reward Points</Label>
                                        <Input
                                          type="number"
                                          className="h-9"
                                          value={complaintPoints[comp.id] || 0}
                                          onChange={(e) => setComplaintPoints({
                                            ...complaintPoints,
                                            [comp.id]: parseInt(e.target.value) || 0
                                          })}
                                        />
                                      </div>
                                      <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs">Update Status</Label>
                                        <Select
                                          value={comp.status}
                                          onValueChange={(val) => handleUpdateComplaint(comp.id, val)}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="received">Received</SelectItem>
                                            <SelectItem value="reported">Reported</SelectItem>
                                            <SelectItem value="working">Working</SelectItem>
                                            <SelectItem value="solved">Solved</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <Button
                                      className="w-full gap-2"
                                      variant="outline"
                                      onClick={() => handleUpdateComplaint(comp.id, comp.status)}
                                    >
                                      <FileText className="h-4 w-4" />
                                      Save Feedback & Points
                                    </Button>
                                  </div>
                                </div>

                                {/* Timeline preview */}
                                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-dashed">
                                  <Clock className="h-3 w-3" />
                                  History: {comp.timeline?.length || 0} status changes recorded
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-1">No Active Issues</h3>
                        <p className="text-muted-foreground">All complaints have been resolved!</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="closed" className="mt-0">
                    {loadingComplaints ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading history...</p>
                      </div>
                    ) : complaints.filter(c => c.status === 'solved').length > 0 ? (
                      <div className="grid gap-6">
                        {complaints.filter(c => c.status === 'solved').map((comp) => (
                          <Card key={comp.id} className="overflow-hidden border hover:border-success/30 transition-all opacity-90 hover:opacity-100">
                            <div className="flex flex-col md:flex-row">
                              {comp.photo_url && (
                                <div className="md:w-64 h-48 md:h-auto bg-muted grayscale">
                                  <img
                                    src={comp.photo_url}
                                    alt="Complaint"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 p-6 bg-muted/10">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{comp.category}</Badge>
                                    <Badge variant="secondary" className="gap-1">
                                      <MapPin className="h-3 w-3" />
                                      Ward {comp.ward_number}
                                    </Badge>
                                    <Badge className="bg-success text-success-foreground gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      SOLVED
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comp.created_at).toLocaleDateString()}
                                  </span>
                                </div>

                                <h4 className="font-bold text-lg mb-2 capitalize text-muted-foreground strike-through decoration-muted-foreground">{comp.category} Issue</h4>
                                <p className="text-sm text-muted-foreground mb-4 line-through decoration-muted-foreground/50">{comp.description}</p>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                  <Users className="h-3 w-3" />
                                  By {comp.users ? `${comp.users.first_name} ${comp.users.last_name}` : `User ${comp.user_id.substring(0, 8)}`}
                                </div>

                                {comp.admin_feedback && (
                                  <div className="p-4 bg-muted/50 rounded-lg border text-sm">
                                    <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Resolution Notes</div>
                                    {comp.admin_feedback}
                                  </div>
                                )}

                                {/* Re-open option */}
                                <div className="flex justify-end mt-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => handleUpdateComplaint(comp.id, 'working')}
                                  >
                                    Re-open Case
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-1">No Solved Complaints</h3>
                        <p className="text-muted-foreground">Start by marking active issues as solved.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Requests Tab */}
          <TabsContent value="admin-requests" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Admin Access Requests
                    </CardTitle>
                    <CardDescription>Verify and approve new administrative accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Checking for requests...</p>
                  </div>
                ) : pendingAdmins.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAdmins.map((admin) => (
                      <div key={admin.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border-2 bg-muted/30 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{admin.first_name} {admin.last_name}</div>
                            <div className="text-sm text-muted-foreground">{admin.email}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">Requested: {new Date(admin.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 md:flex-none gap-2"
                            onClick={() => handleRejectAdmin(admin.id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            className="flex-1 md:flex-none gap-2"
                            onClick={() => handleApproveAdmin(admin.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve Access
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No Pending Requests</h3>
                    <p className="text-sm text-muted-foreground">All admin accounts are verified.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
};

export default AuthorityDashboard;
