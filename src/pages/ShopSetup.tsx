import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useShop } from "@/integrations/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, MapPin } from "lucide-react";
import { toast } from "sonner";
import Map from "@/components/Map";

const ShopSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createShop } = useShop();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    toast.success("Location selected!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please click on the map to pin your shop location");
      return;
    }

    setLoading(true);

    const { error } = await createShop({
      name: formData.name,
      description: formData.description,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      logo_url: null,
      banner_url: null,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });

    if (error) {
      toast.error("Failed to create shop: " + error.message);
      setLoading(false);
    } else {
      toast.success("Shop created! Waiting for admin approval.");
      navigate("/shop/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Store className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Set Up Your Shop
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
            <CardDescription>
              Create your shop profile. Your shop will be reviewed by our admin team before going live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your shop name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your shop and what you sell"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Shop Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete shop address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shop Location *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click "Use Current Location" or click on the map to pinpoint your shop. This helps customers find you.
                  </p>
                  <div className="h-[300px] border rounded-lg overflow-hidden relative">
                    <Map
                      interactive={true}
                      enableCurrentLocation={true}
                      onLocationSelect={handleLocationSelect}
                      className="h-full w-full"
                      markers={formData.latitude && formData.longitude ? [{
                        position: [formData.latitude, formData.longitude],
                        title: "Selected Location",
                        color: "red"
                      }] : []}
                    />
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location secured: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Shop..." : "Create Shop"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ShopSetup;
