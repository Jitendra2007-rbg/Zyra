import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Package, Truck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrderVerification = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          ),
          shops (
            name
          )
        `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error("Failed to verify order");
        } finally {
            setLoading(false);
        }
    };

    const markAsCompleted = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', orderId);

            if (error) throw error;

            setOrder({ ...order, status: 'delivered' });
            toast.success("Order marked as completed!");
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error("Failed to update order status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Verifying order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground text-center">
                    The order you are trying to verify does not exist or has been removed.
                </p>
                <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
        );
    }

    const isDelivered = order.status === 'delivered';

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-lg">
                <Card className="p-8 border-0 shadow-[var(--shadow-soft)] text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                        {isDelivered ? (
                            <CheckCircle2 className="h-10 w-10" />
                        ) : (
                            <Package className="h-10 w-10" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">
                        {isDelivered ? "Order Completed" : "Verify Order"}
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        {isDelivered
                            ? "This order has been successfully delivered and verified."
                            : "Please verify the order details below before marking as completed."}
                    </p>

                    <div className="bg-muted/30 rounded-lg p-4 text-left mb-8 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order #</span>
                            <span className="font-medium">{order.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer</span>
                            <span className="font-medium">{order.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Items</span>
                            <span className="font-medium">{order.order_items?.length} items</span>
                        </div>
                    </div>

                    <div className="text-left mb-8">
                        <h3 className="font-semibold mb-3">Order Items</h3>
                        <div className="space-y-3">
                            {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex gap-3 items-center bg-muted/20 p-2 rounded-lg">
                                    <div className="h-12 w-12 rounded bg-muted shrink-0 overflow-hidden">
                                        <img
                                            src={item.products?.image_url || "/placeholder.svg"}
                                            alt={item.products?.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.products?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">₹{item.price.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-lg text-primary">₹{order.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {!isDelivered ? (
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={markAsCompleted}
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Mark as Completed"}
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                            Back to Home
                        </Button>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default OrderVerification;
