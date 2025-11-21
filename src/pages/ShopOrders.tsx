import { useState, useEffect } from "react";
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

import { useShop } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase/client";

const ShopOrders = () => {
  const { shop } = useShop();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (shop?.id) {
      fetchOrders();
    }
  }, [shop?.id]);

  const fetchOrders = async () => {
    try {
      // Fetch order items for this shop, including order details
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (*),
          products!inner (
            name,
            image_url,
            shop_id
          )
        `)
        .eq('products.shop_id', shop?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group items by order and format the data structure to match the UI expectation
      const ordersMap = new Map();

      data?.forEach((item: any) => {
        if (!item.orders) return;

        if (!ordersMap.has(item.order_id)) {
          ordersMap.set(item.order_id, {
            ...item.orders,
            order_items: []
          });
        }

        const order = ordersMap.get(item.order_id);
        order.order_items.push({
          ...item,
          products: item.products
        });
      });

      setOrders(Array.from(ordersMap.values()));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

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
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No orders found</div>
        ) : (
          orders.map((order) => (
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
                        defaultValue={order.status}
                        onValueChange={(value) => updateStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="packed">Packed</SelectItem>
                          <SelectItem value="on-the-way">On the Way</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          View Details & QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* QR Code */}
                          <div className="flex justify-center p-6 bg-muted rounded-lg">
                            <div className="bg-white p-4 rounded-lg">
                              <QRCodeSVG
                                value={JSON.stringify({
                                  orderNumber: order.order_number,
                                  total: order.total_amount,
                                  customer: order.customer_name,
                                })}
                                size={200}
                                level="H"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-center text-muted-foreground">
                            Scan this QR code to complete the order
                          </p>

                          {/* Customer Details */}
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg">Customer Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{order.customer_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{order.customer_phone}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Delivery Address</p>
                                <p className="font-medium">{order.delivery_address}</p>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg">Order Items</h3>
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex gap-4 mb-2">
                                <img
                                  src={item.products?.image_url || "/placeholder.svg"}
                                  alt={item.products?.name}
                                  className="h-16 w-16 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-semibold">{item.products?.name}</p>
                                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                  <p className="text-sm text-muted-foreground">Price: ₹{item.price.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Payment Summary */}
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg">Payment Summary</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span className="text-green-600">FREE</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total Amount</span>
                                <span className="text-primary">₹{order.total_amount.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Payment Method</span>
                                <span className="font-medium">{order.payment_method}</span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Location Map */}
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg">Delivery Location</h3>
                            <Map
                              center={[Number(order.delivery_latitude) || 12.9716, Number(order.delivery_longitude) || 77.5946]}
                              zoom={15}
                              markers={[{
                                position: [Number(order.delivery_latitude) || 12.9716, Number(order.delivery_longitude) || 77.5946],
                                title: order.customer_name,
                                description: order.delivery_address,
                              }]}
                              className="h-[300px] w-full rounded-lg"
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>

  );
};

export default ShopOrders;
