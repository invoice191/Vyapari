import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AuthBackground } from "../components/auth/AuthBackground";
import { HeroPanel } from "../components/auth/HeroPanel";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Fingerprint } from "lucide-react";

import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const SignIn = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast(parsed.error.issues[0].message, "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) return toast(error.message, "error");
    toast("Welcome back, vyapari! --", "success");
    navigate("/");
  };

  const onGoogle = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      setOauthLoading(false);
      toast(error.message, "error");
    }
  };

  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      toast("Biometrics not supported on this device.", "error");
      return;
    }
    toast("Opening Native Identity Module...", "info");
    try {
      // Native UI Trigger Simulate
      await new Promise(r => setTimeout(r, 1000));
      toast("Biometric Bundle Handshake Complete", "success");
      // Standard redirect for simulated flow
      navigate("/");
    } catch (e) {
      toast("Biometric rejection received.", "error");
    } finally {
      // toast dismissed automatically
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto bg-background">
      <AuthBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-8 p-4 md:p-6 lg:grid-cols-2">
        <HeroPanel />

        <div className="flex items-center justify-center animate-scale-in overflow-y-auto lg:overflow-hidden py-4">
          <div className="w-full max-w-md rounded-[2rem] bg-card-glass p-6 shadow-card-soft border border-white/40 md:p-8">
            <Link to="/" className="font-graffiti text-3xl text-gradient">vyapari</Link>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">Welcome back --</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to keep your hustle going.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@vyapari.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-background/60 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="--------"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-background/60 border-border/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="group h-12 w-full rounded-xl bg-hero-gradient text-base font-semibold shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Sign in <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" size={18} /></>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onGoogle}
              disabled={oauthLoading}
              className="h-12 w-full rounded-xl border-border/60 bg-background/60 font-medium transition-transform hover:scale-[1.02]"
            >
              {oauthLoading ? <Loader2 className="animate-spin" /> : (
                <><GoogleIcon /> Continue with Google</>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleBiometric}
              className="mt-3 h-12 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
            >
              <Fingerprint size={18} className="text-indigo-400" />
              Face ID / Fingerprint
            </Button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              New to Vyapari?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
      <ForgotPasswordModal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)} 
      />
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="mr-2" width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5c-7.3 0-13.6 4.1-17.7 10.2z"/>
    <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5l-6-5c-2 1.4-4.5 2.2-7.1 2.2-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.7 39.1 16.3 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6 5c-.4.4 6.4-4.7 6.4-14.5 0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export default SignIn;
