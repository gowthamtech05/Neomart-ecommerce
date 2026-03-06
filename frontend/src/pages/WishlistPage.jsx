import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Heart, ChevronLeft, Frown, ShoppingCart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { calculateDiscountedPrice } from "../utils/offerUtils";
import specialOfferBadge from "../assets/Offer badge.png";

const API = import.meta.env.VITE_API_URL;

const WishlistProductCard = ({
  product,
  isLowestPriceItem = false,
  onRemove,
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted } = useWishlist();
  const liked = isWishlisted(product._id);

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const loyaltyPoints = Number(userInfo?.loyaltyPoints || 0);
  const isNewUser = !!(userInfo && userInfo.firstOrderCompleted === false);
  const isLoyal = loyaltyPoints >= 20;
  const isPlusMember = userInfo?.isPlusMember || false;

  const stock = product.quantity || 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;
  const mrp = Number(product.price) || 0;

  const offerData = calculateDiscountedPrice(
    product,
    { isNewUser, loyaltyPoints, isPlusMember },
    { isLowestPriceItem, isFirstOrder: isNewUser, quantityIndex: 0 },
  );

  const finalPrice = offerData.finalPrice;
  const totalDiscount = offerData.totalDiscount;
  const totalSavings = mrp - finalPrice;

  const showNewUserBadge =
    isNewUser &&
    isLowestPriceItem &&
    totalDiscount > offerData.baseDiscount + offerData.expiryDiscount;
  const showLoyalBadge =
    !showNewUserBadge && isLoyal && offerData.appliedLabel === "LOYALTY OFFER";
  const showPlusBadge = !showNewUserBadge && !showLoyalBadge && isPlusMember;

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="group relative bg-white rounded-xl border border-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col w-full"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(product._id);
        }}
        className="absolute top-2 right-2 z-20 transition-transform active:scale-90"
      >
        <Heart
          size={18}
          className={`transition-all duration-300 ${
            liked
              ? "text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              : "text-gray-400 group-hover:text-red-400"
          }`}
        />
      </button>

      {(showNewUserBadge || showLoyalBadge || showPlusBadge) && (
        <div
          className={`absolute top-0 left-0 text-white text-[8px] sm:text-[10px] px-2 py-1 rounded-br-md font-bold z-10 shadow-sm ${
            showNewUserBadge
              ? "bg-blue-600"
              : showLoyalBadge
                ? "bg-purple-600"
                : "bg-amber-500"
          }`}
        >
          {showNewUserBadge ? "NEW USER" : showLoyalBadge ? "LOYALTY" : "PLUS"}
        </div>
      )}

      <div className="relative w-full h-28 xs:h-32 sm:h-36 md:h-40 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={product.images?.[0] || "https://via.placeholder.com/200"}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-1"
          alt={product.name}
        />
        {totalDiscount >= 25 && (
          <img
            src={specialOfferBadge}
            className="absolute top-0 right-1 w-10 h-10 sm:w-12 md:w-14 object-contain pointer-events-none"
            alt="Special Offer"
          />
        )}
      </div>

      <div className="p-2 xs:p-2.5 sm:p-3 flex flex-col flex-1">
        <p className="text-[8px] sm:text-[10px] uppercase text-gray-400 font-semibold truncate">
          {product.brand || "Brand"}
        </p>
        <h3 className="text-[11px] sm:text-[13px] text-gray-800 font-medium truncate group-hover:text-[#6FAF8E] mt-0.5">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center gap-1 flex-wrap">
          <span className="text-sm sm:text-lg font-bold text-gray-900">
            ₹{finalPrice}
          </span>
          {totalDiscount > 0 && mrp > finalPrice && (
            <span className="text-[9px] sm:text-xs text-gray-400 line-through">
              ₹{mrp}
            </span>
          )}
          {totalDiscount > 0 && (
            <span className="text-[8px] sm:text-[10px] font-semibold text-green-600">
              {totalDiscount}% OFF
            </span>
          )}
        </div>

        {totalSavings > 0 && (
          <p className="text-[8px] sm:text-[10px] text-green-600 font-semibold mt-0.5">
            Save ₹{totalSavings}
          </p>
        )}

        <div className="mt-1 flex-1">
          {isOutOfStock ? (
            <p className="text-red-600 text-[8px] sm:text-[10px] font-bold">
              No stock
            </p>
          ) : isLowStock ? (
            <p className="text-orange-600 text-[8px] sm:text-[10px] font-bold">
              ⚠ Only {stock} left
            </p>
          ) : (
            <p className="text-gray-400 text-[7px] sm:text-[9px]">
              {isPlusMember
                ? "⭐ Plus Price"
                : isLoyal
                  ? "👤 Loyalty Applied"
                  : "Free Delivery"}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) addToCart({ ...product, finalPrice });
          }}
          disabled={isOutOfStock}
          className={`mt-2 w-full text-[9px] sm:text-xs py-1.5 rounded-md font-semibold transition ${
            isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#6FAF8E] text-white hover:bg-green-700"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "Add"}
        </button>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { toggleWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
    withCredentials: true,
  };

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await axios.get(`${API}/api/wishlist`, config);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = (productId) => {
    toggleWishlist(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b sticky top-0 z-30 px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black text-gray-900">
            My Wishlist
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
            {products.length} saved items
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <Frown size={30} className="text-red-300" />
            </div>
            <h2 className="text-xl font-black text-gray-800">
              Your wishlist is empty
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Tap the heart on any product to save it here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#6FAF8E] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {products.map((product, index) => (
              <WishlistProductCard
                key={product._id}
                product={product}
                isLowestPriceItem={index === 0}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
