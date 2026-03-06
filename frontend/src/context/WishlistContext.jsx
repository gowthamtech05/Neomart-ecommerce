import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/wishlist", {
        withCredentials: true,
      });
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
      await axios.post(
        `http://localhost:5000/api/wishlist/${productId}`,
        {},
        { withCredentials: true },
      );
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
