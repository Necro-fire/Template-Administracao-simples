import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/TopNav";
import { LoginPage } from "@/components/auth/LoginPage";
import { useAuthStore } from "@/store/authStore";
import PDV from "./pages/PDV";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedApp() {
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
