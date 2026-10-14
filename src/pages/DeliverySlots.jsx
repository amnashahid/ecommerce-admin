import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptyForm = {
  label: "",
  startTime: "",
  endTime: "",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  minLeadMinutes: "0",
  sortOrder: "0",
  isActive: true,
};

export default function DeliverySlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/delivery-slots`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load delivery slots");
      }

      setSlots(data.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditingId(slot._id);
    setForm({
      label: slot.label || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      daysOfWeek: slot.daysOfWeek || [],
      minLeadMinutes: String(slot.minLeadMinutes ?? 0),
      sortOrder: String(slot.sortOrder ?? 0),
      isActive: slot.isActive !== false,
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!TIME_PATTERN.test(form.startTime) || !TIME_PATTERN.test(form.endTime)) {
      setError("Start and end time are required (HH:mm).");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    if (form.daysOfWeek.length === 0) {
      setError("Select at least one day.");
      return;
    }

    const minLeadMinutes = Number(form.minLeadMinutes);
    const sortOrder = Number(form.sortOrder);

    if (
      form.minLeadMinutes.trim() === "" ||
      !Number.isFinite(minLeadMinutes) ||
      minLeadMinutes < 0
    ) {
      setError("Minimum lead time must be 0 or more.");
      return;
    }

    if (form.sortOrder.trim() === "" || !Number.isFinite(sortOrder)) {
      setError("Sort order must be a number.");
      return;
    }

    const payload = {
      label: form.label.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      daysOfWeek: form.daysOfWeek,
      minLeadMinutes,
      sortOrder,
      isActive: form.isActive,
    };

    try {
      setSaving(true);
      const response = await fetch(
        editingId
          ? `${API_URL}/delivery-slots/${editingId}`
          : `${API_URL}/delivery-slots`,
        {
          method: editingId ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save delivery slot");
      }

      setShowModal(false);
      setEditingId(null);
      await fetchSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery slot?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/delivery-slots/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete delivery slot");
      }

      fetchSlots();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDays = (days = []) =>
    days.length === 7 ? "Every day" : days.map((d) => DAYS[d]).join(", ");

  return (
    <div className="ds-page">
      <div className="ds-header">
        <div>
          <h1>Delivery Slots</h1>
          <p>Manage the time slots customers can choose for delivery</p>
        </div>
        <button type="button" className="ds-btn-primary" onClick={openCreate}>
          + Add Slot
        </button>
      </div>

      <div className="ds-table-wrap">
        {loading ? (
          <div className="ds-empty">Loading delivery slots...</div>
        ) : slots.length === 0 ? (
          <div className="ds-empty">No delivery slots found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Time</th>
                <th>Days</th>
                <th>Min Lead (min)</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot._id}>
                  <td>{slot.label || "-"}</td>
                  <td>
                    {slot.startTime} - {slot.endTime}
                  </td>
                  <td>{formatDays(slot.daysOfWeek)}</td>
                  <td>{slot.minLeadMinutes ?? 0}</td>
                  <td>{slot.sortOrder ?? 0}</td>
                  <td>
                    <span
                      className={`ds-status ${
                        slot.isActive ? "active" : "inactive"
                      }`}
                    >
                      {slot.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ds-btn-edit"
                      onClick={() => openEdit(slot)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ds-btn-delete"
                      onClick={() => handleDelete(slot._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div
          className="ds-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="ds-modal">
            <div className="ds-modal-header">
              <h2>{editingId ? "Edit Delivery Slot" : "Add Delivery Slot"}</h2>
              <button
                type="button"
                className="ds-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ds-modal-body">
                {error && <div className="ds-error">{error}</div>}

                <div className="ds-field">
                  <label>Label</label>
                  <input
                    type="text"
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    placeholder="e.g. Morning"
                  />
                </div>

                <div className="ds-grid">
                  <div className="ds-field">
                    <label>Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="ds-field">
                    <label>End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="ds-field">
                    <label>Minimum Lead Time (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      name="minLeadMinutes"
                      value={form.minLeadMinutes}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ds-field">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={form.sortOrder}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="ds-field">
                  <label>Available Days</label>
                  <div className="ds-days">
                    {DAYS.map((name, day) => (
                      <button
                        type="button"
                        key={day}
                        className={`ds-day ${
                          form.daysOfWeek.includes(day) ? "on" : ""
                        }`}
                        onClick={() => toggleDay(day)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="ds-check">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>

              <div className="ds-modal-footer">
                <button
                  type="button"
                  className="ds-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingId ? "Update Slot" : "Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ds-page { padding: 24px; background: #f5f6f8; min-height: 100vh; box-sizing: border-box; }
        .ds-page * { box-sizing: border-box; }
        .ds-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .ds-header h1 { margin: 0; font-size: 28px; color: #222; }
        .ds-header p { margin: 5px 0 0; color: #777; }
        .ds-btn-primary { border: none; background: #f97316; color: #fff; padding: 11px 20px; border-radius: 7px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .ds-btn-primary:hover { background: #ea580c; }
        .ds-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .ds-btn-secondary { border: 1px solid #ddd; background: #fff; padding: 11px 20px; border-radius: 7px; cursor: pointer; }
        .ds-table-wrap { background: #fff; border-radius: 10px; overflow: auto; box-shadow: 0 1px 5px rgba(0,0,0,0.08); }
        .ds-page table { width: 100%; border-collapse: collapse; }
        .ds-page th { text-align: left; padding: 15px; background: #fafafa; border-bottom: 1px solid #eee; font-size: 13px; color: #555; }
        .ds-page td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; }
        .ds-empty { padding: 50px; text-align: center; color: #777; }
        .ds-status { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .ds-status.active { background: #dcfce7; color: #166534; }
        .ds-status.inactive { background: #fee2e2; color: #991b1b; }
        .ds-btn-edit, .ds-btn-delete { border: none; padding: 7px 12px; border-radius: 5px; cursor: pointer; margin-right: 6px; }
        .ds-btn-edit { background: #fff7ed; color: #ea580c; }
        .ds-btn-delete { background: #fee2e2; color: #dc2626; }
        .ds-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; justify-content: center; align-items: center; padding: 20px; z-index: 9999; }
        .ds-modal { width: 100%; max-width: 600px; max-height: 92vh; background: #fff; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .ds-modal form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
        .ds-modal-header { padding: 20px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .ds-modal-header h2 { margin: 0; font-size: 21px; }
        .ds-close { border: none; background: transparent; font-size: 28px; cursor: pointer; color: #777; line-height: 1; }
        .ds-modal-body { padding: 24px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
        .ds-modal-footer { padding: 16px 24px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; }
        .ds-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .ds-field { margin-bottom: 15px; }
        .ds-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #444; }
        .ds-field input[type="text"], .ds-field input[type="time"], .ds-field input[type="number"] { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; }
        .ds-field input:focus { border-color: #f97316; }
        .ds-days { display: flex; flex-wrap: wrap; gap: 8px; }
        .ds-day { border: 1px solid #ddd; background: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .ds-day.on { background: #f97316; border-color: #f97316; color: #fff; }
        .ds-check { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .ds-error { background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; }
      `}</style>
    </div>
  );
}
