import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Home, Package, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  // Check if current route is customer role (not shop or admin)
  const isCustomerRole = !location.pathname.startsWith('/shop') && !location.pathname.startsWith('/admin');

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCartCount();

      // Subscribe to cart changes
      const channel = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCartCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setCartCount(count || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-3xl font-bold text-[#132B4C] font-serif tracking-wide">Zyra</span>
            </Link>



            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {isCustomerRole && (
                <>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-8" />
                  </div>
                  <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                    Home
                  </Link>
                  <Link to="/shops" className="text-sm font-medium hover:text-primary transition-colors">
                    Shops
                  </Link>
                </>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isCustomerRole && (
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </Button>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {userRole === 'shop_owner' ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/shop/dashboard">Shop Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/">Customer View</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/profile">Profile</Link>
                        </DropdownMenuItem>
                        {userRole !== 'admin' && (
                          <DropdownMenuItem asChild>
                            <Link to="/orders">Orders</Link>
                          </DropdownMenuItem>
                        )}
                        {userRole === 'admin' && (
                          <DropdownMenuItem asChild>
                            <Link to="/admin/dashboard">Admin Dashboard</Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>

            {/* Mobile Dashboard Button for Shop Owners */}
            <div className="md:hidden flex items-center">
              {user && userRole === 'shop_owner' && (
                <Button size="sm" variant="outline" asChild className="mr-2">
                  <Link to="/shop/dashboard">
                    Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </>
  );
};
