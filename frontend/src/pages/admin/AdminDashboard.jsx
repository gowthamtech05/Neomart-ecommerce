import React, { useEffect, useState, useCallback } from "react";
import API from "../../api/api";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faIndianRupeeSign,
  faRotateLeft,
  faArrowsRotate,
  faFilePdf,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/orders/admin/dashboard");

      console.log("FRONTEND RECEIVED DATA:", res.data);

      setData(res.data);
      setError("");
    } catch (err) {
      console.error("FRONTEND ERROR:", err);
      setError("Failed to fetch dashboard data ❌");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const normalizedData = {
    totalRevenue: data?.totalRevenue ?? 0,
    totalRefunded: data?.totalRefunded ?? 0,
    paidOrders: data?.paidOrders ?? 0,
    usersCount: data?.usersCount ?? 0,
    cancelledOrders: data?.cancelledOrders ?? 0,
    totalOrders: data?.totalOrders ?? 0,
    codOrders: data?.codOrders ?? 0,
    productsCount: data?.productsCount ?? 0,
    lowStockProducts: data?.lowStockProducts || [],
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;
    const brandColor = "#6FAF8E";

    // 1. BRANDED HEADER
    doc.setFillColor(brandColor);
    doc.rect(0, 0, pageWidth, 100, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("NEOMART", margin, 55);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("ADMINISTRATION DASHBOARD REPORT", margin, 75);
    doc.text(
      `GENERATED: ${new Date().toLocaleDateString()}`,
      pageWidth - margin - 120,
      75,
    );

    // 2. STATISTICS GRID
    let yPos = 140;
    const cardWidth = (pageWidth - margin * 2 - 20) / 2;
    const cardHeight = 65;

    const stats = [
      { label: "Net Revenue", value: `${normalizedData.totalRevenue}` },
      { label: "Refunded", value: `${normalizedData.totalRefunded}` },
      { label: "Paid Orders", value: normalizedData.paidOrders },
      { label: "Total Users", value: normalizedData.usersCount },
      { label: "Cancelled Orders", value: normalizedData.cancelledOrders },
      { label: "Total Orders", value: normalizedData.totalOrders },
      { label: "COD Orders", value: normalizedData.codOrders },
      { label: "Total Products", value: normalizedData.productsCount },
    ];

    stats.forEach((stat, index) => {
      const xPos = margin + (index % 2) * (cardWidth + 20);
      const currentRow = Math.floor(index / 2);
      const currentY = yPos + currentRow * (cardHeight + 15);

      // Light background for cards
      doc.setFillColor("#F8FAFC");
      doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 6, 6, "F");

      // Card Accent (Small vertical bar on the left)
      doc.setFillColor(brandColor);
      doc.rect(xPos, currentY + 15, 3, 35, "F");

      // Label text
      doc.setFontSize(9);
      doc.setTextColor("#64748B");
      doc.setFont("helvetica", "bold");
      doc.text(stat.label.toUpperCase(), xPos + 15, currentY + 22);

      // Value text
      doc.setFontSize(16);
      doc.setTextColor("#1E293B");
      doc.text(`${stat.value}`, xPos + 15, currentY + 48);
    });

    yPos += Math.ceil(stats.length / 2) * (cardHeight + 15) + 40;

    // 3. LOW STOCK SECTION
    doc.setFontSize(16);
    doc.setTextColor(brandColor);
    doc.setFont("helvetica", "bold");
    doc.text("Inventory Alerts", margin, yPos);

    doc.setDrawColor(brandColor);
    doc.setLineWidth(1.5);
    doc.line(margin, yPos + 5, margin + 110, yPos + 5);

    yPos += 35;

    if (normalizedData.lowStockProducts.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor("#64748B");
      doc.setFont("helvetica", "normal");
      doc.text("All inventory levels are currently healthy.", margin, yPos);
    } else {
      // Table Header
      doc.setFontSize(10);
      doc.setTextColor("#94A3B8");
      doc.text("PRODUCT NAME", margin, yPos);
      doc.text("REMAINING STOCK", pageWidth - margin - 100, yPos);

      yPos += 10;
      doc.setDrawColor("#E2E8F0");
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 20;

      normalizedData.lowStockProducts.forEach((p) => {
        // Page break check
        if (yPos > 780) {
          doc.addPage();
          yPos = 50;
        }

        doc.setTextColor("#334155");
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(p.name, margin, yPos);

        doc.setTextColor("#EF4444"); // Red for alerts
        doc.setFont("helvetica", "bold");
        doc.text(`${p.quantity} Units`, pageWidth - margin - 100, yPos);

        yPos += 20;
        // Subtle row line
        doc.setDrawColor("#F1F5F9");
        doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
      });
    }

    // 4. FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor("#94A3B8");
      doc.text(
        `Neomart Business Report - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        820,
        { align: "center" },
      );
    }

    doc.save(`Neomart_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleResetMonthly = async () => {
    if (!window.confirm("Reset all monthly stats?")) return;
    try {
      await API.put("/api/orders/reset-monthly-data");

      alert("Monthly stats reset successfully ✅");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Reset failed ❌");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <h2 className="text-2xl font-bold animate-pulse text-emerald-600">
          Crunching Stats...
        </h2>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <h2 className="text-xl text-red-500 font-semibold">{error}</h2>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">
            <i class="fa-solid fa-users-gear"></i> Admin Overview
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Monitor revenue, orders and inventory in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="bg-[#6FAF8E] text-white px-6 py-2.5 rounded-2xl shadow-md hover:shadow-xl transition-all text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faFilePdf} /> Export PDF & Reset
          </button>

          <button
            onClick={handleResetMonthly}
            className="bg-white text-red-500 outline-red px-6 py-2.5 rounded-2xl shadow-md hover:bg-red-600 hover:text-white hover:shadow-xl transition-all text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faArrowsRotate} /> Reset Monthly
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Net Revenue"
          value={`₹${normalizedData.totalRevenue}`}
          icon={<FontAwesomeIcon icon={faIndianRupeeSign} />}
          gradient="from-emerald-400 to-teal-500"
        />
        <StatCard
          title="Refunded"
          value={`₹${normalizedData.totalRefunded}`}
          icon={<FontAwesomeIcon icon={faRotateLeft} />}
          gradient="from-rose-400 to-red-500"
        />
        <StatCard
          title="Paid Orders"
          value={normalizedData.paidOrders}
          icon={<FontAwesomeIcon icon={faBoxOpen} />}
          gradient="from-blue-400 to-indigo-500"
        />
        <StatCard
          title="Total Users"
          value={normalizedData.usersCount}
          icon={<FontAwesomeIcon icon={faUsers} />}
          gradient="from-purple-400 to-fuchsia-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 border-black border-b-2 pb-10">
        <MiniCard title="Cancelled" value={normalizedData.cancelledOrders} />
        <MiniCard title="Total Orders" value={normalizedData.totalOrders} />
        <MiniCard title="COD Orders" value={normalizedData.codOrders} />
        <MiniCard title="Products" value={normalizedData.productsCount} />
      </div>

      {/* Low Stock Section */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-700">
            ⚠️ Low Stock Alerts
          </h2>
          <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
            {normalizedData.lowStockProducts.length} Items
          </span>
        </div>

        {normalizedData.lowStockProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Inventory levels are healthy. ✅
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 text-left">Product</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {normalizedData.lowStockProducts.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-semibold">
                        {item.quantity} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient }) => (
  <div className="bg-white rounded-3xl shadow-md p-6 relative overflow-hidden group hover:shadow-xl transition-all">
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition`}
    />
    <div className="flex justify-between items-center mb-4 relative z-10">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </span>
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="text-3xl font-extrabold text-gray-800 relative z-10">
      {value}
    </div>
  </div>
);

const MiniCard = ({ title, value }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
      {title}
    </p>
    <p className="text-xl font-bold text-gray-700">{value}</p>
  </div>
);

export default AdminDashboard;
