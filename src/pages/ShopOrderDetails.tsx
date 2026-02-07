import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Phone, Mail, MapPin, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Map from "@/components/Map";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ShopOrderDetails = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }

        const channel = supabase
            .channel('shop-order-updates')
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
                    setOrder((prev: any) => prev ? { ...prev, ...payload.new } : null);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          shops (
            name,
            address,
            latitude,
            longitude,
            phone
          ),
          order_items (
            *,
            products (
              name,
              image_url,
              shop_id
            )
          )
        `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;

            setOrder({ ...order, status });
            toast.success(`Order status updated to ${status}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error("Failed to update status");
        }
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
                    <Link to="/shop/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    const verificationUrl = `${window.location.origin}/verify-order/${order.id}`;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/shop/orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
                        <p className="text-muted-foreground">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN')} at {new Date(order.created_at).toLocaleTimeString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <h2 className="text-xl font-bold mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                                            <img
                                                src={item.products?.image_url || "/placeholder.svg"}
                                                alt={item.products?.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{item.products?.name}</h3>
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                                <p>Quantity: <span className="text-foreground font-medium">{item.quantity}</span></p>
                                                {item.size && <p>Size: <span className="text-foreground font-medium">{item.size}</span></p>}
                                                {item.color && <p>Color: <span className="text-foreground font-medium">{item.color}</span></p>}
                                            </div>
                                            <p className="mt-2 font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
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

                        {/* Customer Details */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <h2 className="text-xl font-bold mb-4">Customer Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Name</p>
                                        <p className="font-medium text-lg">{order.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Contact Info</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <a href={`tel:${order.customer_phone}`} className="hover:text-primary transition-colors">
                                                    {order.customer_phone}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <a href={`mailto:${order.customer_email}`} className="hover:text-primary transition-colors">
                                                    {order.customer_email}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                        <p className="font-medium leading-relaxed">{order.delivery_address}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Map */}
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Delivery Location</h2>
                                {(() => {
                                    const shopLat = Number(order.shops?.latitude);
                                    const shopLon = Number(order.shops?.longitude);
                                    const customerLat = Number(order.delivery_latitude);
                                    const customerLon = Number(order.delivery_longitude);

                                    const hasShopLocation = !isNaN(shopLat) && !isNaN(shopLon) && shopLat !== 0;
                                    const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLon) && customerLat !== 0;

                                    if (hasShopLocation && hasCustomerLocation) {
                                        const R = 6371; // Radius of the earth in km
                                        const dLat = (customerLat - shopLat) * Math.PI / 180;
                                        const dLon = (customerLon - shopLon) * Math.PI / 180;
                                        const a =
                                            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                            Math.cos(shopLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
                                            Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                        const distance = (R * c).toFixed(2);

                                        return (
                                            <Badge variant="outline" className="text-lg px-3 py-1 border-primary text-primary">
                                                Distance: {distance} km
                                            </Badge>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {(() => {
                                const shopLat = Number(order.shops?.latitude);
                                const shopLon = Number(order.shops?.longitude);
                                const customerLat = Number(order.delivery_latitude);
                                const customerLon = Number(order.delivery_longitude);

                                const hasShopLocation = !isNaN(shopLat) && !isNaN(shopLon) && shopLat !== 0;
                                const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLon) && customerLat !== 0;

                                // Default fallback to Hyderabad if no shop location
                                const centerLat = hasShopLocation ? shopLat : 17.3850;
                                const centerLon = hasShopLocation ? shopLon : 78.4867;

                                const markers: Array<{
                                    position: [number, number];
                                    title: string;
                                    description?: string;
                                    color?: 'blue' | 'red';
                                }> = [];

                                if (hasShopLocation) {
                                    markers.push({
                                        position: [shopLat, shopLon] as [number, number],
                                        title: order.shops?.name || "Shop Location",
                                        description: order.shops?.address || "Your Shop",
                                        color: "blue"
                                    });
                                }

                                if (hasCustomerLocation) {
                                    markers.push({
                                        position: [customerLat, customerLon] as [number, number],
                                        title: order.customer_name || "Customer",
                                        description: order.delivery_address,
                                        color: "red" as const
                                    });
                                }

                                return (
                                    <div className="relative">
                                        <Map
                                            center={[centerLat, centerLon]}
                                            zoom={15}
                                            markers={markers}
                                            className="h-[400px] w-full rounded-lg"
                                        />
                                        {!hasCustomerLocation && (
                                            <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-lg z-[400]">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-2"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                    View Customer Address on Maps
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        <Card className="p-6 border-0 shadow-[var(--shadow-soft)] sticky top-24">
                            <h2 className="text-xl font-bold mb-4">Order Actions</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Update Status</label>
                                    <Select
                                        value={order.status}
                                        onValueChange={updateStatus}
                                    >
                                        <SelectTrigger className="w-full">
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

                                <div className="pt-6 border-t">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <QrCode className="h-5 w-5" />
                                        Order Verification
                                    </h3>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full mb-4" variant="outline">
                                                <QrCode className="h-4 w-4 mr-2" />
                                                Show QR Code
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-center">Scan to Verify</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex flex-col items-center justify-center p-6">
                                                <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                                                    <QRCodeSVG
                                                        value={verificationUrl}
                                                        size={200}
                                                        level="H"
                                                    />
                                                </div>
                                                <p className="text-center text-sm text-muted-foreground">
                                                    Scan this QR code to verify and complete the order.
                                                </p>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button variant="secondary" className="w-full" asChild>
                                        <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                                            Open Verification Page
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopOrderDetails;
