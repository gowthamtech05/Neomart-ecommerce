import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import {
  Crown,
  Flame,
  Lock,
  Truck,
  Percent,
  ChevronLeft,
  Check,
} from "lucide-react";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const LoyaltyPage = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [isPlus, setIsPlus] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastRewardDate, setLastReward] = useState(null);
  const [expiryDate, setExpiry] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [userInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      return {};
    }
  });

  const maxCycles = 4;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data } = await API.get("/api/users/profile");
      setPoints(data.loyaltyPoints || 0);
      setIsPlus(data.isPlusMember || false);
      setStreak(data.streakCount || 0);
      setLastReward(data.lastStreakRewardDate);
      setExpiry(data.plusExpiryDate);
    } catch (err) {
      console.error(err);
    }
  };

  const getStreakStatus = () => {
    if (streak === 0) return "No active streak";
    if (streak >= maxCycles) return "Streak complete 🎉";
    if (!lastRewardDate) return "Cycle started";
    const diff = Math.ceil(
      (new Date(lastRewardDate).getTime() + 14 * 86400000 - Date.now()) /
        86400000,
    );
    return diff > 0 ? `${diff} days left to next cycle` : "Streak expired!";
  };

  const handleActivatePlus = async () => {
    try {
      setProcessing(true);

      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        setProcessing(false);
        return;
      }

      // 2. Reuse the same route cart uses — just pass 299 as the amount
      const { data: rzpData } = await API.post("/api/payment/create-order", {
        amount: 299,
      });

      // 3. Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rzpData.key,
          amount: rzpData.amount,
          currency: "INR",
          name: "NeoMart",
          description: "Plus Membership — ₹299",
          order_id: rzpData.id,
          theme: { color: "#f5c842" },
          prefill: {
            name: userInfo?.name || "",
            email: userInfo?.email || "",
          },
          handler: async (response) => {
            try {
              // 4. Verify payment & activate Plus — same verify route, with isPlus flag
              await API.post("/api/orders/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isPlus: true, // backend checks this and sets isPlusMember: true on user
              });

              // 5. Update UI immediately — no page reload needed
              setIsPlus(true);
              fetchUserData();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              resolve(); // dismissed cleanly, no error alert
            },
          },
        });
        rzp.open();
      });
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const eligibleForPlus = streak >= maxCycles && !isPlus;
  const progress = Math.min(streak, maxCycles) / maxCycles;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap');
        .loyalty-root {
          font-family: 'DM Sans', sans-serif;
          background: #0E0E10;
          color: #fff;
          min-height: 100vh;
          width: 100%;
          position: absolute;
          top: 0; left: 0;
          overflow-y: auto;
          z-index: 0;
        }
        .inner { max-width: 680px; margin: 0 auto; padding: 32px 16px 80px; }
        @media (min-width: 640px) { .inner { padding: 48px 24px 80px; } }
        .points-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 18vw, 120px);
          line-height: 1;
          letter-spacing: 0.02em;
        }
        .bar-fill { transition: width 1s cubic-bezier(.22,1,.36,1); }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 20px; }
        @media (min-width: 640px) { .card { padding: 28px; border-radius: 28px; } }
        .plus-card { background: linear-gradient(135deg,#1a1000,#2a1a00); border-color: rgba(234,179,8,0.2); }
        .green-card { background: linear-gradient(135deg,#0d1f16,#0a1710); border-color: rgba(111,175,142,0.2); }
        .chip { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; padding:4px 12px; border-radius:99px; }
      `}</style>

      <div className="loyalty-root">
        <div className="inner">
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".15em",
              marginBottom: 32,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <div
            className={`card ${isPlus ? "plus-card" : ""}`}
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div
                className="chip"
                style={{
                  background: isPlus
                    ? "rgba(234,179,8,0.15)"
                    : "rgba(111,175,142,0.15)",
                  color: isPlus ? "#f5c842" : "#6FAF8E",
                }}
              >
                <Crown size={12} />
                {isPlus ? "Plus Member" : "Standard"}
              </div>
              {isPlus && expiryDate && (
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(245,200,66,0.6)",
                    fontWeight: 600,
                  }}
                >
                  Expires{" "}
                  {new Date(expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            <div
              className="points-num"
              style={{ color: isPlus ? "#f5c842" : "#fff" }}
            >
              {points}
            </div>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: ".2em",
                fontWeight: 700,
                marginTop: 4,
                marginBottom: 24,
              }}
            >
              Loyalty Points
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <Flame size={18} color="#fb923c" fill="#fb923c" />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
                  {Math.min(streak, maxCycles)} / {maxCycles} Cycles
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    margin: 0,
                  }}
                >
                  {getStreakStatus()}
                </p>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                ₹500+ / 14d
              </div>
            </div>

            {!isPlus && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".15em",
                    marginBottom: 8,
                  }}
                >
                  <span>Progress to Plus</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 99,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="bar-fill"
                    style={{
                      width: `${progress * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#6FAF8E,#4e9e7a)",
                      borderRadius: 99,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  {Array.from({ length: maxCycles }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: `2px solid ${i < streak ? "#6FAF8E" : "rgba(255,255,255,0.15)"}`,
                        background: i < streak ? "#6FAF8E" : "transparent",
                        boxShadow:
                          i < streak ? "0 0 8px rgba(111,175,142,0.5)" : "none",
                        transition: "all .4s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isPlus && (
              <div style={{ marginTop: 20 }}>
                {eligibleForPlus ? (
                  <button
                    onClick={handleActivatePlus}
                    disabled={processing}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg,#f5c842,#e6a800)",
                      color: "#000",
                      fontWeight: 800,
                      fontSize: 15,
                      border: "none",
                      borderRadius: 16,
                      padding: "14px 0",
                      cursor: "pointer",
                      opacity: processing ? 0.6 : 1,
                    }}
                  >
                    {processing ? "Opening Payment…" : "✦ Activate Plus — ₹299"}
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 13,
                    }}
                  >
                    <Lock size={13} />
                    {maxCycles - Math.min(streak, maxCycles)} more cycle
                    {maxCycles - Math.min(streak, maxCycles) !== 1
                      ? "s"
                      : ""}{" "}
                    to unlock Plus
                  </div>
                )}
              </div>
            )}
          </div>

          {!isPlus && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
                How to earn Plus
              </p>
              {[
                "Spend ₹500+ in a single order",
                "Repeat every 14 days",
                "Complete 4 cycles (≈ 2 months)",
                "Pay ₹299 to activate Plus 🎉",
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: i < 3 ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(111,175,142,0.12)",
                      border: "1px solid rgba(111,175,142,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#6FAF8E",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.55)",
                      margin: 0,
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
            {isPlus ? "Your Active Benefits" : "What Plus unlocks"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 12,
            }}
          >
            <div className={`card ${isPlus ? "green-card" : ""}`}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isPlus
                    ? "rgba(111,175,142,0.15)"
                    : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Truck
                  size={20}
                  color={isPlus ? "#6FAF8E" : "rgba(255,255,255,0.3)"}
                />
              </div>
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
                Free Delivery
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Zero delivery charge on every order — no minimum required.
              </p>
              {isPlus && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 12,
                    color: "#6FAF8E",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                  }}
                >
                  <Check size={11} />
                  Active
                </div>
              )}
            </div>

            <div className={`card ${isPlus ? "plus-card" : ""}`}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isPlus
                    ? "rgba(245,200,66,0.12)"
                    : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Percent
                  size={20}
                  color={isPlus ? "#f5c842" : "rgba(255,255,255,0.3)"}
                />
              </div>
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
                5% Extra Discount
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Extra 5% stacked on every product's existing discount, always.
              </p>
              {isPlus && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 12,
                    color: "#f5c842",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                  }}
                >
                  <Check size={11} />
                  Active on all products
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoyaltyPage;
