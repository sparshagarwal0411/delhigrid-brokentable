import { useState, useEffect, useMemo } from "react";
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
import {
    Loader2, User, Building2, CheckCircle2, Leaf,
    Circle, Square, Triangle, Hexagon, X
} from "lucide-react";
import { WardSelector } from "@/components/WardSelector";

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

    // --- BACKGROUND SHAPES LOGIC (From AuthPage) ---
    const shapes = useMemo(() => {
        const items = [];
        const columns = 12; const rows = 12;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const depth = Math.random() < 0.6 ? 1 : Math.random() < 0.9 ? 2 : 3;
                const sizeBase = depth === 1 ? 8 : depth === 2 ? 15 : 25;
                const speedBase = depth === 1 ? 0.1 : depth === 2 ? 0.3 : 0.6;
                items.push({
                    id: `${row}-${col}`,
                    left: (col * (100 / columns)) + (Math.random() * (100 / columns)),
                    top: (row * (100 / rows)) + (Math.random() * (100 / rows)),
                    size: Math.random() * 5 + sizeBase,
                    parallaxSpeed: speedBase + Math.random() * 0.1,
                    zIndex: depth,
                    type: Math.floor(Math.random() * 5),
                    floatDuration: 10 + Math.random() * 10,
                    floatDelay: Math.random() * 5,
                    floatX: (Math.random() - 0.5) * 60,
                    floatY: (Math.random() - 0.5) * 60
                });
            }
        }
        return items;
    }, []);

    const ShapeIcon = ({ type, className }: { type: number, className?: string }) => {
        const icons = [Circle, Square, Triangle, Hexagon, X];
        const IconComponent = icons[type];
        return <IconComponent className={className} strokeWidth={1.5} />;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({
                x: (e.clientX - window.innerWidth / 2) / window.innerWidth,
                y: (e.clientY - window.innerHeight / 2) / window.innerHeight
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession) {
                navigate("/auth");
                return;
            }
            setSession(currentSession);

            const { data: profiles } = await supabase
                .from("users")
                .select("role")
                .eq("id", currentSession.user.id);

            const profile = profiles && profiles.length > 0 ? profiles[0] : null;

            if (profile) {
                const userProfile = profile as { role: "citizen" | "admin" };
                navigate(userProfile.role === "admin" ? "/authority" : "/citizen");
            } else {
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
                sex: formData.sex,
                ward_number: parseInt(formData.wardNumber),
                role: role,
                is_verified: role === "citizen" ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any);

            if (error) throw error;

            toast({ title: "Welcome!", description: "Your profile has been created." });
            navigate(role === "admin" ? "/admin-pending" : "/citizen");
        } catch (err: any) {
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
            <style>{`
                @keyframes auth-shape-float {
                    0% { transform: translate(0px, 0px) rotate(0deg); }
                    33% { transform: translate(var(--tx), var(--ty)) rotate(10deg); }
                    66% { transform: translate(calc(var(--tx) * -0.5), calc(var(--ty) * -0.5)) rotate(-5deg); }
                    100% { transform: translate(0px, 0px) rotate(0deg); }
                }
            `}</style>

            {/* BACKGROUND SHAPES */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background transition-colors duration-300">
                {shapes.map((shape) => (
                    <div
                        key={shape.id}
                        className="absolute text-slate-800 dark:text-white"
                        style={{
                            top: `${shape.top}%`,
                            left: `${shape.left}%`,
                            zIndex: shape.zIndex === 1 ? 0 : shape.zIndex,
                            transform: `translate(${mousePos.x * -50 * shape.parallaxSpeed}px, ${mousePos.y * -50 * shape.parallaxSpeed}px)`,
                            transition: 'transform 0.1s ease-out',
                            // @ts-ignore
                            "--tx": `${shape.floatX}px`,
                            "--ty": `${shape.floatY}px`
                        }}
                    >
                        <div
                            style={{
                                width: `${shape.size}px`,
                                height: `${shape.size}px`,
                                opacity: shape.zIndex === 1 ? 0.3 : shape.zIndex === 2 ? 0.6 : 1,
                                animation: `auth-shape-float ${shape.floatDuration}s ease-in-out infinite`,
                                animationDelay: `${shape.floatDelay}s`
                            }}
                        >
                            <ShapeIcon type={shape.type} className="w-full h-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center p-4 z-10 overflow-hidden">
                <div className="w-full max-w-md flex flex-col max-h-full">

                    {/* Header */}
                    <div className="text-center mb-6 shrink-0">
                        <div className="inline-flex items-center gap-2 mb-2 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                                <Leaf className="h-7 w-7 text-primary-foreground" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-heading font-bold tracking-tight">Complete Registration</h1>
                        <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself to get started.</p>
                    </div>

                    <Card className="border border-border/40 shadow-xl bg-white dark:bg-slate-950 ring-1 ring-black/5 overflow-y-auto custom-scrollbar">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RadioGroup
                                defaultValue="citizen"
                                value={role}
                                onValueChange={(v: "citizen" | "admin") => setRole(v)}
                                className="grid grid-cols-2 gap-3"
                            >
                                <div>
                                    <RadioGroupItem value="citizen" id="citizen" className="peer sr-only" />
                                    <Label
                                        htmlFor="citizen"
                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-background/50 p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                    >
                                        <User className="mb-2 h-5 w-5" />
                                        <div className="text-center">
                                            <div className="font-semibold text-sm">Citizen</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Report & Earn</div>
                                        </div>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="admin" id="admin" className="peer sr-only" />
                                    <Label
                                        htmlFor="admin"
                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-background/50 p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                                    >
                                        <Building2 className="mb-2 h-5 w-5" />
                                        <div className="text-center">
                                            <div className="font-semibold text-sm">Authority</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Manage Wards</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>

                            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-dashed">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">First Name</Label>
                                        <Input
                                            className="h-9 bg-background/50"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Last Name</Label>
                                        <Input
                                            className="h-9 bg-background/50"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Phone Number</Label>
                                    <Input
                                        className="h-9 bg-background/50"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Age</Label>
                                        <Input
                                            className="h-9 bg-background/50"
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="25"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Sex</Label>
                                        <Select value={formData.sex} onValueChange={v => setFormData({ ...formData, sex: v })}>
                                            <SelectTrigger className="h-9 bg-background/50">
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

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Ward No.</Label>
                                    <div className="[&>button]:h-9 [&>button]:bg-background/50">
                                        <WardSelector
                                            value={formData.wardNumber ? parseInt(formData.wardNumber) : undefined}
                                            onChange={v => setFormData({ ...formData, wardNumber: v.toString() })}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-10 mt-2 shadow-md" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Profile...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Complete Registration
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default OnboardingPage;