import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Leaf,
  Menu,
  X,
  MapPin,
  LayoutDashboard,
  Users,
  LogIn,
  LogOut,
  IndianRupee,
  ShoppingBag,
  FileWarning,
  Coins,
  User,
  ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"citizen" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  // New States for Profile & Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Check authentication status & Fetch User Data
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);

          // Get user email as fallback name
          const emailName = session.user.email?.split('@')[0] || "User";

          // Fetch user details from 'users' table
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("role, wallet_balance, full_name")
            .eq("id", session.user.id)
            .single();

          if (profile && !profileError) {
            setUserRole(profile.role as "citizen" | "admin");
            setWalletBalance(profile.wallet_balance || 0);
            setUserName(profile.full_name || emailName);
          } else {
            // Fallback if profile fetch fails
            setUserName(emailName);
          }
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUserRole(null);
        setWalletBalance(0);
        setUserName("");
        return;
      }

      if (session && session.user) {
        setIsAuthenticated(true);
        // Re-fetch profile on auth change to ensure sync
        supabase
          .from("users")
          .select("role, wallet_balance, full_name")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserRole(profile.role as "citizen" | "admin");
              setWalletBalance(profile.wallet_balance || 0);
              setUserName(profile.full_name || session.user.email?.split('@')[0] || "User");
            }
          });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setIsAuthenticated(false);
      setUserRole(null);
      setIsOpen(false);
      setIsDropdownOpen(false);

      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign out error:", error);

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      navigate("/", { replace: true });
    }
  };

  // Determine dashboard path
  const dashboardPath = userRole === "admin" ? "/authority" : "/citizen";

  const navLinks = [
    { to: "/", label: "Home", icon: Leaf },
    { to: "/map", label: "Ward Map", icon: MapPin },
    ...(isAuthenticated && userRole === "citizen" ? [
      { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      { to: "/complaints", label: "Complaints", icon: FileWarning }
    ] : []),
    ...(isAuthenticated && userRole === "admin" ? [
      { to: "/authority", label: "Portal", icon: LayoutDashboard }
    ] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">CleanWard</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive(link.to) ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              const element = document.getElementById('pricing');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                navigate('/');
                setTimeout(() => {
                  const el = document.getElementById('pricing');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
          >
            <IndianRupee className="h-4 w-4" />
            Pricing
          </Button>

          {/* AUTH SECTION (Desktop) */}
          {isAuthenticated ? (
            <div className="relative ml-2" ref={dropdownRef}>
              <div className="flex items-center gap-3">
                {/* Coins Display */}
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{walletBalance.toLocaleString()}</span>
                </div>

                {/* Profile Trigger */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center text-muted-foreground overflow-hidden">
                    <User className="h-5 w-5" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-lg border bg-popover shadow-xl animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/30">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>

                  <div className="p-1">
                    <Link to={dashboardPath} onClick={() => setIsDropdownOpen(false)}>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                        <User className="h-4 w-4" />
                        <span>Profile & Dashboard</span>
                      </div>
                    </Link>

                    <div className="h-px bg-border my-1" />

                    <div
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive text-destructive cursor-pointer transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="civic" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-background animate-slide-down">
          <div className="container py-4 space-y-2">
            {isAuthenticated && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{userName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className="font-medium text-primary">{walletBalance.toLocaleString()} Points</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    View Profile
                  </Button>
                </Link>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive(link.to) ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}

            {isAuthenticated ? (
              <Button
                variant="civic-outline"
                className="w-full gap-2 mt-4 text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={(e) => {
                  setIsOpen(false);
                  handleSignOut(e);
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="civic" className="w-full gap-2 mt-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}