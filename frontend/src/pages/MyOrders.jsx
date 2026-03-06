import React, { useEffect, useState, useLayoutEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCancel, setLoadingCancel] = useState({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/orders/myorders",
        {
          withCredentials: true,
        },
      );
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      if (error.response?.status === 401) {
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (orders.length > 0)
        sessionStorage.setItem("userOrdersScrollPos", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [orders]);

  useLayoutEffect(() => {
    if (orders.length > 0) {
      const savedPosition = sessionStorage.getItem("userOrdersScrollPos");
      if (savedPosition)
        setTimeout(() => window.scrollTo(0, parseInt(savedPosition)), 50);
    }
  }, [orders]);

  const cancelOrderHandler = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      setLoadingCancel((prev) => ({ ...prev, [orderId]: true }));
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        {
          withCredentials: true,
        },
      );
      alert("Order cancelled ❌");
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Cancel failed");
    } finally {
      setLoadingCancel((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/invoice`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Invoice download failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 font-sans animate-fadeIn">
      <div className="mb-8 border-b-2 border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-8 h-8 text-gray-800" />
          My Orders
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse font-semibold">
          Fetching your orders...
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
              No orders found.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:border-[#6FAF8E] grid grid-cols-1 md:grid-cols-6 items-center gap-6 animate-slideIn transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">
                    Order ID
                  </span>
                  <Link
                    to={`/order/${order._id}`}
                    className="font-mono text-sm text-[#6FAF8E] hover:underline font-bold"
                  >
                    #{order._id.slice(-8)}
                  </Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">
                    Date
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">
                    Amount
                  </span>
                  <span className="text-lg font-black text-gray-900">
                    ₹{order.totalPrice}
                  </span>
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {order.isPaid ? "Paid ✅" : "Unpaid ❌"}
                  </span>
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.isCancelled ? "bg-red-50 text-red-600" : order.isDelivered ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                  >
                    {order.isCancelled
                      ? "Cancelled"
                      : order.isDelivered
                        ? "Delivered"
                        : "Pending"}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!order.isDelivered && !order.isCancelled && (
                    <button
                      onClick={() => cancelOrderHandler(order._id)}
                      disabled={loadingCancel[order._id]}
                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {loadingCancel[order._id] ? "..." : "Cancel"}
                    </button>
                  )}
                  <button
                    onClick={() => downloadInvoice(order._id)}
                    className="bg-gray-900 hover:bg-black text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition-colors"
                  >
                    Invoice
                  </button>
                </div>

                {order.isCancelled && order.isPaid && (
                  <div className="col-span-full mt-2 text-[11px] font-bold border-t pt-2 uppercase tracking-wide">
                    {order.isRefunded ? (
                      <span className="text-purple-600">
                        ✅ Amount Refunded to Source
                      </span>
                    ) : (
                      <span className="text-blue-600">
                        💰 Refund processing (3-5 days)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-in-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default MyOrders;
