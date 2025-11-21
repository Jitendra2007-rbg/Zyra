import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingBag, TrendingUp, DollarSign, AlertCircle, Home, Shield, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useShop, useAuth } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect } from "react";

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { shop, loading } = useShop();
  const { userRole } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    completedOrders: 0,
    revenue: 0,
    followers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Redirect to shop setup if no shop exists
  useEffect(() => {
    if (!loading && userRole === 'shop_owner' && !shop) {
      navigate('/shop/setup');
    }
  }, [shop, loading, userRole, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!shop?.id) return;

      try {
        // Fetch products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .eq('is_active', true);

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('status, total_amount')
          .eq('shop_id', shop.id);

        const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
        const totalRevenue = orders?.filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

        // Fetch followers count
        const { count: followersCount } = await supabase
          .from('shop_followers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);

        setStats({
          products: productsCount || 0,
          orders: orders?.length || 0,
          completedOrders,
          revenue: totalRevenue,
          followers: followersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (shop?.id) {
      fetchStats();
    }
  }, [shop]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Shop Found</h2>
              <p className="text-muted-foreground mb-6">
                You need to create a shop to access the dashboard.
              </p>
              <Button asChild>
                <Link to="/auth">Go to Setup</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!shop.is_active) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your shop registration request has been sent to the admin. You'll be able to add and sell products once your shop is approved.
            </AlertDescription>
          </Alert>

          <Card className="p-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">Shop Pending Approval</h2>
              <p className="text-muted-foreground mb-2">
                Thank you for registering your shop "{shop.name}"!
              </p>
              <p className="text-muted-foreground mb-6">
                Our admin team is reviewing your application. Once approved, you'll be able to:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground mb-6">
                <li>• Add and manage products</li>
                <li>• Sell your products to customers</li>
                <li>• Track orders and revenue</li>
                <li>• Manage your shop details</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Please wait for admin approval to access the full dashboard features.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Browse as Customer
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Products",
      value: stats.products.toString(),
      icon: Package,
      color: "text-[#E7A17A]",
    },
    {
      title: "Total Orders",
      value: stats.orders.toString(),
      icon: ShoppingBag,
      color: "text-[#E7A17A]",
    },
    {
      title: "Followers",
      value: (stats as any).followers?.toString() || "0",
      icon: Users,
      color: "text-[#E7A17A]",
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: "text-[#E7A17A]",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {shop.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your store today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <Card
              key={stat.title}
              className="p-6 border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <h3 className="text-2xl font-bold mb-1">{loadingStats ? "..." : stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="p-6 border-0 shadow-[var(--shadow-soft)] mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto py-4">
              <Link to="/shop/products/new">Add Product</Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/shop/orders">Manage Orders</Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/shop/products">View Products</Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/shop/revenue">View Revenue</Link>
            </Button>
          </div>
        </Card>

        {/* Role Switcher */}
        {userRole && (
          <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-bold mb-4">Switch Views</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto py-4">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Customer View
                </Link>
              </Button>
              {userRole === 'admin' && (
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link to="/admin/dashboard">
                    <Shield className="mr-2 h-5 w-5" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
