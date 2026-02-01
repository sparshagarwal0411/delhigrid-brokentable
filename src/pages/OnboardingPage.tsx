
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Loader2, User, Building2, CheckCircle2 } from "lucide-react";
import { WardSelector } from "@/components/WardSelector";

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState<any>(null);

    // Form State
    const [role, setRole] = useState<"citizen" | "admin">("citizen");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        age: "",
        sex: "",
        wardNumber: "",
    });

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession) {
                navigate("/auth");
                return;
            }
            setSession(currentSession);

            // Check if profile already exists
            const { data: profiles } = await supabase
                .from("users")
                .select("role")
                .eq("id", currentSession.user.id);

            const profile = profiles && profiles.length > 0 ? profiles[0] : null;

            if (profile) {
                // User already has a profile, redirect to dashboard
                const userProfile = profile as { role: "citizen" | "admin" };
                navigate(userProfile.role === "admin" ? "/authority" : "/citizen");
            } else {
                // Pre-fill email/name from metadata if available
                const meta = currentSession.user.user_metadata;
                if (meta) {
                    const fullName = meta.full_name || meta.name || "";
                    const [first = "", ...rest] = fullName.split(" ");
                    setFormData(prev => ({
                        ...prev,
                        firstName: first,
                        lastName: rest.join(" ")
                    }));
                }
                setLoading(false);
            }
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.wardNumber || !formData.age || !formData.sex) {
            toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from("users").insert({
                id: session.user.id,
                email: session.user.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                age: parseInt(formData.age),
                sex: formData.sex, // 'male', 'female', 'other'
                ward_number: parseInt(formData.wardNumber),
                role: role,
                is_verified: role === "citizen" ? true : false, // Admins need verification
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any);

            if (error) throw error;

            toast({ title: "Welcome!", description: "Your profile has been created." });

            if (role === "admin") {
                navigate("/admin-pending");
            } else {
                navigate("/citizen");
            }
        } catch (err: any) {
            console.error("Onboarding error:", err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Layout showFooter={false}>
            <div className="container max-w-lg py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-bold">Complete Registration</h1>
                    <p className="text-muted-foreground mt-2">Tell us a bit about yourself to get started.</p>
                </div>

                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Select Account Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup
                            defaultValue="citizen"
                            value={role}
                            onValueChange={(v: "citizen" | "admin") => setRole(v)}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="citizen" id="citizen" className="peer sr-only" />
                                <Label
                                    htmlFor="citizen"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                >
                                    <User className="mb-3 h-6 w-6" />
                                    <div className="text-center">
                                        <div className="font-semibold">Citizen</div>
                                        <div className="text-xs text-muted-foreground mt-1">Report issues & earn rewards</div>
                                    </div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="admin" id="admin" className="peer sr-only" />
                                <Label
                                    htmlFor="admin"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                >
                                    <Building2 className="mb-3 h-6 w-6" />
                                    <div className="text-center">
                                        <div className="font-semibold">Authority</div>
                                        <div className="text-xs text-muted-foreground mt-1">Manage wards & complaints</div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input
                                        type="number"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                        placeholder="25"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sex</Label>
                                    <Select value={formData.sex} onValueChange={v => setFormData({ ...formData, sex: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ward No.</Label>
                                <WardSelector
                                    value={formData.wardNumber ? parseInt(formData.wardNumber) : undefined}
                                    onChange={v => setFormData({ ...formData, wardNumber: v.toString() })}
                                />
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Profile...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Complet Registration
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default OnboardingPage;
