import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const items = [
  { name: "Laptop ASUS ROG", category: "Electronics", qty: 2, condition: "Good", holder: "Budi Santoso", notes: "Dev team usage" },
  { name: "Projector Epson", category: "Electronics", qty: 1, condition: "Good", holder: "Office", notes: "Shared for presentations" },
  { name: "Standing Desk", category: "Furniture", qty: 3, condition: "Good", holder: "Office", notes: "Ergonomic desks" },
  { name: "Webcam Logitech C920", category: "Electronics", qty: 4, condition: "Fair", holder: "Team", notes: "For remote meetings" },
  { name: "Whiteboard 120x90", category: "Office Supply", qty: 2, condition: "Good", holder: "Meeting Room", notes: "" },
  { name: "External Monitor 27\"", category: "Electronics", qty: 3, condition: "Good", holder: "Dev Team", notes: "Secondary displays" },
];

export default function Inventaris() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Inventaris" description="Asset and inventory management">
        {isAdmin && <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Tambah Item</Button>}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nama Barang</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs">Jumlah</TableHead>
                <TableHead className="text-xs">Kondisi</TableHead>
                <TableHead className="text-xs">Pemegang</TableHead>
                <TableHead className="text-xs">Catatan</TableHead>
                {isAdmin && <TableHead className="text-xs w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{item.category}</Badge></TableCell>
                  <TableCell className="text-sm">{item.qty}</TableCell>
                  <TableCell><Badge variant={item.condition === "Good" ? "default" : "secondary"} className="text-[10px]">{item.condition}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.holder}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.notes || "—"}</TableCell>
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
