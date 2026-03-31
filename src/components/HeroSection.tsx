import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Eye, Lock, Database, Layers, CheckCircle, Users, Smartphone, ArrowRight, Hash, Fingerprint, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getNetworkStats } from "@/lib/api";
import { useWorldApp, getWorldAppDeepLink } from "@/hooks/useWorldApp";
import { SteleLogoMark } from "./SteleLogo";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Verify Your Humanity",
    desc: "World ID biometric proof confirms you're a real human (Orb or Device). No bots. No fake accounts. 1 person, 1 voice.",
    color: "border-violet-500/40 text-violet-400",
    dot: "bg-violet-400",
  },
  {
    step: "02",
    title: "Seal the Evidence",
    desc: "Your file gets hashed with SHA-256 and uploaded to Storacha (IPFS/Filecoin) via UCAN delegation. No central server can delete it.",
    color: "border-stele-gold/40 text-stele-gold",
    dot: "bg-stele-gold",
  },
  {
    step: "03",
    title: "Anchor on World Chain",
    desc: "The content hash + your World ID nullifier are anchored immutably on World Chain. Tamper-proof. Timestamped. Permanent record.",
    color: "border-emerald-500/40 text-emerald-400",
    dot: "bg-emerald-400",
  },
];

const PILLARS = [
  {
    icon: Shield,
    title: "Identity Sovereignty",
    desc: "World ID Orb verification ensures 1-Human-1-Voice. No bots. No sockpuppets. Biological proof-of-personhood.",
    accent: "text-violet-400",
    border: "border-violet-500/20",
    glow: "hover:border-violet-500/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]",
  },
  {
    icon: Lock,
    title: "Data Permanence",
    desc: "Storacha (IPFS/Filecoin) + UCAN delegations. Content addressed, censorship-resistant. Once published, cannot be erased.",
    accent: "text-stele-gold",
    border: "border-stele-gold/20",
    glow: "hover:border-stele-gold/50 hover:shadow-[0_0_24px_rgba(205,147,60,0.15)]",
  },
  {
    icon: Eye,
    title: "Witness Consensus",
    desc: "Verified humans vouch or flag stories. Reputation built on biological proof: Orb = 10x weight, Device = 1x. All on-chain.",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "hover:border-emerald-500/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]",
  },
];

const PROOF_STEPS = [
  { label: "World ID", icon: Fingerprint, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", hash: "0x1b45fe2b..." },
  { label: "SHA-256", icon: Hash, color: "text-stele-gold", bg: "bg-primary/10 border-primary/30", hash: "5970ce3d7e..." },
  { label: "IPFS / Storacha", icon: Database, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", hash: "bafybei..." },
  { label: "World Chain", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", hash: "0x0f406..." },
];

function ProofCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow orb behind card */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(205,147,60,0.12)_0%,rgba(139,92,246,0.06)_40%,transparent_70%)] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        style={{ perspective: "800px" }}
        className="relative"
      >
        {/* Main card */}
        <div className="relative rounded-2xl border border-foreground/10 bg-card backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] overflow-hidden">
          {/* Card header */}
          <div className="px-5 pt-5 pb-4 border-b border-foreground/8">
            <div className="flex items-center justify-between mb-3">
              <SteleLogoMark size={22} />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                VERIFIED
              </motion.span>
            </div>
            <h3 className="font-display font-bold text-sm text-foreground leading-snug mb-1">
              Cryptocurrency Market Analysis<br />Shows Varied Token Performance
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">Unknown · Governance · 14 Mar 2026</p>
          </div>

          {/* Proof chain */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-3">Cryptographic Proof Chain</p>
            {PROOF_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.4 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${step.bg}`}
              >
                <step.icon className={`w-3.5 h-3.5 shrink-0 ${step.color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-mono uppercase tracking-wider ${step.color}`}>{step.label}</p>
                  <p className="text-[10px] font-mono text-foreground/70 truncate">{step.hash}</p>
                </div>
                <CheckCircle className="w-3 h-3 text-emerald-400/60 shrink-0" />
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 pt-3 border-t border-foreground/8">
              <div className="flex gap-1.5">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-stele-gold"
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-muted-foreground ml-auto">9 vouches · +61 consensus pts</span>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Floating badge — outside motion.div so it centers against the full card width */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="absolute -bottom-4 left-0 right-0 flex justify-center"
      >
        <div className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-foreground/10 backdrop-blur-sm text-[10px] font-mono text-muted-foreground shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Permanently stored on World Chain Sepolia
        </div>
      </motion.div>
    </div>
  );
}

const HeroSection = () => {
  const { data: stats } = useQuery({
    queryKey: ["network-stats"],
    queryFn: getNetworkStats,
    refetchInterval: 30_000,
  });
  const { isWorldApp, appId } = useWorldApp();
  const worldAppLink = getWorldAppDeepLink(appId, "/publish");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background — use bg-background so it switches properly in light mode */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(205,147,60,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(139,92,246,0.07)_0%,transparent_60%)]" />
      {/* Subtle grid — use foreground-tinted lines that work on both modes */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.07)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 w-full">
        <div className="container mx-auto px-6 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ─── LEFT: Text content ─── */}
            <div>
              {/* Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded-full border border-stele-gold/30 text-stele-gold bg-stele-gold/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Human-Verified Truth Network
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  ⬡ World × Protocol Labs Hackathon
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <h1
                  className="font-display font-bold leading-[0.88] tracking-tight"
                  style={{ fontSize: "clamp(4rem, 10vw, 7.5rem)" }}
                >
                  <span className="text-gradient-gold">STELE</span>
                </h1>
                <p className="text-xl md:text-2xl font-display italic text-stele-inscription mt-2">
                  Immutable Witness Protocol
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="text-base md:text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed"
              >
                In the age of synthetic echoes, truth belongs to those who can prove they're real.
                The first censorship-proof journalism protocol, verified by <span className="text-violet-400">World ID</span>, stored on <span className="text-stele-gold">Storacha</span>, anchored on <span className="text-emerald-400">World Chain</span>.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link
                  to="/feed"
                  data-testid="link-read-record"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stele-gold to-amber-500 text-primary-foreground font-body font-semibold text-sm tracking-wide uppercase rounded-xl hover:brightness-110 hover:shadow-[0_0_24px_rgba(205,147,60,0.35)] transition-all active:scale-95 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  Read the Record
                </Link>
                <Link
                  to="/publish"
                  data-testid="link-inscribe-truth"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-foreground font-body font-semibold text-sm tracking-wide uppercase hover:bg-white/10 hover:border-white/25 transition-all backdrop-blur-sm whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Inscribe Truth
                </Link>
                <a
                  href="https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-500/25 text-violet-400 font-body font-semibold text-sm tracking-wide uppercase hover:bg-violet-500/10 hover:border-violet-500/40 transition-all whitespace-nowrap"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  Live Contract ↗
                </a>
              </motion.div>

              {/* Open in World App — mobile only, outside World App */}
              {!isWorldApp && worldAppLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className="mb-10 sm:hidden"
                >
                  <a
                    href={worldAppLink}
                    data-testid="link-open-world-app"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-body font-semibold text-sm tracking-wide uppercase hover:brightness-110 transition-all shadow-lg shadow-violet-900/40"
                  >
                    <Smartphone className="w-4 h-4" />
                    Open in World App
                    <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded-md">Full Experience</span>
                  </a>
                </motion.div>
              )}

              {/* Live stats strip */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap gap-6 px-5 py-3.5 rounded-xl border border-white/8 bg-card/40 backdrop-blur-sm"
                >
                  {[
                    { icon: Database, label: "Sealed", value: stats.total, color: "text-stele-gold", testId: "hero-stat-inscriptions" },
                    { icon: CheckCircle, label: "Verified", value: stats.verified, color: "text-emerald-400", testId: "hero-stat-verified" },
                    { icon: Users, label: "Vouches", value: stats.totalVouches, color: "text-blue-400", testId: "hero-stat-vouches" },
                    { icon: Layers, label: "On-Chain", value: stats.worldChain?.onChainAnchored ?? 0, color: "text-violet-400", testId: "hero-stat-onchain" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2" data-testid={item.testId}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <div>
                        <span className="text-lg font-display font-bold text-foreground">{item.value}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">{item.label}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto text-[9px] font-mono text-muted-foreground/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    live
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── RIGHT: Proof visualization card ─── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:flex justify-center items-center"
            >
              <ProofCard />
            </motion.div>

          </div>
        </div>

        {/* ─── HOW IT WORKS section ─── */}
        <div className="container mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-16"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-3">
              <span className="flex-1 h-px bg-border" />
              How It Works
              <span className="flex-1 h-px bg-border" />
            </p>
            <div className="flex flex-col md:flex-row items-stretch gap-0">
              {HOW_IT_WORKS.flatMap((step, i) => {
                const card = (
                  <div key={step.step} className="flex-1 min-w-0">
                    <div className={`border rounded-xl px-4 py-3 h-full ${step.color} bg-card/30 backdrop-blur-sm transition-all hover:bg-card/60`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${step.dot}`} />
                        <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">{step.step}</span>
                      </div>
                      <h4 className="font-display font-semibold text-sm text-foreground mb-1">{step.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
                const arrow = i < HOW_IT_WORKS.length - 1 ? (
                  <div key={`arrow-${i}`} className="hidden md:flex items-center justify-center px-3 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                ) : null;
                return arrow ? [card, arrow] : [card];
              })}
            </div>
          </motion.div>

          {/* Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {PILLARS.map((pillar, i) => (
              <div
                key={i}
                className={`px-4 py-3.5 bg-card/40 border ${pillar.border} rounded-xl backdrop-blur-sm transition-all duration-300 cursor-default ${pillar.glow}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg border ${pillar.border} flex items-center justify-center shrink-0`}>
                    <pillar.icon className={`w-3.5 h-3.5 ${pillar.accent}`} />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
