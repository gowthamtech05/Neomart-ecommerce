import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ setIsLoggedIn, setIsAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }
      localStorage.setItem("userInfo", JSON.stringify(data));
      localStorage.setItem("isAdmin", data.isAdmin);

      setIsLoggedIn(true);
      setIsAdmin(data.isAdmin === true);
      navigate("/");
    } catch {
      setError("Server error. Please try again.");
    }
  };

  useEffect(() => {
    const container = document.getElementById("container");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const panelLeft = document.getElementById("panel-left");
    const panelRight = document.getElementById("panel-right");
    const toRegister = document.getElementById("toRegister");
    const toLogin = document.getElementById("toLogin");

    const handleRegisterClick = () => {
      container.classList.add("active");
      loginForm.classList.add(
        "-translate-x-full",
        "opacity-0",
        "pointer-events-none",
      );
      registerForm.classList.remove(
        "translate-x-full",
        "opacity-0",
        "pointer-events-none",
      );
      registerForm.classList.add("translate-x-0", "md:-translate-x-full");
      panelLeft.classList.add("-translate-x-full", "opacity-0");
      panelRight.classList.remove("md:translate-x-full", "translate-y-full");
    };

    const handleLoginClick = () => {
      container.classList.remove("active");
      loginForm.classList.remove(
        "-translate-x-full",
        "opacity-0",
        "pointer-events-none",
      );
      registerForm.classList.add(
        "translate-x-full",
        "opacity-0",
        "pointer-events-none",
      );
      registerForm.classList.remove("translate-x-0", "md:-translate-x-full");
      panelLeft.classList.remove("-translate-x-full", "opacity-0");
      panelRight.classList.add("md:translate-x-full", "translate-y-full");
    };

    toRegister?.addEventListener("click", handleRegisterClick);
    toLogin?.addEventListener("click", handleLoginClick);
    return () => {
      toRegister?.removeEventListener("click", handleRegisterClick);
      toLogin?.removeEventListener("click", handleLoginClick);
    };
  }, []);

  return (
    <div className="w-full bg-white overflow-hidden">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        @media (min-width: 768px) {
          .toggle-blob::before {
            content: "";
            position: absolute;
            left: -250%;
            width: 300%;
            height: 100%;
            background: #6FAF8E;
            border-radius: 150px;
            z-index: 2;
            transition: 1.0s ease;
          }
          .active .toggle-blob::before { left: 50%; }
        }

        @media (max-width: 767px) {
          .toggle-blob::before { display: none; }
        }
      `}</style>

      <div
        id="container"
        className="hidden md:block relative w-full h-[calc(100vh-64px)] overflow-hidden transition-all duration-700"
      >
        <div
          id="login-form"
          className="absolute right-0 w-1/2 h-full flex items-center justify-center p-10 transition-all duration-700 z-20"
        >
          <form
            onSubmit={submitHandler}
            className="w-full max-w-sm text-center"
          >
            <h1 className="text-4xl font-bold mb-5 text-gray-800">Login</h1>
            {error && (
              <p className="text-red-500 mb-3 text-sm font-medium">{error}</p>
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 my-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E] transition text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-4 my-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E] transition text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="w-full h-14 mt-4 bg-[#6FAF8E] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
              SIGN IN
            </button>
            <p className="mt-6 text-sm">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </p>
          </form>
        </div>

        <div
          id="register-form"
          className="absolute right-0 w-1/2 h-full flex items-center justify-center p-10 translate-x-full opacity-0 pointer-events-none transition-all duration-700 z-20"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">New Here?</h1>
            <Link
              to="/register"
              className="inline-block px-10 py-3 bg-[#6FAF8E] text-white rounded-xl font-bold hover:bg-green-600 transition"
            >
              CREATE ACCOUNT
            </Link>
          </div>
        </div>

        <div className="toggle-blob absolute inset-0 pointer-events-none z-10">
          <div
            id="panel-left"
            className="absolute left-0 w-1/2 h-full flex flex-col items-center justify-center text-white z-30 pointer-events-auto transition-all duration-1000"
          >
            <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-white/70 text-sm mb-6 text-center px-8">
              Sign in to continue your shopping
            </p>
            <button
              id="toRegister"
              className="border-2 border-white px-12 py-3 rounded-xl font-bold hover:bg-white hover:text-[#6FAF8E] transition"
            >
              REGISTER
            </button>
          </div>

          <div
            id="panel-right"
            className="absolute right-0 w-1/2 h-full flex flex-col items-center justify-center text-white z-30 md:translate-x-full pointer-events-auto transition-all duration-1000"
          >
            <h2 className="text-3xl font-bold mb-2">Hello, Friend!</h2>
            <p className="text-white/70 text-sm mb-6 text-center px-8">
              Already have an account?
            </p>
            <button
              id="toLogin"
              className="border-2 border-white px-12 py-3 rounded-xl font-bold hover:bg-white hover:text-[#6FAF8E] transition"
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-5 py-10 bg-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">
            NEO<span className="text-[#6FAF8E]">MART</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="w-full max-w-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={submitHandler} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E] focus:border-transparent text-sm transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E] focus:border-transparent text-sm transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-[#6FAF8E] font-bold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full bg-[#6FAF8E] text-white py-3.5 rounded-xl font-black text-sm hover:bg-green-600 transition active:scale-95 mt-1 shadow-lg shadow-green-100"
            >
              SIGN IN
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#6FAF8E] font-bold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
