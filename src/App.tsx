import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/TopNav";
import { LoginPage } from "@/components/auth/LoginPage";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "@/store/useStore";
import PDV from "./pages/PDV";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const fetchAll = useStore(s => s.fetchAll);
  const loading = useStore(s => s.loading);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <TopNav />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<PDV />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

const App = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="bottom-right" />
        {isAuthenticated ? <AuthenticatedApp /> : <LoginPage />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
