import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const authConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const days = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const emptyStoreForm = {
  storeName: "",
  storeNotes: "",
  latitude: "",
  longitude: "",
  radius: "",
  radiusUnit: "km",
  isActive: true,
};

const emptyDeliveryForm = {
  minDistance: "",
  maxDistance: "",
  charge: "",
  isActive: true,
};

const emptySlotForm = {
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  isActive: true,
};

const emptyCopyForm = {
  slotId: "",
  days: [],
};

function StoreSettings() {
  const [activeTab, setActiveTab] = useState("settings");

  // =========================
  // STORE SETTINGS
  // =========================

  const [form, setForm] = useState(emptyStoreForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =========================
  // DELIVERY CHARGES
  // =========================

  const [deliveryCharges, setDeliveryCharges] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const [deliveryForm, setDeliveryForm] =
    useState(emptyDeliveryForm);

  const [editingDeliveryId, setEditingDeliveryId] =
    useState(null);

  const [showDeliveryPopup, setShowDeliveryPopup] =
    useState(false);

  // =========================
  // DELIVERY SLOTS
  // =========================

  const [deliverySlots, setDeliverySlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);

  const [slotForm, setSlotForm] =
    useState(emptySlotForm);

  const [editingSlotId, setEditingSlotId] =
    useState(null);

  const [showSlotPopup, setShowSlotPopup] =
    useState(false);

  // =========================
  // COPY SLOT
  // =========================

  const [copyForm, setCopyForm] =
    useState(emptyCopyForm);

  const [showCopyPopup, setShowCopyPopup] =
    useState(false);

  const [copyingSlot, setCopyingSlot] =
    useState(false);

  // =========================
  // LOAD STORE SETTINGS
  // =========================

  const loadStoreSettings = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/store-settings`,
        authConfig()
      );

      if (response.data?.data) {
        const data = response.data.data;

        setForm({
          storeName: data.storeName || "",
          storeNotes: data.storeNotes || "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          radius: data.radius ?? "",
          radiusUnit: data.radiusUnit || "km",
          isActive:
            data.isActive !== undefined
              ? data.isActive
              : true,
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load store settings"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD DELIVERY CHARGES
  // =========================

  const loadDeliveryCharges = async () => {
    try {
      setDeliveryLoading(true);

      const response = await axios.get(
        `${API_URL}/delivery-charges`,
        authConfig()
      );

      setDeliveryCharges(response.data?.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load delivery charges"
      );
    } finally {
      setDeliveryLoading(false);
    }
  };

  // =========================
  // LOAD DELIVERY SLOTS
  // =========================

  const loadDeliverySlots = async () => {
    try {
      setSlotLoading(true);

      const response = await axios.get(
        `${API_URL}/delivery-slots`,
        authConfig()
      );

      setDeliverySlots(response.data?.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load delivery slots"
      );
    } finally {
      setSlotLoading(false);
    }
  };

  useEffect(() => {
    loadStoreSettings();
    loadDeliveryCharges();
    loadDeliverySlots();
  }, []);

  // =========================
  // STORE SETTINGS HANDLERS
  // =========================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    if (!form.storeName.trim()) {
      alert("Store name is required");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radius = Number(form.radius);

    if (
      Number.isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      alert("Invalid latitude");
      return;
    }

    if (
      Number.isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert("Invalid longitude");
      return;
    }

    if (
      Number.isNaN(radius) ||
      radius < 0
    ) {
      alert("Invalid delivery radius");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${API_URL}/store-settings`,
        {
          ...form,
          latitude,
          longitude,
          radius,
        },
        authConfig()
      );

      alert("Store settings saved successfully");

      loadStoreSettings();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save store settings"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELIVERY CHARGE HANDLERS
  // =========================

  const openAddDeliveryPopup = () => {
    setEditingDeliveryId(null);

    setDeliveryForm({
      ...emptyDeliveryForm,
    });

    setShowDeliveryPopup(true);
  };

  const openEditDeliveryPopup = (item) => {
    setEditingDeliveryId(item._id);

    setDeliveryForm({
      minDistance: item.minDistance,
      maxDistance: item.maxDistance,
      charge: item.charge,
      isActive:
        item.isActive !== undefined
          ? item.isActive
          : true,
    });

    setShowDeliveryPopup(true);
  };

  const closeDeliveryPopup = () => {
    setShowDeliveryPopup(false);
    setEditingDeliveryId(null);
    setDeliveryForm({
      ...emptyDeliveryForm,
    });
  };

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDeliveryForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveDeliveryCharge = async (e) => {
    e.preventDefault();

    const minDistance = Number(
      deliveryForm.minDistance
    );

    const maxDistance = Number(
      deliveryForm.maxDistance
    );

    const charge = Number(
      deliveryForm.charge
    );

    if (
      Number.isNaN(minDistance) ||
      minDistance < 0
    ) {
      alert("Minimum distance must be 0 or greater");
      return;
    }

    if (
      Number.isNaN(maxDistance) ||
      maxDistance <= minDistance
    ) {
      alert(
        "Maximum distance must be greater than minimum distance"
      );
      return;
    }

    if (
      Number.isNaN(charge) ||
      charge < 0
    ) {
      alert("Delivery charge must be 0 or greater");
      return;
    }

    const payload = {
      minDistance,
      maxDistance,
      charge,
      isActive: deliveryForm.isActive,
    };

    try {
      if (editingDeliveryId) {
        await axios.put(
          `${API_URL}/delivery-charges/${editingDeliveryId}`,
          payload,
          authConfig()
        );

        alert(
          "Delivery charge updated successfully"
        );
      } else {
        await axios.post(
          `${API_URL}/delivery-charges`,
          payload,
          authConfig()
        );

        alert(
          "Delivery charge created successfully"
        );
      }

      closeDeliveryPopup();
      loadDeliveryCharges();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save delivery charge"
      );
    }
  };

  const deleteDeliveryCharge = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this delivery charge?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/delivery-charges/${id}`,
        authConfig()
      );

      loadDeliveryCharges();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete delivery charge"
      );
    }
  };

  // =========================
  // DELIVERY SLOT HANDLERS
  // =========================

  const openAddSlotPopup = () => {
    setEditingSlotId(null);

    setSlotForm({
      ...emptySlotForm,
    });

    setShowSlotPopup(true);
  };

  const openEditSlotPopup = (slot) => {
    setEditingSlotId(slot._id);

    setSlotForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive:
        slot.isActive !== undefined
          ? slot.isActive
          : true,
    });

    setShowSlotPopup(true);
  };

  const closeSlotPopup = () => {
    setShowSlotPopup(false);
    setEditingSlotId(null);

    setSlotForm({
      ...emptySlotForm,
    });
  };

  const handleSlotChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSlotForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "dayOfWeek"
          ? Number(value)
          : value,
    }));
  };

  const saveSlot = async (e) => {
    e.preventDefault();

    if (
      slotForm.dayOfWeek === undefined ||
      slotForm.dayOfWeek === null
    ) {
      alert("Please select a day");
      return;
    }

    if (!slotForm.startTime) {
      alert("Start time is required");
      return;
    }

    if (!slotForm.endTime) {
      alert("End time is required");
      return;
    }

    if (
      slotForm.endTime <= slotForm.startTime
    ) {
      alert(
        "End time must be greater than start time"
      );
      return;
    }

    const payload = {
      dayOfWeek: Number(slotForm.dayOfWeek),
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      isActive: slotForm.isActive,
    };

    try {
      if (editingSlotId) {
        await axios.put(
          `${API_URL}/delivery-slots/${editingSlotId}`,
          payload,
          authConfig()
        );

        alert(
          "Delivery slot updated successfully"
        );
      } else {
        await axios.post(
          `${API_URL}/delivery-slots`,
          payload,
          authConfig()
        );

        alert(
          "Delivery slot created successfully"
        );
      }

      closeSlotPopup();
      loadDeliverySlots();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save delivery slot"
      );
    }
  };

  const deleteSlot = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this delivery slot?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/delivery-slots/${id}`,
        authConfig()
      );

      loadDeliverySlots();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete delivery slot"
      );
    }
  };

  // =========================
  // COPY SLOT
  // =========================

  const openCopyPopup = (slot) => {
    setCopyForm({
      slotId: slot._id,
      days: [],
    });

    setShowCopyPopup(true);
  };

  const closeCopyPopup = () => {
    setShowCopyPopup(false);

    setCopyForm({
      ...emptyCopyForm,
    });
  };

  const handleCopyDayChange = (day) => {
    setCopyForm((prev) => {
      const exists = prev.days.includes(day);

      if (exists) {
        return {
          ...prev,
          days: prev.days.filter(
            (item) => item !== day
          ),
        };
      }

      return {
        ...prev,
        days: [...prev.days, day],
      };
    });
  };

  const copySlotToDays = async (e) => {
    e.preventDefault();

    if (!copyForm.slotId) {
      alert("Slot is required");
      return;
    }

    if (copyForm.days.length === 0) {
      alert(
        "Please select at least one day"
      );
      return;
    }

    const sourceSlot = deliverySlots.find(
      (slot) => slot._id === copyForm.slotId
    );

    if (!sourceSlot) {
      alert("Source slot not found");
      return;
    }

    try {
      setCopyingSlot(true);

      let successCount = 0;
      let errors = [];

      for (const day of copyForm.days) {
        try {
          await axios.post(
            `${API_URL}/delivery-slots`,
            {
              dayOfWeek: day,
              startTime: sourceSlot.startTime,
              endTime: sourceSlot.endTime,
              isActive: sourceSlot.isActive,
            },
            authConfig()
          );

          successCount++;
        } catch (error) {
          errors.push(
            `${getDayName(day)}: ${
              error.response?.data?.message ||
              "Failed"
            }`
          );
        }
      }

      await loadDeliverySlots();

      closeCopyPopup();

      if (errors.length > 0) {
        alert(
          `${successCount} slot(s) copied successfully.\n\nFailed:\n${errors.join(
            "\n"
          )}`
        );
      } else {
        alert(
          `${successCount} slot(s) copied successfully`
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to copy delivery slot"
      );
    } finally {
      setCopyingSlot(false);
    }
  };

  // =========================
  // HELPERS
  // =========================

  const getDayName = (day) => {
    const found = days.find(
      (item) => item.value === Number(day)
    );

    return found ? found.label : "Unknown";
  };

  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] =
      time.split(":").map(Number);

    const date = new Date();

    date.setHours(hour);
    date.setMinutes(minute);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================
  // STYLES
  // =========================

  const pageStyle = {
    background: "#f5f6f8",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginTop: "6px",
    marginBottom: "5px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
  };

  const buttonStyle = {
    background: "#f28c28",
    color: "#fff",
    border: "none",
    padding: "11px 18px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  };

  const cancelButtonStyle = {
    background: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "11px 18px",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const editButtonStyle = {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  };

  const deleteButtonStyle = {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  };

  const copyButtonStyle = {
    background: "#17a2b8",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #ddd",
    background: "#f8f9fa",
    fontSize: "14px",
  };

  const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  };

  const tabContainerStyle = {
    display: "flex",
    gap: "5px",
    background: "#fff",
    padding: "5px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const tabButtonStyle = {
    background: "transparent",
    color: "#555",
    border: "none",
    padding: "12px 20px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  };

  const activeTabStyle = {
    background: "#f28c28",
    color: "#fff",
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  };

  const modalStyle = {
    width: "100%",
    maxWidth: "600px",
    background: "#fff",
    borderRadius: "10px",
    padding: "25px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const closeButtonStyle = {
    width: "34px",
    height: "34px",
    border: "none",
    background: "#f1f2f4",
    color: "#555",
    borderRadius: "50%",
    fontSize: "24px",
    lineHeight: "30px",
    cursor: "pointer",
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              marginBottom: "5px",
            }}
          >
            Store Settings
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: "14px",
            }}
          >
            Manage your store, delivery charges and
            delivery slots
          </p>
        </div>
      </div>

      {/* =========================
          TABS
      ========================= */}

      <div style={tabContainerStyle}>
        <button
          style={{
            ...tabButtonStyle,
            ...(activeTab === "settings"
              ? activeTabStyle
              : {}),
          }}
          onClick={() => setActiveTab("settings")}
        >
          Store Settings
        </button>

        <button
          style={{
            ...tabButtonStyle,
            ...(activeTab === "charges"
              ? activeTabStyle
              : {}),
          }}
          onClick={() => setActiveTab("charges")}
        >
          Delivery Charges
        </button>

        <button
          style={{
            ...tabButtonStyle,
            ...(activeTab === "slots"
              ? activeTabStyle
              : {}),
          }}
          onClick={() => setActiveTab("slots")}
        >
          Delivery Slots
        </button>
      </div>

      {/* =========================
          STORE SETTINGS TAB
      ========================= */}

      {activeTab === "settings" && (
        <>
          <form
            onSubmit={handleSaveSettings}
          >
            <div style={cardStyle}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Store Information
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <label>Store Name</label>

                  <input
                    type="text"
                    name="storeName"
                    value={form.storeName}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="My Grocery Store"
                  />
                </div>

                <div>
                  <label>Delivery Radius</label>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="number"
                      name="radius"
                      value={form.radius}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        marginBottom: 0,
                      }}
                      min="0"
                      step="0.1"
                    />

                    <select
                      name="radiusUnit"
                      value={form.radiusUnit}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        marginBottom: 0,
                        width: "100px",
                      }}
                    >
                      <option value="km">
                        KM
                      </option>

                      <option value="meter">
                        Meter
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                }}
              >
                <label>Store Notes</label>

                <textarea
                  name="storeNotes"
                  value={form.storeNotes}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                  placeholder="Enter store notes..."
                />
              </div>
            </div>

            <div style={cardStyle}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Store Location
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <label>Latitude</label>

                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    style={inputStyle}
                    step="any"
                  />
                </div>

                <div>
                  <label>Longitude</label>

                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    style={inputStyle}
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />

                Store is active
              </label>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Settings"}
                </button>

                <button
                  type="button"
                  style={cancelButtonStyle}
                  onClick={loadStoreSettings}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* =========================
          DELIVERY CHARGES TAB
      ========================= */}

      {activeTab === "charges" && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: "5px",
                }}
              >
                Delivery Charges
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Configure delivery charges based on
                distance.
              </p>
            </div>

            <button
              style={buttonStyle}
              onClick={openAddDeliveryPopup}
            >
              + Add Charge
            </button>
          </div>

          {deliveryLoading ? (
            <p>Loading delivery charges...</p>
          ) : deliveryCharges.length === 0 ? (
            <p
              style={{
                color: "#777",
              }}
            >
              No delivery charges found.
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>
                      Min Distance
                    </th>
                    <th style={thStyle}>
                      Max Distance
                    </th>
                    <th style={thStyle}>
                      Delivery Charge
                    </th>
                    <th style={thStyle}>
                      Status
                    </th>
                    <th style={thStyle}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {deliveryCharges.map(
                    (item, index) => (
                      <tr key={item._id}>
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td style={tdStyle}>
                          {item.minDistance} KM
                        </td>

                        <td style={tdStyle}>
                          {item.maxDistance} KM
                        </td>

                        <td style={tdStyle}>
                          Rs.{" "}
                          {Number(
                            item.charge
                          ).toLocaleString()}
                        </td>

                        <td style={tdStyle}>
                          {item.isActive ? (
                            <span
                              style={{
                                color: "#198754",
                                fontWeight: "600",
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#dc3545",
                                fontWeight: "600",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                            }}
                          >
                            <button
                              style={
                                editButtonStyle
                              }
                              onClick={() =>
                                openEditDeliveryPopup(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              style={
                                deleteButtonStyle
                              }
                              onClick={() =>
                                deleteDeliveryCharge(
                                  item._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================
          DELIVERY SLOTS TAB
      ========================= */}

      {activeTab === "slots" && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: "5px",
                }}
              >
                Delivery Slots
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                You can create multiple delivery slots
                for each day.
              </p>
            </div>

            <button
              style={buttonStyle}
              onClick={openAddSlotPopup}
            >
              + Add Delivery Slot
            </button>
          </div>

          {slotLoading ? (
            <p>Loading delivery slots...</p>
          ) : deliverySlots.length === 0 ? (
            <p
              style={{
                color: "#777",
              }}
            >
              No delivery slots found.
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>

                    <th style={thStyle}>
                      Day
                    </th>

                    <th style={thStyle}>
                      Start Time
                    </th>

                    <th style={thStyle}>
                      End Time
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {deliverySlots.map(
                    (slot, index) => (
                      <tr key={slot._id}>
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "600",
                          }}
                        >
                          {getDayName(
                            slot.dayOfWeek
                          )}
                        </td>

                        <td style={tdStyle}>
                          {formatTime(
                            slot.startTime
                          )}
                        </td>

                        <td style={tdStyle}>
                          {formatTime(
                            slot.endTime
                          )}
                        </td>

                        <td style={tdStyle}>
                          {slot.isActive ? (
                            <span
                              style={{
                                color: "#198754",
                                fontWeight: "600",
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#dc3545",
                                fontWeight: "600",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              style={
                                editButtonStyle
                              }
                              onClick={() =>
                                openEditSlotPopup(
                                  slot
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              style={
                                copyButtonStyle
                              }
                              onClick={() =>
                                openCopyPopup(
                                  slot
                                )
                              }
                            >
                              Copy
                            </button>

                            <button
                              style={
                                deleteButtonStyle
                              }
                              onClick={() =>
                                deleteSlot(
                                  slot._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          DELIVERY CHARGE POPUP
      ===================================================== */}

      {showDeliveryPopup && (
        <div
          style={modalOverlayStyle}
          onClick={closeDeliveryPopup}
        >
          <div
            style={modalStyle}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                {editingDeliveryId
                  ? "Edit Delivery Charge"
                  : "Add Delivery Charge"}
              </h3>

              <button
                style={closeButtonStyle}
                onClick={closeDeliveryPopup}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveDeliveryCharge}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label>
                    Minimum Distance (KM)
                  </label>

                  <input
                    type="number"
                    name="minDistance"
                    value={
                      deliveryForm.minDistance
                    }
                    onChange={
                      handleDeliveryChange
                    }
                    style={inputStyle}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label>
                    Maximum Distance (KM)
                  </label>

                  <input
                    type="number"
                    name="maxDistance"
                    value={
                      deliveryForm.maxDistance
                    }
                    onChange={
                      handleDeliveryChange
                    }
                    style={inputStyle}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label>
                  Delivery Charge (Rs.)
                </label>

                <input
                  type="number"
                  name="charge"
                  value={deliveryForm.charge}
                  onChange={
                    handleDeliveryChange
                  }
                  style={inputStyle}
                  min="0"
                  step="1"
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "15px",
                }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    deliveryForm.isActive
                  }
                  onChange={
                    handleDeliveryChange
                  }
                />

                Active
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  style={cancelButtonStyle}
                  onClick={
                    closeDeliveryPopup
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={buttonStyle}
                >
                  {editingDeliveryId
                    ? "Update Charge"
                    : "Save Charge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DELIVERY SLOT POPUP
      ===================================================== */}

      {showSlotPopup && (
        <div
          style={modalOverlayStyle}
          onClick={closeSlotPopup}
        >
          <div
            style={modalStyle}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                {editingSlotId
                  ? "Edit Delivery Slot"
                  : "Add Delivery Slot"}
              </h3>

              <button
                style={closeButtonStyle}
                onClick={closeSlotPopup}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveSlot}>
              <div>
                <label>
                  Day of Week
                </label>

                <select
                  name="dayOfWeek"
                  value={
                    slotForm.dayOfWeek
                  }
                  onChange={handleSlotChange}
                  style={inputStyle}
                >
                  {days.map((day) => (
                    <option
                      key={day.value}
                      value={day.value}
                    >
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label>
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    value={
                      slotForm.startTime
                    }
                    onChange={handleSlotChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>
                    End Time
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    value={
                      slotForm.endTime
                    }
                    onChange={handleSlotChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    slotForm.isActive
                  }
                  onChange={handleSlotChange}
                />

                Active
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  style={cancelButtonStyle}
                  onClick={closeSlotPopup}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={buttonStyle}
                >
                  {editingSlotId
                    ? "Update Slot"
                    : "Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          COPY SLOT POPUP
      ===================================================== */}

      {showCopyPopup && (
        <div
          style={modalOverlayStyle}
          onClick={closeCopyPopup}
        >
          <div
            style={modalStyle}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  Copy Delivery Slot
                </h3>

                <p
                  style={{
                    marginTop: "5px",
                    marginBottom: 0,
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  Select the days where you want to
                  create this same slot.
                </p>
              </div>

              <button
                style={closeButtonStyle}
                onClick={closeCopyPopup}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {(() => {
                const sourceSlot =
                  deliverySlots.find(
                    (slot) =>
                      slot._id ===
                      copyForm.slotId
                  );

                if (!sourceSlot) {
                  return null;
                }

                return (
                  <>
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "5px",
                      }}
                    >
                      Source Slot
                    </div>

                    <div
                      style={{
                        color: "#555",
                      }}
                    >
                      {getDayName(
                        sourceSlot.dayOfWeek
                      )}{" "}
                      —{" "}
                      {formatTime(
                        sourceSlot.startTime
                      )}{" "}
                      to{" "}
                      {formatTime(
                        sourceSlot.endTime
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <form
              onSubmit={copySlotToDays}
            >
              <label
                style={{
                  fontWeight: "600",
                }}
              >
                Copy To
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                {days.map((day) => {
                  const sourceSlot =
                    deliverySlots.find(
                      (slot) =>
                        slot._id ===
                        copyForm.slotId
                    );

                  const isSourceDay =
                    sourceSlot &&
                    sourceSlot.dayOfWeek ===
                      day.value;

                  return (
                    <label
                      key={day.value}
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                        padding: "10px",
                        border:
                          "1px solid #ddd",
                        borderRadius: "6px",
                        background:
                          isSourceDay
                            ? "#f1f1f1"
                            : "#fff",
                        cursor: isSourceDay
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={copyForm.days.includes(
                          day.value
                        )}
                        disabled={
                          isSourceDay
                        }
                        onChange={() =>
                          handleCopyDayChange(
                            day.value
                          )
                        }
                      />

                      {day.label}

                      {isSourceDay && (
                        <span
                          style={{
                            fontSize:
                              "11px",
                            color:
                              "#999",
                          }}
                        >
                          Source
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  background: "#fff8e8",
                  border:
                    "1px solid #ffe0a3",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#856404",
                }}
              >
                The selected slot will be copied
                with the same start time, end time
                and active status. If a selected day
                already has an overlapping slot, that
                day will be skipped.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  style={cancelButtonStyle}
                  onClick={
                    closeCopyPopup
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={copyingSlot}
                >
                  {copyingSlot
                    ? "Copying..."
                    : "Copy Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreSettings;