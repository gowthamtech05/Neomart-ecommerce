import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Store,
  ImagePlus,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  ChevronLeft,
  ArrowRight,
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
    label: "Accepted 🎉",
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
  chatting: {
    label: "Chat Open",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    Icon: MessageSquare,
  },
};

export default function SellerRequestPage() {
  const navigate = useNavigate();
  // ✅ No token — auth via httpOnly cookie

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [chatMsg, setChatMsg] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [polling, setPolling] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const chatBottomRef = useRef(null);

  const fetchRequest = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/seller-requests/mine",
        { withCredentials: true }, // ✅ cookie
      );
      setRequest(data);
    } catch (err) {
      if (err.response?.status === 401) setIsLoggedIn(false);
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  // Poll for new chat messages every 8s when accepted
  useEffect(() => {
    const canChat =
      request?.status === "accepted" || request?.status === "chatting";
    if (!canChat) return;
    const interval = setInterval(async () => {
      setPolling(true);
      await fetchRequest();
      setPolling(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [request?.status]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [request?.chat?.length]);

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
      files.forEach((f) => fd.append("images", f));
      const { data } = await axios.post(
        "http://localhost:5000/api/seller-requests",
        fd,
        {
          withCredentials: true, // ✅ cookie
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setRequest(data);
      setMessage("");
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatMsg.trim()) return;
    setSendingChat(true);
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/seller-requests/${request._id}/chat`,
        { message: chatMsg.trim(), sender: "user" },
        { withCredentials: true }, // ✅ cookie
      );
      setRequest(data);
      setChatMsg("");
    } catch {
      alert("Failed to send message");
    } finally {
      setSendingChat(false);
    }
  };

  if (!isLoggedIn)
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-6 text-center gap-4">
        <Store size={40} className="text-gray-300" />
        <h2 className="text-lg font-black text-gray-800">Sign in to apply</h2>
        <p className="text-sm text-gray-400">
          You need an account to become a seller.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition"
        >
          Sign In
        </button>
      </div>
    );

  const meta = request
    ? (STATUS_META[request.status] ?? STATUS_META.pending)
    : null;
  const canChat =
    request?.status === "accepted" || request?.status === "chatting";
  const declined = request?.status === "declined";
  const showForm = !request || declined;

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-16">
      <div className="max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
              <Store size={20} className="text-[#6FAF8E]" /> Become a Seller
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Sell your products on NeoMart
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
            {request && meta && (
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
                  {polling && (
                    <RefreshCw
                      size={11}
                      className="text-gray-400 animate-spin ml-auto"
                    />
                  )}
                </div>
                <div className="bg-white/70 rounded-xl p-3 sm:p-4 mb-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Your Request
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {request.message}
                  </p>
                  {request.images?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {request.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img
                            src={img}
                            alt=""
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-white shadow-sm hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-2">
                    {new Date(request.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {request.adminReply && (
                  <div className="bg-white/80 rounded-xl p-3 sm:p-4 border border-white/60">
                    <p className="text-[9px] font-black text-[#6FAF8E] uppercase tracking-widest mb-1.5">
                      NeoMart Response
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {request.adminReply}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chat panel */}
            {canChat && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#6FAF8E]" />
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">
                    Seller Chat
                  </h3>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                    <span className="text-[9px] text-gray-400">Live</span>
                  </span>
                </div>
                <div className="p-3 sm:p-4 space-y-2.5 min-h-[180px] max-h-80 overflow-y-auto">
                  {!request.chat || request.chat.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-300">
                      <MessageSquare size={24} />
                      <p className="text-xs text-center">
                        Congratulations! Start chatting to arrange listing your
                        products.
                      </p>
                    </div>
                  ) : (
                    request.chat.map((msg, i) => {
                      const isMe = msg.sender === "user";
                      return (
                        <div
                          key={i}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed ${isMe ? "bg-gray-900 text-white rounded-br-sm" : "bg-[#6FAF8E]/10 text-gray-800 rounded-bl-sm border border-[#6FAF8E]/20"}`}
                          >
                            <p>{msg.message}</p>
                            <p className="text-[8px] opacity-50 mt-1">
                              {isMe ? "You" : "NeoMart Admin"} ·{" "}
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div className="border-t p-3 sm:p-4">
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      value={chatMsg}
                      onChange={(e) => setChatMsg(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 text-xs sm:text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatMsg.trim()}
                      className="bg-gray-900 hover:bg-[#6FAF8E] text-white px-3 sm:px-4 py-2 rounded-xl transition disabled:opacity-50 shrink-0"
                    >
                      {sendingChat ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Declined nudge */}
            {declined && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs sm:text-sm text-orange-700 font-medium">
                Your previous request wasn't accepted. You can submit a new
                request below with more details.
              </div>
            )}

            {/* Request form */}
            {showForm && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b bg-gray-50">
                  <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest">
                    {declined ? "Send a New Request" : "Tell us about yourself"}
                  </h2>
                </div>
                {!declined && (
                  <div className="px-4 sm:px-5 pt-4 grid grid-cols-3 gap-2">
                    {[
                      { emoji: "🛒", tip: "What you want to sell" },
                      { emoji: "📸", tip: "Photos or catalogue" },
                      { emoji: "📞", tip: "How to contact you" },
                    ].map(({ emoji, tip }) => (
                      <div
                        key={tip}
                        className="bg-gray-50 rounded-xl p-2.5 text-center"
                      >
                        <p className="text-base sm:text-lg mb-1">{emoji}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Describe the products you want to sell, your business, pricing, and how we can reach you..."
                      className="w-full text-xs sm:text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] bg-gray-50 resize-none transition"
                    />
                    <p className="text-[9px] text-gray-400 mt-1 text-right">
                      {message.length} chars
                    </p>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                      Attach Images{" "}
                      <span className="normal-case font-normal">(up to 5)</span>
                    </label>
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
                        <label className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#6FAF8E] transition bg-gray-50">
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Request <ArrowRight size={14} />
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
