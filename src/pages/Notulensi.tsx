import { FileText, Plus, Edit, Trash2, Users2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";

const notes = [
  {
    title: "Sprint Review — Week 14",
    date: "7 Apr 2026",
    participants: ["Fariz", "Andi", "Sari", "Budi"],
    summary: "Reviewed progress on investor dashboard module. Discussed timeline adjustments for Q2 deliverables.",
    decisions: ["Prioritize investor mode over mobile optimization", "Extend sprint by 2 days"],
    actions: ["Fariz: Finalize investor layout", "Andi: Prepare demo script"],
    status: "Final",
  },
  {
    title: "Board Strategy Meeting",
    date: "3 Apr 2026",
    participants: ["Fariz", "Investor A", "Advisor B"],
    summary: "Strategic direction discussion for AINA expansion. Explored partnership opportunities with education sector.",
    decisions: ["Proceed with education pilot program", "Allocate Rp 5.000.000 for marketing"],
    actions: ["Fariz: Draft partnership proposal", "Sari: Market research report"],
    status: "Draft",
  },
  {
    title: "Partnership Discussion — XYZ Corp",
    date: "1 Apr 2026",
    participants: ["Fariz", "XYZ Rep"],
    summary: "Initial meeting to explore collaboration on AI-powered document processing solutions.",
    decisions: ["Schedule follow-up technical assessment"],
    actions: ["Budi: Prepare technical capability document"],
    status: "Final",
  },
  {
    title: "Weekly Team Sync",
    date: "28 Mar 2026",
    participants: ["Fariz", "Andi", "Sari", "Budi", "Dewi"],
    summary: "Regular sync covering product, operations, and finance updates. All team members reported blockers.",
    decisions: ["Adopt new task management workflow"],
    actions: ["Dewi: Set up new project board", "Andi: Document current processes"],
    status: "Final",
  },
];

export default function Notulensi() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Notulensi" description="Meeting notes and internal documentation">
        {isAdmin && (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Tambah Notulensi
          </Button>
        )}
      </PageHeader>

      <div className="space-y-4">
        {notes.map((note, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm">{note.title}</h3>
                    <Badge variant={note.status === "Final" ? "default" : "secondary"} className="text-[10px]">
                      {note.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                  <div className="flex items-center gap-1.5">
                    <Users2 className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{note.participants.join(", ")}</p>
                  </div>
                  <p className="text-sm text-foreground/80">{note.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keputusan</p>
                      {note.decisions.map((d, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                          <p className="text-xs">{d}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tindak Lanjut</p>
                      {note.actions.map((a, j) => (
                        <p key={j} className="text-xs text-foreground/70">• {a}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
