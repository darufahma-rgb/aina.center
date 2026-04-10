import { Users, Plus, Edit, Trash2, Mail, Shield, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";

const members = [
  { name: "Fariz Anwar", role: "Founder & Lead", division: "Executive", status: "Active", contact: "fariz@aina.id", access: "Admin" },
  { name: "Andi Pratama", role: "Product Manager", division: "Product", status: "Active", contact: "andi@aina.id", access: "Admin" },
  { name: "Sari Wulandari", role: "Business Development", division: "Business", status: "Active", contact: "sari@aina.id", access: "User" },
  { name: "Budi Santoso", role: "Lead Developer", division: "Engineering", status: "Active", contact: "budi@aina.id", access: "Admin" },
  { name: "Dewi Lestari", role: "Finance & Operations", division: "Operations", status: "Active", contact: "dewi@aina.id", access: "User" },
  { name: "Rizky Maulana", role: "UI/UX Designer", division: "Product", status: "Active", contact: "rizky@aina.id", access: "User" },
  { name: "Putri Handayani", role: "Content Strategist", division: "Marketing", status: "On Leave", contact: "putri@aina.id", access: "User" },
  { name: "Agus Setiawan", role: "Data Analyst", division: "Engineering", status: "Active", contact: "agus@aina.id", access: "User" },
];

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

export default function Anggota() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Anggota" description="Internal team members and access management">
        {isAdmin && (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Tambah Anggota
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((m, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-sm font-semibold">{initials(m.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold truncate">{m.name}</h3>
                    {isAdmin && (
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{m.division}</Badge>
                    <Badge variant={m.status === "Active" ? "default" : "secondary"} className="text-[10px]">{m.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{m.contact}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {m.access === "Admin" ? (
                        <ShieldCheck className="h-3 w-3 text-primary" />
                      ) : (
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{m.access}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
