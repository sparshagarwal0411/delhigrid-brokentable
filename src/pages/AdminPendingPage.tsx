
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ShieldAlert, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AdminPendingPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    return (
        <Layout showFooter={false}>
            <div className="flex h-[80vh] items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-24 w-24 bg-yellow-100 rounded-full flex items-center justify-center">
                            <ShieldAlert className="h-12 w-12 text-yellow-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold font-heading">Approval Pending</h1>
                        <p className="text-muted-foreground">
                            Your request to join as an **Authority/Admin** is currently under review by existing administrators.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You will gain access to the dashboard once your request is approved.
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <Button variant="outline" onClick={handleLogout} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminPendingPage;
