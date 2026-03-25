import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Share2, BarChart3, Smartphone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <QrCode className="h-7 w-7 text-accent" />
          <span className="font-heading text-xl font-bold text-foreground">CardSync</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/register">Get Started</Link></Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center animate-fade-in">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Your Digital Business Card,{" "}
            <span className="text-accent">One Scan Away</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Create professional digital business cards with dynamic QR codes. Share your contact info instantly — no app needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">Create Your Card Free</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-14 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: "Create Your Card", desc: "Fill in your details — name, title, company, socials, and more." },
              { icon: QrCode, title: "Get Your QR Code", desc: "A unique dynamic QR code is generated for each card. Download or share it." },
              { icon: Share2, title: "Share & Track", desc: "Anyone scans the code to view your card. Track how many times it's been scanned." },
            ].map((f, i) => (
              <div key={i} className="card-elevated p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 mb-5">
                  <f.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} CardSync. Built as a final year project.
      </footer>
    </div>
  );
}
