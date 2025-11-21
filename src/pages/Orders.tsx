import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrders } from "@/integrations/supabase";

const Orders = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { orders, loading } = useOrders();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      "pending": { label: "Pending", icon: Package, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      "packed": { label: "Packed", icon: Package, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      "shipped": { label: "On the Way", icon: Truck, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
      "delivered": { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      "cancelled": { label: "Cancelled", icon: Package, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    const config = statusConfig[status] || statusConfig["pending"];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterOrders = (status?: string) => {
    if (!status || status === "all") return orders;
    if (status === "ongoing") return orders.filter(o => ['pending', 'packed', 'shipped'].includes(o.status));
    return orders.filter(o => o.status === status);
  };

  const renderOrderCard = (order: any) => (
    <Card key={order.id} className="p-6 border-0 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">{order.order_number}</h3>
          <p className="text-sm text-muted-foreground">
            Ordered on {new Date(order.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {order.order_items?.map((item: any, idx: number) => (
        <div key={idx} className="flex gap-4 mb-4">
          <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={item.products?.image_url || "/placeholder.svg"}
              alt={item.products?.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{order.shops?.name}</p>
            <h4 className="font-semibold mb-1">{item.products?.name}</h4>
            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
            {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
            {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="font-semibold">Total Amount</p>
        <p className="text-xl font-bold text-primary">₹{order.total_amount.toLocaleString('en-IN')}</p>
      </div>

      {order.status === "delivered" && (
        <Button className="w-full mt-4">Order Again</Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filterOrders("all").length === 0 ? (
                <Card className="p-12">
                  <p className="text-center text-muted-foreground">No orders yet</p>
                </Card>
              ) : (
                filterOrders("all").map(renderOrderCard)
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              {filterOrders("ongoing").length === 0 ? (
                <Card className="p-12">
                  <p className="text-center text-muted-foreground">No ongoing orders</p>
                </Card>
              ) : (
                filterOrders("ongoing").map(renderOrderCard)
              )}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4">
              {filterOrders("delivered").length === 0 ? (
                <Card className="p-12">
                  <p className="text-center text-muted-foreground">No delivered orders</p>
                </Card>
              ) : (
                filterOrders("delivered").map(renderOrderCard)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {filterOrders("cancelled").length === 0 ? (
                <Card className="p-12">
                  <p className="text-center text-muted-foreground">No cancelled orders</p>
                </Card>
              ) : (
                filterOrders("cancelled").map(renderOrderCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Orders;
