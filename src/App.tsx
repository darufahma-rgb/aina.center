import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { PortalLayout } from "@/components/PortalLayout";
import Dashboard from "./pages/Dashboard";
import Notulensi from "./pages/Notulensi";
import FiturTerbaru from "./pages/FiturTerbaru";
import Keuangan from "./pages/Keuangan";
import Agenda from "./pages/Agenda";
import Anggota from "./pages/Anggota";
import Relasi from "./pages/Relasi";
import Surat from "./pages/Surat";
import Inventaris from "./pages/Inventaris";
import InvestorMode from "./pages/InvestorMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PortalLayout><Dashboard /></PortalLayout>} path="/" />
            <Route element={<PortalLayout><Notulensi /></PortalLayout>} path="/notulensi" />
            <Route element={<PortalLayout><FiturTerbaru /></PortalLayout>} path="/fitur" />
            <Route element={<PortalLayout><Keuangan /></PortalLayout>} path="/keuangan" />
            <Route element={<PortalLayout><Agenda /></PortalLayout>} path="/agenda" />
            <Route element={<PortalLayout><Anggota /></PortalLayout>} path="/anggota" />
            <Route element={<PortalLayout><Relasi /></PortalLayout>} path="/relasi" />
            <Route element={<PortalLayout><Surat /></PortalLayout>} path="/surat" />
            <Route element={<PortalLayout><Inventaris /></PortalLayout>} path="/inventaris" />
            <Route element={<PortalLayout><InvestorMode /></PortalLayout>} path="/investor" />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
