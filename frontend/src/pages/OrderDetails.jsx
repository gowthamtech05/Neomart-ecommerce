import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios.js";
import {
  ChevronLeft,
  Package,
  User,
  CreditCard,
  MapPin,
  FileText,
  Clock,
  Phone,
  XCircle,
  Calendar,
  Truck,
} from "lucide-react";

const DeliveryTracker = ({ order }) => {
  if (order.isCancelled) return null;

  const currentStep = order.isDelivered
    ? 3
    : order.orderStatus === "Out for Delivery"
      ? 2
      : order.orderStatus === "In Transit"
        ? 1
        : 0;

  const steps = [
    { label: "Order Placed", icon: "🛒", time: order.createdAt },
    { label: "In Transit", icon: "📦", time: order.inTransitAt || null },
    { label: "Out for Delivery", icon: "🛵", time: order.assignedAt || null },
    { label: "Delivered", icon: "✅", time: order.deliveredAt || null },
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b bg-gray-50/50 flex items-center gap-1.5">
        <Truck size={13} className="text-[#6FAF8E]" />
        <h3 className="text-[9px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
          Delivery Status
        </h3>
      </div>

      <div className="px-4 sm:px-5 py-5 sm:py-6">
        <div className="flex items-start justify-between relative">
          <div className="absolute top-[14px] left-[14px] right-[14px] h-px bg-gray-100 z-0" />
          <div
            className="absolute top-[14px] left-[14px] h-px bg-[#6FAF8E] z-0 transition-all duration-500"
            style={{
              width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep === steps.length - 1 ? "28px" : "0px"})`,
            }}
          />

          {steps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;

            return (
              <div
                key={step.label}
                className="flex flex-col items-center gap-1.5 z-10 flex-1 min-w-0"
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-[#6FAF8E] border-[#6FAF8E]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {done ? (
                    <span style={{ fontSize: 12 }}>{step.icon}</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200 block" />
                  )}
                </div>
                <p
                  className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-center leading-tight px-0.5 ${
                    active
                      ? "text-[#6FAF8E]"
                      : done
                        ? "text-gray-600"
                        : "text-gray-300"
                  }`}
                >
                  {step.label}
                </p>
                {done && step.time && (
                  <p className="text-[7px] sm:text-[8px] text-gray-400 font-bold text-center">
                    {new Date(step.time).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/api/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please login again."
          : "Order not found ❌",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const downloadInvoice = async () => {
    try {
      const response = await API.get(`/api/orders/${order._id}/invoice`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${order._id}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download invoice");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#6FAF8E] font-black uppercase tracking-widest animate-pulse text-xs sm:text-sm">
          Syncing...
        </p>
      </div>
    );

  if (error || !order)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] p-6 text-center">
        <XCircle size={48} className="text-red-400" />
        <h2 className="text-gray-800 text-base sm:text-xl font-black uppercase">
          {error}
        </h2>
        <Link
          to="/myorders"
          className="bg-[#6FAF8E] text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-green-600 transition"
        >
          Return to Orders
        </Link>
      </div>
    );

  const itemsPriceSum = order.orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );
  const _localUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const isPlusMember = !!(order.user?.isPlusMember || _localUser?.isPlusMember);
  const deliveryCharge = isPlusMember ? 0 : itemsPriceSum >= 299 ? 0 : 39;
  const totalSavings = order.orderItems.reduce(
    (acc, item) =>
      acc +
      ((Number(item.mrp) || Number(item.price)) - Number(item.price)) *
        item.qty,
    0,
  );
  const offerLabel =
    order.orderItems.find((i) => i.offerDetails?.appliedLabel)?.offerDetails
      ?.appliedLabel || null;

  const infoBento = [
    {
      icon: <User className="text-[#6FAF8E]" size={16} />,
      label: "Customer",
      main: order.user?.name || "Guest",
      sub: order.user?.email,
    },
    {
      icon: <CreditCard className="text-blue-500" size={16} />,
      label: "Payment",
      main: order.isRefunded ? "Refunded" : order.isPaid ? "Paid" : "Unpaid",
      sub: order.paymentMethod,
    },
    {
      icon: <MapPin className="text-orange-500" size={16} />,
      label: "Shipping",
      main:
        order.shippingAddress?.fullAddress ||
        order.shippingAddress?.address ||
        "—",
      sub: `${order.shippingAddress?.city || ""} ${order.shippingAddress?.pinCode || ""}`,
      phone: order.shippingAddress?.phone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-12">
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-xl text-[#6FAF8E] shrink-0 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-gray-900 uppercase italic truncate">
                Order Details
              </h1>
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-mono font-bold truncate">
                #{order._id}
              </p>
            </div>
          </div>
          <button
            onClick={downloadInvoice}
            className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-xl font-black text-[10px] sm:text-xs flex items-center gap-1.5 hover:opacity-90 transition shrink-0"
          >
            <FileText size={13} className="text-[#6FAF8E]" />
            <span className="hidden sm:inline">Invoice</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-5 lg:gap-8">
        <div className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
          {order.isPaid && order.isCancelled && !order.isRefunded && (
            <div className="bg-amber-50 border-2 border-amber-100 p-3 sm:p-4 rounded-2xl flex items-center gap-3">
              <Clock className="text-amber-600 shrink-0" size={16} />
              <p className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase">
                Order cancelled. Refund within 7 days.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {infoBento.map(({ icon, label, main, sub, phone }) => (
              <div
                key={label}
                className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="mb-2">{icon}</div>
                <p className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase mb-0.5">
                  {label}
                </p>
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                  {main}
                </h3>
                {sub && (
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate mt-0.5">
                    {sub}
                  </p>
                )}
                {phone && (
                  <div className="flex items-center gap-1 text-[#6FAF8E] mt-1">
                    <Phone size={10} />
                    <p className="text-[9px] sm:text-[10px] font-black">
                      {phone}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DeliveryTracker order={order} />

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-[9px] sm:text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Package size={13} /> Order Content
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold bg-white px-2.5 py-1 rounded-full border">
                {order.orderItems.length} Items
              </span>
            </div>
            <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
              {order.orderItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-gray-100/60 transition"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center p-1 border shrink-0">
                      <img
                        src={
                          item.image?.startsWith("http")
                            ? item.image
                            : `${import.meta.env.VITE_API_URL}${item.image}`
                        }
                        className="max-h-full object-contain"
                        alt={item.name}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold">
                          Qty {item.qty} × ₹{item.price}
                        </p>
                        {item.mrp && item.mrp > item.price && (
                          <p className="text-[9px] sm:text-[10px] text-gray-300 line-through">
                            ₹{item.mrp}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-gray-900 shrink-0">
                    ₹{Math.round(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="bg-gray-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl">
              <p className="text-[9px] sm:text-[10px] font-black text-[#6FAF8E] uppercase tracking-widest mb-1">
                Payable Total
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter italic mb-4 sm:mb-6">
                ₹{order.totalPrice}
              </h2>
              <div className="space-y-2 sm:space-y-3 border-t border-white/10 pt-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <div className="flex justify-between text-gray-400">
                  <span>Items</span>
                  <span className="text-white">₹{itemsPriceSum}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#6FAF8E]">
                    <span className="normal-case">
                      {offerLabel || "Offer"} Savings
                    </span>
                    <span>- ₹{Math.round(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1">
                    <Truck size={10} /> Delivery
                  </span>
                  <span
                    className={
                      deliveryCharge === 0 ? "text-[#6FAF8E]" : "text-white"
                    }
                  >
                    {deliveryCharge === 0
                      ? isPlusMember
                        ? "FREE (Plus)"
                        : "FREE"
                      : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-[9px] sm:text-[10px]">
                      Net Paid
                    </span>
                    <span className="text-base sm:text-xl font-black text-[#6FAF8E]">
                      ₹{order.totalPrice}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">
                  <Calendar size={11} className="text-[#6FAF8E] shrink-0" />
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">
                  <Clock size={11} className="text-[#6FAF8E] shrink-0" />
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
