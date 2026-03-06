import { useEffect, useState } from "react";
import API from "../api/api";

const AdSlider = () => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    try {
      const { data } = await API.get("/api/ads");
      setAds(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Auto-slide logic
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads]);

  const handleUpload = async (e, targetIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
      await API.put(`/api/ads/${targetIndex}`, formData);

      await fetchAds();
      alert("Ad updated!");
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdChange = async (e, i) => {
    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("image", file);

    try {
      const res = await API.put(`/api/ads/${i}`, formData);
      console.log("Server Response:", res.data);
      fetchAds();
    } catch (error) {
      console.error(
        "FULL ERROR OBJECT:",
        error.response?.data || error.message,
      );
    }
  };

  if (ads.length === 0) {
    return isAdmin ? (
      <div className="w-full h-[300px] border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 mb-12">
        <p className="text-gray-500 mb-4">No ads found in database.</p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700">
          {loading ? "Uploading..." : "Upload First Ad (Index 0)"}
          <input type="file" hidden onChange={(e) => handleUpload(e, 0)} />
        </label>
      </div>
    ) : null;
  }

  return (
    <div className="relative w-full h-[300px] overflow-hidden rounded-2xl mb-12 group">
      <img
        src={ads[currentIndex]?.image}
        className="w-full h-full object-cover transition-opacity duration-700"
        alt={`Slide ${currentIndex}`}
      />

      {isAdmin && (
        <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg shadow-lg flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-gray-700">EDIT ADS:</p>

          {[...ads, { index: ads.length }].map((ad, i) => (
            <div key={i} className="flex items-center gap-2 border-b pb-1">
              <span className="text-xs">ID {ad.index}:</span>
              <input
                type="file"
                className="text-[10px] w-32"
                onChange={(e) => handleUpload(e, ad.index)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === currentIndex ? "bg-white w-4" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AdSlider;
