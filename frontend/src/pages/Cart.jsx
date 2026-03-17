import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import API from "../api/axios.js";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  CreditCard,
  Truck,
  Plus,
  Minus,
  CheckCircle,
  ShoppingBag,
  ChevronRight,
  MapPin,
  X,
  Navigation,
} from "lucide-react";
import {
  calculateDiscountedPrice,
  calculateDeliveryCharge,
} from "../utils/offerUtils";

const TN_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thiruvallur",
  "Tirupattur",
  "Tiruppur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tiruvannamalai",
  "Tiruvarur",
  "Thoothukudi",
  "Vellore",
  "Villupuram",
  "Virudhunagar",
];

const Cart = () => {
  const { cartItems, fetchCart, setCartItems } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressInput, setAddressInput] = useState({
    fullAddress: "",
    pinCode: "",
    phone: "",
    district: "",
  });
  const [locating, setLocating] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [userInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      return {};
    }
  });

  const isNewUser = dbUser?.firstOrderCompleted === false;
  const loyaltyPoints = Number(dbUser?.loyaltyPoints || 0);
  const isPlusMember = dbUser?.isPlusMember || false;

  useEffect(() => {
    const syncUser = async () => {
      if (!userInfo?._id) return;
      try {
        const { data } = await API.get("/api/users/profile");
        setDbUser(data);
        if (data.addresses?.length > 0) setSelectedAddress(data.addresses[0]);
      } catch (err) {
        console.error(err);
      }
    };

    syncUser();
    fetchCart();
  }, []);

  const cartWithPrices = useMemo(() => {
    if (!cartItems.length) return [];
    const getMrp = (item) => Number(item.price) || 0;
    const lowestIndex = cartItems.reduce(
      (minIdx, item, i, arr) =>
        getMrp(arr[i]) < getMrp(arr[minIdx]) ? i : minIdx,
      0,
    );
    const userCtx = { isNewUser, loyaltyPoints, isPlusMember };

    return cartItems.map((item, index) => {
      const populated =
        item.product && typeof item.product === "object" ? item.product : {};
      const productData = {
        ...populated,
        price: item.price,
        discountedPrice: item.discountedPrice,
        name: item.name,
        quantity: item.quantity,
      };
      const isLowest = index === lowestIndex;

      const firstResult = calculateDiscountedPrice(productData, userCtx, {
        isLowestPriceItem: isLowest,
        isFirstOrder: isNewUser,
        quantityIndex: 0,
      });
      const restResult =
        item.quantity > 1
          ? calculateDiscountedPrice(productData, userCtx, {
              isLowestPriceItem: false,
              isFirstOrder: false,
              quantityIndex: 1,
            })
          : null;

      const firstPrice = firstResult.finalPrice;
      const restPrice = restResult ? restResult.finalPrice : firstPrice;
      const total = firstPrice + Math.max(0, item.quantity - 1) * restPrice;

      return {
        ...item,
        displayPrice: firstPrice,
        restQtyPrice: restPrice,
        totalItemPrice: total,
        offerLabel: firstResult.appliedLabel,
        firstDiscount: firstResult.totalDiscount,
        mrp: firstResult.mrp,
        offerDetails: firstResult.offerDetails,
      };
    });
  }, [cartItems, dbUser]);

  const totalPrice = useMemo(
    () => cartWithPrices.reduce((s, i) => s + i.totalItemPrice, 0),
    [cartWithPrices],
  );
  const deliveryCharge = calculateDeliveryCharge(totalPrice, dbUser);
  const grandTotal = totalPrice + deliveryCharge;

  const updateQuantity = async (productId, qty) => {
    if (qty < 1) return;
    try {
      await API.put(`/api/cart/${productId}`, { quantity: Number(qty) });
      setCartItems(
        cartItems.map((i) =>
          (i.product?._id || i.product) === productId
            ? { ...i, quantity: qty }
            : i,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await API.delete(`/api/cart/${productId}`);
      setCartItems(
        cartItems.filter((i) => (i.product?._id || i.product) !== productId),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const { data } = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          setAddressInput((p) => ({
            ...p,
            fullAddress: `${data.locality}, ${data.city}, ${data.principalSubdivision}`,
            pinCode: data.postcode || "",
          }));
        } catch {
          alert("Could not fetch location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("Location denied");
        setLocating(false);
      },
    );
  };

  const saveNewAddress = async () => {
    if (
      !addressInput.fullAddress ||
      !addressInput.pinCode ||
      !addressInput.phone
    )
      return alert("Fill all fields");
    try {
      const { data } = await API.post("/api/users/address", addressInput);
      setDbUser({ ...dbUser, addresses: data });
      setSelectedAddress(data[data.length - 1]);
      setAddressInput({
        fullAddress: "",
        pinCode: "",
        phone: "",
        district: "",
      });
    } catch {
      alert("Failed to save address");
    }
  };

  const saveEditedAddress = async () => {
    if (!editingAddress) return;
    if (
      !addressInput.fullAddress ||
      !addressInput.pinCode ||
      !addressInput.phone ||
      !addressInput.district
    )
      return alert("Fill all fields including district");
    try {
      const { data } = await API.put(
        `/api/users/address/${editingAddress._id}`,
        editingAddress,
      );
      setDbUser({ ...dbUser, addresses: data });
      if (selectedAddress?._id === editingAddress._id) {
        const fresh = data.find((a) => a._id === editingAddress._id);
        if (fresh) setSelectedAddress(fresh);
      }
      setEditingAddress(null);
    } catch {
      alert("Failed to update address");
    }
  };

  const buildOrderPayload = (method, isPaid) => ({
    orderItems: cartWithPrices.map((i) => ({
      product: typeof i.product === "object" ? i.product._id : i.product,
      name: i.name,
      qty: i.quantity,
      price: i.displayPrice,
      mrp: i.price,
      image: i.image,
      offerDetails: i.offerDetails || {},
    })),
    totalPrice: grandTotal,
    paymentMethod: method,
    isPaid,
    shippingAddress: {
      address: selectedAddress.fullAddress,
      city: selectedAddress.district || "Tamil Nadu",
      postalCode: selectedAddress.pinCode,
      phone: selectedAddress.phone,
      district: selectedAddress.district || "",
    },
  });
  const processPayment = async () => {
    if (!selectedAddress) return alert("Select a delivery address");
    setLoading(true); 

    try {
      if (paymentMethod === "ONLINE") {
        const [{ data: orderData }, { data: rzpData }] = await Promise.all([
          API.post("/api/orders", buildOrderPayload("ONLINE", false)),
          API.post("/api/payment/create-order", { amount: grandTotal }),
        ]);
        const mongoOrderId = orderData._id;

        setShowAddressForm(false); 

        new window.Razorpay({
          key: rzpData.key,
          amount: rzpData.amount,
          currency: "INR",
          name: "NeoMart",
          order_id: rzpData.id,
          handler: async (res) => {
            setOrderSuccess(true);
            setCartItems([]);

            try {
              await API.post("/api/orders/verify", {
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                orderId: mongoOrderId,
              });
              await API.delete("/api/cart");
            } catch (err) {
              console.error(
                "Background verify failed — Order ID:",
                mongoOrderId,
                err,
              );
            }
          },
          prefill: {
            name: userInfo.name,
            email: userInfo.email,
            contact: selectedAddress.phone,
          },
          modal: {
            ondismiss: () => setLoading(false),
          },
          theme: { color: "#6FAF8E" },
        }).open();
      } else {
        await API.post("/api/orders", buildOrderPayload("COD", false));
        await API.delete("/api/cart");
        setCartItems([]);
        setOrderSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200] p-6 text-center"
      >
        <CheckCircle size={56} className="text-[#6FAF8E] mb-4" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2">
          Order Placed!
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mb-6">
          Your goodies are on the way.
        </p>
        <button
          onClick={() => navigate("/myorders")}
          className="bg-[#6FAF8E] text-white px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:bg-green-600 transition"
        >
          VIEW ORDERS
        </button>
      </motion.div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center gap-2 mb-5 sm:mb-7">
          <ShoppingBag className="text-[#6FAF8E] shrink-0" size={22} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
            My Cart
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-2xl border-2 border-dashed px-6 text-center">
            <ShoppingBag size={40} className="text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm sm:text-base font-medium mb-5">
              Your basket is empty!
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-900 text-white px-6 sm:px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <AnimatePresence mode="popLayout">
                {cartWithPrices.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {item.offerLabel && (
                      <span
                        className={`absolute top-0 left-0 px-2 py-0.5 text-[9px] sm:text-[10px] font-black rounded-br-xl ${
                          item.offerLabel === "NEW USER OFFER"
                            ? "bg-blue-800 text-blue-100"
                            : item.offerLabel === "LOYALTY OFFER"
                              ? "bg-purple-800 text-purple-100"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.offerLabel} (1st qty)
                      </span>
                    )}

                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 pt-6 sm:pt-7">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base truncate">
                          {item.name}
                        </h3>

                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[#6FAF8E] font-black text-sm sm:text-base">
                            ₹{item.displayPrice}
                          </span>
                          {item.mrp > item.displayPrice && (
                            <span className="text-gray-400 line-through text-xs sm:text-sm">
                              ₹{item.mrp}
                            </span>
                          )}
                          {item.firstDiscount > 0 && (
                            <span className="text-[10px] sm:text-xs text-green-600 font-semibold">
                              {item.firstDiscount}% OFF
                            </span>
                          )}
                        </div>

                        {item.quantity > 1 && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            Next qty: ₹{item.restQtyPrice} · Subtotal:{" "}
                            <span className="font-bold text-gray-700">
                              ₹{item.totalItemPrice}
                            </span>
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 sm:mt-3">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product?._id || item.product,
                                item.quantity - 1,
                              )
                            }
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-sm w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product?._id || item.product,
                                item.quantity + 1,
                              )
                            }
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(item.product?._id || item.product)
                        }
                        className="text-red-400 hover:text-red-600 p-1 transition shrink-0 mt-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xl p-4 sm:p-6 md:p-8 lg:sticky lg:top-10">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-5">
                  Summary
                </h2>

                <div className="space-y-1.5 mb-4 text-xs sm:text-sm text-gray-500">
                  {cartWithPrices.map((item) => (
                    <div key={item._id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-800 shrink-0">
                        ₹{item.totalItemPrice}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2 mb-4 sm:mb-5 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">
                      ₹{totalPrice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-[#6FAF8E] font-bold">
                      {deliveryCharge === 0
                        ? isPlusMember
                          ? "FREE (Plus)"
                          : "FREE"
                        : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  {deliveryCharge > 0 && (
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      Add ₹{299 - totalPrice} more for free delivery
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-base sm:text-xl md:text-2xl font-black text-[#6FAF8E] mb-4 sm:mb-6">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  {[
                    { id: "ONLINE", Icon: CreditCard, label: "Online" },
                    { id: "COD", Icon: Truck, label: "COD" },
                  ].map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex-1 py-2 sm:py-3 rounded-xl border-2 text-xs sm:text-sm font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === id
                          ? "border-[#6FAF8E] bg-[#6FAF8E]/5 text-[#6FAF8E]"
                          : "border-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddressForm(true)}
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-[#6FAF8E] text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-lg hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? "Processing..." : "CHECKOUT NOW"}
                  {!loading && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showAddressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                Delivery Address
              </h3>
              <button
                onClick={() => setShowAddressForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {dbUser?.addresses?.map((addr) => (
                <div
                  key={addr._id}
                  className={`border-2 rounded-xl overflow-hidden transition ${selectedAddress?._id === addr._id ? "border-[#6FAF8E]" : "border-gray-100"}`}
                >
                  {editingAddress?._id === addr._id ? (
                    <div className="p-3 space-y-2 bg-green-50">
                      <p className="text-[10px] font-black text-[#6FAF8E] uppercase tracking-wider">
                        Editing Address
                      </p>
                      <input
                        className="w-full text-xs p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                        placeholder="Full Address"
                        value={editingAddress.fullAddress}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            fullAddress: e.target.value,
                          })
                        }
                      />
                      <select
                        className="w-full text-xs p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E] bg-white"
                        value={editingAddress.district || ""}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            district: e.target.value,
                          })
                        }
                      >
                        <option value="">Select District *</option>
                        {TN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 text-xs p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                          placeholder="Pincode"
                          value={editingAddress.pinCode}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              pinCode: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-1/2 text-xs p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                          placeholder="Phone"
                          value={editingAddress.phone}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditedAddress}
                          className="flex-1 text-xs py-2 bg-[#6FAF8E] text-white rounded-lg font-bold hover:bg-green-600 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAddress(null)}
                          className="flex-1 text-xs py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3 flex items-start gap-2 cursor-pointer transition ${selectedAddress?._id === addr._id ? "bg-green-50" : "hover:bg-gray-50"}`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <MapPin
                        size={13}
                        className="mt-0.5 text-gray-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold truncate">
                          {addr.fullAddress}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          {addr.district && (
                            <span className="font-semibold text-gray-600">
                              {addr.district} ·{" "}
                            </span>
                          )}
                          {addr.pinCode} · {addr.phone}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddress({
                            ...addr,
                            district: addr.district || "",
                          });
                        }}
                        className="shrink-0 text-[9px] font-black text-[#6FAF8E] border border-[#6FAF8E]/30 px-2 py-1 rounded-lg hover:bg-[#6FAF8E]/10 transition"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-2 border-dashed rounded-xl p-3 space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500">
                  Add New
                </span>
                <button
                  onClick={detectLocation}
                  className="text-[10px] font-bold bg-[#6FAF8E] text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-green-600 transition"
                >
                  <Navigation size={10} />{" "}
                  {locating ? "Locating..." : "Auto-detect"}
                </button>
              </div>
              <input
                className="w-full text-xs sm:text-sm p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                placeholder="Full Address"
                value={addressInput.fullAddress}
                onChange={(e) =>
                  setAddressInput({
                    ...addressInput,
                    fullAddress: e.target.value,
                  })
                }
              />
              <select
                className="w-full text-xs sm:text-sm p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E] bg-white text-gray-700"
                value={addressInput.district}
                onChange={(e) =>
                  setAddressInput({ ...addressInput, district: e.target.value })
                }
              >
                <option value="">Select District *</option>
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="w-1/2 text-xs sm:text-sm p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                  placeholder="Pincode"
                  value={addressInput.pinCode}
                  onChange={(e) =>
                    setAddressInput({
                      ...addressInput,
                      pinCode: e.target.value,
                    })
                  }
                />
                <input
                  className="w-1/2 text-xs sm:text-sm p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6FAF8E]"
                  placeholder="Phone"
                  value={addressInput.phone}
                  onChange={(e) =>
                    setAddressInput({ ...addressInput, phone: e.target.value })
                  }
                />
              </div>
              <button
                onClick={saveNewAddress}
                className="w-full text-xs sm:text-sm py-2 bg-[#6FAF8E] text-white rounded-lg font-bold hover:bg-green-600 transition"
              >
                Save Address
              </button>
            </div>

            <button
              onClick={processPayment}
              disabled={!selectedAddress || loading}
              className="w-full py-3 sm:py-4 bg-[#6FAF8E] text-white rounded-2xl font-black text-sm sm:text-lg shadow-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              CONFIRM & PAY ₹{grandTotal}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
