import { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import axios from "axios";

const CACHE_KEY = "neomart_home";
const CACHE_TTL = 5 * 60 * 1000;

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};
const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
};
const bustCache = () => sessionStorage.removeItem(CACHE_KEY);

const Home = ({ search = "" }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [offers, setOffers] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);

  const categories = [
    { name: "Dairy", image: "/cat/dairy.png" },
    { name: "Fruits", image: "/cat/fruits.png" },
    { name: "Vegetables", image: "/cat/vegetables.png" },
    { name: "Bakery", image: "/cat/bakery.png" },
    { name: "Chocolates", image: "/cat/chocolates.png" },
    { name: "Biscuits", image: "/cat/biscuits.png" },
    { name: "Snacks", image: "/cat/snacks.png" },
    { name: "Beverages", image: "/cat/beverages.png" },
    { name: "Rice", image: "/cat/rice.png" },
    { name: "Oil", image: "/cat/oil.png" },
    { name: "Household", image: "/cat/household.png" },
    { name: "Meat", image: "/cat/meat.png" },
    { name: "Seafood", image: "/cat/seafood.png" },
    { name: "Masalas", image: "/cat/masalas.png" },
    { name: "Personal Care", image: "/cat/personal.png" },
    { name: "Baby Care", image: "/cat/baby.png" },
    { name: "Dry Fruits", image: "/cat/dryfruits.png" },
    { name: "Frozen Foods", image: "/cat/frozen.png" },
    { name: "Pet Care", image: "/cat/petcare.png" },
    { name: "Pooja Needs", image: "/cat/pooja.png" },
  ];

  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCache();
      if (cached) {
        setProducts(cached.products);
        setAds(cached.ads);
        setOffers(cached.offers);
        return;
      }
    }

    try {
      const [prodRes, adsRes, offRes] = await Promise.all([
        fetch("http://localhost:5000/api/products", { credentials: "include" }),
        fetch("http://localhost:5000/api/ads"),
        fetch("http://localhost:5000/api/offers"),
      ]);
      const [products, ads, offers] = await Promise.all([
        prodRes.json(),
        adsRes.json(),
        offRes.json(),
      ]);
      writeCache({ products, ads, offers });
      setProducts(products);
      setAds(ads);
      setOffers(offers);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (ads.length === 0) return;
    const timer = setInterval(
      () => setCurrentAd((prev) => (prev + 1) % ads.length),
      4000,
    );
    return () => clearInterval(timer);
  }, [ads.length]);

  const handleRemoveFromHome = async (id) => {
    if (!window.confirm("Remove this product from homepage?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        alert("Failed to remove product");
        return;
      }
      bustCache();
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isPinned: false } : p)),
      );
    } catch {
      alert("Failed to remove product");
    }
  };

  const handleAddAd = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      await axios.post("http://localhost:5000/api/ads", formData, {
        withCredentials: true,
      });
      bustCache();
      fetchData(true);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm("Delete this ad?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/ads/${id}`, {
        withCredentials: true,
      });
      bustCache();
      fetchData(true);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const updateOfferLink = async (id, newLink) => {
    try {
      await fetch(`http://localhost:5000/api/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ link: newLink }),
      });
      bustCache();
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOfferImage = async (id, file) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      await fetch(`http://localhost:5000/api/offers/${id}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });
      bustCache();
      fetchData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    await fetch(`http://localhost:5000/api/offers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    bustCache();
    setOffers(offers.filter((o) => o._id !== id));
  };

  const pinnedProducts = products
    .filter((p) => p.isPinned)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 30);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-0">
      <div className="relative w-full h-36 xs:h-44 sm:h-56 md:h-72 lg:h-80 overflow-hidden rounded-2xl sm:rounded-3xl mt-2 sm:mt-4 shadow-lg bg-gray-100">
        {ads.length > 0 ? (
          <>
            <img
              src={ads[currentAd]?.image}
              className="w-full h-full object-cover transition-opacity duration-500"
              alt="Advertisement"
            />
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentAd(i)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${i === currentAd ? "bg-white w-5 sm:w-6" : "bg-white/50 w-1.5 sm:w-2"}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-sm bg-gray-200">
            No ads available
          </div>
        )}

        {isAdmin && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
            <label className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm font-semibold transition shadow-lg">
              <i className="fa-solid fa-plus text-[10px] sm:text-xs" />
              <span className="hidden sm:inline">Add Ad</span>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleAddAd(e.target.files[0])}
              />
            </label>
            {ads.length > 0 && (
              <button
                onClick={() => handleDeleteAd(ads[currentAd]._id)}
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg"
              >
                <i className="fa-solid fa-trash-can text-[10px] sm:text-xs" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="my-6 sm:my-10 md:my-12" id="category-section">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-5 md:mb-6">
          Shop by Category
        </h2>
        <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(`/category/${cat.name.toLowerCase()}`)}
              className="group cursor-pointer text-center"
            >
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3 group-hover:bg-green-50 transition-colors">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full aspect-square object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-gray-700 truncate">
                {cat.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6 sm:my-10">
        <div className="flex justify-between items-center mb-3 sm:mb-5 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
            Special Offers
          </h2>
          {isAdmin && (
            <label className="bg-[#6FAF8E] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg cursor-pointer text-xs sm:text-sm font-bold hover:bg-green-600 transition">
              + New Offer
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("image", file);
                  await fetch("http://localhost:5000/api/offers", {
                    method: "POST",
                    credentials: "include",
                    body: fd,
                  });
                  bustCache();
                  fetchData(true);
                }}
              />
            </label>
          )}
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="relative shrink-0 w-[80%] xs:w-[75%] sm:w-[60%] md:w-[48%] lg:w-[32%] aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden shadow-md group cursor-pointer"
              onClick={() => offer.link && navigate(offer.link)}
            >
              <img
                src={offer.image}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt="Offer"
              />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 sm:gap-3">
                  <label className="bg-white text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer font-bold text-[10px] sm:text-xs">
                    Change Image
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOfferImage(offer._id, e.target.files[0]);
                      }}
                    />
                  </label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOffer(offer._id);
                    }}
                    className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const lnk = prompt("Enter link:", offer.link);
                      if (lnk !== null) updateOfferLink(offer._id, lnk);
                    }}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold"
                  >
                    Set Link
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="my-6 sm:my-10 md:my-14">
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              Featured Products
            </h2>
            {isAdmin && (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                {products.filter((p) => p.isPinned).length}/30 products
              </p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/products")}
              className="bg-[#6FAF8E] hover:bg-green-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow transition"
            >
              + Add/Manage
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {pinnedProducts.length > 0 ? (
            pinnedProducts.map((product) => (
              <div key={product._id} className="relative group">
                <ProductCard product={product} />
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveFromHome(product._id)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400 text-sm py-8">
              No products available
            </p>
          )}
        </div>
      </div>

      <footer className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-900 text-gray-300 pt-8 sm:pt-12 md:pt-16 pb-5 sm:pb-8 mt-10 sm:mt-14 md:mt-20 rounded-t-[24px] sm:rounded-t-[40px] md:rounded-t-[70px] shadow-[0_-8px_24px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
              NEO<span className="text-[#6FAF8E]">MART</span>
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 leading-relaxed max-w-[220px] mx-auto sm:mx-0">
              Your destination for farm-fresh produce. Quality you can taste.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-[#6FAF8E] font-bold mb-3 sm:mb-4 uppercase text-[10px] sm:text-xs tracking-widest">
              Explore
            </h3>
            <ul className="text-[11px] sm:text-xs md:text-sm space-y-2 sm:space-y-3 text-gray-400">
              <li>
                <button
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="hover:text-white transition"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("category-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hover:text-white transition"
                >
                  Shop Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/myorders")}
                  className="hover:text-white transition"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-[#6FAF8E] font-bold mb-3 sm:mb-4 uppercase text-[10px] sm:text-xs tracking-widest">
              Support
            </h3>
            <div className="text-[11px] sm:text-xs md:text-sm space-y-1.5 sm:space-y-2 text-gray-400">
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                support@neomart.com
              </p>
              <p>
                <span className="text-gray-500">Call:</span> +91 98765 43210
              </p>
              <div className="pt-3 sm:pt-4 flex justify-center sm:justify-start gap-2 sm:gap-3">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] sm:text-xs hover:bg-[#6FAF8E] cursor-pointer transition">
                  ig
                </span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] sm:text-xs hover:bg-[#6FAF8E] cursor-pointer transition">
                  fb
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 border-t border-gray-800/50 mt-6 sm:mt-10 md:mt-14 pt-4 sm:pt-5 flex flex-col xs:flex-row justify-between items-center gap-3">
          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 tracking-widest uppercase text-center">
            © {new Date().getFullYear()} NeoMart. All Rights Reserved.
          </p>
          <div className="flex gap-1.5 sm:gap-2 md:gap-3 opacity-40 hover:opacity-100 transition-all duration-500">
            {["VISA", "MC", "STRIPE"].map((b) => (
              <span
                key={b}
                className="text-[7px] sm:text-[8px] md:text-[9px] font-black border border-gray-600 px-1 sm:px-1.5 md:px-2 py-0.5 md:py-1 rounded"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
