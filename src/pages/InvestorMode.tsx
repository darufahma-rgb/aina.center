import {
  Target, Lightbulb, Shield, Sparkles, TrendingUp, Rocket,
  CheckCircle2, ArrowRight, Zap, Globe, Brain, BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const milestones = [
  { label: "Portal MVP Launched", date: "Mar 2026", done: true },
  { label: "AI Report Assistant Beta", date: "Apr 2026", done: false },
  { label: "10+ Active Users", date: "May 2026", done: false },
  { label: "Partnership Signed with 3 Institutions", date: "Jun 2026", done: false },
  { label: "Revenue Generation Begins", date: "Q3 2026", done: false },
];

const strengths = [
  { icon: Brain, title: "AI-Powered Intelligence", desc: "Built-in AI assistant for report processing and data summarization." },
  { icon: Shield, title: "Structured & Secure", desc: "Role-based access with clear admin and user separation." },
  { icon: Zap, title: "Fast Execution", desc: "Lean team with rapid development cycles and shipping velocity." },
  { icon: Globe, title: "Scalable Architecture", desc: "Modular design ready for growth and institutional adoption." },
];

const keyFeatures = [
  "Centralized Operations Dashboard",
  "Meeting Notes Management (Notulensi)",
  "Financial Tracking & Reporting",
  "Team & Relationship Management",
  "AI Report Assistant (Coming Soon)",
  "Investor-Ready Presentation Mode",
];

export default function InvestorMode() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-4">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" /> Investor Overview
        </div>
        <h1 className="text-4xl font-bold tracking-tight">AINA</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The intelligent operating portal that helps organizations manage, document, and present everything important — in one place.
        </p>
      </div>

      <Separator />

      {/* What is AINA */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> What is AINA?</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          AINA is a modern internal operating portal designed for organizations that need a centralized command center. It combines operations management, documentation, financial tracking, and intelligent reporting into a single, cohesive platform. AINA is built for teams who want structure, clarity, and speed.
        </p>
      </section>

      {/* Problem */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-warning" /> The Problem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Scattered documents across multiple tools",
            "No single source of truth for operations",
            "Manual report formatting wastes hours",
            "Difficult to present progress to stakeholders",
          ].map((p, i) => (
            <div key={i} className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
              <p className="text-sm">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Why This Matters</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Organizations lose 20-30% of productive time on administrative overhead — searching for documents, formatting reports, and preparing presentations. AINA eliminates this friction by providing an integrated, intelligent workspace that turns raw operational data into actionable insights and presentation-ready content.
        </p>
      </section>

      {/* Core Strengths */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Core Strengths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {keyFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Progress & Milestones</h2>
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className={`h-3 w-3 rounded-full shrink-0 ${m.done ? "bg-success" : "bg-border"}`} />
              <div className="flex-1">
                <p className={`text-sm ${m.done ? "font-medium" : ""}`}>{m.label}</p>
              </div>
              <Badge variant={m.done ? "default" : "outline"} className="text-[10px]">{m.date}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Financial Summary */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Funding</p>
              <p className="text-2xl font-bold text-success">Rp 22.5M</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Operational Costs</p>
              <p className="text-2xl font-bold text-foreground">Rp 8.25M</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-primary">Rp 14.25M</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Roadmap */}
      <section className="space-y-4 pb-8">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Roadmap Ahead</h2>
        <div className="space-y-3">
          {[
            { q: "Q2 2026", items: ["AI Report Assistant launch", "PDF export for investor mode", "Email notifications"] },
            { q: "Q3 2026", items: ["Mobile-responsive optimization", "Advanced analytics dashboard", "API integrations"] },
            { q: "Q4 2026", items: ["Multi-organization support", "Revenue model activation", "Public-facing features"] },
          ].map((phase, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Badge className="text-xs shrink-0">{phase.q}</Badge>
                  <div className="space-y-1">
                    {phase.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
