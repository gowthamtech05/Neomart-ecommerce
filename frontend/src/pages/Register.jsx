import { useState } from "react";
import API from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  User,
  Lock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isPasswordValid = (pass) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[_\-@]).{8,}$/.test(pass);

  const passwordStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[_\-@]/.test(password)) s++;
    return s;
  };

  const strengthColors = [
    "bg-gray-200",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-[#6FAF8E]",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strength = passwordStrength();

  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/api/users/send-otp", { email });
      setStep(2);
    } catch {
      setError("Failed to send OTP. Check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    if (!isPasswordValid(password)) {
      setError(
        "Password must be 8+ chars with uppercase, lowercase and a special char (@, _, -).",
      );
      return;
    }
    try {
      const { data } = await API.post("/api/users/register", {
        name,
        email,
        password,
        otp,
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("isAdmin", data.isAdmin);

      navigate(data.isAdmin ? "/admin" : "/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-4 shadow-xl">
            <ShieldCheck size={26} className="text-[#6FAF8E]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Join us — fresh groceries await.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div
            className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${step >= 1 ? "bg-gray-900" : "bg-gray-200"}`}
          />
          <div
            className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${step >= 2 ? "bg-[#6FAF8E]" : "bg-gray-200"}`}
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                  Step 1 — Verify Email
                </p>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  What's your email?
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  We'll send a one-time code to confirm it's you.
                </p>
              </div>

              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50"
                />
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm py-3 rounded-xl transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Sending OTP...
                  </>
                ) : (
                  <>
                    {" "}
                    Get OTP <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#6FAF8E] font-bold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                  Step 2 — Complete Registration
                </p>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  Almost there!
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={12} className="text-[#6FAF8E]" />
                  <p className="text-xs text-gray-500">
                    OTP sent to{" "}
                    <span className="font-bold text-gray-700">{email}</span>
                  </p>
                </div>
              </div>

              <div className="relative">
                <ShieldCheck
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50 tracking-widest font-bold"
                />
              </div>

              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Set Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColors[strength] : "bg-gray-100"}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {strengthLabels[strength]} · Min 8 chars, uppercase,
                      lowercase, and (@, _, -)
                    </p>
                  </div>
                )}
                {!password && (
                  <p className="text-[10px] text-gray-400">
                    Min 8 chars: uppercase, lowercase + (@, _, -)
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#6FAF8E] hover:bg-green-600 text-white font-black text-sm py-3 rounded-xl transition shadow-lg shadow-green-100"
              >
                Verify & Create Account <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <RotateCcw size={12} /> {loading ? "Sending..." : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-6">
          By registering, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Register;
