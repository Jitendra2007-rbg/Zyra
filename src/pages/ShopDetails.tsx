import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Phone, Mail, ArrowLeft, Users } from "lucide-react";
import { useAuth } from "@/integrations/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/integrations/supabase/hooks/useProducts";
import { toast } from "sonner";
import type { Shop } from "@/integrations/supabase/hooks/useShop";

const ShopDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const { products, loading: productsLoading } = useProducts(id);

  useEffect(() => {
    if (id) {
      fetchShop();
    }
  }, [id, user]);

  const fetchShop = async () => {
    try {
      // Fetch shop details
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setShop(data);

      // Fetch follower count
      const { count } = await supabase
        .from('shop_followers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id);

      setFollowerCount(count || 0);

      // Check if user is following
      if (user) {
        const { data: followData } = await supabase
          .from('shop_followers')
          .select('*')
          .eq('shop_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow shops");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow logic
        const { error } = await supabase
          .from('shop_followers')
          .delete()
          .eq('shop_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success("Unfollowed shop");
      } else {
        // Follow logic
        const { error } = await supabase
          .from('shop_followers')
          .insert({ shop_id: id, user_id: user.id });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success("Following shop");
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      if (error.code === '23505') { // Unique violation
        setIsFollowing(true);
        toast.success("Following shop");
      } else {
        toast.error("Failed to update follow status");
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading shop...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Shop Not Found</h2>
              <Button asChild>
                <Link to="/shops">Browse Shops</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="icon" className="mb-4" asChild>
          <Link to="/shops">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <Card className="p-8 border-0 shadow-[var(--shadow-soft)] mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-32 w-32 rounded-lg overflow-hidden bg-muted shrink-0">
              <img
                src={shop.logo_url || "/placeholder.svg"}
                alt={shop.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(shop.rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                        }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{shop.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{followerCount.toLocaleString()} followers</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{products.length} Products</span>
              </div>

              <Button
                onClick={handleFollow}
                disabled={followLoading || isFollowing}
                className={`mb-4 ${isFollowing ? 'bg-muted text-muted-foreground' : 'bg-[#E7A17A] text-[#132B4C]'}`}
              >
                {isFollowing ? "Following" : "Follow Shop"}
              </Button>

              {shop.description && (
                <p className="text-muted-foreground mb-4">{shop.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {shop.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Products from this Shop</h2>
        </div>

        {products.length === 0 ? (
          <Card className="p-12">
            <p className="text-center text-muted-foreground">No products available yet</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                image={product.image_url || "/placeholder.svg"}
                price={product.price}
                originalPrice={product.compare_at_price || undefined}
                shop={shop.name}
                discount={product.compare_at_price ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
