import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api.js";
import {
  Store,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronLeft,
  Send,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

const STATUS_CHIP = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
  chatting: "bg-blue-100 text-blue-700",
};
const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  chatting: "Chatting",
};

export default function AdminSellerRequests() {
  const navigate = useNavigate();
  // ✅ No token — auth via httpOnly cookie

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [chatTexts, setChatTexts] = useState({});
  const [acting, setActing] = useState({});
  const [polling, setPolling] = useState(false);
  const chatRefs = useRef({});

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setPolling(true);
    try {
      const { data } = await API.get("/seller-requests/admin/all");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch seller requests", err);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Poll for new chat messages every 10s
  useEffect(() => {
    const interval = setInterval(() => fetchRequests(true), 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Scroll chat to bottom when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(
        () =>
          chatRefs.current[expanded]?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [expanded, requests]);

  const handleAccept = async (id) => {
    const reply =
      replyTexts[id]?.trim() ||
      "Your request has been accepted! Let's chat about getting your products listed.";
    setActing((p) => ({ ...p, [id]: "accepting" }));
    try {
      const { data } = await API.put(`/seller-requests/admin/${id}/accept`, {
        adminReply: reply,
      });
      setRequests((prev) => prev.map((r) => (r._id === id ? data : r)));
      setExpanded(id);
    } catch {
      alert("Failed to accept");
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  const handleDecline = async (id) => {
    const reply = replyTexts[id]?.trim();
    if (!reply) {
      alert("Please write a reply message explaining why you're declining.");
      return;
    }
    setActing((p) => ({ ...p, [id]: "declining" }));
    try {
      const { data } = await API.put(`/seller-requests/admin/${id}/decline`, {
        adminReply: reply,
      });
      setRequests((prev) => prev.map((r) => (r._id === id ? data : r)));
    } catch {
      alert("Failed to decline");
    } finally {
      setActing((p) => ({ ...p, [id]: null }));
    }
  };

  const handleSendChat = async (id) => {
    const msg = chatTexts[id]?.trim();
    if (!msg) return;
    setActing((p) => ({ ...p, [`chat_${id}`]: true }));
    try {
      const { data } = await API.post(`/seller-requests/${id}/chat`, {
        message: msg,
        sender: "admin",
      });
      setRequests((prev) => prev.map((r) => (r._id === id ? data : r)));
      setChatTexts((p) => ({ ...p, [id]: "" }));
    } catch {
      alert("Failed to send message");
    } finally {
      setActing((p) => ({ ...p, [`chat_${id}`]: null }));
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active")
      return r.status === "accepted" || r.status === "chatting";
    return r.status === filter;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    active: requests.filter(
      (r) => r.status === "accepted" || r.status === "chatting",
    ).length,
    declined: requests.filter((r) => r.status === "declined").length,
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <Store size={20} className="text-[#6FAF8E]" /> Seller Requests
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Review and manage seller applications
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchRequests(true)}
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
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
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

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-9 h-9 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 animate-pulse">
              Loading requests...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 sm:p-16 text-center">
            <Store size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No {filter !== "all" ? filter : ""} requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((req) => {
              const isOpen = expanded === req._id;
              const isPending = req.status === "pending";
              const canChat =
                req.status === "accepted" || req.status === "chatting";
              const unread =
                canChat &&
                req.chat?.some((m) => m.sender === "user" && !m.readByAdmin);

              return (
                <div
                  key={req._id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden transition-all ${
                    isPending
                      ? "border-amber-200"
                      : canChat
                        ? "border-green-200"
                        : "border-gray-100"
                  }`}
                >
                  {/* Collapsed header */}
                  <div
                    className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpanded(isOpen ? null : req._id)}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                        {req.user?.name || "Unknown User"}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                        {req.user?.email}
                      </p>
                    </div>
                    {unread && (
                      <span className="w-2 h-2 bg-[#6FAF8E] rounded-full animate-pulse shrink-0" />
                    )}
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-1 rounded-full shrink-0 ${STATUS_CHIP[req.status] ?? STATUS_CHIP.pending}`}
                    >
                      {STATUS_LABEL[req.status] ?? req.status}
                    </span>
                    <p className="text-[9px] text-gray-400 shrink-0 hidden sm:block">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-gray-400 shrink-0"
                      />
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-gray-100 p-3 sm:p-5 space-y-4">
                      {/* User message */}
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          Seller's Message
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {req.message}
                        </p>
                        {req.images?.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {req.images.map((img, i) => (
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
                        <p className="text-[9px] text-gray-400 mt-2">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Pending: reply + accept/decline */}
                      {isPending && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                              Reply to Seller{" "}
                              <span className="normal-case font-normal">
                                (required for decline)
                              </span>
                            </label>
                            <textarea
                              value={replyTexts[req._id] || ""}
                              onChange={(e) =>
                                setReplyTexts((p) => ({
                                  ...p,
                                  [req._id]: e.target.value,
                                }))
                              }
                              placeholder="Write a response to the seller..."
                              rows={3}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] bg-gray-50 resize-none transition"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(req._id)}
                              disabled={!!acting[req._id]}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#6FAF8E] hover:bg-green-600 text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition disabled:opacity-60"
                            >
                              {acting[req._id] === "accepting" ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(req._id)}
                              disabled={!!acting[req._id]}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs sm:text-sm py-2.5 rounded-xl transition disabled:opacity-60"
                            >
                              {acting[req._id] === "declining" ? (
                                <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sent reply (non-pending) */}
                      {req.adminReply && !isPending && (
                        <div className="bg-[#6FAF8E]/10 border border-[#6FAF8E]/20 rounded-xl p-3 sm:p-4">
                          <p className="text-[9px] font-black text-[#6FAF8E] uppercase tracking-widest mb-1.5">
                            Your Reply
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700">
                            {req.adminReply}
                          </p>
                        </div>
                      )}

                      {/* Chat panel */}
                      {canChat && (
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                          <div className="px-3 sm:px-4 py-2.5 bg-gray-50 border-b flex items-center gap-2">
                            <MessageSquare
                              size={13}
                              className="text-[#6FAF8E]"
                            />
                            <span className="text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest">
                              Live Chat
                            </span>
                            <span className="ml-auto flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              <span className="text-[9px] text-gray-400">
                                Live
                              </span>
                            </span>
                          </div>
                          <div className="p-3 sm:p-4 space-y-2.5 max-h-72 overflow-y-auto">
                            {!req.chat || req.chat.length === 0 ? (
                              <p className="text-center text-xs text-gray-400 py-6">
                                No messages yet. Start the conversation!
                              </p>
                            ) : (
                              req.chat.map((msg, i) => {
                                const isAdminMsg = msg.sender === "admin";
                                const isLast = i === req.chat.length - 1;
                                return (
                                  <div
                                    key={i}
                                    className={`flex ${isAdminMsg ? "justify-end" : "justify-start"}`}
                                    ref={
                                      isLast
                                        ? (el) =>
                                            (chatRefs.current[req._id] = el)
                                        : null
                                    }
                                  >
                                    <div
                                      className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${isAdminMsg ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}
                                    >
                                      <p>{msg.message}</p>
                                      <p className="text-[8px] opacity-50 mt-1">
                                        {isAdminMsg
                                          ? "You (Admin)"
                                          : req.user?.name}{" "}
                                        ·{" "}
                                        {new Date(
                                          msg.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div className="border-t p-3 sm:p-4 flex gap-2">
                            <input
                              value={chatTexts[req._id] || ""}
                              onChange={(e) =>
                                setChatTexts((p) => ({
                                  ...p,
                                  [req._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                !e.shiftKey &&
                                handleSendChat(req._id)
                              }
                              placeholder="Reply to seller..."
                              className="flex-1 text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition"
                            />
                            <button
                              onClick={() => handleSendChat(req._id)}
                              disabled={
                                acting[`chat_${req._id}`] ||
                                !chatTexts[req._id]?.trim()
                              }
                              className="bg-[#6FAF8E] hover:bg-green-600 text-white px-3 py-2 rounded-xl transition disabled:opacity-50"
                            >
                              <Send size={13} />
                            </button>
                          </div>
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
