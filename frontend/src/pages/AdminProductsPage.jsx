import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pin, PinOff, ArrowLeft, LayoutGrid } from "lucide-react";
import API from "../api/axios.js";

const CACHE_KEY = "neomart_home";
const bustCache = () => sessionStorage.removeItem(CACHE_KEY);

const AdminProductsPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/api/products");
      setAllProducts(data);
      bustCache();
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const pinnedCount = useMemo(
    () => allProducts.filter((p) => p.isPinned).length,
    [allProducts],
  );

  const togglePin = async (productId) => {
    setTogglingId(productId);
    try {
      const { data } = await API.put(`/api/products/${productId}/pin`);

      setAllProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isPinned: data.isPinned } : p,
        ),
      );

      bustCache();
    } catch (err) {
      console.error("Toggle failed:", err);
      alert("Failed to toggle pin");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return [...filtered].sort((a, b) =>
      a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1,
    );
  }, [allProducts, searchTerm]);

  const pinnedPct = Math.min((pinnedCount / 30) * 100, 100);
  const isFull = pinnedCount >= 30;

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-12">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 md:px-6 py-5 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <LayoutGrid size={20} className="text-[#6FAF8E]" /> Homepage
                Grid Manager
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Pin products to appear on the homepage
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-56 md:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Pin
                size={14}
                className={isFull ? "text-red-500" : "text-[#6FAF8E]"}
              />
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-500">
                Pinned to Homepage
              </span>
            </div>
            <span
              className={`text-sm sm:text-base font-black ${isFull ? "text-red-500" : "text-gray-900"}`}
            >
              {pinnedCount} <span className="text-gray-300 font-normal">/</span>{" "}
              30
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pinnedPct}%`,
                background: isFull ? "#ef4444" : "#6FAF8E",
              }}
            />
          </div>
          {isFull && (
            <p className="text-[10px] text-red-400 font-bold mt-1.5">
              Max reached — unpin a product to add more.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <div className="w-9 h-9 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm animate-pulse">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 sm:p-16 text-center">
            <Search size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No products matching "
              <span className="font-bold">{searchTerm}</span>"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const imgPath = product.images?.[0] || product.image;
              const imageUrl = imgPath?.startsWith("http")
                ? imgPath
                : `${import.meta.env.VITE_API_URL}${imgPath?.startsWith("/") ? "" : "/"}${imgPath || ""}`;
              const isToggling = togglingId === product._id;

              return (
                <div
                  key={product._id}
                  className={`group flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                    product.isPinned
                      ? "border-[#6FAF8E]/50 bg-[#6FAF8E]/5 shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${product.isPinned ? "border-[#6FAF8E]/20 bg-white" : "border-gray-100 bg-gray-50"}`}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-xl p-0.5"
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {product.isPinned && (
                          <Pin size={10} className="text-[#6FAF8E] shrink-0" />
                        )}
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePin(product._id)}
                    disabled={isToggling || (!product.isPinned && isFull)}
                    title={
                      !product.isPinned && isFull
                        ? "Max 30 pinned — unpin another first"
                        : ""
                    }
                    className={`shrink-0 flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all disabled:opacity-50 ml-2 ${
                      product.isPinned
                        ? "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
                        : "bg-gray-900 text-white hover:bg-[#6FAF8E]"
                    }`}
                  >
                    {isToggling ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : product.isPinned ? (
                      <>
                        <PinOff size={11} /> Unpin
                      </>
                    ) : (
                      <>
                        <Pin size={11} /> Pin
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
