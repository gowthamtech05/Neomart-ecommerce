import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api.js";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const mergeCartData = (items) => {
    const merged = items.reduce((acc, current) => {
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

    return merged;
  };

  const fetchCart = async () => {
    try {
      const { data } = await API.get("/api/cart");

      const rawItems = Array.isArray(data)
        ? data
        : data.items || data.cartItems || [];

      setCartItems(mergeCartData(rawItems));
    } catch (err) {
      console.error("Fetch Cart Error:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (product, quantity = 1) => {
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
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, fetchCart, setCartItems }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
