import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const WishlistContext = createContext();

const API = import.meta.env.VITE_API_URL;

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
      const { data } = await axios.get(`${API}/api/wishlist`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${userInfo?.token}` },
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
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
      await axios.post(
        `${API}/api/wishlist/${productId}`,
        {},
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        },
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
