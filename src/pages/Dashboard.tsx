import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { QrCode, Plus, Eye, Pencil, Trash2, BarChart3, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QrModal from "@/components/QrModal";

interface CardWithScans {
  id: string;
  public_id: string;
  name: string;
  job_title: string | null;
  organization: string | null;
  status: string;
  created_at: string;
  scan_count: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [cards, setCards] = useState<CardWithScans[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCardId, setQrCardId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCards = async () => {
    if (!user) return;
    const { data: cardsData, error } = await supabase
      .from("business_cards")
      .select("id, public_id, name, job_title, organization, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    // Get scan counts
    const cardsWithScans: CardWithScans[] = [];
    for (const card of cardsData || []) {
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("card_id", card.id)
        .limit(1);
      
      let scanCount = 0;
      if (qrData && qrData.length > 0) {
        const { count } = await supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("qr_id", qrData[0].id);
        scanCount = count || 0;
      }
      cardsWithScans.push({ ...card, scan_count: scanCount });
    }
    setCards(cardsWithScans);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    const { error } = await supabase.from("business_cards").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchCards();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted">
      <nav className="bg-card border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-accent" />
            <span className="font-heading text-lg font-bold">CardSync</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">My Business Cards</h1>
          <Button asChild className="gap-2">
            <Link to="/cards/new"><Plus className="h-4 w-4" /> New Card</Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : cards.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">No cards yet</h2>
            <p className="text-muted-foreground mb-6">Create your first digital business card</p>
            <Button asChild><Link to="/cards/new">Create Card</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => (
              <div key={card.id} className="card-elevated p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg font-semibold truncate">{card.name}</h3>
                  {card.job_title && <p className="text-sm text-muted-foreground">{card.job_title}</p>}
                  {card.organization && <p className="text-sm text-muted-foreground">{card.organization}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>{card.scan_count} scan{card.scan_count !== 1 ? 's' : ''}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    card.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {card.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild><Link to={`/card/${card.public_id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                  <Button variant="outline" size="sm" asChild><Link to={`/cards/${card.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                  <Button variant="outline" size="sm" onClick={() => setQrCardId(card.id)}>
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(card.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qrCardId && <QrModal cardId={qrCardId} onClose={() => setQrCardId(null)} />}
    </div>
  );
}
