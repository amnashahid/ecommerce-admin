import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const emptyTier = { minKm: "", maxKm: "", charge: "" };

export default function DeliveryCharges() {
  const [tiers, setTiers] = useState([]);
  const [defaultCharge, setDefaultCharge] = useState("250");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/delivery-charges`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load delivery charges");
      }

      const config = data.data || {};
      setTiers(
        (config.tiers || []).map((t) => ({
          minKm: String(t.minKm),
          maxKm: String(t.maxKm),
          charge: String(t.charge),
        }))
      );
      setDefaultCharge(String(config.defaultCharge ?? 250));
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers([
      ...tiers,
      { ...emptyTier, minKm: last && last.maxKm !== "" ? last.maxKm : "" },
    ]);
  };

  const updateTier = (index, field, value) => {
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const removeTier = (index) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (parsed, defaultValue) => {
    if (
      defaultCharge.trim() === "" ||
      !Number.isFinite(defaultValue) ||
      defaultValue < 0
    ) {
      return "Default charge must be 0 or greater.";
    }

    for (const tier of parsed) {
      if (
        !Number.isFinite(tier.minKm) ||
        !Number.isFinite(tier.maxKm) ||
        !Number.isFinite(tier.charge)
      ) {
        return "Each tier needs numeric min km, max km and charge values.";
      }
      if (tier.minKm < 0 || tier.charge < 0) {
        return "Min km and charge must be 0 or greater.";
      }
      if (tier.maxKm <= tier.minKm) {
        return "Each tier's max km must be greater than its min km.";
      }
    }

    const sorted = [...parsed].sort((a, b) => a.minKm - b.minKm);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].minKm < sorted[i - 1].maxKm) {
        return "Distance tiers must not overlap.";
      }
    }

    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);

    const parsed = tiers.map((t) => ({
      minKm: t.minKm === "" ? NaN : Number(t.minKm),
      maxKm: t.maxKm === "" ? NaN : Number(t.maxKm),
      charge: t.charge === "" ? NaN : Number(t.charge),
    }));
    const defaultValue = Number(defaultCharge);

    const error = validate(parsed, defaultValue);
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/delivery-charges`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ tiers: parsed, defaultCharge: defaultValue }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save delivery charges");
      }

      setMessage({
        type: "success",
        text: data.message || "Delivery charges saved successfully.",
      });
      await fetchConfig();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dc-page">
      <div className="dc-header">
        <h1>Delivery Charges</h1>
        <p>
          Set delivery charges by distance from the store. Orders outside every
          tier use the default charge.
        </p>
      </div>

      {message && (
        <div className={`dc-message ${message.type}`}>{message.text}</div>
      )}

      {loading ? (
        <div className="dc-card dc-empty">Loading delivery charges...</div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="dc-card">
            <h3>Default Charge</h3>
            <div className="dc-field">
              <label htmlFor="defaultCharge">
                Default delivery charge (Rs.)
              </label>
              <input
                id="defaultCharge"
                type="number"
                min="0"
                step="any"
                value={defaultCharge}
                onChange={(e) => setDefaultCharge(e.target.value)}
              />
            </div>
          </div>

          <div className="dc-card">
            <div className="dc-card-header">
              <h3>Distance Tiers</h3>
              <button type="button" className="dc-btn-add" onClick={addTier}>
                + Add Tier
              </button>
            </div>

            {tiers.length === 0 ? (
              <div className="dc-empty">
                No tiers yet. The default charge applies to every order.
              </div>
            ) : (
              <div className="dc-tiers">
                <div className="dc-tier dc-tier-head">
                  <span>Min km</span>
                  <span>Max km</span>
                  <span>Charge (Rs.)</span>
                  <span />
                </div>

                {tiers.map((tier, index) => (
                  <div className="dc-tier" key={index}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tier.minKm}
                      onChange={(e) =>
                        updateTier(index, "minKm", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tier.maxKm}
                      onChange={(e) =>
                        updateTier(index, "maxKm", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tier.charge}
                      onChange={(e) =>
                        updateTier(index, "charge", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="dc-btn-remove"
                      onClick={() => removeTier(index)}
                      aria-label="Remove tier"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="dc-btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Delivery Charges"}
          </button>
        </form>
      )}

      <style>{`
        .dc-page { padding: 24px; background: #f5f6f8; min-height: 100vh; box-sizing: border-box; }
        .dc-page * { box-sizing: border-box; }
        .dc-header h1 { margin: 0; font-size: 28px; color: #222; }
        .dc-header p { margin: 5px 0 20px; color: #777; }
        .dc-card { background: #fff; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 5px rgba(0,0,0,0.08); }
        .dc-card h3 { margin: 0 0 15px; font-size: 16px; color: #333; }
        .dc-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .dc-card-header h3 { margin: 0; }
        .dc-field { max-width: 320px; }
        .dc-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #444; }
        .dc-page input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; }
        .dc-page input:focus { border-color: #f97316; }
        .dc-tiers { display: flex; flex-direction: column; gap: 10px; }
        .dc-tier { display: grid; grid-template-columns: 1fr 1fr 1fr 40px; gap: 12px; align-items: center; }
        .dc-tier-head { font-size: 13px; font-weight: 600; color: #555; }
        .dc-empty { color: #777; text-align: center; padding: 20px; }
        .dc-btn-add { border: none; background: #fff7ed; color: #ea580c; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .dc-btn-remove { border: none; background: #fee2e2; color: #dc2626; height: 38px; border-radius: 6px; cursor: pointer; font-size: 20px; }
        .dc-btn-save { border: none; background: #f97316; color: #fff; padding: 11px 22px; border-radius: 7px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .dc-btn-save:hover { background: #ea580c; }
        .dc-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .dc-message { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .dc-message.error { background: #fee2e2; color: #991b1b; }
        .dc-message.success { background: #dcfce7; color: #166534; }
      `}</style>
    </div>
  );
}
