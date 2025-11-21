import { Navigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "customer" | "shop_owner" | "admin";
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-specific access
  if (requireRole && userRole !== requireRole) {
    // Admin can access everything
    if (userRole === 'admin') {
      return <>{children}</>;
    }
    
    // Redirect based on actual user role
    if (userRole === 'shop_owner') {
      return <Navigate to="/shop/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
