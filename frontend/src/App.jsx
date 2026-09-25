import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import AppLayout from "@/components/layout/AppLayout";
import CityHallProtectedRoute from "@/components/CityHallProtectedRoute";
import CitySearch from "@/pages/CitySearch";
import CitySearchDetails from "@/pages/CitySearchDetails";
import Methodology from "@/pages/Methodology";
import Indicators from "@/pages/Indicators";
import CityHallArea from "@/pages/CityHallArea";
import CityHallConfirmAccount from "@/pages/CityHallConfirmAccount";
import CityHallResetPassword from "@/pages/CityHallResetPassword";
import CityHallPostLogin from "@/pages/CityHallPostLogin";
import CityHallAdmin from "@/pages/CityHallAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/municipios" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/municipios" element={<CitySearch />} />
              <Route path="/municipios/:cityFriendlyName" element={<CitySearchDetails />} />
              <Route path="/metodologias" element={<Methodology />} />
              <Route path="/indicadores" element={<Indicators />} />
              <Route path="/prefeitura" element={<CityHallArea />} />
              <Route path="/prefeitura/confirmar-conta" element={<CityHallConfirmAccount />} />
              <Route path="/prefeitura/redefinir-senha" element={<CityHallResetPassword />} />
              <Route element={<CityHallProtectedRoute allowedRoles={["prefeitura"]} />}>
                <Route path="/prefeitura/pos-login" element={<CityHallPostLogin />} />
              </Route>
              <Route element={<CityHallProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/prefeitura/admin" element={<CityHallAdmin />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
