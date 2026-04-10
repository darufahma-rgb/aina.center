import { Mail, Plus, Edit, Trash2, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const letters = [
  { title: "Surat Kerjasama PT Maju Bersama", number: "001/AINA/IV/2026", date: "5 Apr 2026", type: "MOU", status: "Signed" },
  { title: "Proposal Hibah Pendidikan", number: "002/AINA/IV/2026", date: "3 Apr 2026", type: "Proposal", status: "Sent" },
  { title: "Surat Undangan Demo Day", number: "003/AINA/III/2026", date: "25 Mar 2026", type: "Undangan", status: "Draft" },
  { title: "Surat Tugas Tim Lapangan", number: "004/AINA/III/2026", date: "20 Mar 2026", type: "Internal", status: "Signed" },
  { title: "Surat Pernyataan Keanggotaan", number: "005/AINA/III/2026", date: "15 Mar 2026", type: "Internal", status: "Signed" },
];

export default function Surat() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Surat" description="Official letters and document management">
        {isAdmin && <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Tambah Surat</Button>}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Judul</TableHead>
                <TableHead className="text-xs">Nomor</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
                <TableHead className="text-xs">Tipe</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">File</TableHead>
                {isAdmin && <TableHead className="text-xs w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {letters.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{l.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{l.number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.date}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{l.type}</Badge></TableCell>
                  <TableCell><Badge variant={l.status === "Signed" ? "default" : l.status === "Sent" ? "secondary" : "outline"} className="text-[10px]">{l.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><FileDown className="h-3.5 w-3.5" /></Button>
                  </TableCell>
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
