import { useState } from "react";
import axios from "axios";
import {
  Package,
  Tag,
  Layers,
  AlignLeft,
  Weight,
  Hash,
  DollarSign,
  Calendar,
  BarChart2,
  ImagePlus,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "",
  description: "",
  weight: "",
  unit: "",
  price: "",
  discountedPrice: "",
  manufacturingDate: "",
  expiryDate: "",
  quantity: "",
  images: [],
};

const FIELDS = [
  {
    key: "name",
    label: "Product Name",
    icon: Package,
    type: "text",
    required: true,
  },
  { key: "brand", label: "Brand", icon: Tag, type: "text", required: false },
  {
    key: "category",
    label: "Category",
    icon: Layers,
    type: "text",
    required: true,
  },
  {
    key: "weight",
    label: "Weight (e.g. 500g, 1L)",
    icon: Weight,
    type: "text",
    required: false,
  },
  {
    key: "unit",
    label: "Unit (kg / litre / pack)",
    icon: Hash,
    type: "text",
    required: false,
  },
  {
    key: "price",
    label: "MRP Price (₹)",
    icon: DollarSign,
    type: "number",
    required: true,
  },
  {
    key: "discountedPrice",
    label: "Discounted Price (₹)",
    icon: DollarSign,
    type: "number",
    required: false,
  },
  {
    key: "manufacturingDate",
    label: "Manufacturing Date",
    icon: Calendar,
    type: "date",
    required: false,
  },
  {
    key: "expiryDate",
    label: "Expiry Date",
    icon: Calendar,
    type: "date",
    required: false,
  },
  {
    key: "quantity",
    label: "Stock Quantity",
    icon: BarChart2,
    type: "number",
    required: true,
  },
];

function Admin() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "images") fd.append(key, value);
      });

      if (selectedFile) fd.append("image", selectedFile);

      await axios.post("http://localhost:5000/api/products", fd, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Product added successfully");
      setFormData(EMPTY_FORM);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      alert(error?.response?.data?.message || "❌ Not authorized");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-5 md:px-6 py-5 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Add Product
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in product details and upload an image
            </p>
          </div>
        </div>

        <form onSubmit={submitHandler}>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* ── LEFT: Form fields ── */}
            <div className="flex-1 space-y-4 sm:space-y-5">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-4 sm:mb-5">
                  Product Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {FIELDS.map(({ key, label, icon: Icon, type, required }) => (
                    <div
                      key={key}
                      className={`relative group ${key === "name" ? "sm:col-span-2" : ""}`}
                    >
                      <Icon
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6FAF8E] transition-colors pointer-events-none"
                      />
                      <input
                        type={type}
                        placeholder={label}
                        value={formData[key]}
                        required={required}
                        onChange={(e) => set(key, e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm border rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50 ${
                          type === "date" ? "text-gray-600" : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">
                  Description
                </h2>
                <div className="relative group">
                  <AlignLeft
                    size={14}
                    className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#6FAF8E] transition-colors pointer-events-none"
                  />
                  <textarea
                    placeholder="Write a clear product description..."
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm border rounded-xl outline-none focus:ring-2 focus:ring-[#6FAF8E]/40 focus:border-[#6FAF8E] transition bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ── RIGHT: Image + Submit ── */}
            <div className="lg:w-64 xl:w-72 space-y-4 sm:space-y-5">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">
                  Product Image
                </h2>

                <label
                  className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    preview
                      ? "border-[#6FAF8E]/40 bg-[#6FAF8E]/5"
                      : "border-gray-200 bg-gray-50 hover:border-[#6FAF8E]/40 hover:bg-[#6FAF8E]/5"
                  }`}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-2xl p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 p-4 text-center">
                      <ImagePlus size={28} className="text-gray-300" />
                      <p className="text-xs font-bold">Click to upload</p>
                      <p className="text-[10px]">PNG, JPG, WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>

                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="w-full mt-2 text-[10px] sm:text-xs text-red-400 hover:text-red-600 font-bold transition"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Quick summary */}
              {(formData.price || formData.discountedPrice) && (
                <div className="bg-gray-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Pricing Summary
                  </p>
                  {formData.price && (
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>MRP</span>
                      <span className="text-white">₹{formData.price}</span>
                    </div>
                  )}
                  {formData.discountedPrice && formData.price && (
                    <>
                      <div className="flex justify-between text-xs font-bold text-gray-400 mt-1.5">
                        <span>Sale</span>
                        <span className="text-[#6FAF8E]">
                          ₹{formData.discountedPrice}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs font-black">
                        <span className="text-gray-400">Discount</span>
                        <span className="text-[#6FAF8E]">
                          {Math.round(
                            ((formData.price - formData.discountedPrice) /
                              formData.price) *
                              100,
                          )}
                          % OFF
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#6FAF8E] hover:bg-green-600 text-white font-black text-sm py-3 sm:py-4 rounded-2xl transition shadow-lg shadow-green-100 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Admin;
