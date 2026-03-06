import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import {
  ChevronLeft,
  Package,
  CreditCard,
  MapPin,
  Phone,
  XCircle,
  CheckCircle,
  RefreshCcw,
  Tag,
  Percent,
  Star,
  Gift,
  Eye,
  ShoppingCart,
  Calendar,
  TrendingDown,
  Shield,
  HelpCircle,
  Truck,
  Clock,
  Bike,
  KeyRound,
  UserCheck,
  AlertCircle,
} from "lucide-react";

const OfferBadge = ({ item }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const od = item.offerDetails;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasOffer =
    od &&
    (od.totalDiscountPercent > 0 ||
      od.isNewUserOffer ||
      od.isLoyalOffer ||
      od.isPlusOffer ||
      od.baseDiscount > 0);

  return (
    <div ref={ref} className="relative inline-block ml-1.5 shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${open ? "bg-[#6FAF8E] text-white" : "bg-white text-[#6FAF8E] border border-[#6FAF8E]/30 hover:bg-[#6FAF8E]/10"}`}
        title="View offer breakdown"
      >
        <HelpCircle size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-64 sm:w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.14)" }}
        >
          <div className="bg-gradient-to-r from-[#6FAF8E] to-[#4e9e7a] px-4 py-3">
            <p className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Tag size={11} /> Offer Breakdown
            </p>
            <p className="text-white/70 text-[9px] mt-0.5 truncate">
              {item.name}
            </p>
          </div>
          <div className="p-3 space-y-2.5">
            {!hasOffer ? (
              <p className="text-gray-400 text-xs text-center py-2">
                No special offer applied.
              </p>
            ) : (
              <>
                {od.appliedLabel && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <Star size={11} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase font-black">
                        Offer Type
                      </p>
                      <p className="text-[11px] font-black text-green-700">
                        {od.appliedLabel}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      label: "MRP",
                      val: `₹${item.mrp || item.price}`,
                      cls: "bg-gray-50 text-gray-700",
                    },
                    {
                      label: "Paid",
                      val: `₹${item.price}`,
                      cls: "bg-gray-50 text-[#6FAF8E]",
                    },
                    {
                      label: "Saved",
                      val: `₹${od.totalSavings || (item.mrp || item.price) - item.price}`,
                      cls: "bg-green-50 text-green-600",
                    },
                  ].map(({ label, val, cls }) => (
                    <div
                      key={label}
                      className={`rounded-xl p-1.5 text-center ${cls}`}
                    >
                      <p className="text-[7px] text-gray-400 uppercase font-black">
                        {label}
                      </p>
                      <p className="text-xs font-black">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] text-gray-400 uppercase font-black px-1">
                    Discount Stack
                  </p>
                  {od.baseDiscount > 0 && (
                    <Row
                      icon={<Percent size={9} />}
                      label="Base (Admin)"
                      value={`${od.baseDiscount}%`}
                      color="blue"
                    />
                  )}
                  {od.expiryDiscount > 0 && (
                    <Row
                      icon={<Calendar size={9} />}
                      label={`Expiry${od.expiryDate ? ` · ${new Date(od.expiryDate).toLocaleDateString("en-IN")}` : ""}`}
                      value={`${od.expiryDiscount}%`}
                      color="orange"
                    />
                  )}
                  {od.isNewUserOffer && (
                    <Row
                      icon={<Gift size={9} />}
                      label={`New User${od.newUserProductName ? ` · ${od.newUserProductName}` : ""}`}
                      value="+20%"
                      color="blue"
                    />
                  )}
                  {od.isLoyalOffer && od.loyalExtraPercent > 0 && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-2.5 py-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-purple-700">
                          <Shield size={9} />
                          <span className="text-[9px] font-black">
                            Loyalty Offer
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-purple-700">
                          +{od.loyalExtraPercent}%
                        </span>
                      </div>
                      {od.loyalFactors && (
                        <div className="space-y-1 pl-2 border-l-2 border-purple-200">
                          {od.loyalFactors.expiryBonus > 0 && (
                            <FactorRow
                              icon={<Calendar size={7} />}
                              label="Near-Expiry"
                              value={`+${od.loyalFactors.expiryBonus}%`}
                            />
                          )}
                          {od.loyalFactors.viewsBonus > 0 && (
                            <FactorRow
                              icon={<Eye size={7} />}
                              label={`Low Views (${od.loyalFactors.viewsAtOrder ?? "?"})`}
                              value={`+${od.loyalFactors.viewsBonus}%`}
                            />
                          )}
                          {od.loyalFactors.salesBonus > 0 && (
                            <FactorRow
                              icon={<ShoppingCart size={7} />}
                              label={`Low Sales (${od.loyalFactors.salesCountAtOrder ?? "?"} sold)`}
                              value={`+${od.loyalFactors.salesBonus}%`}
                            />
                          )}
                          {od.loyalFactors.stockBonus > 0 && (
                            <FactorRow
                              icon={<TrendingDown size={7} />}
                              label={`Low Stock (${od.loyalFactors.stockAtOrder ?? "?"} left)`}
                              value={`+${od.loyalFactors.stockBonus}%`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {od.isPlusOffer && od.plusExtraPercent > 0 && (
                    <Row
                      icon={<Star size={9} />}
                      label="Plus Member Bonus"
                      value={`+${od.plusExtraPercent}%`}
                      color="amber"
                    />
                  )}
                </div>
                {od.totalDiscountPercent > 0 && (
                  <div className="flex justify-between items-center bg-[#6FAF8E]/10 border border-[#6FAF8E]/20 rounded-xl px-3 py-1.5">
                    <span className="text-[9px] font-black text-[#4e9e7a] uppercase">
                      Total Discount
                    </span>
                    <span className="text-xs font-black text-[#4e9e7a]">
                      {od.totalDiscountPercent}% OFF
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div
      className={`flex items-center justify-between border rounded-lg px-2.5 py-1 ${colors[color] || colors.blue}`}
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[9px] font-bold">{label}</span>
      </div>
      <span className="text-[9px] font-black">{value}</span>
    </div>
  );
};

const FactorRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1 text-purple-400">
      {icon}
      <span className="text-[8px] text-gray-500">{label}</span>
    </div>
    <span className="text-[8px] font-black text-purple-600">{value}</span>
  </div>
);

const DeliveryPartnerSection = ({ order, onRefresh }) => {
  const dp = order.deliveryPartner;
  const isAssigned = !!dp;
  const isDelivered = order.isDelivered;
  const isCancelled = order.isCancelled;

  const [partners, setPartners] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [showSelect, setShowSelect] = useState(false);

  const loadPartners = async () => {
    setLoadingList(true);
    try {
      const pincode =
        order.shippingAddress?.pinCode ||
        order.shippingAddress?.postalCode ||
        order.shippingAddress?.pincode ||
        "";

      const url = `/api/delivery-partners/admin/active${pincode ? "?pincode=" + pincode : ""}`;

      const { data } = await API.get(url);

      setPartners(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoadingList(false);
    }
  };

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      await API.put("/api/delivery-partners/admin/orders/assign", {
        partnerId: selected,
        orderIds: [order._id],
      });
      setShowSelect(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm("Remove this delivery partner from the order?")) return;
    setUnassigning(true);
    try {
      await API.put(
        `/api/delivery-partners/admin/orders/${order._id}/unassign`,
      );
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unassign");
    } finally {
      setUnassigning(false);
    }
  };

  const journeyPill =
    isDelivered && order.otpVerified
      ? { text: "OTP Verified · Delivered", cls: "bg-green-100 text-green-700" }
      : order.orderStatus === "Out for Delivery"
        ? {
            text: "OTP Generated · En Route 🛵",
            cls: "bg-orange-100 text-orange-700",
          }
        : isAssigned
          ? {
              text: "Partner Assigned · Awaiting Dispatch",
              cls: "bg-purple-100 text-purple-700",
            }
          : null;

  const timeline = [
    { label: "Order Placed", done: true, time: order.createdAt },
    { label: "Payment", done: order.isPaid, time: order.paidAt },
    {
      label: "Partner Assigned",
      done: isAssigned || isDelivered,
      time: order.assignedAt,
    },
    {
      label: "Out for Delivery",
      done: order.orderStatus === "Out for Delivery" || isDelivered,
      time: null,
    },
    { label: "Delivered", done: isDelivered, time: order.deliveredAt },
  ];

  return (
    <div className="bg-white rounded-[28px] sm:rounded-[40px] border border-gray-100 overflow-visible shadow-sm">
      <div className="px-4 sm:px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between rounded-t-[28px] sm:rounded-t-[40px]">
        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Bike size={13} className="text-[#6FAF8E]" /> Delivery Partner
        </h3>
        <div className="flex items-center gap-2">
          {isAssigned && !isDelivered && !isCancelled && (
            <>
              <button
                onClick={() => {
                  setShowSelect((v) => !v);
                  if (!partners.length) loadPartners();
                }}
                className="text-[9px] font-black text-[#6FAF8E] hover:underline underline-offset-2"
              >
                {showSelect ? "Cancel" : "Reassign"}
              </button>
              <button
                onClick={handleUnassign}
                disabled={unassigning}
                className="flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1 rounded-full transition disabled:opacity-50"
              >
                {unassigning ? (
                  <div className="w-2.5 h-2.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle size={9} />
                )}
                Unassign
              </button>
            </>
          )}
          {!isAssigned && !isDelivered && !isCancelled && (
            <button
              onClick={() => {
                setShowSelect((v) => !v);
                if (!partners.length) loadPartners();
              }}
              className="text-[9px] font-black text-[#6FAF8E] bg-[#6FAF8E]/10 hover:bg-[#6FAF8E]/20 border border-[#6FAF8E]/20 px-2.5 py-1 rounded-full transition flex items-center gap-1"
            >
              <UserCheck size={10} /> Assign
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {isCancelled && !isAssigned && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <AlertCircle size={15} className="text-gray-300 shrink-0" />
            <p className="text-xs text-gray-400 font-bold">
              Order cancelled — no partner assigned
            </p>
          </div>
        )}

        {!isAssigned && !isDelivered && !isCancelled && !showSelect && (
          <div
            onClick={() => {
              setShowSelect(true);
              if (!partners.length) loadPartners();
            }}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#6FAF8E]/40 hover:bg-[#6FAF8E]/5 transition group"
          >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#6FAF8E]/10 rounded-2xl flex items-center justify-center shrink-0 transition">
              <Bike
                size={18}
                className="text-gray-300 group-hover:text-[#6FAF8E] transition"
              />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 group-hover:text-gray-600 transition">
                No delivery partner assigned
              </p>
              <p className="text-[9px] text-gray-300 mt-0.5">
                Tap to assign a partner
              </p>
            </div>
          </div>
        )}

        {showSelect && !isDelivered && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {isAssigned ? "Choose new partner" : "Choose a partner"}
              </p>
              {partners[0]?.matchDistrict && (
                <span className="text-[9px] font-black bg-[#6FAF8E]/10 text-[#4e9e7a] px-2 py-0.5 rounded-full">
                  📍 {partners[0].matchDistrict} only
                </span>
              )}
            </div>
            {loadingList ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : partners.length === 0 ? (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs font-black text-gray-500">
                  No partners in this district
                </p>
                <p className="text-[9px] text-gray-300">
                  Make sure delivery partners have set their area to match the
                  order's district
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {partners.map((p) => (
                  <label
                    key={p._id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${selected === p._id ? "border-[#6FAF8E] bg-[#6FAF8E]/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                  >
                    <input
                      type="radio"
                      name="dp-pick"
                      value={p._id}
                      checked={selected === p._id}
                      onChange={() => setSelected(p._id)}
                      className="accent-[#6FAF8E] shrink-0"
                    />
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${selected === p._id ? "bg-[#6FAF8E] text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      {p.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate">
                        {p.user?.name}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {p.vehicle && (
                          <span className="text-[9px] text-gray-400">
                            {p.vehicle}
                          </span>
                        )}
                        {p.area && (
                          <span className="text-[9px] text-[#6FAF8E] font-bold">
                            📍 {p.area}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-400">
                          · {p.totalDeliveries} 🚚
                        </span>
                      </div>
                    </div>
                    {p.hasLocation && p.distanceKm != null && (
                      <span
                        className={`text-xs font-black shrink-0 ${p.distanceKm < 5 ? "text-green-600" : p.distanceKm < 15 ? "text-amber-500" : "text-red-400"}`}
                      >
                        {p.distanceKm}km
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            {partners.length > 0 && (
              <button
                onClick={handleAssign}
                disabled={!selected || assigning}
                className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#6FAF8E] text-white font-black text-xs py-2.5 rounded-xl transition disabled:opacity-40"
              >
                {assigning ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserCheck size={13} />{" "}
                    {isAssigned ? "Reassign Partner" : "Assign Partner"}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {isAssigned && (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border ${isDelivered ? "bg-green-50 border-green-100" : "bg-purple-50 border-purple-100"}`}
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg ${isDelivered ? "bg-green-200 text-green-700" : "bg-purple-200 text-purple-700"}`}
              >
                {dp?.user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-800 truncate">
                  {dp?.user?.name || "Delivery Partner"}
                </p>
                <p className="text-[9px] text-gray-400 truncate">
                  {dp?.user?.email}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {dp?.phone && (
                    <a
                      href={`tel:${dp.phone}`}
                      className="flex items-center gap-1 text-[9px] text-[#6FAF8E] font-bold hover:underline"
                    >
                      <Phone size={9} /> {dp.phone}
                    </a>
                  )}
                  {dp?.vehicle && (
                    <span className="flex items-center gap-1 text-[9px] text-gray-400">
                      <Bike size={9} /> {dp.vehicle}
                    </span>
                  )}
                  {dp?.area && (
                    <span className="flex items-center gap-1 text-[9px] text-gray-400">
                      <MapPin size={9} /> {dp.area}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-2xl font-black ${isDelivered ? "text-green-600" : "text-purple-600"}`}
                >
                  {dp?.totalDeliveries ?? 0}
                </p>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                  delivered
                </p>
              </div>
            </div>

            {journeyPill && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black ${journeyPill.cls}`}
              >
                <KeyRound size={11} className="shrink-0" /> {journeyPill.text}
              </div>
            )}

            {order.assignedAt && (
              <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1.5 px-1">
                <Calendar size={10} className="text-[#6FAF8E]" />
                Assigned{" "}
                {new Date(order.assignedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {new Date(order.assignedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}

        {(!isCancelled || isAssigned || isDelivered) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
              Delivery Timeline
            </p>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />
              <div className="space-y-3 sm:space-y-4">
                {timeline.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-start gap-3 relative"
                  >
                    <div
                      className={`absolute -left-5 mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${step.done ? "bg-[#6FAF8E] border-[#6FAF8E]" : "bg-white border-gray-200"}`}
                    >
                      {step.done && (
                        <svg
                          className="w-2 h-2 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-[10px] sm:text-xs font-black ${step.done ? "text-gray-800" : "text-gray-300"}`}
                      >
                        {step.label}
                      </p>
                      {step.done && step.time && (
                        <p className="text-[8px] text-gray-400 mt-0.5">
                          {new Date(step.time).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          {new Date(step.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/api/orders/admin/${id}`);
      setOrder(data);
    } catch {
      setError("Order not found ❌");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateOrderStatus = async (action) => {
    try {
      setBtnLoading(true);
      const url =
        action === "cancel"
          ? `/api/orders/admin/${id}/cancel`
          : `/api/orders/${id}/${action}`;

      await API.put(url);
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} order`);
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-black text-[#6FAF8E] animate-pulse text-sm tracking-widest">
        SYNCING ADMIN PORTAL...
      </div>
    );
  if (error || !order)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 gap-4">
        <XCircle size={50} className="text-red-500" />
        <p className="font-bold text-gray-600">{error}</p>
      </div>
    );

  const itemsPriceSum = order.orderItems.reduce(
    (acc, i) => acc + i.price * i.qty,
    0,
  );
  const _localUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const isPlusMember = !!(order.user?.isPlusMember || _localUser?.isPlusMember);
  const deliveryFee = isPlusMember ? 0 : itemsPriceSum >= 299 ? 0 : 39;

  const showDeliverBtn = !order.isDelivered && !order.isCancelled;
  const showCancelBtn = !order.isDelivered && !order.isCancelled;
  const showRefundBtn = order.isPaid && order.isCancelled && !order.isRefunded;

  const statusChips = [
    {
      show: order.isPaid,
      label: `Paid · ${order.paymentMethod}`,
      bg: "bg-green-100 text-green-700",
    },
    { show: !order.isPaid, label: "Unpaid", bg: "bg-red-100 text-red-600" },
    {
      show: order.isDelivered,
      label: "Delivered",
      bg: "bg-blue-100 text-blue-700",
    },
    {
      show: order.isCancelled,
      label: "Cancelled",
      bg: "bg-orange-100 text-orange-700",
    },
    {
      show: order.isRefunded,
      label: "Refunded",
      bg: "bg-purple-100 text-purple-700",
    },
  ].filter((s) => s.show);

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-16">
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b px-3 sm:px-6 lg:px-8 py-3 sm:py-4 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-[#6FAF8E] shrink-0 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-black uppercase italic truncate">
                Admin: Order Control
              </h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-mono font-bold truncate">
                ID: {order._id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
            {showDeliverBtn && (
              <button
                disabled={btnLoading}
                onClick={() => updateOrderStatus("deliver")}
                className="flex-1 sm:flex-none bg-[#6FAF8E] text-white px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 hover:bg-green-600 transition disabled:opacity-60"
              >
                <CheckCircle size={13} />
                <span className="hidden xs:inline">MARK </span>DELIVERED
              </button>
            )}
            {showCancelBtn && (
              <button
                disabled={btnLoading}
                onClick={() => updateOrderStatus("cancel")}
                className="flex-1 sm:flex-none bg-red-50 text-red-600 border border-red-200 px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 transition disabled:opacity-60"
              >
                <XCircle size={13} />
                <span className="hidden xs:inline">CANCEL </span>ORDER
              </button>
            )}
            {showRefundBtn && (
              <button
                disabled={btnLoading}
                onClick={() => updateOrderStatus("refund")}
                className="flex-1 sm:flex-none bg-orange-500 text-white px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 hover:bg-orange-600 shadow-lg shadow-orange-200 animate-bounce disabled:opacity-60"
              >
                <RefreshCcw size={13} />
                <span className="hidden xs:inline">PROCESS </span>REFUND
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-3 sm:p-5 lg:p-8 flex flex-col xl:flex-row gap-6 lg:gap-8">
        <div className="flex-[2] min-w-0 space-y-4 sm:space-y-6">
          <div className="flex flex-wrap gap-2">
            {statusChips.map(({ label, bg }) => (
              <span
                key={label}
                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${bg}`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                icon: (
                  <CreditCard
                    size={18}
                    className={order.isPaid ? "text-green-600" : "text-red-500"}
                  />
                ),
                label: "Payment Status",
                value: order.isPaid
                  ? `PAID (${order.paymentMethod})`
                  : "UNPAID",
                bg: order.isPaid
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100",
              },
              {
                icon: (
                  <Package
                    size={18}
                    className={
                      order.isDelivered
                        ? "text-blue-600"
                        : order.deliveryPartner
                          ? "text-purple-500"
                          : "text-gray-400"
                    }
                  />
                ),
                label: "Delivery Status",
                value: order.isDelivered
                  ? "DELIVERED"
                  : order.orderStatus === "Out for Delivery"
                    ? "EN ROUTE"
                    : order.orderStatus === "Assigned"
                      ? "PARTNER ASSIGNED"
                      : "PROCESSING",
                bg: order.isDelivered
                  ? "bg-blue-50 border-blue-100"
                  : order.orderStatus === "Assigned" ||
                      order.orderStatus === "Out for Delivery"
                    ? "bg-purple-50 border-purple-100"
                    : "bg-gray-50 border-gray-100",
              },
              {
                icon: (
                  <RefreshCcw
                    size={18}
                    className={
                      order.isRefunded ? "text-purple-600" : "text-orange-500"
                    }
                  />
                ),
                label: "Order Lifecycle",
                value: order.isRefunded
                  ? "REFUNDED"
                  : order.isCancelled
                    ? "CANCELLED"
                    : "ACTIVE",
                bg: order.isCancelled
                  ? "bg-orange-50 border-orange-100"
                  : "bg-gray-50 border-gray-100",
              },
            ].map(({ icon, label, value, bg }) => (
              <div
                key={label}
                className={`p-4 sm:p-5 rounded-[24px] sm:rounded-[32px] border ${bg}`}
              >
                {icon}
                <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 mt-2">
                  {label}
                </p>
                <h3 className="text-xs sm:text-sm font-bold uppercase mt-0.5">
                  {value}
                </h3>
              </div>
            ))}
          </div>

          <DeliveryPartnerSection order={order} onRefresh={fetchOrder} />

          <div className="bg-white rounded-[28px] sm:rounded-[40px] border border-gray-100 overflow-visible shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center rounded-t-[28px] sm:rounded-t-[40px]">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400">
                Order Items
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold bg-white px-3 py-1 rounded-full border">
                {order.orderItems?.length || 0} Products
              </span>
            </div>
            <div className="p-3 sm:p-5 space-y-3">
              {order.orderItems?.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-2xl sm:rounded-3xl gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        item.image?.startsWith("http")
                          ? item.image
                          : `http://localhost:5000${item.image}`
                      }
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain bg-white rounded-lg p-1 shrink-0"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1">
                        <h4 className="text-xs sm:text-sm font-bold truncate">
                          {item.name}
                        </h4>
                        <OfferBadge item={item} />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-black mt-0.5">
                        ₹{item.price} × {item.qty}
                        {item.mrp && item.mrp > item.price && (
                          <span className="ml-1 line-through text-gray-300">
                            ₹{item.mrp}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-black italic text-sm sm:text-base shrink-0">
                    ₹{item.price * item.qty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:w-80 2xl:w-96 space-y-4 sm:space-y-6">
          <div className="bg-[#1A1A1A] p-6 sm:p-8 rounded-[36px] sm:rounded-[48px] text-white shadow-xl">
            <p className="text-[10px] sm:text-[11px] font-black text-[#6FAF8E] uppercase mb-1 tracking-widest">
              Total Revenue
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black italic tracking-tighter mb-6 sm:mb-8">
              ₹{order.totalPrice}
            </h2>
            <div className="space-y-3 sm:space-y-4 border-t border-white/10 pt-5 sm:pt-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="text-white">₹{itemsPriceSum}</span>
              </div>
              <div className="flex justify-between text-gray-500 items-center">
                <div className="flex items-center gap-1.5">
                  <Truck size={12} className="text-gray-400" />
                  <span>Delivery</span>
                </div>
                <span
                  className={
                    deliveryFee === 0 ? "text-[#6FAF8E]" : "text-white"
                  }
                >
                  {deliveryFee === 0
                    ? isPlusMember
                      ? "FREE (Plus)"
                      : "FREE"
                    : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 sm:p-4 rounded-2xl">
                <span className="text-[#6FAF8E]">Final Amount</span>
                <span className="text-lg sm:text-xl font-black text-[#6FAF8E]">
                  ₹{order.totalPrice}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-[28px] sm:rounded-[40px] border border-gray-100 shadow-sm">
            <MapPin className="text-[#6FAF8E] mb-3" size={18} />
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">
              Shipping To
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed mb-3 mt-1">
              {order.shippingAddress?.address}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
            </p>
            <div className="flex items-center gap-2 text-[#6FAF8E] font-black text-xs">
              <Phone size={12} /> {order.shippingAddress?.phone}
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-[40px] border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500">
              <Calendar size={13} className="text-[#6FAF8E] shrink-0" />
              <span>
                Placed:{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500">
              <Clock size={13} className="text-[#6FAF8E] shrink-0" />
              <span>
                Time:{" "}
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {order.isDelivered && order.deliveredAt && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-green-600">
                <CheckCircle size={13} className="shrink-0" />
                <span>
                  Delivered:{" "}
                  {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOrderDetails;
