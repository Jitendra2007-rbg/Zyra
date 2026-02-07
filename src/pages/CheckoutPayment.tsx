import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Wallet, CreditCard, Smartphone, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, useAuth, useAddresses } from "@/integrations/supabase";
import { toast } from "sonner";

interface CartItem {
  id: number;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string;
    category: string;
    shop_id: string;
  };
}

const CheckoutPayment = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { addresses } = useAddresses();
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const selectedAddress = addresses.length > 0 ? addresses[0] : null;
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image_url,
            category,
            shop_id
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Map the response to match CartItem interface
      const items = (data || []).map((item: any) => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] : item.products
      }));
      setCartItems(items);

      const total = items.reduce((sum: number, item: any) => {
        return sum + (item.products.price * item.quantity);
      }, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart items');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (userRole === 'shop_owner') {
      toast.error("Shop owners cannot place orders. Please use a customer account.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setLoading(true);
    try {
      // Group items by shop_id
      const shopItems = new Map<string, CartItem[]>();
      cartItems.forEach(item => {
        const shopId = item.products.shop_id;
        if (!shopItems.has(shopId)) {
          shopItems.set(shopId, []);
        }
        shopItems.get(shopId)?.push(item);
      });

      // Create an order for each shop
      for (const [shopId, items] of shopItems) {
        const shopTotal = items.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            shop_id: shopId,
            order_number: orderNumber,
            status: 'pending',
            total_amount: shopTotal,
            payment_method: paymentMethod,
            payment_status: 'pending',
            delivery_address: `${selectedAddress.full_name}, ${selectedAddress.address_line1}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`,
            delivery_latitude: selectedAddress.latitude ? Number(selectedAddress.latitude) : null,
            delivery_longitude: selectedAddress.longitude ? Number(selectedAddress.longitude) : null,
            customer_name: selectedAddress.full_name,
            customer_phone: selectedAddress.phone,
            customer_email: user.email || '',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.products.price,
          // Add size/color if available in cart item
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // 3. Decrement Stock
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = Math.max(0, product.stock_quantity - item.quantity);
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);
        }
      }

      // 4. Clear Cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) throw clearCartError;

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/checkout/summary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payment Method</h1>
            <p className="text-muted-foreground">Step 3 of 3</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-primary -z-10" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
              ✓
            </div>
            <span className="text-xs font-medium">Address</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
              ✓
            </div>
            <span className="text-xs font-medium">Summary</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
              3
            </div>
            <span className="text-xs font-medium">Payment</span>
          </div>
        </div>

        <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Choose Payment Method</h2>
          </div>

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
            {/* UPI Payment */}
            <Card className={`p-4 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary border-2' : 'border'}`}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="upi" id="upi" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer text-base font-semibold">
                    <Smartphone className="h-5 w-5 text-primary" />
                    UPI Payment
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Pay using PhonePe, Google Pay, Paytm & more
                  </p>
                  {paymentMethod === 'upi' && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="upiId" className="text-sm">Enter UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          <img src="/placeholder.svg" alt="GPay" className="h-4 w-4 mr-1" />
                          Google Pay
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <img src="/placeholder.svg" alt="PhonePe" className="h-4 w-4 mr-1" />
                          PhonePe
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <img src="/placeholder.svg" alt="Paytm" className="h-4 w-4 mr-1" />
                          Paytm
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Cash on Delivery */}
            <Card className={`p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary border-2' : 'border'}`}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="cod" id="cod" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer text-base font-semibold">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Cash on Delivery
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay with cash when you receive your order
                  </p>
                  {paymentMethod === 'cod' && (
                    <div className="mt-3 p-3 bg-muted rounded-lg animate-fade-in">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm">
                          Keep exact change ready. Our delivery partner will collect ₹{totalAmount.toLocaleString('en-IN')} in cash.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </RadioGroup>

          {/* Order Summary */}
          <Card className="mt-6 p-4 bg-muted border-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <Button size="lg" onClick={handlePlaceOrder} disabled={loading || cartItems.length === 0}>
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPayment;
