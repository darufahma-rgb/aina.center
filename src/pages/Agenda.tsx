import { CalendarDays, Plus, Edit, Trash2, MapPin, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";

const agendaItems = [
  { name: "Team Standup", date: "11 Apr 2026", time: "09:00", location: "Online — Google Meet", pic: "Fariz", status: "Confirmed" },
  { name: "Investor Pitch Preparation", date: "14 Apr 2026", time: "14:00", location: "Office — Meeting Room A", pic: "Fariz", status: "Pending" },
  { name: "Product Demo Day", date: "18 Apr 2026", time: "10:00", location: "Co-working Space Bandung", pic: "Andi", status: "Confirmed" },
  { name: "Partnership Review — XYZ Corp", date: "21 Apr 2026", time: "15:00", location: "Online — Zoom", pic: "Sari", status: "Pending" },
  { name: "Monthly Financial Review", date: "25 Apr 2026", time: "11:00", location: "Office — Meeting Room B", pic: "Dewi", status: "Confirmed" },
  { name: "Team Building Event", date: "30 Apr 2026", time: "08:00", location: "Lembang, Bandung", pic: "Budi", status: "Planned" },
];

const statusStyles: Record<string, string> = {
  Confirmed: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Planned: "bg-muted text-muted-foreground",
};

export default function Agenda() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Agenda" description="Upcoming plans and activities">
        {isAdmin && (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Tambah Agenda
          </Button>
        )}
      </PageHeader>

      <div className="space-y-3">
        {agendaItems.map((item, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-primary font-medium">{item.date.split(" ")[1]}</span>
                    <span className="text-lg font-bold text-primary leading-none">{item.date.split(" ")[0]}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />PIC: {item.pic}</span>
                    </div>
                    <Badge className={`text-[10px] border-0 ${statusStyles[item.status]}`}>{item.status}</Badge>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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
