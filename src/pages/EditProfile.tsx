
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Loader2, User, Save, ArrowLeft } from "lucide-react";
import { WardSelector } from "@/components/WardSelector";

const EditProfile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        age: "",
        sex: "",
        wardNumber: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }
            setUserId(session.user.id);

            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            const profile = data as any;

            if (error) {
                console.error("Error fetching profile:", error);
                toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
            } else if (profile) {
                setFormData({
                    firstName: profile.first_name || "",
                    lastName: profile.last_name || "",
                    phone: profile.phone || "",
                    age: profile.age?.toString() || "",
                    sex: profile.sex || "",
                    wardNumber: profile.ward_number?.toString() || "",
                });
            }
            setLoading(false);
        };
        fetchProfile();
    }, [navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setSubmitting(true);
        try {
            const { error } = await (supabase
                .from("users") as any)
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    age: formData.age ? parseInt(formData.age) : null,
                    sex: formData.sex as any,
                    ward_number: formData.wardNumber ? parseInt(formData.wardNumber) : null,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("id", userId);

            if (error) throw error;

            toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
            navigate(-1); // Go back
        } catch (err: any) {
            console.error("Update error:", err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-2xl py-12">
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="flex flex-col gap-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            Edit Profile
                        </h1>
                        <p className="text-muted-foreground mt-2">Update your personal information and location settings.</p>
                    </div>

                    <Card className="border-none shadow-xl bg-glass backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Personal Details
                            </CardTitle>
                            <CardDescription>Only you can see this confidential information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input
                                            id="age"
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sex">Sex</Label>
                                        <Select
                                            value={formData.sex}
                                            onValueChange={v => setFormData({ ...formData, sex: v })}
                                        >
                                            <SelectTrigger className="bg-background/50">
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
                                    <Label>Your Ward</Label>
                                    <div className="p-1 rounded-xl bg-muted/30">
                                        <WardSelector
                                            value={formData.wardNumber ? parseInt(formData.wardNumber) : undefined}
                                            onChange={v => setFormData({ ...formData, wardNumber: v.toString() })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground px-1 italic">
                                        * Changing your ward will update your impact tracking to the new area.
                                    </p>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-11"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl h-11"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default EditProfile;
