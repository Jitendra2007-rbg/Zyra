import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ShopCard } from "@/components/ShopCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, useAuth } from "@/integrations/supabase";
import { useQuery } from "@tanstack/react-query";

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
  const { user } = useAuth();

  const { data: shops = [], isLoading: loading } = useQuery<Shop[]>({
    queryKey: ['shops', user?.id], // efficient key including user status
    queryFn: async () => {
      // 1. Fetch all active shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true);

      if (shopsError) throw shopsError;

      if (!shopsData || shopsData.length === 0) {
        return [];
      }

      const shopIds = shopsData.map(s => s.id);

      // 2. Fetch product counts (fetching shop_id only)
      const { data: productsData } = await supabase
        .from('products')
        .select('shop_id')
        .in('shop_id', shopIds);

      // 3. Fetch follower counts (fetching shop_id only)
      const { data: followersData } = await supabase
        .from('shop_followers')
        .select('shop_id')
        .in('shop_id', shopIds);

      // 4. Fetch user's following status
      let userFollows: Set<any> = new Set();
      if (user) {
        const { data: myFollows } = await supabase
          .from('shop_followers')
          .select('shop_id')
          .eq('user_id', user.id)
          .in('shop_id', shopIds);

        if (myFollows) {
          myFollows.forEach(f => userFollows.add(f.shop_id));
        }
      }

      // Aggregating counts in memory
      const productCounts: Record<string, number> = {};
      productsData?.forEach((p: any) => {
        productCounts[p.shop_id] = (productCounts[p.shop_id] || 0) + 1;
      });

      const followerCounts: Record<string, number> = {};
      followersData?.forEach((f: any) => {
        followerCounts[f.shop_id] = (followerCounts[f.shop_id] || 0) + 1;
      });

      // Construct final array
      return shopsData.map((shop: any) => ({
        id: shop.id,
        name: shop.name,
        logo: shop.logo_url || "/placeholder.svg",
        rating: shop.rating || 0,
        followers: followerCounts[shop.id] || 0,
        products: productCounts[shop.id] || 0,
        description: shop.description || "No description available",
        isFollowing: userFollows.has(shop.id),
      }));
    }
  });

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
            {shops.map((shop: Shop) => (
              <ShopCard key={shop.id} {...shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shops;
