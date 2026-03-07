import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import axios from "axios";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import {
  calculateDiscountedPrice,
  calculateDeliveryCharge,
} from "../utils/offerUtils";
import {
  CreditCard,
  Truck,
  X,
  CheckCircle,
  MapPin,
  Navigation,
  Trash2,
  Plus,
} from "lucide-react";

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

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Address & User Sync
  const [dbUser, setDbUser] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressInput, setAddressInput] = useState({
    fullAddress: "",
    pinCode: "",
    phone: "",
    district: "",
  });
  const [editingAddress, setEditingAddress] = useState(null);

  // Admin States
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editMfgDate, setEditMfgDate] = useState("");
  const [editExpDate, setEditExpDate] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscountedPrice, setEditDiscountedPrice] = useState(0);

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (userInfo?._id || true) {
          const profileRes = await API.get("/api/users/profile");
          setDbUser(profileRes.data);
          if (profileRes.data.addresses?.length > 0) {
            setSelectedAddress(profileRes.data.addresses[0]);
          }
        }

        const { data } = await API.get(`/api/products/${id}`);
        setProduct(data);
        setMainImage(data.images?.[0] || "");

        const simRes = await API.get(`/api/products/category/${data.category}`);
        setSimilarProducts(simRes.data.filter((p) => p._id !== id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (showAdminEdit && product) {
      setEditQuantity(product.quantity || 0);
      setEditMfgDate(
        product.manufacturingDate
          ? product.manufacturingDate.split("T")[0]
          : "",
      );
      setEditExpDate(
        product.expiryDate ? product.expiryDate.split("T")[0] : "",
      );
      setEditBrand(product.brand || "");
      setEditPrice(product.price || 0);
      setEditDiscountedPrice(product.discountedPrice || 0);
    }
  }, [showAdminEdit, product]);

  const handleAdminUpdate = async () => {
    try {
      await API.put(`/products/update/${product._id}`, {
        quantity: Number(editQuantity),
        manufacturingDate: editMfgDate,
        expiryDate: editExpDate,
        brand: editBrand,
        price: Number(editPrice),
        discountedPrice: Number(editDiscountedPrice),
      });
      alert("Product Updated Successfully");
      setShowAdminEdit(false);
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
    } catch {
      alert("Update Failed");
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const { data } = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          setAddressInput((prev) => ({
            ...prev,
            fullAddress: `${data.locality}, ${data.city}, ${data.principalSubdivision}`,
            pinCode: data.postcode || "",
          }));
        } catch {
          alert("Could not fetch location details");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("Location access denied");
        setLocating(false);
      },
    );
  };

  const saveNewAddress = async () => {
    if (
      !addressInput.fullAddress ||
      !addressInput.pinCode ||
      !addressInput.phone ||
      !addressInput.district
    )
      return alert("Fill all fields including district");
    try {
      const { data } = await API.post("/users/address", addressInput);
      setDbUser({ ...dbUser, addresses: data });
      setSelectedAddress(data[data.length - 1]);
      setShowAddressForm(false);
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
      !editingAddress.fullAddress ||
      !editingAddress.pinCode ||
      !editingAddress.phone ||
      !editingAddress.district
    )
      return alert("Fill all fields including district");
    try {
      const { data } = await API.put(
        `/users/address/${editingAddress._id}`,
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

  const deleteAddress = async (addrId) => {
    try {
      const { data } = await API.delete(`/users/address/${addrId}`);
      setDbUser({ ...dbUser, addresses: data });
      if (selectedAddress?._id === addrId) setSelectedAddress(data[0] || null);
    } catch {
      alert("Delete failed");
    }
  };

  const { finalPrice, totalDiscount, appliedLabel, mrp, offerDetails } =
    useMemo(() => {
      if (!product)
        return {
          finalPrice: 0,
          totalDiscount: 0,
          appliedLabel: "",
          mrp: 0,
          offerDetails: {},
        };

      const isNewUser = dbUser ? dbUser.firstOrderCompleted === false : false;
      const loyaltyPoints = Number(dbUser?.loyaltyPoints || 0);
      const isPlusMember = dbUser?.isPlusMember || false;

      const result = calculateDiscountedPrice(
        product,
        { isNewUser, loyaltyPoints, isPlusMember },
        {
          isLowestPriceItem: true,
          isFirstOrder: isNewUser,
          quantityIndex: 0,
        },
      );

      return {
        finalPrice: result.finalPrice,
        totalDiscount: result.totalDiscount,
        appliedLabel: result.appliedLabel,
        mrp: result.mrp,
        offerDetails: result.offerDetails,
      };
    }, [product, dbUser]);

  const deliveryCharge = calculateDeliveryCharge(finalPrice, dbUser);

  const handleBuyNowOrder = async (method) => {
    if (!selectedAddress)
      return alert("Please select or add a delivery address first");

    try {
      setProcessingOrder(true);
      if (method === "ONLINE") {
        const orderPayload = {
          orderItems: [
            {
              product: product._id,
              name: product.name,
              image: product.images?.[0],
              price: finalPrice,
              mrp: mrp,
              qty: 1,
              offerDetails: offerDetails,
            },
          ],
          shippingAddress: {
            address: selectedAddress.fullAddress,
            city: selectedAddress.district || "Tamil Nadu",
            postalCode: selectedAddress.pinCode,
            phone: selectedAddress.phone,
            district: selectedAddress.district || "",
          },
          totalPrice: finalPrice + deliveryCharge,
          paymentMethod: "ONLINE",
          isPaid: false,
          orderStatus: "Not Paid",
        };
        const { data: orderData } = await API.post("/orders", orderPayload);
        const mongoOrderId = orderData._id;

        const { data: rzpData } = await API.post("/payment/create-order", {
          amount: finalPrice + deliveryCharge,
        });
        const options = {
          key: rzpData.key,
          amount: rzpData.amount,
          currency: "INR",
          name: "NeoMart",
          order_id: rzpData.id,
          handler: async (res) => {
            try {
              await API.post("/orders/verify", {
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                orderId: mongoOrderId,
              });
              setOrderSuccess(true);
              setShowPaymentModal(false);
            } catch (err) {
              console.error("Payment verify failed:", err);
              alert(
                "Payment received but verification failed. Your order is saved - please contact support with Order ID: " +
                  mongoOrderId,
              );
              setOrderSuccess(true);
              setShowPaymentModal(false);
            }
          },
          theme: { color: "#6FAF8E" },
        };
        new window.Razorpay(options).open();
      } else {
        await saveOrderToDB("COD", false);
      }
    } catch {
      alert("Order could not be processed.");
    } finally {
      setProcessingOrder(false);
    }
  };

  const saveOrderToDB = async (method, isPaid) => {
    const orderData = {
      orderItems: [
        {
          product: product._id,
          name: product.name,
          image: product.images?.[0],
          price: finalPrice,
          mrp: mrp,
          qty: 1,
          offerDetails: offerDetails,
        },
      ],
      shippingAddress: {
        address: selectedAddress.fullAddress,
        city: selectedAddress.district || "Tamil Nadu",
        postalCode: selectedAddress.pinCode,
        phone: selectedAddress.phone,
        district: selectedAddress.district || "",
      },
      totalPrice: finalPrice + deliveryCharge,
      paymentMethod: method,
      isPaid,
      orderStatus: isPaid ? "Paid" : "Not Paid",
    };

    try {
      await API.post("/orders", orderData);
      setOrderSuccess(true);
      setShowPaymentModal(false);
    } catch {
      alert("Database error. Order not saved.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen font-bold text-[#6FAF8E]">
        Loading...
      </div>
    );

  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 10;

  return (
    <div className="bg-gray-100 min-h-screen pb-24 w-full">
      <nav
        className={`bg-[#6FAF8E] p-4 text-white fixed left-0 right-0 z-50 shadow-md flex items-center justify-between transition-all ${
          isScrolled ? "top-0" : "top-0 md:top-[65px]"
        }`}
      >
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-2xl">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <span className="font-bold truncate">{product.name}</span>
        </div>
        {userInfo?.isAdmin && (
          <button
            onClick={() => setShowAdminEdit(true)}
            className="bg-white text-[#6FAF8E] px-3 py-1 rounded-lg text-sm font-bold"
          >
            Edit Stock
          </button>
        )}
      </nav>

      <div className="h-16 md:h-[25px]"></div>

      <div className="bg-white p-6 flex justify-center border-b">
        <img
          src={
            mainImage?.startsWith("http")
              ? mainImage
              : `${import.meta.env.VITE_API_URL.replace("/api", "")}${mainImage}`
          }
          className="h-96 object-contain"
          alt={product.name}
        />
      </div>

      <div className="bg-white p-5 shadow-sm">
        <h1 className="text-xl font-medium">{product.name}</h1>
        {appliedLabel && (
          <span
            className={`inline-block mt-1 text-xs px-2 py-1 rounded font-bold ${
              appliedLabel === "NEW USER OFFER"
                ? "bg-blue-100 text-blue-700"
                : appliedLabel === "LOYALTY OFFER"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {appliedLabel}
          </span>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-2xl font-bold text-green-600">
            ₹{finalPrice}
          </span>

          {mrp > finalPrice && (
            <span className="line-through text-gray-400 text-lg">₹{mrp}</span>
          )}

          {totalDiscount > 0 && (
            <span className="text-sm text-red-500 font-semibold">
              {totalDiscount}% OFF
            </span>
          )}
        </div>

        {mrp > finalPrice && (
          <p className="text-green-600 text-sm font-semibold mt-1">
            You save ₹{mrp - finalPrice}
          </p>
        )}

        <p className="text-sm text-green-600 font-semibold mt-1">
          {deliveryCharge === 0
            ? dbUser?.isPlusMember
              ? "✨ Free Delivery (Plus Member)"
              : "✅ Free Delivery"
            : `Delivery: ₹${deliveryCharge} (Free above ₹299)`}
        </p>

        <div className="mt-2">
          {isOutOfStock ? (
            <p className="text-red-600 font-semibold text-sm">
              ❌ No stocks available
            </p>
          ) : isLowStock ? (
            <p className="text-orange-500 font-semibold text-sm animate-pulse">
              ⚠ Only {product.quantity} stocks left
            </p>
          ) : null}
        </div>

        {dbUser?.firstOrderCompleted === false && (
          <p className="mt-2 text-blue-600 text-sm font-semibold">
            🎁 20% New User Offer applies to your cheapest item at checkout!
          </p>
        )}

        <div className="mt-4">
          <p
            className={`text-gray-600 text-sm ${
              showFullDesc ? "" : "line-clamp-2"
            }`}
          >
            {product.description}
          </p>
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="mt-2 text-[#6FAF8E] text-sm font-semibold"
          >
            {showFullDesc ? "Read Less ▲" : "Read More ▼"}
          </button>
        </div>
      </div>

      <div className="mt-2 p-5 bg-white">
        <h2 className="font-bold mb-4">Similar Products</h2>
        <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide">
          {similarProducts.map((item) => (
            <div key={item._id} className="min-w-[200px]">
              <ProductCard product={item} />
            </div>
          ))}
        </div>
      </div>

      {product.quantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white flex h-16 border-t z-50">
          <button
            onClick={() => addToCart({ ...product, finalPrice })}
            className="flex-1 font-bold border-r"
          >
            ADD TO CART
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 bg-[#6FAF8E] text-white font-bold"
          >
            BUY NOW
          </button>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                Delivery Address
              </p>
              <div className="space-y-2">
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

              {/* Add New Address form */}
              <div className="border-2 border-dashed rounded-xl p-3 space-y-2 mt-2">
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
                  value={addressInput.district || ""}
                  onChange={(e) =>
                    setAddressInput({
                      ...addressInput,
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
                      setAddressInput({
                        ...addressInput,
                        phone: e.target.value,
                      })
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
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Price</span>
                <span className="font-bold">₹{finalPrice}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Delivery</span>
                <span
                  className={
                    deliveryCharge === 0
                      ? "text-green-600 font-bold"
                      : "font-bold"
                  }
                >
                  {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between mt-2 font-black text-base border-t pt-2">
                <span>Total</span>
                <span className="text-[#6FAF8E]">
                  ₹{finalPrice + deliveryCharge}
                </span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              Payment Method
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleBuyNowOrder("ONLINE")}
                disabled={processingOrder}
                className="w-full flex items-center justify-between p-4 border-2 rounded-2xl hover:border-[#6FAF8E] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="text-blue-600" />
                  <p className="font-bold text-gray-700">Online Payment</p>
                </div>
              </button>
              <button
                onClick={() => handleBuyNowOrder("COD")}
                disabled={processingOrder}
                className="w-full flex items-center justify-between p-4 border-2 rounded-2xl hover:border-[#6FAF8E] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <Truck className="text-orange-600" />
                  <p className="font-bold text-gray-700">Cash on Delivery</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[110]">
          <CheckCircle
            size={80}
            className="text-green-600 mb-4 animate-bounce"
          />
          <h2 className="text-3xl font-bold mb-2">Order Successful!</h2>
          <button
            onClick={() => navigate("/myorders")}
            className="bg-[#6FAF8E] text-white px-10 py-4 rounded-2xl font-bold"
          >
            VIEW MY ORDERS
          </button>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
            <h3 className="text-xl font-bold mb-4">Admin Stock Update</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">MRP Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">
                  Discounted Price (₹)
                </label>
                <input
                  type="number"
                  value={editDiscountedPrice}
                  onChange={(e) => setEditDiscountedPrice(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Brand Name</label>
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Stock Quantity</label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">
                  Manufacturing Date
                </label>
                <input
                  type="date"
                  value={editMfgDate}
                  onChange={(e) => setEditMfgDate(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Expiry Date</label>
                <input
                  type="date"
                  value={editExpDate}
                  onChange={(e) => setEditExpDate(e.target.value)}
                  className="w-full border p-2 rounded-lg mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAdminEdit(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminUpdate}
                className="px-4 py-2 bg-[#6FAF8E] text-white rounded-lg font-bold"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
