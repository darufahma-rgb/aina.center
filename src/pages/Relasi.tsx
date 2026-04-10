import { Handshake, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const relations = [
  { name: "PT Maju Bersama", institution: "Corporate", role: "Sponsor", status: "Active", notes: "Main sponsor since 2025" },
  { name: "CV Teknologi Nusantara", institution: "Tech Company", role: "Partner", status: "Active", notes: "Technical collaboration" },
  { name: "Yayasan Pendidikan Indonesia", institution: "Foundation", role: "Grant Provider", status: "Completed", notes: "Education program grant" },
  { name: "Universitas Bandung", institution: "University", role: "Academic Partner", status: "Active", notes: "Research collaboration" },
  { name: "Komunitas Developer ID", institution: "Community", role: "Network Partner", status: "Active", notes: "Event co-hosting" },
];

export default function Relasi() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Relasi" description="External relationship tracking">
        {isAdmin && <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Tambah Relasi</Button>}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nama</TableHead>
                <TableHead className="text-xs">Institusi</TableHead>
                <TableHead className="text-xs">Peran</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Catatan</TableHead>
                {isAdmin && <TableHead className="text-xs w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {relations.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.institution}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.role}</Badge></TableCell>
                  <TableCell><Badge variant={r.status === "Active" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.notes}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
