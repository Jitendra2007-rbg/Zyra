import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Map from "@/components/Map";
import { Order } from "@/types";

import { useShop } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShopOrders = () => {
  const { shop } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url,
              shop_id
            )
          )
        `)
        .eq('shop_id', shop?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.id) {
      fetchOrders();
    }
  }, [shop?.id, fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];

    if (activeTab === "pending") {
      filtered = filtered.filter(o => ['pending', 'packed', 'shipped'].includes(o.status));
    } else if (activeTab === "completed") {
      filtered = filtered.filter(o => ['delivered', 'cancelled'].includes(o.status));
    } else {
      // For "all", sort incomplete orders to top
      filtered.sort((a, b) => {
        const aIsCompleted = ['delivered', 'cancelled'].includes(a.status);
        const bIsCompleted = ['delivered', 'cancelled'].includes(b.status);

        if (aIsCompleted === bIsCompleted) {
          // If both are same status type, sort by date desc
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Incomplete orders first (return -1 if a is incomplete and b is complete)
        return aIsCompleted ? 1 : -1;
      });
    }
    return filtered;
  };

  const renderOrderList = (ordersToRender: Order[]) => {
    if (ordersToRender.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No orders found</div>;
    }

    return (
      <div className="space-y-4">
        {ordersToRender.map((order) => (
          <Card key={order.id} className="p-6 border-0 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={order.order_items?.[0]?.products?.image_url || "/placeholder.svg"}
                  alt="Product"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">{order.order_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    Customer: {order.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ordered on {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">{order.order_items?.[0]?.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.order_items?.length > 1 ? `+ ${order.order_items.length - 1} more items` : `Quantity: ${order.order_items?.[0]?.quantity}`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                  <p className="text-xl font-bold text-primary">
                    ₹{order.total_amount.toLocaleString('en-IN')}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">On the Way</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/shop/orders/${order.id}`}>
                      <QrCode className="h-4 w-4 mr-2" />
                      View Details & QR
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

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
          <h1 className="text-3xl font-bold">Manage Orders</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {renderOrderList(getFilteredOrders())}
            </TabsContent>
            <TabsContent value="pending">
              {renderOrderList(getFilteredOrders())}
            </TabsContent>
            <TabsContent value="completed">
              {renderOrderList(getFilteredOrders())}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ShopOrders;
