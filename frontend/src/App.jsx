import { useEffect, useState, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import API from "./api/axios.js";

import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import MyOrders from "./pages/MyOrders";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryPage from "./pages/CategoryPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import ProductDetails from "./pages/ProductDetails";
import LoyaltyPage from "./pages/LoyaltyPage";
import OrderDetails from "./pages/OrderDetails";
import SearchResultsPage from "./pages/SearchResultsPage";
import WishlistPage from "./pages/WishlistPage";
import SellerRequestPage from "./pages/partners/SellerRequestPage";
import AdminSellerRequests from "./pages/partners/AdminSellerRequests";
import BecomePartnerPage from "./pages/partners/BecomePartnerPage";
import AdminDeliveryPartners from "./pages/partners/AdminDeliveryPartners";
import SplashScreen from "./components/SplashScreen";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Store,
  Bike,
  ChevronDown,
  Users,
  Menu,
  X,
  Home as HomeIcon,
  ShoppingCart,
  Package,
  LayoutDashboard,
  ShoppingBag,
  BarChart2,
  Settings,
  LogOut,
  Crown,
  ChevronRight,
} from "lucide-react";

import { CartProvider, useCart } from "./context/CartContext";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [pathname]);

  return null;
}
function JoinDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white rounded-full hover:bg-[#6FAF8E] font-bold text-xs transition"
      >
        <Users size={11} /> Join Us{" "}
        <ChevronDown
          size={11}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <Link
              to="/become-seller"
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition group border-b border-gray-50"
            >
              <div className="w-7 h-7 bg-gray-900 group-hover:bg-[#6FAF8E] rounded-xl flex items-center justify-center shrink-0 transition">
                <Store size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800">
                  Become a Seller
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                  List & sell your products
                </p>
              </div>
            </Link>
            <Link
              to="/become-partner"
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition group"
            >
              <div className="w-7 h-7 bg-gray-900 group-hover:bg-[#6FAF8E] rounded-xl flex items-center justify-center shrink-0 transition">
                <Bike size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800">
                  Delivery Partner
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                  Earn by delivering orders
                </p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminManageDropdown({ sellerCount, partnerCount }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const totalBadge = sellerCount + partnerCount;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="nav-link-anim flex items-center gap-1 text-gray-600 hover:text-[#6FAF8E] font-medium text-sm transition"
      >
        Manage
        {totalBadge > 0 && (
          <span className="ml-1 bg-[#6FAF8E] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`ml-0.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <Link
              to="/admin/sellers"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={13} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">
                    Seller Requests
                  </p>
                  <p className="text-[9px] text-gray-400">
                    Review applications
                  </p>
                </div>
              </div>
              {sellerCount > 0 && (
                <span className="bg-[#6FAF8E] text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full">
                  {sellerCount}
                </span>
              )}
            </Link>
            <Link
              to="/admin/partners"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Bike size={13} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">
                    Delivery Partners
                  </p>
                  <p className="text-[9px] text-gray-400">Manage partners</p>
                </div>
              </div>
              {partnerCount > 0 && (
                <span className="bg-amber-400 text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full">
                  {partnerCount}
                </span>
              )}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  isAdmin,
  deliveryAlertCount,
  refundAlertCount,
  sellerRequestCount,
  partnerRequestCount,
  lowStockCount,
}) {
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const [adminOpen, setAdminOpen] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-[300px] bg-white z-50 flex flex-col shadow-2xl lg:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gray-900 shrink-0">
              <span className="text-xl font-black tracking-tighter text-white">
                NEO<span style={{ color: "#6FAF8E" }}>MART</span>
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 py-3">
              {!isAdmin && (
                <div className="px-3 space-y-0.5">
                  <DrawerItem
                    icon={<HomeIcon size={16} />}
                    label="Home"
                    onClick={() => go("/")}
                  />

                  {isLoggedIn && (
                    <>
                      <DrawerItem
                        icon={<Package size={16} />}
                        label="My Orders"
                        onClick={() => go("/myorders")}
                      />
                      <DrawerItem
                        icon={<Crown size={16} className="text-yellow-500" />}
                        label="Plus"
                        badge={null}
                        onClick={() => go("/plus")}
                        labelClass="text-yellow-600 font-bold"
                      />
                      <DrawerItem
                        icon={<Heart size={16} />}
                        label="Wishlist"
                        onClick={() => go("/wishlist")}
                      />
                    </>
                  )}

                  <div className="my-3 border-t border-gray-100" />

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pb-1">
                    Join Us
                  </p>
                  <DrawerItem
                    icon={<Store size={16} />}
                    label="Become a Seller"
                    sub="List & sell your products"
                    onClick={() => go("/become-seller")}
                  />
                  <DrawerItem
                    icon={<Bike size={16} />}
                    label="Delivery Partner"
                    sub="Earn by delivering orders"
                    onClick={() => go("/become-partner")}
                  />
                </div>
              )}

              {isAdmin && (
                <div className="px-3 space-y-0.5">
                  <DrawerItem
                    icon={<HomeIcon size={16} />}
                    label="Home"
                    onClick={() => go("/")}
                  />

                  <div className="my-2 border-t border-gray-100" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pb-1">
                    Admin Panel
                  </p>

                  <DrawerItem
                    icon={<Settings size={16} />}
                    label="Admin"
                    onClick={() => go("/admin")}
                  />
                  <DrawerItem
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                    badge={
                      lowStockCount > 0
                        ? { count: lowStockCount, color: "bg-amber-500" }
                        : null
                    }
                    onClick={() => go("/admin/dashboard")}
                  />
                  <DrawerItem
                    icon={<ShoppingBag size={16} />}
                    label="Orders"
                    badge={
                      deliveryAlertCount + refundAlertCount > 0
                        ? {
                            count: deliveryAlertCount + refundAlertCount,
                            color: "bg-red-500",
                          }
                        : null
                    }
                    onClick={() => go("/admin/orders")}
                  />

                  <DrawerItem
                    icon={<ShoppingCart size={16} />}
                    label="Products"
                    onClick={() => go("/admin/products")}
                  />

                  <div className="my-2 border-t border-gray-100" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pb-1">
                    Manage
                  </p>

                  <DrawerItem
                    icon={<Store size={16} />}
                    label="Seller Requests"
                    badge={
                      sellerRequestCount > 0
                        ? { count: sellerRequestCount, color: "bg-[#6FAF8E]" }
                        : null
                    }
                    onClick={() => go("/admin/sellers")}
                  />
                  <DrawerItem
                    icon={<Bike size={16} />}
                    label="Delivery Partners"
                    badge={
                      partnerRequestCount > 0
                        ? { count: partnerRequestCount, color: "bg-amber-400" }
                        : null
                    }
                    onClick={() => go("/admin/partners")}
                  />
                </div>
              )}
            </div>

            <div className="px-3 py-4 border-t border-gray-100 shrink-0">
              {isLoggedIn ? (
                <button
                  onClick={async () => {
                    try {
                      await fetch(
                        `${import.meta.env.VITE_API_URL}/api/users/logout`,
                        {
                          method: "POST",
                          credentials: "include",
                        },
                      );
                    } catch (err) {
                      console.error("Logout error:", err);
                    } finally {
                      localStorage.removeItem("userInfo");
                      localStorage.removeItem("isAdmin");
                      window.location.href = "/login";
                    }
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition font-semibold text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => go("/login")}
                  className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl bg-gray-900 text-white hover:bg-[#6FAF8E] transition font-semibold text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerItem({ icon, label, sub, badge, onClick, labelClass = "" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-left group"
    >
      <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 transition">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold text-gray-800 leading-tight ${labelClass}`}
        >
          {label}
        </p>
        {sub && (
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
            {sub}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badge && (
          <span
            className={`${badge.color} text-white text-[9px] font-black h-5 min-w-5 px-1 flex items-center justify-center rounded-full`}
          >
            {badge.count > 9 ? "9+" : badge.count}
          </span>
        )}
        <ChevronRight
          size={13}
          className="text-gray-300 group-hover:text-gray-400 transition"
        />
      </div>
    </button>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [deliveryAlertCount, setDeliveryAlertCount] = useState(0);
  const [refundAlertCount, setRefundAlertCount] = useState(0);
  const [sellerRequestCount, setSellerRequestCount] = useState(0);
  const [partnerRequestCount, setPartnerRequestCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    const admin = localStorage.getItem("isAdmin");
    setIsLoggedIn(!!userInfo);
    setIsAdmin(admin === "true");
  }, [location.pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (!raw) return;
      const userInfo = JSON.parse(raw);
      if (!userInfo?.token) {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("isAdmin");
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } catch {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("isAdmin");
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const fetchSuggestions = async (query) => {
    if (!query?.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/suggestions?q=${query}`,
      );
      const data = await res.json();
      setSuggestions((Array.isArray(data) ? data : []).slice(0, 3));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("isAdmin");
      window.location.href = "/login";
    }
  };

  const fetchAdminAlerts = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const oRes = await API.get("/api/orders/admin");
      const oData = oRes.data;

      const orders = Array.isArray(oData.orders) ? oData.orders : oData;

      setDeliveryAlertCount(
        orders.filter((o) => !o.isDelivered && !o.isCancelled).length,
      );

      setRefundAlertCount(
        orders.filter((o) => o.isCancelled && o.isPaid && !o.isRefunded).length,
      );

      const dRes = await API.get("/api/orders/admin/dashboard");
      const dData = dRes.data;

      if (dData.lowStockProducts) {
        setLowStockCount(dData.lowStockProducts.length);
      }

      const sRes = await API.get("/api/seller-requests/admin/all");
      const sData = sRes.data;

      setSellerRequestCount(
        (Array.isArray(sData) ? sData : []).filter(
          (r) => r.status === "pending",
        ).length,
      );

      const pRes = await API.get("/api/delivery-partners/admin/pending-count");
      const pData = pRes.data;

      setPartnerRequestCount(pData.count || 0);
    } catch (err) {
      console.error("Badge fetch error:", err);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminAlerts();
      const iv = setInterval(fetchAdminAlerts, 30000);
      return () => clearInterval(iv);
    }
  }, [isAdmin, fetchAdminAlerts]);

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const isActive = (path) => location.pathname === path;

  const totalAdminBadge =
    deliveryAlertCount +
    refundAlertCount +
    sellerRequestCount +
    partnerRequestCount +
    lowStockCount;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        .nav-link-anim { position: relative; }
        .nav-link-anim::after {
          content: ''; position: absolute; width: 0; height: 2px;
          bottom: -4px; left: 0; background-color: #6FAF8E;
          transition: width 0.3s ease-in-out;
        }
        .nav-link-anim:hover::after { width: 100%; }
        .bottom-nav-item { tap-highlight-color: transparent; -webkit-tap-highlight-color: transparent; }
      `}</style>

      <ScrollToTop />
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        deliveryAlertCount={deliveryAlertCount}
        refundAlertCount={refundAlertCount}
        sellerRequestCount={sellerRequestCount}
        partnerRequestCount={partnerRequestCount}
        lowStockCount={lowStockCount}
      />

      <nav className="bg-white shadow-sm sticky top-0 z-40 px-3 md:px-8 h-14 md:h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-700"
            >
              <Menu size={20} />
              {totalAdminBadge > 0 && isAdmin && (
                <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/vite.svg"
                alt="NeoMart"
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg"
              />
              <span className="text-xl md:text-2xl font-black tracking-tighter text-gray-900">
                NEO<span style={{ color: "#6FAF8E" }}>MART</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-4 ml-2">
              <Link
                to="/"
                className="nav-link-anim text-gray-600 hover:text-[#6FAF8E] font-medium text-sm"
              >
                Home
              </Link>

              {isLoggedIn && (
                <Link
                  to="/myorders"
                  className="nav-link-anim text-gray-600 hover:text-[#6FAF8E] font-medium text-sm"
                >
                  My Orders
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/plus"
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 hover:bg-yellow-100 font-bold text-xs"
                >
                  <Crown size={10} /> Plus
                </Link>
              )}

              {isLoggedIn && !isAdmin && <JoinDropdown />}

              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-gray-200" />
                  <Link
                    to="/admin"
                    className="nav-link-anim text-gray-600 hover:text-[#6FAF8E] font-bold text-sm"
                  >
                    Admin
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    className="nav-link-anim text-gray-600 hover:text-[#6FAF8E] font-medium text-sm relative flex items-center"
                  >
                    Dashboard
                    {lowStockCount > 0 && (
                      <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
                        {lowStockCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="nav-link-anim text-gray-600 hover:text-[#6FAF8E] font-medium text-sm relative flex items-center"
                  >
                    Orders
                    {(deliveryAlertCount > 0 || refundAlertCount > 0) && (
                      <div className="flex items-center ml-1">
                        {deliveryAlertCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                            {deliveryAlertCount}
                          </span>
                        )}
                        {refundAlertCount > 0 && (
                          <span className="bg-purple-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full -ml-1">
                            {refundAlertCount}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                  <AdminManageDropdown
                    sellerCount={sellerRequestCount}
                    partnerCount={partnerRequestCount}
                  />
                </>
              )}
            </div>
          </div>

          {!isAuthPage && (
            <div className="flex flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 md:mx-6 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 bg-gray-100 rounded-full focus:ring-2 focus:ring-[#6FAF8E] outline-none text-xs md:text-sm border-none transition-all"
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  if (!val.trim()) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  } else fetchSuggestions(val);
                }}
                onFocus={() => search.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    navigate(`/search?q=${encodeURIComponent(search)}`);
                    setShowSuggestions(false);
                  }
                }}
              />
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {suggestions.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearch(product.name);
                          setShowSuggestions(false);
                          navigate(
                            `/search?q=${encodeURIComponent(product.name)}`,
                          );
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass text-gray-300 text-xs" />
                        <span className="text-gray-700 text-sm font-medium">
                          {product.name}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {isLoggedIn && (
              <>
                <Link
                  to="/wishlist"
                  className="hidden lg:relative lg:flex p-2 text-gray-500 hover:text-red-500 transition items-center gap-1.5"
                >
                  <Heart
                    size={20}
                    className={
                      wishlistCount > 0 ? "fill-red-500 text-red-500" : ""
                    }
                  />
                  <span className="text-sm font-medium">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="hidden lg:relative lg:flex p-2 text-gray-600 hover:text-[#6FAF8E] items-center gap-1.5"
                >
                  <i className="fa-solid fa-cart-shopping text-xl" />
                  <span className="text-sm font-medium">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-[#6FAF8E] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {!isLoggedIn ? (
              <Link
                to="/login"
                className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6FAF8E] transition"
              >
                Login
              </Link>
            ) : (
              <button
                className="hidden lg:block text-gray-400 hover:text-red-500 text-sm font-medium transition"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <main
        className={`flex-grow ${isAuthPage ? "p-0" : "max-w-7xl mx-auto w-full p-2 md:p-8"} ${isLoggedIn && !isAuthPage ? "pb-20 lg:pb-0" : ""}`}
      >
        <Routes>
          <Route path="/" element={<Home search={search} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
          <Route path="/admin/sellers" element={<AdminSellerRequests />} />
          <Route path="/admin/partners" element={<AdminDeliveryPartners />} />
          <Route
            path="/login"
            element={
              <Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/plus" element={<LoyaltyPage />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/become-seller" element={<SellerRequestPage />} />
          <Route path="/become-partner" element={<BecomePartnerPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {isLoggedIn && !isAuthPage && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            <BottomNavItem
              to="/"
              icon={<HomeIcon size={22} />}
              label="Home"
              active={isActive("/")}
            />

            <BottomNavItem
              to="/myorders"
              icon={<Package size={22} />}
              label="Orders"
              active={isActive("/myorders")}
            />

            <BottomNavItem
              to="/wishlist"
              icon={
                <div className="relative">
                  <Heart
                    size={22}
                    className={
                      wishlistCount > 0 ? "fill-red-500 text-red-500" : ""
                    }
                  />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </div>
              }
              label="Wishlist"
              active={isActive("/wishlist")}
            />

            <BottomNavItem
              to="/cart"
              icon={
                <div className="relative">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#6FAF8E] text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
              }
              label="Cart"
              active={isActive("/cart")}
            />

            {isAdmin ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="bottom-nav-item flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-gray-400 relative"
              >
                <div className="relative">
                  <Settings size={22} />
                  {totalAdminBadge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                      {totalAdminBadge > 9 ? "9+" : totalAdminBadge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="bottom-nav-item flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-gray-400"
              >
                <Menu size={22} />
                <span className="text-[10px] font-semibold">More</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BottomNavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`bottom-nav-item flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors ${
        active ? "text-[#6FAF8E]" : "text-gray-400"
      }`}
    >
      <motion.div
        animate={active ? { scale: 1.1 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span
        className={`text-[10px] font-semibold ${active ? "text-[#6FAF8E]" : ""}`}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="bottomNavIndicator"
          className="absolute bottom-0 h-0.5 w-8 bg-[#6FAF8E] rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}
export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("splashShown"),
  );

  return (
    <CartProvider>
      <WishlistProvider>
        {showSplash && (
          <SplashScreen
            onDone={() => {
              sessionStorage.setItem("splashShown", "1");
              setShowSplash(false);
            }}
          />
        )}
        {!showSplash && <AppContent />}
      </WishlistProvider>
    </CartProvider>
  );
}
