import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: number | string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  shop: string;
  rating?: number;
  discount?: number;
}



export const ProductCard = ({
  id,
  name,
  image,
  price,
  originalPrice,
  shop,
  discount,
}: ProductCardProps) => {
  // Placeholder for handleAddToCart to ensure syntactical correctness
  // In a real application, this function would be defined elsewhere or passed as a prop.
  const handleAddToCart = () => {
    console.log(`Adding product ${name} (ID: ${id}) to cart.`);
  };

  return (
    <Card className="group overflow-hidden border-0 bg-[#FAF7F2] shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 relative">
      {/* Warm Taupe Tint Overlay */}
      <div className="absolute inset-0 bg-[#D6C3B2] opacity-[0.05] pointer-events-none" />

      <Link to={`/product/${id}`}>
        <div className="aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-muted relative">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {discount && (
            <Badge className="absolute top-2 left-2 bg-[#E7A17A] text-[#132B4C] hover:bg-[#E7A17A]">
              {discount}% OFF
            </Badge>
          )}
        </div>
      </Link>
      <div className="p-4 relative">
        <div className="mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{shop}</span>
          <Link to={`/product/${id}`}>
            <h3 className="font-serif font-bold text-[#132B4C] text-lg leading-tight mt-1 group-hover:text-[#E7A17A] transition-colors">
              {name}
            </h3>
          </Link>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[#1A1A1A]">₹{price.toLocaleString('en-IN')}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <Button
            size="icon"
            className="rounded-full h-10 w-10 bg-[#E7A17A] text-[#132B4C] hover:bg-[#E7A17A]/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
