import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Users, Sparkles, Baby, Watch, Tag, Filter, Search } from "lucide-react";
import heroImage from "@/assets/hero-fashion.jpg";

const categories = [
  { name: "All", icon: ShoppingBag },
  { name: "Men", icon: Users },
  { name: "Women", icon: Sparkles },
  { name: "Kids", icon: Baby },
  { name: "Accessories", icon: Watch },
  { name: "New Arrivals", icon: Sparkles },
  { name: "Offers", icon: Tag },
];

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  shop: string;
  shopId: string;
  discount: number;
}

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Preload high-traffic routes for instant navigation
    const preloadRoutes = async () => {
      try {
        await Promise.all([
          import("./Shops"),
          import("./Cart"),
          import("./Profile"),
        ]);
      } catch (error) {
        console.log("Preloading failed (non-critical):", error);
      }
    };

    // Small delay to prioritize main content loading first
    const timer = setTimeout(preloadRoutes, 2000);
    return () => clearTimeout(timer);
  }, []);

  const { data: products = [], isLoading: loading, isError, error } = useQuery({
    queryKey: ['products', selectedCategory, minPrice, maxPrice],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          compare_at_price,
          image_url,
          category,
          rating,
          shops (
            id,
            name,
            is_active
          )
        `);

      // Apply Category Filter
      if (selectedCategory !== "All") {
        if (selectedCategory === "New Arrivals") {
          query = query.order('created_at', { ascending: false });
        } else if (selectedCategory === "Offers") {
          query = query.not('compare_at_price', 'is', null).gt('compare_at_price', 0);
        } else {
          query = query.eq('category', selectedCategory);
        }
      }

      // Apply Price Filter
      if (minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice < 10000) {
        query = query.lte('price', maxPrice);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((product: any) => {
        const discountPercentage = product.compare_at_price && product.compare_at_price > product.price
          ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
          : 0;

        return {
          id: product.id,
          name: product.name,
          image: product.image_url || "/placeholder.svg",
          price: product.price,
          originalPrice: product.compare_at_price || product.price,
          shop: product.shops?.name || "Unknown Shop",
          shopId: product.shops?.id || "",
          discount: discountPercentage,
        };
      });
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[500px] overflow-hidden">
        <img
          src={heroImage}
          alt="Fashion hero banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold leading-tight">
                Discover Your Style
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-muted-foreground">
                Shop the latest trends from local boutiques
              </p>
              <Button size="lg" className="text-sm md:text-base h-9 md:h-11" asChild>
                <Link to="/shops">Explore Shops</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden container mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.name}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="shrink-0 h-8 md:h-10 px-2 md:px-4 gap-1 md:gap-2 flex items-center"
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-[10px] md:text-sm">{cat.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>

          {/* Desktop Filter Sheet */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="hidden md:flex gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Price Range */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Price Range</Label>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={10000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Min</Label>
                        <Input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(Number(e.target.value))}
                          className="h-8"
                          placeholder="Min"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Max</Label>
                        <Input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="h-8"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                    </p>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Size</Label>
                  <div className="space-y-2">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox id={`size-${size}`} />
                        <label htmlFor={`size-${size}`} className="text-sm cursor-pointer">
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Rating</Label>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox id={`rating-${rating}`} />
                        <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                          {rating}★ & above
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Discount</Label>
                  <div className="space-y-2">
                    {["50% or more", "40% or more", "30% or more", "20% or more", "10% or more"].map((discount) => (
                      <div key={discount} className="flex items-center space-x-2">
                        <Checkbox id={`discount-${discount}`} />
                        <label htmlFor={`discount-${discount}`} className="text-sm cursor-pointer">
                          {discount}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen(true)}
            className="md:hidden"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet open={filtersOpen && window.innerWidth < 768} onOpenChange={setFiltersOpen}>
          <SheetContent side="right" className="w-[280px] overflow-y-auto md:hidden">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Same filter content as desktop */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Price Range</Label>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Min</Label>
                      <Input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="h-8"
                        placeholder="Min"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Max</Label>
                      <Input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="h-8"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ₹{priceRange[0]} - ₹{priceRange[1]}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Size</Label>
                <div className="space-y-2">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox id={`mobile-size-${size}`} />
                      <label htmlFor={`mobile-size-${size}`} className="text-sm cursor-pointer">
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Rating</Label>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox id={`mobile-rating-${rating}`} />
                      <label htmlFor={`mobile-rating-${rating}`} className="text-sm cursor-pointer">
                        {rating}★ & above
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Discount</Label>
                <div className="space-y-2">
                  {["50% or more", "40% or more", "30% or more", "20% or more", "10% or more"].map((discount) => (
                    <div key={discount} className="flex items-center space-x-2">
                      <Checkbox id={`mobile-discount-${discount}`} />
                      <label htmlFor={`mobile-discount-${discount}`} className="text-sm cursor-pointer">
                        {discount}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Products Grid */}
        {isError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-destructive">
              <p>Error loading products.</p>
              <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
