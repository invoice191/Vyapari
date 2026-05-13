import { Coins, ShoppingBag, TrendingUp, Sparkles, Zap, IndianRupee, Store, BadgePercent } from "lucide-react";

const floaters = [
  { Icon: IndianRupee, top: "8%", left: "6%", delay: "0s", color: "text-primary", size: 28 },
  { Icon: Coins, top: "18%", left: "82%", delay: "1.2s", color: "text-accent", size: 32 },
  { Icon: ShoppingBag, top: "70%", left: "10%", delay: "0.6s", color: "text-secondary", size: 30 },
  { Icon: TrendingUp, top: "82%", left: "78%", delay: "2s", color: "text-primary", size: 26 },
  { Icon: Sparkles, top: "40%", left: "92%", delay: "0.3s", color: "text-accent", size: 22 },
  { Icon: Zap, top: "55%", left: "4%", delay: "1.8s", color: "text-secondary", size: 24 },
  { Icon: Store, top: "30%", left: "50%", delay: "2.4s", color: "text-primary/40", size: 36 },
  { Icon: BadgePercent, top: "92%", left: "45%", delay: "1s", color: "text-accent/60", size: 22 },
];

export const AuthBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden bg-mesh">
    {/* Blobs */}
    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
    <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary/30 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
    <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

    {/* Graffiti grid dots */}
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />

    {/* Floating icons */}
    {floaters.map(({ Icon, top, left, delay, color, size }, i) => (
      <div
        key={i}
        className="absolute animate-float"
        style={{ top, left, animationDelay: delay }}
      >
        <Icon className={color} size={size} strokeWidth={2.2} />
      </div>
    ))}

    {/* Graffiti tag */}
    <div className="absolute bottom-6 left-6 select-none font-graffiti text-6xl text-primary/10 leading-none">
      vyapari
    </div>
    <div className="absolute top-6 right-8 select-none font-graffiti text-3xl text-secondary/15 leading-none rotate-6">
      Rs. hustle
    </div>
  </div>
);
