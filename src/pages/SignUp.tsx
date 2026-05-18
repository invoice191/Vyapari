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
import { Eye, EyeOff, Mail, Lock, User, Store, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  business_name: z.string().trim().min(2, "Business name required").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const SignUp = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", business_name: "", phone: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pwStrength = Math.min(4, Math.floor(form.password.length / 3));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast(parsed.error.issues[0].message, "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          business_name: parsed.data.business_name,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);
    if (error) return toast(error.message, "error");
    toast("Account created! Check your email to confirm. --", "success");
    navigate("/signin");
  };

  const onGoogle = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) {
      setOauthLoading(false);
      toast(error.message, "error");
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
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">Start your hustle --</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create an account in under a minute.</p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <Field icon={User} id="full_name" label="Full name" placeholder="Ravi Kumar" value={form.full_name} onChange={set("full_name")} />
              <Field icon={Store} id="business_name" label="Business name" placeholder="Kumar General Store" value={form.business_name} onChange={set("business_name")} />
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Phone} id="phone" label="Phone" placeholder="+91 98xxxxxx" value={form.phone} onChange={set("phone")} />
                <Field icon={Mail} id="email" label="Email" type="email" placeholder="you@vyapari.com" value={form.email} onChange={set("email")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    className="pl-10 pr-10 h-12 rounded-xl bg-background/60 border-border/60"
                    required
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < pwStrength ? (pwStrength <= 1 ? "bg-destructive" : pwStrength === 2 ? "bg-primary-glow" : "bg-primary") : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="group h-12 w-full rounded-xl bg-hero-gradient text-base font-semibold shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Create account <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" size={18} /></>
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
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
                <><GoogleIcon /> Sign up with Google</>
              )}
            </Button>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary" /> No credit card required
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already a vyapari?{" "}
              <Link to="/signin" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  icon: Icon, id, label, value, onChange, placeholder, type = "text",
}: {
  icon: any;
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="pl-10 h-12 rounded-xl bg-background/60 border-border/60" required />
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="mr-2" width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5c-7.3 0-13.6 4.1-17.7 10.2z"/>
    <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5l-6-5c-2 1.4-4.5 2.2-7.1 2.2-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.7 39.1 16.3 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6 5c-.4.4 6.4-4.7 6.4-14.5 0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export default SignUp;
