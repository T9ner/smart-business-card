import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Globe, MapPin, Linkedin, Instagram, Twitter } from "lucide-react";

interface CardData {
  name: string;
  job_title: string | null;
  organization: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
}

export default function PublicCard() {
  const { publicId } = useParams();
  const [card, setCard] = useState<CardData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!publicId) return;
    
    const load = async () => {
      const { data, error } = await supabase
        .from("business_cards")
        .select("name, job_title, organization, phone, email, website, address, linkedin_url, instagram_url, twitter_url, id, status")
        .eq("public_id", publicId)
        .eq("status", "active")
        .single();

      if (error || !data) { setNotFound(true); return; }
      setCard(data);

      // Log scan
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("card_id", data.id)
        .limit(1);
      
      if (qrData && qrData.length > 0) {
        await supabase.from("scan_logs").insert({ qr_id: qrData[0].id });
      }
    };
    load();
  }, [publicId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Card Not Found</h1>
          <p className="text-muted-foreground">This business card doesn't exist or is inactive.</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const contactItems: { icon: typeof Phone; label: string; value: string | null; href?: string }[] = [
    { icon: Phone, label: "Phone", value: card.phone, href: card.phone ? `tel:${card.phone}` : undefined },
    { icon: Mail, label: "Email", value: card.email, href: card.email ? `mailto:${card.email}` : undefined },
    { icon: Globe, label: "Website", value: card.website, href: card.website || undefined },
    { icon: MapPin, label: "Address", value: card.address },
  ];

  const socialItems = [
    { icon: Linkedin, value: card.linkedin_url, label: "LinkedIn" },
    { icon: Instagram, value: card.instagram_url, label: "Instagram" },
    { icon: Twitter, value: card.twitter_url, label: "X / Twitter" },
  ];

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="hero-gradient rounded-t-2xl px-8 py-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-primary-foreground font-heading">
            {card.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-heading text-2xl font-bold text-primary-foreground">{card.name}</h1>
          {card.job_title && <p className="text-primary-foreground/80 mt-1">{card.job_title}</p>}
          {card.organization && <p className="text-primary-foreground/60 text-sm mt-1">{card.organization}</p>}
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-b-2xl shadow-lg px-6 py-6 space-y-4">
          {contactItems.map((item, i) => item.value && (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-accent truncate block">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                )}
              </div>
            </div>
          ))}

          {socialItems.some(s => s.value) && (
            <div className="flex gap-3 pt-4 border-t justify-center">
              {socialItems.map((s, i) => s.value && (
                <a key={i} href={s.value} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
                  title={s.label}>
                  <s.icon className="h-5 w-5 text-accent" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
