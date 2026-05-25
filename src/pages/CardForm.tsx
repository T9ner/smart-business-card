import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Eye, EyeOff, Palette } from "lucide-react";

const DEFAULT_VISIBLE = {
  phone: true, email: true, website: true, address: true,
  linkedin_url: true, instagram_url: true, twitter_url: true,
};

const DEFAULT_THEME = {
  primaryColor: "#1a365d",
  accentColor: "#2d9c83",
  backgroundColor: "#f8fafc",
};

export default function CardForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  const [form, setForm] = useState({
    name: "", job_title: "", organization: "", phone: "", email: "",
    website: "", address: "", linkedin_url: "", instagram_url: "", twitter_url: "",
    status: "active",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [theme, setTheme] = useState(DEFAULT_THEME);

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
        setAvatarUrl(data.avatar_url || null);
        const vf = data.visible_fields;
        if (typeof vf === "object" && vf !== null) setVisibleFields(vf as Record<string, boolean>);
        const th = data.theme;
        if (typeof th === "object" && th !== null) setTheme(th as typeof DEFAULT_THEME);
      });
    }
  }, [id]);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleVisibility = (field: string) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload = {
      ...form,
      avatar_url: avatarUrl,
      visible_fields: visibleFields,
      theme,
    };

    if (isEdit) {
      const { error } = await supabase.from("business_cards").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Card updated!" }); navigate("/dashboard"); }
    } else {
      const { data: card, error } = await supabase
        .from("business_cards")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (card) {
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

  const fields: { key: string; label: string; type?: string; required?: boolean; placeholder?: string; toggleable?: boolean }[] = [
    { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
    { key: "job_title", label: "Job Title", placeholder: "Software Engineer" },
    { key: "organization", label: "Organization", placeholder: "Acme Inc." },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+234 801 234 5678", toggleable: true },
    { key: "email", label: "Email", type: "email", placeholder: "john@example.com", toggleable: true },
    { key: "website", label: "Website", type: "url", placeholder: "https://example.com", toggleable: true },
    { key: "address", label: "Address", placeholder: "123 Main St, City", toggleable: true },
    { key: "linkedin_url", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/...", toggleable: true },
    { key: "instagram_url", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/...", toggleable: true },
    { key: "twitter_url", label: "X / Twitter URL", type: "url", placeholder: "https://x.com/...", toggleable: true },
  ];

  return (
    <div className="min-h-screen bg-muted px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="card-elevated p-8">
          <h1 className="font-heading text-2xl font-bold mb-6">{isEdit ? "Edit" : "Create"} Business Card</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4 pb-4 border-b">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-accent/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </div>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
              </div>
            </div>

            {/* Form Fields */}
            {fields.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                  {f.toggleable && (
                    <button
                      type="button"
                      onClick={() => toggleVisibility(f.key)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                        visibleFields[f.key] !== false
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                      title={visibleFields[f.key] !== false ? "Visible to viewers" : "Hidden from viewers"}
                    >
                      {visibleFields[f.key] !== false ? (
                        <><Eye className="h-3 w-3" /> Visible</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Hidden</>
                      )}
                    </button>
                  )}
                </div>
                <Input
                  id={f.key}
                  type={f.type || "text"}
                  value={(form as any)[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  required={f.required}
                  className={visibleFields[f.key] === false ? "opacity-50" : ""}
                />
              </div>
            ))}

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Theme Customization Toggle */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowCustomization(!showCustomization)}
                className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <Palette className="h-4 w-4" />
                {showCustomization ? "Hide" : "Customize"} Card Theme
              </button>

              {showCustomization && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3 animate-slide-up">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="primaryColor"
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accentColor" className="text-xs">Accent Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="accentColor"
                          type="color"
                          value={theme.accentColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.accentColor}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bgColor" className="text-xs">Background</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="bgColor"
                          type="color"
                          value={theme.backgroundColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{theme.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                  {/* Live preview strip */}
                  <div
                    className="rounded-lg h-12 flex items-center justify-center text-white text-sm font-medium"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
                  >
                    Preview: {form.name || "Your Name"}
                  </div>
                </div>
              )}
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
