import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Truck, CheckCircle, QrCode, MapPin, Phone, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Map from "@/components/Map";
import { Order } from "@/types";

const OrderDetails = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

    const fetchOrderDetails = useCallback(async () => {
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
          ),
          shops (
            name,
            phone,
            email,
            email,
            address,
            latitude,
            longitude
          )
        `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data as Order);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

    useEffect(() => {
        if (!orderId) return;

        const channel = supabase
            .channel('order-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    console.log('Order updated:', payload);
                    setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
                    // Optionally refetch if you need deep relation updates, but for status/location payload.new is usually enough
                    // fetchOrderDetails(); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);

    useEffect(() => {
        if (!order || order.status === 'delivered') return;

        const calculateTimeLeft = () => {
            const orderDate = new Date(order.created_at);
            const deliveryDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
            const now = new Date();
            const difference = deliveryDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft("Arriving soon");
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            setTimeLeft(`${hours}h`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [order]);



    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <p>Order not found</p>
                <Button asChild>
                    <Link to="/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Order Details</h1>
                        <p className="text-muted-foreground">#{order.order_number}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status & Shop Info */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-1">Order Status</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {order.status !== 'delivered' && timeLeft && (
                                        <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary">
                                            <Truck className="h-3 w-3" />
                                            Arriving in {timeLeft}
                                        </Badge>
                                    )}
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">Sold by</h3>
                                <p className="font-medium text-lg">{order.shops?.name}</p>
                                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                    {order.shops?.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            {order.shops.address}
                                        </div>
                                    )}
                                    {order.shops?.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            {order.shops.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Order Items */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <h2 className="text-xl font-bold mb-4">Items</h2>
                            <div className="space-y-4">
                                {order.order_items?.map((item) => (
                                    <Link
                                        to={`/product/${item.product_id}`}
                                        key={item.id}
                                        className="flex gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                            <img
                                                src={item.products?.image_url || "/placeholder.svg"}
                                                alt={item.products?.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.products?.name}</h3>
                                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                                                <p>Qty: {item.quantity}</p>
                                                {item.size && <p>Size: {item.size}</p>}
                                                {item.color && <p>Color: {item.color}</p>}
                                            </div>
                                            <p className="mt-2 font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery Fee</span>
                                    <span className="text-green-600">FREE</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl pt-2 border-t mt-2">
                                    <span>Total Amount</span>
                                    <span className="text-primary">₹{order.total_amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <Badge variant="outline">{order.payment_method}</Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Delivery Address */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold">{order.customer_name}</p>
                                    <p className="text-muted-foreground leading-relaxed mt-1">
                                        {order.delivery_address}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Phone: {order.customer_phone}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 h-[300px] w-full rounded-lg overflow-hidden relative">
                                {(() => {
                                    const shopLat = Number(order.shops?.latitude);
                                    const shopLon = Number(order.shops?.longitude);
                                    const customerLat = Number(order.delivery_latitude);
                                    const customerLon = Number(order.delivery_longitude);

                                    const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLon) && customerLat !== 0;
                                    const hasShopLocation = !isNaN(shopLat) && !isNaN(shopLon) && shopLat !== 0;

                                    // If we have customer location, show it
                                    if (hasCustomerLocation) {
                                        return (
                                            <Map
                                                center={[customerLat, customerLon]}
                                                zoom={15}
                                                markers={[{
                                                    position: [customerLat, customerLon],
                                                    title: "Delivery Location",
                                                    description: order.delivery_address,
                                                    color: "red"
                                                }]}
                                                className="h-full w-full"
                                            />
                                        );
                                    }

                                    // If no customer location but have shop location, show shop location with route hint (conceptually)
                                    // Or just show shop location
                                    if (hasShopLocation) {
                                        return (
                                            <Map
                                                center={[shopLat, shopLon]}
                                                zoom={13}
                                                markers={[{
                                                    position: [shopLat, shopLon],
                                                    title: "Shop Location",
                                                    description: "Order shipped from here",
                                                    color: "blue"
                                                }]}
                                                className="h-full w-full"
                                            />
                                        );
                                    }

                                    // If neither, fallback to default (Bangalore) but empty markers
                                    return (
                                        <Map
                                            center={[12.9716, 77.5946]}
                                            zoom={10}
                                            markers={[]}
                                            className="h-full w-full"
                                        />
                                    );
                                })()}

                                {(() => {
                                    // Only show the external link if we DON'T have a customer location, 
                                    // or maybe just keep it hidden as per user request to "not navigate".
                                    // User said: "show the map directly here dont navigate to google map site"
                                    // So we will hide the overlay button if we have what we need.

                                    const customerLat = Number(order.delivery_latitude);
                                    const customerLon = Number(order.delivery_longitude);
                                    const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLon) && customerLat !== 0;

                                    if (hasCustomerLocation) return null;

                                    return (
                                        <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded-lg shadow-md z-[400]">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                <MapPin className="h-3 w-3" />
                                                Locate on Google Maps
                                            </a>
                                        </div>
                                    );
                                })()}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)] sticky top-24">
                            <h2 className="text-xl font-bold mb-4">Actions</h2>

                            <div className="space-y-4">
                                {order.status === 'pending' && (
                                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">
                                                Cancel Order
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Cancel Order</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
                                            </div>
                                            <div className="flex justify-end gap-4">
                                                <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                                                    Keep Order
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={async () => {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('orders')
                                                                .update({ status: 'cancelled' })
                                                                .eq('id', order.id);

                                                            if (error) throw error;

                                                            toast.success("Order cancelled successfully");
                                                            setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
                                                            setIsCancelDialogOpen(false);
                                                        } catch (error) {
                                                            console.error("Error cancelling order:", error);
                                                            toast.error("Failed to cancel order");
                                                        }
                                                    }}
                                                >
                                                    Yes, Cancel Order
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {order.status === 'delivered' && (
                                    <Button variant="outline" className="w-full">
                                        Write a Review
                                    </Button>
                                )}

                                <Button variant="ghost" className="w-full text-muted-foreground">
                                    Need Help?
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
