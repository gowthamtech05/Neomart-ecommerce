import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { calculateDiscountedPrice } from "../utils/offerUtils";
import { Heart } from "lucide-react";
import specialOfferBadge from "../assets/Offer badge.png";

const API = import.meta.env.VITE_API_URL;

/* ── Mini product card matching ProductCard UI ── */
const CategoryProductCard = ({ product, isLowestPriceItem = false }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
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
      {/* Wishlist */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product._id);
        }}
        className="absolute top-2 right-2 z-20 transition-transform active:scale-90"
      >
        <Heart
          size={18}
          strokeWidth={2}
          className={`transition-all duration-300 ${
            liked
              ? "text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              : "text-gray-400 group-hover:text-red-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
          }`}
        />
      </button>

      {/* Offer badge */}
      {(showNewUserBadge || showLoyalBadge || showPlusBadge) && (
        <div
          className={`absolute top-0 left-0 text-white text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-br-md font-bold z-10 shadow-sm ${
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

      {/* Image */}
      <div className="relative w-full h-28 xs:h-32 sm:h-36 md:h-40 lg:h-44 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={product.images?.[0] || "https://via.placeholder.com/200"}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-1"
          alt={product.name}
        />
        {totalDiscount >= 25 && (
          <img
            src={specialOfferBadge}
            alt="Special Offer"
            className="absolute top-0 right-1 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-xl pointer-events-none"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-2 xs:p-2.5 sm:p-3 flex flex-col flex-1">
        <p className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase text-gray-400 font-semibold truncate">
          {product.brand || "Brand"}
        </p>
        <h3 className="text-[11px] xs:text-xs sm:text-[13px] md:text-sm text-gray-800 font-medium truncate group-hover:text-[#6FAF8E] mt-0.5">
          {product.name}
        </h3>

        <div className="mt-1 sm:mt-1.5 flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="text-sm xs:text-base sm:text-lg font-bold text-gray-900">
            ₹{finalPrice}
          </span>
          {totalDiscount > 0 && mrp > finalPrice && (
            <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">
              ₹{mrp}
            </span>
          )}
          {totalDiscount > 0 && (
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-green-600">
              {totalDiscount}% OFF
            </span>
          )}
        </div>

        {totalSavings > 0 && (
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-green-600 font-semibold mt-0.5">
            Save ₹{totalSavings}
          </p>
        )}

        <div className="mt-1 sm:mt-1.5 flex-1">
          {isOutOfStock ? (
            <p className="text-red-600 text-[8px] xs:text-[9px] sm:text-[10px] font-bold">
              No stock
            </p>
          ) : isLowStock ? (
            <p className="text-orange-600 text-[8px] xs:text-[9px] sm:text-[10px] font-bold">
              ⚠ Only {stock} left
            </p>
          ) : showNewUserBadge ? (
            <p className="text-blue-600 text-[8px] xs:text-[9px] sm:text-[10px] font-bold">
              🎁 20% Extra!
            </p>
          ) : showLoyalBadge ? (
            <p className="text-purple-600 text-[8px] xs:text-[9px] sm:text-[10px] font-bold">
              👤 Loyalty Applied
            </p>
          ) : isPlusMember ? (
            <p className="text-amber-600 text-[8px] xs:text-[9px] sm:text-[10px] font-bold">
              ⭐ Plus Price
            </p>
          ) : isLoyal ? (
            <p className="text-gray-400 text-[7px] xs:text-[8px] sm:text-[9px]">
              Loyalty offer eligible
            </p>
          ) : (
            <p className="text-gray-400 text-[7px] xs:text-[8px] sm:text-[9px]">
              20 pts = Loyalty Price
            </p>
          )}
        </div>

        <p className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] text-green-600 font-semibold mt-1">
          {isPlusMember ? "✨ Free Delivery (Plus)" : "Free Delivery"}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) addToCart({ ...product, finalPrice });
          }}
          disabled={isOutOfStock}
          className={`mt-2 sm:mt-2.5 w-full text-[9px] xs:text-[10px] sm:text-xs py-1 xs:py-1.5 sm:py-2 rounded-md font-semibold transition ${
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

/* ── Category Page ── */
const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API}/api/products?category=${encodeURIComponent(categoryName)}`,
        );
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryName]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header — flush to navbar, no gap */}
      <div className="bg-white border-b px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 truncate capitalize">
            {categoryName}
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-4xl">📦</p>
            <h2 className="text-lg font-black text-gray-700">
              No products here
            </h2>
            <p className="text-gray-400 text-sm">
              Nothing in {categoryName} yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 bg-[#6FAF8E] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 xs:gap-3 sm:gap-4 lg:gap-5">
            {products.map((product, index) => (
              <CategoryProductCard
                key={product._id}
                product={product}
                isLowestPriceItem={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
