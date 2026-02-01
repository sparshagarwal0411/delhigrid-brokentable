
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole?: "citizen" | "admin";
    requireVerified?: boolean;
}

export const ProtectedRoute = ({ children, allowedRole, requireVerified = true }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setAuthenticated(false);
                setLoading(false);
                return;
            }

            setAuthenticated(true);

            // Fetch profile
            const { data: profiles } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id);

            const profile = profiles && profiles.length > 0 ? profiles[0] : null;

            if (!profile) {
                // No profile? Force onboarding
                navigate("/onboarding");
                return;
            }

            setUserProfile(profile);
            setLoading(false);
        };

        checkAuth();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/auth" replace />;
    }

    // Role Check
    if (allowedRole && userProfile?.role !== allowedRole) {
        return <Navigate to={userProfile?.role === "admin" ? "/authority" : "/citizen"} replace />;
    }

    // Verification Check
    if (requireVerified && userProfile?.role === "admin" && !userProfile?.is_verified) {
        return <Navigate to="/admin-pending" replace />;
    }

    return <>{children}</>;
};
