import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";
import {
  Bike,
  X,
  MapPin,
  Map,
  Globe,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const geocodeAddress = async (addr) => {
  try {
    const q = encodeURIComponent(
      `${addr.address}, ${addr.city}, ${addr.postalCode}, India`,
    );
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } },
    );
    const d = await r.json();
    if (d[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {}
  return null;
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function AssignModal({
  selectedOrders,
  allOrders,
  filterDistrict,
  onClose,
  onAssigned,
}) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const refOrder = allOrders.find((o) => selectedOrders.includes(o._id));
  const refAddr = refOrder?.shippingAddress;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setGeocoding(true);
      try {
        let lat = null,
          lng = null;
        if (refAddr) {
          const geo = await geocodeAddress(refAddr);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
          }
        }
        setGeocoding(false);

        const districtParam = filterDistrict
          ? `&district=${encodeURIComponent(filterDistrict)}`
          : "";
        const pincodeParam = refAddr?.postalCode
          ? `&pincode=${refAddr.postalCode}`
          : "";
        const url =
          lat && lng
            ? `/api/delivery-partners/admin/active?lat=${lat}&lng=${lng}${pincodeParam}${districtParam}`
            : `/api/delivery-partners/admin/active?${pincodeParam.slice(1)}${districtParam}`;

        const { data } = await API.get(url);
        setPartners(Array.isArray(data) ? data : []);
      } catch {
        setGeocoding(false);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAssign = async () => {
    if (!chosen) return;
    setAssigning(true);
    try {
      await API.put("/api/delivery-partners/admin/orders/assign", {
        partnerId: chosen,
        orderIds: selectedOrders,
      });
      onAssigned();
    } catch (err) {
      alert(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-sm font-extrabold text-[#1A1A1A] flex items-center gap-2">
              <Bike size={16} className="text-[#6FAF8E]" />
              Assign Delivery Partner
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {selectedOrders.length} order
              {selectedOrders.length > 1 ? "s" : ""} selected
              {refAddr?.city ? ` · ${refAddr.city}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
          {selectedOrders.map((id) => {
            const o = allOrders.find((x) => x._id === id);
            return (
              <span
                key={id}
                className="text-[9px] font-bold bg-[#6FAF8E]/10 text-[#6FAF8E] border border-[#6FAF8E]/20 px-2 py-0.5 rounded-full"
              >
                #{id.slice(-6).toUpperCase()} · {o?.user?.name || "?"}
              </span>
            );
          })}
        </div>

        {geocoding && (
          <div className="mx-5 mt-3 flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <MapPin size={11} className="animate-pulse shrink-0" />
            Locating delivery address & calculating nearest partners...
          </div>
        )}

        <div className="px-5 py-3 max-h-[50vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#6FAF8E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bike size={30} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs font-bold text-gray-500">
                No delivery partners available
              </p>
              {filterDistrict && (
                <p className="text-[10px] mt-1 text-amber-500 font-semibold">
                  No active partners in{" "}
                  <span className="font-black">{filterDistrict}</span> district
                </p>
              )}
              <p className="text-[9px] mt-2 text-gray-300">
                Partners must be accepted & have a matching district set
              </p>
            </div>
          ) : (
            partners.map((p, i) => {
              const isFirst = i === 0 && p.hasLocation;
              const isChosen = chosen === p._id;
              const distColor =
                p.distanceKm == null
                  ? "text-gray-300"
                  : p.distanceKm < 5
                    ? "text-emerald-600"
                    : p.distanceKm < 15
                      ? "text-amber-500"
                      : "text-red-400";

              return (
                <label
                  key={p._id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${isChosen ? "border-[#6FAF8E] bg-[#6FAF8E]/5 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
                >
                  <input
                    type="radio"
                    name="assign-partner"
                    value={p._id}
                    checked={isChosen}
                    onChange={() => setChosen(p._id)}
                    className="accent-[#6FAF8E] w-4 h-4 shrink-0"
                  />
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${isChosen ? "bg-[#6FAF8E] text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    {p.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {p.user?.name}
                      </span>
                      {isFirst && (
                        <span className="text-[8px] font-black bg-[#6FAF8E] text-white px-1.5 py-0.5 rounded-full">
                          NEAREST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {p.vehicle && (
                        <span className="text-[9px] text-gray-400">
                          {p.vehicle}
                        </span>
                      )}
                      {(p.district || p.area) && (
                        <span className="text-[9px] text-gray-400">
                          · {p.district || p.area}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400">
                        · {p.totalDeliveries} deliveries
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {p.hasLocation && p.distanceKm != null ? (
                      <>
                        <p className={`text-sm font-black ${distColor}`}>
                          {p.distanceKm}
                          <span className="text-[9px] font-medium ml-0.5">
                            km
                          </span>
                        </p>
                        <p className="text-[8px] text-gray-400">away</p>
                      </>
                    ) : (
                      <p className="text-[9px] text-gray-300">No GPS</p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleAssign}
            disabled={!chosen || assigning}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#6FAF8E] text-white font-bold text-sm py-3 rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Assigning...
              </>
            ) : (
              <>
                <Bike size={15} /> Assign to {selectedOrders.length} Order
                {selectedOrders.length > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnassignModal({ order, onClose, onDone }) {
  const [loading, setLoading] = useState(false);

  const handleUnassign = async () => {
    setLoading(true);
    try {
      await API.put(
        `/api/delivery-partners/admin/orders/${order._id}/unassign`,
      );
      onDone();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unassign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 animate-slideUp">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-800">
              Cancel Delivery Assignment?
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Order #{order._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-[11px] text-gray-600 space-y-1">
          <p>
            Currently assigned to:{" "}
            <span className="font-extrabold text-gray-800">
              {order.deliveryPartner?.user?.name || "Partner"}
            </span>
          </p>
          <p className="text-gray-400">Order status will revert to Paid.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
          >
            Keep
          </button>
          <button
            onClick={handleUnassign}
            disabled={loading}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <XCircle size={13} />
            )}
            Unassign
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [assignMode, setAssignMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/orders/admin");
      setOrders(data.orders ? data.orders : data);
    } catch {
      console.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handleScroll = () => {
      if (!loading && orders.length > 0)
        sessionStorage.setItem("adminOrdersScrollPos", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, orders]);

  useLayoutEffect(() => {
    if (!loading && orders.length > 0) {
      const saved = sessionStorage.getItem("adminOrdersScrollPos");
      if (saved) setTimeout(() => window.scrollTo(0, parseInt(saved)), 50);
    }
  }, [loading, orders]);

  const deliverHandler = async (id) => {
    if (!window.confirm("Mark this order as delivered?")) return;
    try {
      await API.put(`/api/orders/${id}/deliver`);
      fetchOrders();
    } catch {
      alert("Delivery update failed");
    }
  };

  const refundHandler = async (id) => {
    if (!window.confirm("Confirm refund has been processed?")) return;
    try {
      await API.put(`/api/orders/${id}/refund`);
      alert("Order marked as Refunded 💰");
      fetchOrders();
    } catch {
      alert("Refund update failed");
    }
  };

  const resetDatabaseHandler = async () => {
    if (
      !window.confirm(
        "CRITICAL: This will archive all orders for Admin view. User history is preserved. Continue?",
      )
    )
      return;
    try {
      await API.delete("/api/orders/reset");
      setOrders([]);
      alert("Dashboard Reset 🧨");
    } catch (err) {
      alert("Reset failed: " + (err.response?.data?.message || "Error"));
    }
  };

  const toggleAssignMode = () => {
    setAssignMode((v) => !v);
    setSelectedOrders([]);
  };

  const isOrderSelectable = (order) => !order.isDelivered && !order.isCancelled;

  const toggleSelect = (id, order) => {
    if (!isOrderSelectable(order)) return;
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    const eligible = filteredOrders.filter(isOrderSelectable).map((o) => o._id);
    setSelectedOrders((prev) =>
      prev.length === eligible.length ? [] : eligible,
    );
  };

  const searchFiltered = orders.filter((order) => {
    const s = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(s) ||
      (order.user?.name?.toLowerCase() || "guest").includes(s)
    );
  });

  const districtCounts = searchFiltered.reduce((acc, o) => {
    if (o.isDelivered || o.isCancelled) return acc;
    const d = o.shippingAddress?.district || "Unknown";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const districtList = ["ALL", ...Object.keys(districtCounts).sort()];

  const filteredOrders = searchFiltered.filter((order) => {
    if (selectedDistrict === "ALL") return true;
    const d = order.shippingAddress?.district || "Unknown";
    return d === selectedDistrict;
  });

  const assignableCount = filteredOrders.filter(isOrderSelectable).length;

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-4 md:p-8 font-sans animate-fadeIn">
      {showAssignModal && (
        <AssignModal
          selectedOrders={selectedOrders}
          allOrders={orders}
          filterDistrict={selectedDistrict === "ALL" ? null : selectedDistrict}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            setAssignMode(false);
            setSelectedOrders([]);
            fetchOrders();
          }}
        />
      )}
      {unassignTarget && (
        <UnassignModal
          order={unassignTarget}
          onClose={() => setUnassignTarget(null)}
          onDone={() => {
            setUnassignTarget(null);
            fetchOrders();
          }}
        />
      )}

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
              Admin Dashboard
            </h2>
            <p className="text-gray-500 mt-1">
              Manage fulfillment and refund requests
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-grow sm:flex-grow-0">
              <input
                type="text"
                placeholder="Search ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6FAF8E]/50 focus:border-[#6FAF8E] transition-all bg-white shadow-sm"
              />
              <span className="absolute left-3 top-3 text-gray-400">
                <i className="fa-solid fa-magnifying-glass" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex-grow text-center min-w-[100px]">
                <span className="text-sm font-semibold text-gray-600">
                  {filteredOrders.length} of {orders.length}
                </span>
              </div>

              <button
                onClick={toggleAssignMode}
                className={`flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm border whitespace-nowrap ${
                  assignMode
                    ? "bg-[#6FAF8E] text-white border-[#6FAF8E] shadow-[#6FAF8E]/30 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-[#6FAF8E]/50"
                }`}
              >
                <Bike size={13} />
                <span>{assignMode ? "Cancel" : "Delivery Man"}</span>
              </button>

              <button
                onClick={resetDatabaseHandler}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fa-solid fa-trash-can" />
                <span className="hidden sm:inline">Reset Orders</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {assignMode && (
          <div className="mt-5 bg-white border-2 border-[#6FAF8E]/40 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-slideUp">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#6FAF8E]/10 rounded-xl flex items-center justify-center shrink-0">
                <Bike size={16} className="text-[#6FAF8E]" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800">
                  Delivery Assignment Mode
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Select paid orders using checkboxes → then tap{" "}
                  <strong>Assign</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {assignableCount > 0 && (
                <button
                  onClick={selectAll}
                  className="text-[10px] font-bold text-[#6FAF8E] hover:underline underline-offset-2"
                >
                  {selectedOrders.length === assignableCount
                    ? "Deselect All"
                    : `Select All (${assignableCount})`}
                </button>
              )}
              <button
                disabled={selectedOrders.length === 0}
                onClick={() => setShowAssignModal(true)}
                className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition-all border ${
                  selectedOrders.length > 0
                    ? "bg-[#1A1A1A] hover:bg-[#6FAF8E] text-white border-transparent animate-pulse"
                    : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                }`}
              >
                <Bike size={12} />
                Assign{" "}
                {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ""}
              </button>
            </div>
          </div>
        )}
      </div>

      {!loading && districtList.length > 1 && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {districtList.map((d) => {
              const count =
                d === "ALL"
                  ? searchFiltered.filter(
                      (o) => !o.isDelivered && !o.isCancelled,
                    ).length
                  : districtCounts[d] || 0;
              const isActive = selectedDistrict === d;
              return (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDistrict(d);
                    setSelectedOrders([]);
                  }}
                  className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#6FAF8E]/60 hover:text-[#6FAF8E]"
                  }`}
                >
                  {d === "ALL" ? (
                    <span className="flex items-center gap-2">
                      <Globe size={18} className="text-blue-500" />
                      <span>All Districts</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MapPin size={18} className="text-red-500" />
                      <span>{d}</span>
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6FAF8E]" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div
              className={`hidden md:grid px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 ${assignMode ? "grid-cols-[2rem_1fr_1fr_0.7fr_0.8fr_1fr_1.2fr]" : "grid-cols-6"}`}
            >
              {assignMode && <span />}
              <span>Order Details</span>
              <span>Customer</span>
              <span>Revenue</span>
              <span>Payment</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => {
                const offerName =
                  order.couponCode ||
                  order.promoCode ||
                  order.offerName ||
                  (order.discountPrice > 0 ? "Discount Applied" : null);

                const isAssigned = !!order.deliveryPartner;
                const partnerName = order.deliveryPartner?.user?.name;
                const showCheckbox = assignMode && isOrderSelectable(order);
                const isSelected = selectedOrders.includes(order._id);
                const isSelectableRow = assignMode && isOrderSelectable(order);

                return (
                  <div
                    key={order._id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      if (assignMode) {
                        if (isSelectableRow) toggleSelect(order._id, order);
                        return;
                      }
                      navigate(`/admin/orders/${order._id}`);
                    }}
                    className={`group bg-white rounded-xl border p-5 shadow-sm transition-all duration-300 grid grid-cols-1 items-center gap-4 animate-slideUp
                      ${
                        assignMode
                          ? isSelectableRow
                            ? isSelected
                              ? "border-[#6FAF8E] bg-[#6FAF8E]/5 ring-2 ring-[#6FAF8E]/20 shadow-md cursor-pointer"
                              : "border-gray-200 hover:border-[#6FAF8E]/50 hover:bg-[#F0F7F3] cursor-pointer"
                            : "border-gray-200 cursor-default"
                          : "border-gray-200 hover:shadow-md hover:border-[#6FAF8E]/40 hover:bg-[#F0F7F3] cursor-pointer"
                      }
                      ${assignMode ? "md:grid-cols-[2rem_1fr_1fr_0.7fr_0.8fr_1fr_1.2fr]" : "md:grid-cols-6"}
                    `}
                  >
                    {assignMode && (
                      <div className="flex items-center justify-center">
                        {showCheckbox ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(order._id, order);
                            }}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all focus:outline-none ${isSelected ? "bg-[#6FAF8E] border-[#6FAF8E]" : "border-gray-300 bg-white hover:border-[#6FAF8E]"}`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="w-5 h-5" />
                        )}
                      </div>
                    )}

                    <div className="flex flex-col">
                      {!assignMode ? (
                        <Link
                          to={`/admin/orders/${order._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#6FAF8E] font-mono text-sm font-semibold hover:underline"
                        >
                          #{order._id.substring(14)}
                        </Link>
                      ) : (
                        <span className="text-[#6FAF8E] font-mono text-sm font-semibold">
                          #{order._id.substring(14)}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">
                        {order.user?.name || "Guest"}
                      </span>
                      {offerName && (
                        <span className="mt-1 inline-block bg-[#6FAF8E]/10 text-[#6FAF8E] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#6FAF8E]/20 uppercase tracking-tighter w-fit">
                          🏷️ {offerName}
                        </span>
                      )}
                    </div>

                    <span className="text-[#1A1A1A] font-bold">
                      ₹{order.totalPrice}
                    </span>

                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                          order.isCancelled && !order.isPaid
                            ? "bg-gray-100 text-gray-500"
                            : order.isRefunded
                              ? "bg-purple-100 text-purple-700"
                              : order.isPaid
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.isCancelled && !order.isPaid
                          ? "Void"
                          : order.isRefunded
                            ? "Refunded"
                            : order.isPaid
                              ? "Paid"
                              : "Unpaid"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase w-fit ${
                          order.isCancelled
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : order.isDelivered
                              ? "bg-[#F0F7F3] text-[#6FAF8E]"
                              : order.orderStatus === "Assigned"
                                ? "bg-purple-100 text-purple-700"
                                : order.orderStatus === "Out for Delivery"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {order.isCancelled
                          ? "Cancelled ❌"
                          : order.isDelivered
                            ? "Delivered ✅"
                            : order.orderStatus === "Assigned"
                              ? "🚴 Assigned"
                              : order.orderStatus === "Out for Delivery"
                                ? "🛵 On the Way"
                                : "Processing ⏳"}
                      </span>
                      {isAssigned && partnerName && (
                        <span className="text-[9px] font-bold text-purple-600 flex items-center gap-0.5">
                          <Bike size={9} /> {partnerName}
                        </span>
                      )}
                      {order.shippingAddress?.district && (
                        <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                          <MapPin size={8} /> {order.shippingAddress.district}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex md:justify-end gap-2 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAssigned && !order.isDelivered && (
                        <button
                          onClick={() => setUnassignTarget(order)}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <XCircle size={11} /> Unassign
                        </button>
                      )}
                      {!order.isDelivered && !order.isCancelled && (
                        <button
                          onClick={() => deliverHandler(order._id)}
                          className="bg-[#1A1A1A] hover:bg-[#6FAF8E] text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          Deliver
                        </button>
                      )}
                      {order.isCancelled &&
                        order.isPaid &&
                        !order.isRefunded && (
                          <button
                            onClick={() => refundHandler(order._id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Refund
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No orders found matching "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(15px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn  { animation: fadeIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity:0; }
      `}</style>
    </div>
  );
}

export default AdminOrders;
