import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import {
  Bike,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  MapPin,
  Phone,
} from "lucide-react";

const STATUS_CHIP = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
  suspended: "bg-gray-100 text-gray-600",
};

export default function AdminDeliveryPartners() {
  const navigate = useNavigate();
  // ✅ No token — auth via httpOnly cookie

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [acting, setActing] = useState({});
  const [polling, setPolling] = useState(false);

  const fetchPartners = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setPolling(true);
    try {
      const { data } = await API.get("/delivery-partners/admin/all");
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAccept = async (id) => {
    const reply =
      replyTexts[id]?.trim() || "Welcome to the NeoMart delivery team!";
    setActing((p) => ({ ...p, [id]: "accepting" }));
    try {
      const { data } = await API.put(`/delivery-partners/admin/${id}/accept`, {
        adminReply: reply,
      });
      setPartners((prev) => prev.map((p) => (p._id === id ? data : p)));
    } catch {
      alert("Failed to accept");
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  const handleDecline = async (id) => {
    const reply = replyTexts[id]?.trim();
    if (!reply) {
      alert("Write a reply before declining.");
      return;
    }
    setActing((p) => ({ ...p, [id]: "declining" }));
    try {
      const { data } = await API.put(`/delivery-partners/admin/${id}/decline`, {
        adminReply: reply,
      });
      setPartners((prev) => prev.map((p) => (p._id === id ? data : p)));
    } catch {
      alert("Failed to decline");
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  const filtered = partners.filter((p) => {
    if (filter === "all") return true;
    if (filter === "active") return p.status === "accepted";
    return p.status === filter;
  });

  const counts = {
    all: partners.length,
    pending: partners.filter((p) => p.status === "pending").length,
    active: partners.filter((p) => p.status === "accepted").length,
    declined: partners.filter((p) => p.status === "declined").length,
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <Bike size={20} className="text-[#6FAF8E]" /> Delivery Partners
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Review delivery partner applications
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchPartners(true)}
            disabled={polling}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw
              size={15}
              className={`text-gray-500 ${polling ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "active", label: "Active" },
            { key: "declined", label: "Declined" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition border ${
                filter === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${filter === key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}
                >
                  {counts[key]}
                </span>
              )}
              {key === "pending" &&
                counts.pending > 0 &&
                filter !== "pending" && (
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-9 h-9 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Bike size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No {filter !== "all" ? filter : ""} applications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((partner) => {
              const isOpen = expanded === partner._id;
              const isPending = partner.status === "pending";
              return (
                <div
                  key={partner._id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    isPending
                      ? "border-amber-200"
                      : partner.status === "accepted"
                        ? "border-green-200"
                        : "border-gray-100"
                  }`}
                >
                  <div
                    className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpanded(isOpen ? null : partner._id)}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                        {partner.user?.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-[9px] text-gray-400">
                          {partner.user?.email}
                        </p>
                        {partner.vehicle && (
                          <span className="text-[9px] text-gray-400">
                            · {partner.vehicle}
                          </span>
                        )}
                        {partner.area && (
                          <span className="text-[9px] text-gray-400">
                            · {partner.area}
                          </span>
                        )}
                        {partner.status === "accepted" && (
                          <span className="text-[9px] text-green-600 font-bold">
                            · {partner.totalDeliveries} deliveries
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${STATUS_CHIP[partner.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {partner.status}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-gray-400 shrink-0"
                      />
                    )}
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-3 sm:p-5 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          Application
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                          {partner.message}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {partner.phone && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Phone size={10} /> {partner.phone}
                            </span>
                          )}
                          {partner.vehicle && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Bike size={10} /> {partner.vehicle}
                            </span>
                          )}
                          {partner.area && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                              <MapPin size={10} /> {partner.area}
                            </span>
                          )}
                        </div>
                        {partner.images?.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {partner.images.map((img, i) => (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={img}
                                  alt=""
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="space-y-3">
                          <textarea
                            value={replyTexts[partner._id] || ""}
                            onChange={(e) =>
                              setReplyTexts((p) => ({
                                ...p,
                                [partner._id]: e.target.value,
                              }))
                            }
                            placeholder="Write a reply (required to decline)..."
                            rows={3}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 bg-gray-50 resize-none transition"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(partner._id)}
                              disabled={!!acting[partner._id]}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#6FAF8E] hover:bg-green-600 text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition disabled:opacity-60"
                            >
                              {acting[partner._id] === "accepting" ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(partner._id)}
                              disabled={!!acting[partner._id]}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs sm:text-sm py-2.5 rounded-xl transition disabled:opacity-60"
                            >
                              {acting[partner._id] === "declining" ? (
                                <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {partner.adminReply && !isPending && (
                        <div className="bg-[#6FAF8E]/10 border border-[#6FAF8E]/20 rounded-xl p-3 sm:p-4">
                          <p className="text-[9px] font-black text-[#6FAF8E] uppercase tracking-widest mb-1.5">
                            Your Reply
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700">
                            {partner.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
