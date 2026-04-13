import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PortalLayout } from "@/components/PortalLayout";
import { queryClient } from "@/lib/queryClient";
import AIChatWidget from "@/components/AIChatWidget";
import Login from "./pages/Login";
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
import ManageUsers from "./pages/ManageUsers";
import AIReport from "./pages/AIReport";
import Asisten from "./pages/Asisten";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><PortalLayout><Dashboard /></PortalLayout></ProtectedRoute>} />
            <Route path="/notulensi" element={<ProtectedRoute><PortalLayout><Notulensi /></PortalLayout></ProtectedRoute>} />
            <Route path="/fitur" element={<ProtectedRoute><PortalLayout><FiturTerbaru /></PortalLayout></ProtectedRoute>} />
            <Route path="/keuangan" element={<ProtectedRoute><PortalLayout><Keuangan /></PortalLayout></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><PortalLayout><Agenda /></PortalLayout></ProtectedRoute>} />
            <Route path="/anggota" element={<ProtectedRoute><PortalLayout><Anggota /></PortalLayout></ProtectedRoute>} />
            <Route path="/relasi" element={<ProtectedRoute><PortalLayout><Relasi /></PortalLayout></ProtectedRoute>} />
            <Route path="/surat" element={<ProtectedRoute><PortalLayout><Surat /></PortalLayout></ProtectedRoute>} />
            <Route path="/inventaris" element={<ProtectedRoute><PortalLayout><Inventaris /></PortalLayout></ProtectedRoute>} />
            <Route path="/investor" element={<ProtectedRoute><PortalLayout><InvestorMode /></PortalLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><PortalLayout><ManageUsers /></PortalLayout></ProtectedRoute>} />
            <Route path="/ai-report" element={<ProtectedRoute><PortalLayout><AIReport /></PortalLayout></ProtectedRoute>} />
            <Route path="/asisten" element={<ProtectedRoute><PortalLayout><Asisten /></PortalLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
