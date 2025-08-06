import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RangeProvider } from "@/contexts/RangeContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

console.log("App.tsx rendered"); // <-- Добавлено

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RangeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider> {/* Wrap the application with AuthProvider */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </RangeProvider>
  </QueryClientProvider>
);

export default App;
