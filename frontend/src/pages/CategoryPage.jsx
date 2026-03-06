import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import API from "../api/api";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get("/api/products");

        if (Array.isArray(data)) {
          const categoryFiltered = data.filter(
            (p) =>
              p.category?.toLowerCase().trim() ===
              categoryName.toLowerCase().trim(),
          );
          setAllProducts(categoryFiltered);
        }
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, allProducts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-[#6FAF8E] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-2xl">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-3xl font-black capitalize">
            {categoryName} Products
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search in this category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6FAF8E] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 text-gray-500 text-lg">
          No products found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
