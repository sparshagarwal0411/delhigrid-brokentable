import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WardSearch } from "@/components/WardSearch";
import { StatCard } from "@/components/StatCard";
import { Layout } from "@/components/Layout";
import {
  MapPin,
  Users,
  Building2,
  HeartHandshake,
  Leaf,
  Wind,
  Droplets,
  Volume2,
  ArrowRight,
  CheckCircle,
  Shield,
  BarChart3,
  Info,
  HelpCircle,
  IndianRupee,
  Sparkles,
  Award,
  Zap,
  Target,
  Car,
  Sprout,
  Crown
} from "lucide-react";
import { PollutionCarousel } from "@/components/PollutionCarousel";

// --- Interactive Grid Component ---
const InteractiveGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gap = 40;
      const influenceRadius = 250;

      ctx.lineWidth = 1;

      // Theme-aware Grid Colors
      const isDark = document.documentElement.classList.contains('dark');

      // FIXED: Use Darker Slate-500 ('100, 116, 139') in Light Mode for visibility
      const baseStroke = isDark ? '255, 255, 255' : '100, 116, 139';

      for (let x = 0; x <= canvas.width; x += gap) {
        for (let y = 0; y <= canvas.height; y += gap) {

          if (x + gap <= canvas.width) {
            const centerX = x + gap / 2;
            const centerY = y;
            const dist = Math.sqrt((centerX - mouseX) ** 2 + (centerY - mouseY) ** 2);

            // FIXED: Lower base opacity, but much higher hover boost for light mode
            let alpha = isDark ? 0.05 : 0.15;
            if (dist < influenceRadius) {
              const factor = (influenceRadius - dist) / influenceRadius;
              // Stronger boost (0.7) for light mode so lines pop
              const boost = isDark ? 0.4 : 0.7;
              alpha = alpha + factor * boost;
            }

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + gap, y);
            ctx.strokeStyle = `rgba(${baseStroke}, ${alpha})`;
            ctx.stroke();
          }

          if (y + gap <= canvas.height) {
            const centerX = x;
            const centerY = y + gap / 2;
            const dist = Math.sqrt((centerX - mouseX) ** 2 + (centerY - mouseY) ** 2);

            let alpha = isDark ? 0.05 : 0.15;
            if (dist < influenceRadius) {
              const factor = (influenceRadius - dist) / influenceRadius;
              const boost = isDark ? 0.4 : 0.7;
              alpha = alpha + factor * boost;
            }

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + gap);
            ctx.strokeStyle = `rgba(${baseStroke}, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full pointer-events-none" />;
};

const TYPEWRITER_MESSAGES = [
  "Real-time pollution data for every Delhi ward.",
  "AI-driven insights for a cleaner, greener capital.",
  "Empowering citizens to take collective action today."
];

const Index = () => {
  const [logoError, setLogoError] = useState(false);

  // --- Typewriter State ---
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % TYPEWRITER_MESSAGES.length;
      const fullText = TYPEWRITER_MESSAGES[i];

      setText(isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 20 : 40);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-20 md:py-32 min-h-[80vh] flex flex-col justify-center transition-colors duration-300">

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NDk0OTQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        {/* INTERACTIVE GRID */}
        <InteractiveGrid />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">

            {/* --- HEADER --- */}
            <div className="inline-block mb-2">
              <span className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-slate-600 dark:text-white/90 drop-shadow-sm">
                Government of NCT of Delhi Initiative
              </span>
            </div>

            {/* --- HERO TITLE & LOGOS --- */}
            <div className="flex flex-col items-center justify-center">

              {/* Main Title Row with App Logo Beside */}
              <div className="flex items-center justify-center gap-6 mb-0">
                <div className="relative z-50 p-2 bg-white dark:bg-slate/10 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-white/0">
                  {!logoError ? (
                    <img
                      src="/logo.png"
                      alt="DelhiGrid Logo"
                      className="h-20 w-20 md:h-28 md:w-28 object-contain drop-shadow-2xl"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Shield className="h-20 w-20 md:h-28 md:w-28 text-slate-900 dark:text-white p-2" />
                  )}
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-8xl font-heading font-bold text-slate-900 dark:text-white leading-tight drop-shadow-lg pb-2">
                  DelhiGrid
                </h1>
              </div>

              {/* "By Broken Table" Team Branding */}
              <div className="flex items-center justify-center gap-3 opacity-90 hover:opacity-100 transition-opacity relative z-50 -mt-2">
                <span className="text-xl md:text-2xl font-light text-slate-600 dark:text-white/80 italic font-serif pb-1">
                  by
                </span>

                <img
                  src="/logo_light.png"
                  alt="broken_table"
                  className="h-20 md:h-32 w-auto dark:hidden object-contain"
                />

                <img
                  src="/logo_dark.png"
                  alt="broken_table"
                  className="h-20 md:h-32 w-auto hidden dark:block object-contain"
                />
              </div>
            </div>
            {/* ----------------------------- */}

            {/* --- THIN TYPEWRITER EFFECT --- */}
            <div className="min-h-[40px] flex items-center justify-center -mt-2">
              <p className="text-lg md:text-2xl text-slate-700 dark:text-white font-light tracking-wide drop-shadow-sm leading-relaxed">
                {text}
                <span className="animate-pulse text-emerald-500 font-light ml-1">|</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <WardSearch placeholder="Search your ward by name or number..." />
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link to="/map">
                <Button variant="hero" size="xl" className="gap-2 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-900/20 hover:scale-105 transition-transform">
                  <MapPin className="h-5 w-5" />
                  Explore Ward Map
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="xl" className="gap-2 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-900/20 hover:scale-105 transition-transform">
                  Join as Citizen
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L60 45.7C120 41.3 240 32.7 360 32.3C480 32 600 40 720 48.3C840 56.7 960 65.3 1080 65C1200 64.7 1320 55.3 1380 50.7L1440 46V101H1380C1320 101 1200 101 1080 101C960 101 840 101 720 101C600 101 480 101 360 101C240 101 120 101 60 101H0V50Z" className="fill-slate-50 dark:fill-slate-950" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Total Wards"
              value="250"
              description="Across 12 zones"
              icon={MapPin}
              variant="primary"
            />
            <StatCard
              title="Citizens Engaged"
              value="50+"
              description="Active participants"
              icon={Users}
              variant="success"
            />
            <StatCard
              title="NGOs Registered"
              value="10+"
              description="Partner organizations"
              icon={Building2}
              variant="warning"
            />
            <StatCard
              title="Actions Taken"
              value="10"
              description="This month"
              icon={HeartHandshake}
              variant="primary"
            />
          </div>
        </div>
      </section>

      {/* Pollution Categories */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Comprehensive Pollution Monitoring
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track and understand pollution across key dimensions in your ward
            </p>
          </div>

          <div className="mt-8 pb-16 overflow-visible">
            <PollutionCarousel />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              How DelhiGrid Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From data to action — empowering every citizen to make a difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold transition-colors hover:bg-primary hover:text-white cursor-default">
                1
              </div>
              <h3 className="font-heading text-xl font-semibold">Find Your Ward</h3>
              <p className="text-muted-foreground">
                Search by ward number, name, or explore the interactive map to locate your area
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold transition-colors hover:bg-primary hover:text-white cursor-default">
                2
              </div>
              <h3 className="font-heading text-xl font-semibold">Understand the Data</h3>
              <p className="text-muted-foreground">
                View pollution scores, trends, sources, and educational content specific to your ward
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold transition-colors hover:bg-primary hover:text-white cursor-default">
                3
              </div>
              <h3 className="font-heading text-xl font-semibold">Take Action</h3>
              <p className="text-muted-foreground">
                Follow ward-specific recommendations, file complaints, and earn green points
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Get Involved
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to contribute to Delhi's cleaner future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <HeartHandshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Contribute to the Cause</CardTitle>
                <CardDescription>
                  Support ward-level initiatives financially
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto w-full pb-6">
                <Link to="/contribute">
                  <Button variant="civic-outline" className="w-full">Donate Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">Join as Volunteer</CardTitle>
                <CardDescription>
                  Participate in clean-up drives and awareness campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto w-full pb-6">
                <Link to="/volunteer">
                  <Button variant="civic-outline" className="w-full">Register</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6 text-warning" />
                </div>
                <CardTitle className="text-lg">Register Your NGO</CardTitle>
                <CardDescription>
                  Partner with us for on-ground implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto w-full pb-6">
                <Link to="/ngo">
                  <Button variant="civic-outline" className="w-full">Apply</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-info/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-info" />
                </div>
                <CardTitle className="text-lg">Partner with Municipality</CardTitle>
                <CardDescription>
                  Corporate partnerships for geospatial & sustainable impact
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto w-full pb-6">
                <Link to="/partnership">
                  <Button variant="civic-outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features for Different Users */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card variant="elevated" className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold">For Citizens</h3>
                  <p className="text-muted-foreground">Your personal pollution dashboard</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>View your ward's real-time pollution data</span>
                </li>
                {/* Added Feature from PPT context */}
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>AI-assisted complaint reporting & analysis</span>
                </li>
                {/* Added Feature from PPT context */}
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Earn Green Points & rewards for actions</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Access educational videos and guides</span>
                </li>
              </ul>
              <Link to="/citizen">
                <Button variant="civic-outline" size="lg" className="w-full gap-2">
                  Access Citizen Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </Card>

            <Card variant="elevated" className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold">For Authorities</h3>
                  <p className="text-muted-foreground">Advanced analytics portal</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>City-wide pollution overview and trends</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Ward comparison and ranking analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Resource allocation insights</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Citizen engagement metrics</span>
                </li>
              </ul>
              <Link to="/authority">
                <Button variant="civic-outline" size="lg" className="w-full gap-2">
                  Access Authority Portal
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-slate-100 dark:bg-slate-900 transition-colors duration-300 scroll-mt-16">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Info className="h-3 w-3 mr-1" />
              About Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              About DelhiGrid
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform connecting citizens, authorities, and organizations for cleaner Delhi
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card variant="civic" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold">Our Mission</h3>
              </div>
              <p className="text-muted-foreground">
                DelhiGrid is a government initiative by the NCT of Delhi to create a transparent,
                data-driven approach to pollution management. We empower citizens with real-time
                ward-level pollution data and actionable insights to drive community-led environmental action.
              </p>
            </Card>

            <Card variant="civic" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-heading font-semibold">Our Vision</h3>
              </div>
              <p className="text-muted-foreground">
                To make Delhi one of the cleanest cities in India by fostering citizen participation,
                enabling data-driven policy decisions, and creating a collaborative ecosystem where
                every ward takes ownership of its environmental health.
              </p>
            </Card>

            <Card variant="civic" className="p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <h3 className="text-xl font-heading font-semibold">Who We Are</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                DelhiGrid is developed and maintained by the Delhi Municipal Corporation in partnership
                with the Delhi Pollution Control Committee (DPCC) and Central Pollution Control Board (CPCB).
                Our platform integrates high-precision geospatial data from GSDL and multiple government sources to provide comprehensive
                pollution monitoring across all 250 wards of Delhi.
              </p>
              <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                *Geospatial data aligned with the 2022 Zone & Ward Map provided by <strong>Geospatial Delhi Limited (GSDL)</strong>, A Government of NCT of Delhi Company.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">250</div>
                  <div className="text-sm text-muted-foreground">Wards Covered</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-success mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Data Monitoring</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-info mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">Transparent</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <HelpCircle className="h-3 w-3 mr-1" />
              Frequently Asked Questions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Common Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to the most common questions about DelhiGrid
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    What is DelhiGrid and how does it work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    DelhiGrid is a government platform that provides real-time pollution data for all 250 wards
                    in Delhi. Citizens can search for their ward, view pollution scores across air, water, waste,
                    and noise categories, and access educational resources and action steps to improve their ward's
                    environmental health.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    Do I need to register to use DelhiGrid?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, you can browse ward data, view the map, and access public information without registration.
                    However, creating a free account gives you access to personalized dashboards, goal tracking,
                    educational videos, and the ability to track your environmental impact.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    Is DelhiGrid free to use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, all basic features are completely free. Citizens can access pollution data, educational
                    content, and participate in community initiatives at no cost. We offer optional premium features
                    for advanced analytics and priority support, but the core platform remains free for all citizens.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    Can NGOs or organizations partner with DelhiGrid?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! We welcome partnerships with NGOs, community organizations, and corporate entities.
                    Organizations can register through our platform to participate in clean-up drives, awareness
                    campaigns, and implementation projects. Contact us through the "Register Your NGO" section for more information.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="space-y-4">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    How is the pollution data collected?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our data comes from multiple trusted sources including the Central Pollution Control Board (CPCB),
                    Delhi Pollution Control Committee (DPCC), municipal records, and IoT sensors deployed across
                    Delhi. Data is updated in real-time and verified by government authorities.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    How can I contribute to reducing pollution in my ward?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    There are multiple ways to contribute: join volunteer clean-up drives, participate in tree
                    plantation events, follow ward-specific action recommendations, report pollution incidents,
                    and spread awareness in your community. You can also make donations to support ward-level
                    initiatives through our platform.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    How accurate is the pollution data?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our data is sourced from government-certified monitoring stations and verified by environmental
                    authorities. We update data multiple times daily and use standardized measurement protocols
                    approved by CPCB and DPCC. However, pollution levels can vary within a ward, so data represents
                    average conditions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    How do I report a pollution issue in my area?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Once you're logged into your Citizen Dashboard, you can report pollution incidents directly
                    through the platform. Reports are forwarded to the relevant municipal authorities and
                    tracked for resolution. You can also call our toll-free helpline at 1800-XXX-XXXX for urgent issues.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing/Billing Section - MATCHED HERO BACKGROUND (DARKER) */}
      <section id="pricing" className="py-16 bg-slate-100 dark:bg-slate-900 transition-colors duration-300 scroll-mt-16">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <IndianRupee className="h-3 w-3 mr-1" />
              Pricing & Support
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Affordable Plans for Everyone
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your needs. All plans support our mission to make Delhi cleaner.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Free Plan */}
            <Card variant="civic" className="relative h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Citizen</CardTitle>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <CardDescription>Perfect for individual citizens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div>
                  <div className="text-3xl font-bold">₹0</div>
                  <div className="text-sm text-muted-foreground">Forever free</div>
                </div>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Access to all ward pollution data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Personal dashboard & goal tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Educational videos & guides</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Join volunteer programs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Report pollution incidents</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link to="/auth">
                  <Button variant="civic-outline" className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </Card>

            {/* Premium Plan - Yellow Border & Crown */}
            <Card variant="civic" className="relative border-2 border-yellow-400 h-full flex flex-col shadow-[0_0_30px_rgba(250,204,21,0.15)]">
              {/* Crown Icon */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-background p-2 rounded-full border-2 border-yellow-400 text-yellow-400 shadow-lg z-10">
                <Crown className="h-6 w-6 fill-current" />
              </div>

              <CardHeader className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <Badge variant="outline" className="border-yellow-400 text-yellow-600">₹99/mo</Badge>
                </div>
                <CardDescription>For engaged citizens & small groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div>
                  <div className="text-3xl font-bold">₹99</div>
                  <div className="text-sm text-muted-foreground">per month or ₹999/year</div>
                </div>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Everything in Citizen plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Advanced analytics & trends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Priority support & response</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Early access to new features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Detailed impact reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Ad-free experience</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link to="/payment">
                  {/* Hollow Yellow Style */}
                  <Button
                    variant="outline"
                    className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white shadow-sm transition-colors"
                  >
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Organization Plan */}
            <Card variant="civic" className="relative h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Organization</CardTitle>
                  <Badge variant="secondary">Custom</Badge>
                </div>
                <CardDescription>For NGOs & community groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div>
                  <div className="text-3xl font-bold">₹499</div>
                  <div className="text-sm text-muted-foreground">per month (starting)</div>
                </div>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Everything in Premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Team management (up to 50 members)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Custom reporting & analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Event management tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">API access for integration</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link to="/partnership">
                  <Button variant="civic-outline" className="w-full">Contact Sales</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;