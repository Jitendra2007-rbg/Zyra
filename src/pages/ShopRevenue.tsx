import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop, supabase } from "@/integrations/supabase";

const ShopRevenue = () => {
  const { shop } = useShop();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop?.id) {
      fetchRevenueData();
    }
  }, [shop]);

  const fetchRevenueData = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalOrders = orders.length;

  // Simple calculation for "This Month" (filtering by current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRevenue = orders
    .filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
    })
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const revenueStats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, trend: "Lifetime" },
    { title: "This Month", value: `₹${monthRevenue.toLocaleString('en-IN')}`, icon: Calendar, trend: "Current" },
    { title: "Total Orders", value: totalOrders.toString(), icon: ShoppingBag, trend: "Lifetime" },
    // { title: "Growth Rate", value: "23%", icon: TrendingUp, trend: "+5%" }, // Hard to calc without history
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/shop/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#132B4C]">Revenue Dashboard</h1>
            <p className="text-muted-foreground">Track your earnings and performance</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {revenueStats.map((stat) => (
            <Card
              key={stat.title}
              className="p-6 border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow bg-[#FAF7F2]"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-[#E7A17A]" />
                <span className="text-sm font-medium text-muted-foreground">{stat.trend}</span>
              </div>
              <h3 className="text-2xl font-bold mb-1 text-[#132B4C]">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 border-0 shadow-[var(--shadow-soft)] bg-[#FAF7F2]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#132B4C]">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-bold text-[#E7A17A]">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D6C3B2]">
                  <th className="text-left py-3 px-4 font-semibold text-[#132B4C]">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#132B4C]">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#132B4C]">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#132B4C]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[#D6C3B2]/50 hover:bg-[#D6C3B2]/10 transition-colors">
                    <td className="py-4 px-4 font-medium text-[#1A1A1A]">#{transaction.id.slice(0, 8)}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${transaction.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[#132B4C]">
                      ₹{Number(transaction.total_amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No orders found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShopRevenue;
