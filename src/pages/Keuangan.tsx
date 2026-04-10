import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const income = [
  { date: "5 Apr 2026", desc: "Sponsorship — PT Maju Bersama", amount: "Rp 5.000.000", category: "Sponsor" },
  { date: "1 Apr 2026", desc: "Hibah Program Pendidikan", amount: "Rp 10.000.000", category: "Grant" },
  { date: "20 Mar 2026", desc: "Sponsorship — CV Teknologi", amount: "Rp 3.000.000", category: "Sponsor" },
  { date: "10 Mar 2026", desc: "Donasi Alumni", amount: "Rp 2.500.000", category: "Donation" },
  { date: "1 Mar 2026", desc: "Pendapatan Workshop", amount: "Rp 2.000.000", category: "Revenue" },
];

const expenses = [
  { date: "8 Apr 2026", desc: "Server & Cloud Hosting", amount: "Rp 1.200.000", category: "Operations" },
  { date: "5 Apr 2026", desc: "Team Meeting Venue", amount: "Rp 500.000", category: "Operations" },
  { date: "1 Apr 2026", desc: "Software Subscriptions", amount: "Rp 750.000", category: "Tools" },
  { date: "25 Mar 2026", desc: "Marketing Materials", amount: "Rp 2.000.000", category: "Marketing" },
  { date: "15 Mar 2026", desc: "Equipment Purchase", amount: "Rp 3.800.000", category: "Assets" },
];

const sponsors = [
  { name: "PT Maju Bersama", total: "Rp 15.000.000", status: "Active" },
  { name: "CV Teknologi", total: "Rp 8.000.000", status: "Active" },
  { name: "Yayasan Pendidikan", total: "Rp 10.000.000", status: "Completed" },
];

export default function Keuangan() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Keuangan" description="Financial overview and transaction management">
        {isAdmin && (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Tambah Transaksi
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} title="Dana Masuk" value="Rp 22.500.000" trend="+12% dari bulan lalu" trendUp />
        <StatCard icon={TrendingDown} title="Dana Keluar" value="Rp 8.250.000" trend="-5% dari bulan lalu" trendUp />
        <StatCard icon={DollarSign} title="Saldo Tersedia" value="Rp 14.250.000" gradient />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-success flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Dana Masuk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Deskripsi</TableHead>
                  <TableHead className="text-xs text-right">Jumlah</TableHead>
                  {isAdmin && <TableHead className="text-xs w-16"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="text-xs">
                      {item.desc}
                      <Badge variant="outline" className="ml-2 text-[9px]">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-success">{item.amount}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Edit className="h-3 w-3" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Dana Keluar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Deskripsi</TableHead>
                  <TableHead className="text-xs text-right">Jumlah</TableHead>
                  {isAdmin && <TableHead className="text-xs w-16"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="text-xs">
                      {item.desc}
                      <Badge variant="outline" className="ml-2 text-[9px]">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-destructive">{item.amount}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Edit className="h-3 w-3" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Ringkasan Sponsor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nama Sponsor</TableHead>
                <TableHead className="text-xs">Total Kontribusi</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                {isAdmin && <TableHead className="text-xs w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsors.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.total}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
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
