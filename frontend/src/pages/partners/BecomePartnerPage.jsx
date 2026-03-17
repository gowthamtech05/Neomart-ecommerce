import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios.js";
import {
  Bike,
  ImagePlus,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ArrowRight,
  Package,
  MapPin,
  Phone,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

const STATUS_META = {
  pending: {
    label: "Under Review",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    Icon: Clock,
  },
  accepted: {
    label: "Active Partner",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    Icon: CheckCircle,
  },
  declined: {
    label: "Not Accepted",
    bg: "bg-red-50 border-red-200",
    text: "text-red-600",
    Icon: XCircle,
  },
};

const STATUS_CHIP = {
  Assigned: "bg-purple-50 text-purple-700 border-purple-200",
  "Out for Delivery": "bg-orange-50 text-orange-700 border-orange-200",
  Delivered: "bg-green-50 text-green-700 border-green-200",
};

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

export default function BecomePartnerPage() {
  const navigate = useNavigate();
  const userInfo = localStorage.getItem("userInfo"); // cookie auth — just check if logged in

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [area, setArea] = useState("");
  const [district, setDistrict] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [otpState, setOtpState] = useState({});

  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/api/delivery-partners/mine");
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await API.get("/api/delivery-partners/my-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      setLoading(false);
      return;
    }
    Promise.all([fetchProfile(), fetchOrders()]).finally(() =>
      setLoading(false),
    );
  }, []);

  useEffect(() => {
    if (profile?.status !== "accepted") return;
    const iv = setInterval(fetchOrders, 20000);
    return () => clearInterval(iv);
  }, [profile?.status]);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles((p) => [...p, ...picked]);
    setPreviews((p) => [...p, ...picked.map((f) => URL.createObjectURL(f))]);
  };
  const removeFile = (i) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("message", message.trim());
      fd.append("phone", phone.trim());
      fd.append("vehicle", vehicle.trim());
      fd.append("area", area.trim());
      fd.append("district", district.trim());
      files.forEach((f) => fd.append("images", f));
      const { data } = await API.post("/api/delivery-partners", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(data);
      setMessage("");
      setPhone("");
      setVehicle("");
      setArea("");
      setDistrict("");
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const setOtp = (orderId, patch) =>
    setOtpState((p) => ({
      ...p,
      [orderId]: { ...(p[orderId] || {}), ...patch },
    }));

  const handleGenerateOtp = async (orderId) => {
    setOtp(orderId, { loading: true });
    try {
      const { data } = await API.post(
        `/api/delivery-partners/orders/${orderId}/generate-otp`,
        {},
      );
      setOtp(orderId, {
        generatedOtp: data.otp,
        loading: false,
        showVerify: true,
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate OTP");
      setOtp(orderId, { loading: false });
    }
  };

  const handleVerifyOtp = async (orderId) => {
    const s = otpState[orderId] || {};
    if (!s.inputOtp?.trim()) return;
    setOtp(orderId, { loading: true });
    try {
      await API.post(`/api/delivery-partners/orders/${orderId}/verify-otp`, {
        otp: s.inputOtp.trim(),
      });
      setOtpState((p) => {
        const n = { ...p };
        delete n[orderId];
        return n;
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Incorrect OTP");
      setOtp(orderId, { loading: false });
    }
  };

  if (!userInfo)
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-6 text-center gap-4">
        <Bike size={40} className="text-gray-300" />
        <h2 className="text-lg font-black text-gray-800">Sign in to apply</h2>
        <button
          onClick={() => navigate("/login")}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition"
        >
          Sign In
        </button>
      </div>
    );

  const meta = profile
    ? (STATUS_META[profile.status] ?? STATUS_META.pending)
    : null;
  const isActive = profile?.status === "accepted";
  const declined = profile?.status === "declined";
  const showForm = !profile || declined;

  const sortedOrders = [
    ...orders.filter((o) => o.orderStatus === "Out for Delivery"),
    ...orders.filter((o) => o.orderStatus === "Assigned"),
    ...orders.filter((o) => o.isDelivered),
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-16">
      <div className="max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
              <Bike size={20} className="text-[#6FAF8E]" /> Delivery Partner
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Earn by delivering NeoMart orders
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-9 h-9 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {/* Status card */}
            {profile && meta && (
              <div
                className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 ${meta.bg}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <meta.Icon size={15} className={meta.text} />
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${meta.text}`}
                  >
                    {meta.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs font-black text-green-600">
                      🚚 {profile.totalDeliveries} delivered
                    </span>
                  )}
                </div>
                <div className="bg-white/70 rounded-xl p-3 sm:p-4 mb-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Application
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {profile.message}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {profile.phone && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Phone size={10} /> {profile.phone}
                      </span>
                    )}
                    {profile.vehicle && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Bike size={10} /> {profile.vehicle}
                      </span>
                    )}
                    {profile.area && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <MapPin size={10} /> {profile.area}
                      </span>
                    )}
                  </div>
                </div>
                {profile.adminReply && (
                  <div className="bg-white/80 rounded-xl p-3 sm:p-4 border border-white/60">
                    <p className="text-[9px] font-black text-[#6FAF8E] uppercase tracking-widest mb-1.5">
                      NeoMart Response
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {profile.adminReply}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Assigned Orders ── */}
            {isActive && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-gray-800">
                    Your Orders
                  </h2>
                  <button
                    onClick={fetchOrders}
                    className="p-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    <RefreshCw size={13} className="text-gray-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Assigned",
                      count: orders.filter((o) => o.orderStatus === "Assigned")
                        .length,
                      color: "text-purple-600",
                    },
                    {
                      label: "En Route",
                      count: orders.filter(
                        (o) => o.orderStatus === "Out for Delivery",
                      ).length,
                      color: "text-orange-600",
                    },
                    {
                      label: "Delivered",
                      count: orders.filter((o) => o.isDelivered).length,
                      color: "text-green-600",
                    },
                  ].map(({ label, count, color }) => (
                    <div
                      key={label}
                      className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm"
                    >
                      <p className={`text-xl sm:text-2xl font-black ${color}`}>
                        {count}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {sortedOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                    <Package size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      No orders assigned yet.
                    </p>
                  </div>
                ) : (
                  sortedOrders.map((order) => {
                    const s = otpState[order._id] || {};
                    const isOtfd = order.orderStatus === "Out for Delivery";

                    return (
                      <div
                        key={order._id}
                        className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                          isOtfd
                            ? "border-orange-200"
                            : order.isDelivered
                              ? "border-green-200"
                              : "border-purple-200"
                        }`}
                      >
                        <div className="p-3 sm:p-4">
                          {/* Order header */}
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div>
                              <p className="font-mono text-xs sm:text-sm font-black text-gray-700">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {order.user?.name} · ₹{order.totalPrice}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border shrink-0 ${STATUS_CHIP[order.orderStatus] || "bg-gray-50 text-gray-500 border-gray-200"}`}
                            >
                              {order.orderStatus}
                            </span>
                          </div>

                          {/* Address */}
                          <div className="bg-gray-50 rounded-xl p-2.5 mb-3 space-y-1">
                            <div className="flex items-start gap-1.5 text-[10px] sm:text-xs text-gray-600">
                              <MapPin
                                size={11}
                                className="mt-0.5 shrink-0 text-[#6FAF8E]"
                              />
                              <span>
                                {order.shippingAddress?.address},{" "}
                                {order.shippingAddress?.city} —{" "}
                                {order.shippingAddress?.postalCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600">
                              <Phone
                                size={11}
                                className="shrink-0 text-[#6FAF8E]"
                              />
                              <span>{order.shippingAddress?.phone}</span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="mb-3">
                            {order.orderItems?.slice(0, 2).map((item, i) => (
                              <p key={i} className="text-[10px] text-gray-500">
                                {item.qty}× {item.name}
                              </p>
                            ))}
                            {order.orderItems?.length > 2 && (
                              <p className="text-[9px] text-gray-400">
                                +{order.orderItems.length - 2} more
                              </p>
                            )}
                          </div>

                          {/* OTP Actions */}
                          {!order.isDelivered && (
                            <div className="space-y-2">
                              {/* Generated OTP display */}
                              {s.generatedOtp && (
                                <div className="bg-gray-900 rounded-xl p-3 text-center">
                                  <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1.5">
                                    Show this OTP to customer
                                  </p>
                                  <p className="text-2xl sm:text-3xl font-black text-white tracking-[0.35em]">
                                    {s.generatedOtp}
                                  </p>
                                  <p className="text-[9px] text-gray-500 mt-1">
                                    Valid 15 min
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleGenerateOtp(order._id)}
                                  disabled={s.loading}
                                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#6FAF8E] hover:bg-green-600 text-white font-black text-xs py-2.5 rounded-xl transition disabled:opacity-60"
                                >
                                  {s.loading && !s.generatedOtp ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <KeyRound size={13} />
                                  )}
                                  {s.generatedOtp ? "New OTP" : "Generate OTP"}
                                </button>
                                {s.generatedOtp && (
                                  <button
                                    onClick={() =>
                                      setOtp(order._id, {
                                        showVerify: !s.showVerify,
                                      })
                                    }
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-black text-xs py-2.5 rounded-xl transition"
                                  >
                                    <ShieldCheck size={13} /> Verify OTP
                                  </button>
                                )}
                              </div>

                              {/* OTP verify input */}
                              {s.showVerify && (
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type={s.showOtp ? "text" : "password"}
                                      value={s.inputOtp || ""}
                                      onChange={(e) =>
                                        setOtp(order._id, {
                                          inputOtp: e.target.value,
                                        })
                                      }
                                      placeholder="Enter customer's OTP"
                                      maxLength={6}
                                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] bg-gray-50 tracking-[0.3em] font-bold transition"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOtp(order._id, {
                                          showOtp: !s.showOtp,
                                        })
                                      }
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      {s.showOtp ? (
                                        <EyeOff size={14} />
                                      ) : (
                                        <Eye size={14} />
                                      )}
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleVerifyOtp(order._id)}
                                    disabled={s.loading || !s.inputOtp}
                                    className="bg-gray-900 hover:bg-[#6FAF8E] text-white font-black text-xs px-4 rounded-xl transition disabled:opacity-50 shrink-0"
                                  >
                                    {s.loading ? (
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      "✓ Confirm"
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {order.isDelivered && (
                            <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                              <CheckCircle size={13} />
                              Delivered ·{" "}
                              {new Date(order.deliveredAt).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Declined nudge */}
            {declined && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs sm:text-sm text-orange-700 font-medium">
                Your previous application wasn't accepted. Apply again with more
                details below.
              </div>
            )}

            {/* Application form */}
            {showForm && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b bg-gray-50">
                  <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest">
                    {declined ? "Re-Apply" : "Partner Application"}
                  </h2>
                </div>

                {!declined && (
                  <div className="px-4 sm:px-5 pt-4 grid grid-cols-3 gap-2">
                    {[
                      { emoji: "🏍️", tip: "Your vehicle" },
                      { emoji: "📍", tip: "Your area" },
                      { emoji: "📸", tip: "ID & photos" },
                    ].map(({ emoji, tip }) => (
                      <div
                        key={tip}
                        className="bg-gray-50 rounded-xl p-2.5 text-center"
                      >
                        <p className="text-lg mb-1">{emoji}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Phone
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone"
                        className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 transition"
                      />
                    </div>
                    <div className="relative">
                      <Bike
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        placeholder="Vehicle type"
                        className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 transition"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin
                      size={12}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Delivery area / zone"
                      className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 transition"
                    />
                  </div>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 transition text-gray-700"
                  >
                    <option value="">Select District *</option>
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      placeholder="Tell us about yourself, your availability, and your experience delivering..."
                      className="w-full text-xs sm:text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 resize-none transition"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Attach Photos{" "}
                      <span className="normal-case font-normal">
                        (ID, vehicle)
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {previews.map((src, i) => (
                        <div
                          key={i}
                          className="relative w-14 h-14 sm:w-16 sm:h-16"
                        >
                          <img
                            src={src}
                            className="w-full h-full object-cover rounded-xl border border-gray-200"
                            alt=""
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {files.length < 5 && (
                        <label className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#6FAF8E] bg-gray-50 transition">
                          <ImagePlus size={15} className="text-gray-400" />
                          <span className="text-[8px] text-gray-400 mt-0.5">
                            Add
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleFiles}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-sm py-3 rounded-xl transition"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Submit Application{" "}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
