import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/lib/AuthContext";
import Admin from "./pages/Admin.tsx";
import Checkout from "./pages/Checkout.tsx";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import PurchaseConfirmation from "./pages/PurchaseConfirmation.tsx";
import Terms from "./pages/Terms.tsx";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ScrollToTop />
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
    </AuthProvider>
  </BrowserRouter>
);

export default App;
