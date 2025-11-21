import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Package, IndianRupee } from "lucide-react";
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
  };
}

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addresses, loading: addressesLoading } = useAddresses();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedAddress = addresses.length > 0 ? addresses[0] : null;

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
            category
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const items = (data || []).map((item: any) => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] : item.products
      }));
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast.error("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum: any, item: any) => sum + (item.products?.price || 0) * item.quantity, 0);
  const delivery = 0;
  const total = subtotal + delivery;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/checkout/address">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Summary</h1>
            <p className="text-muted-foreground">Step 2 of 3</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
            <div className="h-full w-2/3 bg-primary" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
              ✓
            </div>
            <span className="text-xs font-medium">Address</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
              2
            </div>
            <span className="text-xs font-medium">Summary</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold mb-2">
              3
            </div>
            <span className="text-xs text-muted-foreground">Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Address & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Delivery Address</h2>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/checkout/address">Edit</Link>
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                {addressesLoading ? (
                  <p>Loading address...</p>
                ) : selectedAddress ? (
                  <>
                    <p className="font-semibold">{selectedAddress.full_name}</p>
                    <p>{selectedAddress.address_line1}</p>
                    {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                    <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}</p>
                    <p>Mobile: {selectedAddress.phone}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No address found. Please add one.</p>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6 border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Order Items</h2>
              </div>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.products?.image_url || "/placeholder.svg"}
                        alt={item.products?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        Category: {item.products?.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-bold text-primary">
                          ₹{((item.products?.price || 0) * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Price Details */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-0 shadow-[var(--shadow-soft)] sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Price Details</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Charges</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-6"
                onClick={() => navigate("/checkout/payment")}
                disabled={cartItems.length === 0}
              >
                Continue to Payment
              </Button>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
