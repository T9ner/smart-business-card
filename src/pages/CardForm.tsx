import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function CardForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", job_title: "", organization: "", phone: "", email: "",
    website: "", address: "", linkedin_url: "", instagram_url: "", twitter_url: "",
    status: "active",
  });

  useEffect(() => {
    if (isEdit) {
      supabase.from("business_cards").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { navigate("/dashboard"); return; }
        setForm({
          name: data.name, job_title: data.job_title || "", organization: data.organization || "",
          phone: data.phone || "", email: data.email || "", website: data.website || "",
          address: data.address || "", linkedin_url: data.linkedin_url || "",
          instagram_url: data.instagram_url || "", twitter_url: data.twitter_url || "",
          status: data.status,
        });
      });
    }
  }, [id]);

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isEdit) {
      const { error } = await supabase.from("business_cards").update(form).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Card updated!" }); navigate("/dashboard"); }
    } else {
      const { data: card, error } = await supabase
        .from("business_cards")
        .insert({ ...form, user_id: user.id })
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (card) {
        // Create QR code record
        const qrString = `${window.location.origin}/card/${card.public_id}`;
        await supabase.from("qr_codes").insert({
          card_id: card.id,
          qr_string: qrString,
          qr_type: "dynamic",
        });
        toast({ title: "Card created!" });
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  const fields: { key: string; label: string; type?: string; required?: boolean; placeholder?: string }[] = [
    { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
    { key: "job_title", label: "Job Title", placeholder: "Software Engineer" },
    { key: "organization", label: "Organization", placeholder: "Acme Inc." },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 8900" },
    { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
    { key: "website", label: "Website", type: "url", placeholder: "https://example.com" },
    { key: "address", label: "Address", placeholder: "123 Main St, City" },
    { key: "linkedin_url", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/..." },
    { key: "instagram_url", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/..." },
    { key: "twitter_url", label: "X / Twitter URL", type: "url", placeholder: "https://x.com/..." },
  ];

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="card-elevated p-8">
          <h1 className="font-heading text-2xl font-bold mb-6">{isEdit ? "Edit" : "Create"} Business Card</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                <Input
                  id={f.key}
                  type={f.type || "text"}
                  value={(form as any)[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={e => handleChange("status", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Card" : "Create Card"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
