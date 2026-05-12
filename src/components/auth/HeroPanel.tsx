import heroImg from "../../assets/vyapari-hero.png";
import { Sparkles, ShieldCheck, Rocket } from "lucide-react";

export const HeroPanel = () => (
  <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-[2rem] bg-hero-gradient p-10 text-primary-foreground shadow-glow">
    {/* Decorative shapes */}
    <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
    <div className="pointer-events-none absolute inset-0 opacity-20" style={{
      backgroundImage: "radial-gradient(white 1.2px, transparent 1.2px)",
      backgroundSize: "22px 22px",
    }} />

    <div className="relative z-10 animate-fade-in">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
        <Sparkles size={16} /> Built for bold merchants
      </div>
      <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight">
        Run your shop like a <span className="font-graffiti block text-6xl mt-2">superstar.</span>
      </h1>
      <p className="mt-5 max-w-md text-lg text-primary-foreground/90">
        Vyapari is the all-in-one toolkit to track sales, manage stock, and grow your business — with a little extra swagger.
      </p>
    </div>

    <div className="relative z-10 flex justify-center -my-2">
      <img
        src={heroImg}
        alt="Vyapari merchant 3D illustration"
        width={400}
        height={400}
        className="h-auto w-[75%] max-w-sm drop-shadow-2xl animate-float-slow"
      />
    </div>

    <div className="relative z-10 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      {[
        { Icon: Rocket, label: "Lightning fast" },
        { Icon: ShieldCheck, label: "Bank-grade safe" },
        { Icon: Sparkles, label: "Loved by 10k+" },
      ].map(({ Icon, label }) => (
        <div key={label} className="rounded-2xl bg-white/15 p-4 backdrop-blur-md transition-transform hover:scale-105">
          <Icon size={20} />
          <p className="mt-2 text-xs font-medium leading-tight">{label}</p>
        </div>
      ))}
    </div>
  </div>
);
