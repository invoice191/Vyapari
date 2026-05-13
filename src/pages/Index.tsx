import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import heroImg from "../assets/vyapari-hero.png";
import { ArrowRight, LogOut, Sparkles } from "lucide-react";
import { AuthBackground } from "../components/auth/AuthBackground";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <AuthBackground />
      <main className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 py-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-card-glass border border-white/40 px-4 py-1.5 text-sm font-medium shadow-soft animate-fade-in">
          <Sparkles size={16} className="text-primary" /> Welcome to Vyapari
        </div>

        <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Your business, <br />
          <span className="font-graffiti text-gradient text-6xl md:text-7xl">amplified.</span>
        </h1>

        <img src={heroImg} alt="Vyapari merchant" width={320} height={320}
          className="my-6 h-auto w-56 md:w-72 drop-shadow-2xl animate-float-slow" />

        <p className="max-w-xl text-md text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {loading ? "Loading-" : user ? `Hey ${user.email?.split("@")[0]} -- You're signed in.` : "Sign in to start tracking sales, stock, and growth - all in one bold place."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {user ? (
            <Button onClick={signOut} variant="outline" className="h-12 rounded-xl px-6">
              <LogOut size={18} className="mr-2" /> Sign out
            </Button>
          ) : (
            <>
              <Button asChild className="group h-12 rounded-xl bg-hero-gradient px-6 text-base font-semibold shadow-glow transition-transform hover:scale-105">
                <Link to="/signup">Get started <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" size={18} /></Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl px-6 text-base font-semibold">
                <Link to="/signin">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
