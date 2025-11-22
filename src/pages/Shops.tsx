import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ShopCard } from "@/components/ShopCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, useAuth } from "@/integrations/supabase";

interface Shop {
  id: number | string;
  name: string;
  logo: string;
  rating: number;
  followers: number;
  products: number;
  description: string;
  isFollowing?: boolean;
}

const Shops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchShops();
  }, [user]);

  const fetchShops = async () => {
    try {
      // Only fetch active shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true);

      if (shopsError) throw shopsError;

      // Fetch product counts and follower counts for each shop
      const shopsWithCounts = await Promise.all(
        (shopsData || []).map(async (shop: any) => {
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shop.id)
          // .eq('is_active', true); // Relaxed filter

          const { count: followerCount } = await supabase
            .from('shop_followers')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shop.id);

          let isFollowing = false;
          if (user) {
            const { data: followData } = await supabase
              .from('shop_followers')
              .select('*')
              .eq('shop_id', shop.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isFollowing = !!followData;
          }

          return {
            id: shop.id,
            name: shop.name,
            logo: shop.logo_url || "/placeholder.svg",
            rating: shop.rating || 0,
            followers: followerCount || 0,
            products: productCount || 0,
            description: shop.description || "No description available",
            isFollowing,
          };
        })
      );

      setShops(shopsWithCounts);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="icon" className="mb-4" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Explore{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fashion Shops
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Discover unique collections from verified fashion retailers
          </p>

          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search shops..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading shops...</p>
            </div>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shops available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <ShopCard key={shop.id} {...shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shops;
