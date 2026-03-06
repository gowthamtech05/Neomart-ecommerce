import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios.js";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    try {
      const { data } = await API.get("/api/wishlist");

      setWishlist(data.map((p) => (typeof p === "object" ? p._id : p)));
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    }
  };

  const toggleWishlist = async (productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );

    try {
      await API.post(`/api/wishlist/${productId}`);
    } catch (err) {
      fetchWishlist();
      console.error("Toggle wishlist error:", err);
    }
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isWishlisted, fetchWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
