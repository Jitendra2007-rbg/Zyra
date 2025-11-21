import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppWithLoader from "@/components/AppWithLoader";
import { Suspense, lazy } from "react";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Shops = lazy(() => import("./pages/Shops"));
const ShopDetails = lazy(() => import("./pages/ShopDetails"));
const ShopDashboard = lazy(() => import("./pages/ShopDashboard"));
const ShopOrders = lazy(() => import("./pages/ShopOrders"));
const ShopProducts = lazy(() => import("./pages/ShopProducts"));
const ShopProductNew = lazy(() => import("./pages/ShopProductNew"));
const ShopProductEdit = lazy(() => import("./pages/ShopProductEdit"));
const ShopRevenue = lazy(() => import("./pages/ShopRevenue"));
const ShopSetup = lazy(() => import("./pages/ShopSetup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CheckoutAddress = lazy(() => import("./pages/CheckoutAddress"));
const CheckoutSummary = lazy(() => import("./pages/CheckoutSummary"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// ========================================
// LOADER CONFIGURATION
// ========================================
// Customize these values to match your project theme:
const LOADER_CONFIG = {
  duration: 4000,           // Duration in milliseconds (4000ms = 4 seconds)
  backgroundColor: "#ffffff", // Loader background color
  textColor: "#000000",      // "ZYRA" text color
  dotColor: "#000000",       // Animated dots color
};
// ========================================

const App = () => (
  <AppWithLoader
    loaderDuration={LOADER_CONFIG.duration}
    backgroundColor={LOADER_CONFIG.backgroundColor}
    textColor={LOADER_CONFIG.textColor}
    dotColor={LOADER_CONFIG.dotColor}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          }>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/shops" element={<ProtectedRoute><Shops /></ProtectedRoute>} />
              <Route path="/shop/:id" element={<ProtectedRoute><ShopDetails /></ProtectedRoute>} />
              <Route path="/shop/setup" element={<ProtectedRoute requireRole="shop_owner"><ShopSetup /></ProtectedRoute>} />
              <Route path="/shop/dashboard" element={<ProtectedRoute requireRole="shop_owner"><ShopDashboard /></ProtectedRoute>} />
              <Route path="/shop/orders" element={<ProtectedRoute requireRole="shop_owner"><ShopOrders /></ProtectedRoute>} />
              <Route path="/shop/products" element={<ProtectedRoute requireRole="shop_owner"><ShopProducts /></ProtectedRoute>} />
              <Route path="/shop/products/new" element={<ProtectedRoute requireRole="shop_owner"><ShopProductNew /></ProtectedRoute>} />
              <Route path="/shop/products/:id/edit" element={<ProtectedRoute requireRole="shop_owner"><ShopProductEdit /></ProtectedRoute>} />
              <Route path="/shop/revenue" element={<ProtectedRoute requireRole="shop_owner"><ShopRevenue /></ProtectedRoute>} />
              <Route path="/checkout/address" element={<ProtectedRoute><CheckoutAddress /></ProtectedRoute>} />
              <Route path="/checkout/summary" element={<ProtectedRoute><CheckoutSummary /></ProtectedRoute>} />
              <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AppWithLoader>
);

export default App;
