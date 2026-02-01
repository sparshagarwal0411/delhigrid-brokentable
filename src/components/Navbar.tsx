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
  User,
  ChevronDown,
  Coins
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const fetchUserData = async (userId: string) => {
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (profile) {
      setUserData(profile);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          await fetchUserData(session.user.id);
        } else {
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUserData(null);
        return;
      }
      if (session) {
        setIsAuthenticated(true);
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDropdownOpen(false);
    setIsOpen(false);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Leaf },
    { to: "/map", label: "Ward Map", icon: MapPin },
    ...(isAuthenticated && userData?.role === "admin" ? [{ to: "/authority", label: "Authority Portal", icon: LayoutDashboard }] : []),
    ...(isAuthenticated && userData?.role === "citizen" ? [
      { to: "/citizen", label: "Citizen Dashboard", icon: Users },
      { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      { to: "/complaints", label: "Complaints", icon: FileWarning }
    ] : []),
  ];

  const dashboardPath = userData?.role === "admin" ? "/authority" : "/citizen";
  const userName = userData ? `${userData.first_name} ${userData.last_name}` : "User";
  const userRole = userData?.role || "user";
  const tokens = userData?.score || 0;

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
                className="gap-2 rounded-xl"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Token Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 shadow-sm">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Coins className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">{tokens} Tokens</span>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 px-2 hover:bg-muted rounded-full"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md">
                    <User className="h-4 w-4" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-12 w-64 rounded-2xl border bg-popover shadow-2xl animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                      <div className="px-5 py-4 border-b bg-muted/20 backdrop-blur-md">
                        <p className="text-sm font-bold truncate leading-none mb-1">{userName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{userRole} Account</p>
                      </div>

                      <div className="p-1.5">
                        <Link to={dashboardPath} onClick={() => setIsDropdownOpen(false)}>
                          <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-primary/10 hover:text-primary cursor-pointer transition-all duration-200">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span>My Dashboard</span>
                          </div>
                        </Link>

                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)}>
                          <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-primary/10 hover:text-primary cursor-pointer transition-all duration-200 mt-1">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <span>Edit Profile</span>
                          </div>
                        </Link>

                        <div className="h-px bg-border my-1.5 mx-2" />

                        <div
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-destructive/10 hover:text-destructive text-destructive cursor-pointer transition-all duration-200"
                        >
                          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span>Sign Out</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="civic" size="sm" className="gap-2 px-6 rounded-full shadow-lg shadow-primary/20">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 mr-1">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{tokens}</span>
            </div>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-top duration-300">
          <div className="container py-6 space-y-2">
            {isAuthenticated && (
              <div className="flex items-center gap-4 p-4 mb-4 rounded-2xl bg-muted/50 border">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">{userName}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{userRole}</div>
                </div>
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
                  className="w-full justify-start gap-4 h-12 rounded-xl text-base font-semibold"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Button>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-4 h-12 rounded-xl text-base font-semibold"
                  >
                    <User className="h-5 w-5" />
                    Edit Profile
                  </Button>
                </Link>
                <div className="h-px bg-border my-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-4 h-12 rounded-xl text-base font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="civic" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-4">
                  <LogIn className="h-5 w-5 mr-2" />
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