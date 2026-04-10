import { Sparkles, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";

const features = [
  { name: "AI Report Summarizer", category: "AI", date: "10 Apr 2026", status: "In Progress", description: "Automatically tidy and summarize raw reports into structured documents.", impact: "High" },
  { name: "Role-Based Dashboard", category: "Platform", date: "5 Apr 2026", status: "Completed", description: "Different dashboard views for Admin and Regular users with appropriate controls.", impact: "Medium" },
  { name: "Investor Export PDF", category: "Presentation", date: "2 Apr 2026", status: "Planned", description: "Export investor mode data into a clean, branded PDF document.", impact: "High" },
  { name: "Real-Time Collaboration Notes", category: "Operations", date: "28 Mar 2026", status: "In Progress", description: "Multiple users can edit notulensi simultaneously with live sync.", impact: "Medium" },
  { name: "Financial Dashboard Charts", category: "Analytics", date: "20 Mar 2026", status: "Completed", description: "Visual charts for income, expenses, and financial trends over time.", impact: "High" },
  { name: "Smart Agenda Reminders", category: "Operations", date: "15 Mar 2026", status: "Planned", description: "Automated reminders for upcoming agenda items via email and in-app notifications.", impact: "Low" },
];

const statusColors: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  "In Progress": "bg-warning/10 text-warning",
  Planned: "bg-muted text-muted-foreground",
};

export default function FiturTerbaru() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Fitur Terbaru AINA" description="Track product development and feature progress">
        {isAdmin && (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Tambah Fitur
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{f.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground/70">{f.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                <Badge className={`text-[10px] border-0 ${statusColors[f.status]}`}>{f.status}</Badge>
                <span className="text-[10px] text-muted-foreground">Impact: {f.impact}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{f.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
