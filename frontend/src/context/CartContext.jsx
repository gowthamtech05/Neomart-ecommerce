import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import API from "../api/axios.js";

const CartContext = createContext();

// ✅ Outside component — never recreated
const mergeCartData = (items) => {
  return items.reduce((acc, current) => {
    const productId = current.product?._id || current.product || current._id;
    const existing = acc.find(
      (item) => (item.product?._id || item.product || item._id) === productId,
    );
    if (existing) {
      existing.quantity += current.quantity;
    } else {
      acc.push({ ...current });
    }
    return acc;
  }, []);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // ✅ useCallback — stable reference, never recreated
  const fetchCart = useCallback(async () => {
    try {
      const { data } = await API.get("/api/cart");
      const rawItems = Array.isArray(data)
        ? data
        : data.items || data.cartItems || [];
      setCartItems(mergeCartData(rawItems));
    } catch (err) {
      console.error("Fetch Cart Error:", err);
    }
  }, []); // no deps — never changes

  // ✅ useCallback — stable reference
  const addToCart = useCallback(async (product, quantity = 1) => {
    try {
      const { data } = await API.post("/api/cart", {
        productId: product._id,
        quantity,
      });
      const rawItems = Array.isArray(data)
        ? data
        : data.items || data.cartItems || [];
      setCartItems(mergeCartData(rawItems));
    } catch (err) {
      console.error("Add to Cart Error:", err);
      alert("Could not add to cart. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, []); // ✅ fetchCart is now stable so this is safe

  // ✅ useMemo — context value only changes when cartItems changes
  const value = useMemo(
    () => ({ cartItems, addToCart, fetchCart, setCartItems }),
    [cartItems, addToCart, fetchCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
