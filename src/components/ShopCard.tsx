import { useState } from "react";
import { Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase, useAuth } from "@/integrations/supabase";
import { toast } from "sonner";

interface ShopCardProps {
  id: number | string;
  name: string;
  logo: string;
  rating: number;
  followers: number;
  products: number;
  description: string;
  isFollowing?: boolean;
}

export const ShopCard = ({
  id,
  name,
  logo,
  rating,
  followers: initialFollowers,
  products,
  description,
  isFollowing: initialIsFollowing = false,
}: ShopCardProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow shops");
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('shop_followers')
          .delete()
          .eq('shop_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowers(prev => Math.max(0, prev - 1));
        toast.success("Unfollowed shop");
      } else {
        const { error } = await supabase
          .from('shop_followers')
          .insert({ shop_id: id, user_id: user.id });

        if (error) throw error;
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
        toast.success("Following shop");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all duration-300">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
            <img src={logo} alt={name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-medium">{rating}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{followers.toLocaleString()} followers</span>
          </div>
          <Badge variant="secondary">{products} products</Badge>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/shop/${id}`}>View Shop</Link>
          </Button>
          <Button
            variant={isFollowing ? "secondary" : "outline"}
            onClick={handleFollow}
            disabled={loading}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
