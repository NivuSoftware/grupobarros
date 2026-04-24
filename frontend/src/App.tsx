import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/lib/AuthContext";

// Carga eager solo la página principal (crítica para LCP)
import Index from "./pages/Index.tsx";

// Resto de páginas con lazy loading (reducen el bundle inicial)
const Admin               = lazy(() => import("./pages/Admin.tsx"));
const Checkout            = lazy(() => import("./pages/Checkout.tsx"));
const Login               = lazy(() => import("./pages/Login.tsx"));
const NotFound            = lazy(() => import("./pages/NotFound.tsx"));
const PurchaseConfirmation = lazy(() => import("./pages/PurchaseConfirmation.tsx"));
const Terms               = lazy(() => import("./pages/Terms.tsx"));

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/compra-confirmada" element={<PurchaseConfirmation />} />
          <Route path="/terminos-y-condiciones" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
