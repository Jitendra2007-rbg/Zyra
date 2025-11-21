import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingCart, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase";

export const MobileNav = () => {
  const location = useLocation();

  const { userRole } = useAuth();

  // Only show for customer role (not shop or admin pages)
  const isCustomerRole = !location.pathname.startsWith('/shop') && !location.pathname.startsWith('/admin');

  if (!isCustomerRole) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Store, label: "Shops", path: "/shops" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Orders", path: "/orders" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  // Dashboard link removed from here as per request, moved to Profile Settings

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[var(--shadow-strong)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
