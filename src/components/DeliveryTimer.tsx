import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";

interface DeliveryTimerProps {
    productId: string;
}

const DeliveryTimer = ({ productId }: DeliveryTimerProps) => {
    const { user } = useAuth();
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isDelivered, setIsDelivered] = useState(false);

    useEffect(() => {
        if (user && productId) {
            checkActiveOrder();
        }
    }, [user, productId]);

    const checkActiveOrder = async () => {
        // Find the most recent order for this product by this user
        const { data, error } = await supabase
            .from('order_items')
            .select(`
        created_at,
        orders!inner (
          id,
          status,
          created_at,
          user_id
        )
      `)
            .eq('product_id', productId)
            .eq('orders.user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data && data.orders) {
            const order = data.orders as any;
            if (order.status === 'delivered') {
                setIsDelivered(true);
                setActiveOrder(null);
            } else {
                setIsDelivered(false);
                setActiveOrder(order);
            }
        }
    };

    useEffect(() => {
        if (!activeOrder) return;

        const calculateTimeLeft = () => {
            const orderDate = new Date(activeOrder.created_at);
            const deliveryDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
            const now = new Date();
            const difference = deliveryDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft("Arriving soon");
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [activeOrder]);

    if (isDelivered) {
        return null; // Don't show anything if delivered (or could show "Delivered")
    }

    if (!activeOrder) return null;

    return (
        <Card className="p-4 mb-6 bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div>
                    <h3 className="font-semibold text-primary">Order in Progress</h3>
                    <p className="text-sm text-muted-foreground">
                        Arriving in: <span className="font-mono font-medium text-foreground">{timeLeft}</span>
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default DeliveryTimer;
