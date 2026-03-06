import React, { useEffect, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { ArrowLeft, SlidersHorizontal, X, Search } from "lucide-react";
import API from "../api/api";



function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResultsPage() {
  const query = useQuery();
  const searchTerm = query.get("q") || "";
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Brand");

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);

  useEffect(() => {
  if (!searchTerm) return;

  const fetchSearch = async () => {
    try {
      setLoading(true);

      const { data } = await API.get(
        `/api/products/search?q=${encodeURIComponent(searchTerm)}`
      );

      const arr = Array.isArray(data) ? data : [];
      setResults(arr);
      setFilteredResults(arr);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchSearch();
}, [searchTerm]);

  const allBrands = Array.from(
    new Set(results.map((p) => p.brand?.trim() || "Unknown Brand")),
  );

  const totalFilters =
    selectedBrands.length +
    selectedPrices.length +
    selectedDiscounts.length +
    selectedAvailability.length;

  const filterCategories = [
    { id: "Brand", sel: selectedBrands, count: selectedBrands.length },
    { id: "Price", sel: selectedPrices, count: selectedPrices.length },
    { id: "Discount", sel: selectedDiscounts, count: selectedDiscounts.length },
    {
      id: "Availability",
      sel: selectedAvailability,
      count: selectedAvailability.length,
    },
  ];

  const handleToggle = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedPrices([]);
    setSelectedDiscounts([]);
    setSelectedAvailability([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: showFilters ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="fixed top-0 left-0 h-full w-[88%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
      >
        <div className="px-4 sm:px-5 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#6FAF8E]" />
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              Filters
            </h2>
            {totalFilters > 0 && (
              <span className="bg-gray-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {totalFilters}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[38%] bg-gray-50 border-r overflow-y-auto">
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative w-full px-3 py-3.5 text-left text-xs sm:text-sm font-bold transition-colors border-b border-gray-100 ${
                  activeCategory === cat.id
                    ? "bg-white text-[#6FAF8E]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {activeCategory === cat.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#6FAF8E]"
                  />
                )}
                <span className="flex items-center gap-1.5">
                  {cat.id}
                  {cat.count > 0 && (
                    <span className="bg-[#6FAF8E] text-white text-[8px] font-black px-1 py-0.5 rounded-full leading-none">
                      {cat.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-1"
              >
                {activeCategory === "Brand" &&
                  allBrands.map((brand) => (
                    <FilterOption
                      key={brand}
                      label={brand}
                      checked={selectedBrands.includes(brand)}
                      onChange={() =>
                        handleToggle(selectedBrands, setSelectedBrands, brand)
                      }
                    />
                  ))}
                {activeCategory === "Price" &&
                  ["50", "100", "150", "200+"].map((price) => (
                    <FilterOption
                      key={price}
                      label={
                        price === "200+" ? "₹200 & Above" : `Under ₹${price}`
                      }
                      checked={selectedPrices.includes(price)}
                      onChange={() =>
                        handleToggle(selectedPrices, setSelectedPrices, price)
                      }
                    />
                  ))}
                {activeCategory === "Discount" &&
                  ["10", "20", "30"].map((d) => (
                    <FilterOption
                      key={d}
                      label={`${d}% or more`}
                      checked={selectedDiscounts.includes(d)}
                      onChange={() =>
                        handleToggle(selectedDiscounts, setSelectedDiscounts, d)
                      }
                    />
                  ))}
                {activeCategory === "Availability" &&
                  [
                    { k: "instock", l: "In Stock" },
                    { k: "lowstock", l: "Low Stock" },
                    { k: "outofstock", l: "Out of Stock" },
                  ].map((item) => (
                    <FilterOption
                      key={item.k}
                      label={item.l}
                      checked={selectedAvailability.includes(item.k)}
                      onChange={() =>
                        handleToggle(
                          selectedAvailability,
                          setSelectedAvailability,
                          item.k,
                        )
                      }
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-4 py-4 border-t flex gap-2">
          <button
            onClick={clearAll}
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Clear All
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="flex-1 py-2.5 bg-[#6FAF8E] text-white text-xs sm:text-sm font-black rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-100"
          >
            Show Results
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 pt-0 pb-10">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 -mx-3 sm:-mx-4 md:-mx-5 px-3 sm:px-4 md:px-5 py-3 mb-5 sm:mb-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition shrink-0"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-black text-gray-900 truncate">
                  Results for{" "}
                  <span className="text-[#6FAF8E]">"{searchTerm}"</span>
                </h1>
                {!loading && (
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    {filteredResults.length} product
                    {filteredResults.length !== 1 ? "s" : ""} found
                    {totalFilters > 0 &&
                      ` · ${totalFilters} filter${totalFilters !== 1 ? "s" : ""} active`}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="relative flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shrink-0"
            >
              <SlidersHorizontal size={14} />
              <span>Filter</span>
              {totalFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#6FAF8E] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalFilters}
                </span>
              )}
            </button>
          </div>
        </div>
        {totalFilters > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
            {[
              ...selectedBrands,
              ...selectedPrices.map((p) => (p === "200+" ? "₹200+" : `<₹${p}`)),
              ...selectedDiscounts.map((d) => `${d}%+`),
              ...selectedAvailability,
            ].map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full"
              >
                {chip}
              </span>
            ))}
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-red-500 hover:text-red-700 transition"
            >
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6FAF8E] rounded-full animate-spin" />
            <p className="text-sm animate-pulse">Searching...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 mx-auto max-w-md">
            <Search size={36} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-black text-gray-800 mb-2">
              Nothing found
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6">
              Try adjusting filters or search something else.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#6FAF8E] text-white rounded-xl font-black text-sm hover:bg-green-600 transition"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {filteredResults.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterOption({ label, checked, onChange }) {
  return (
    <label
      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
        checked
          ? "border-[#6FAF8E]/30 bg-[#6FAF8E]/5"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className={`text-xs sm:text-sm ${checked ? "text-[#6FAF8E] font-bold" : "text-gray-600"}`}
      >
        {label}
      </span>
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? "bg-[#6FAF8E] border-[#6FAF8E]" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 12 10"
            className="w-2.5 h-2.5 fill-none stroke-white stroke-2"
          >
            <polyline points="1,5 4,8 11,1" />
          </svg>
        )}
      </div>
    </label>
  );
}
