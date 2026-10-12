
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm = {
  storeName: "",
  storeNotes: "",
  lat: "",
  lon: "",
  currency: "PKR",
  defaultDeliveryCharge: "150",
  minimumOrderAmount: "500",
};

const currencies = [
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
];

function StoreSettings() {
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const authConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    };
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.get(
        `${API_URL}/store-settings/admin`,
        authConfig()
      );

      const data = response.data?.data;

      if (data) {
        setForm({
          storeName: data.storeName ?? "",
          storeNotes: data.storeNotes ?? "",
          lat: String(data.lat ?? ""),
          lon: String(data.lon ?? ""),
          currency: data.currency ?? "PKR",
          defaultDeliveryCharge: String(
            data.defaultDeliveryCharge ?? 150
          ),
          minimumOrderAmount: String(
            data.minimumOrderAmount ?? 500
          ),
        });
      } else {
        setForm({ ...emptyForm });
      }
    } catch (error) {
      console.error("Failed to load store settings:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to load store settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleReset = () => {
    setSuccessMessage("");
    setErrorMessage("");
    loadSettings();
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.storeName.trim()) {
      setErrorMessage("Store name is required.");
      return;
    }

    if (
      form.lat.trim() === "" ||
      !Number.isFinite(Number(form.lat)) ||
      Number(form.lat) < -90 ||
      Number(form.lat) > 90
    ) {
      setErrorMessage("Enter a valid latitude between -90 and 90.");
      return;
    }

    if (
      form.lon.trim() === "" ||
      !Number.isFinite(Number(form.lon)) ||
      Number(form.lon) < -180 ||
      Number(form.lon) > 180
    ) {
      setErrorMessage("Enter a valid longitude between -180 and 180.");
      return;
    }

    const defaultDeliveryCharge = Number(
      form.defaultDeliveryCharge
    );

    const minimumOrderAmount = Number(
      form.minimumOrderAmount
    );

    if (
      form.defaultDeliveryCharge.trim() === "" ||
      !Number.isFinite(defaultDeliveryCharge) ||
      defaultDeliveryCharge < 0
    ) {
      setErrorMessage("Default delivery charge must be 0 or greater.");
      return;
    }

    if (
      form.minimumOrderAmount.trim() === "" ||
      !Number.isFinite(minimumOrderAmount) ||
      minimumOrderAmount < 0
    ) {
      setErrorMessage("Minimum order amount must be 0 or greater.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(form.currency)) {
      setErrorMessage("Select a valid currency.");
      return;
    }

    const payload = {
      storeName: form.storeName.trim(),
      storeNotes: form.storeNotes.trim(),
      lat: Number(form.lat),
      lon: Number(form.lon),
      currency: form.currency,
      defaultDeliveryCharge,
      minimumOrderAmount,
    };

    try {
      setSaving(true);

      const response = await axios.put(
        `${API_URL}/store-settings/admin`,
        payload,
        authConfig()
      );

      const data = response.data?.data;

      if (data) {
        setForm({
          storeName: data.storeName ?? "",
          storeNotes: data.storeNotes ?? "",
          lat: String(data.lat ?? ""),
          lon: String(data.lon ?? ""),
          currency: data.currency ?? "PKR",
          defaultDeliveryCharge: String(
            data.defaultDeliveryCharge ?? 0
          ),
          minimumOrderAmount: String(
            data.minimumOrderAmount ?? 0
          ),
        });
      }

      setSuccessMessage(
        response.data?.message ||
          "Store settings saved successfully."
      );
    } catch (error) {
      console.error("Failed to save store settings:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save store settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "24px",
      background: "#f5f6fa",
      color: "#252b36",
      boxSizing: "border-box",
    },
    header: {
      marginBottom: "24px",
    },
    subtitle: {
      color: "#778091",
      margin: "8px 0 0",
      fontSize: "14px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e8eaf0",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: "0 3px 12px rgba(30, 40, 60, 0.04)",
    },
    sectionTitle: {
      margin: "0 0 6px",
      fontSize: "17px",
      fontWeight: 700,
    },
    sectionDescription: {
      color: "#778091",
      fontSize: "13px",
      margin: "0 0 22px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "20px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minWidth: 0,
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#404858",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px 12px",
      border: "1px solid #dce0e8",
      borderRadius: "7px",
      background: "#fff",
      color: "#252b36",
      fontSize: "14px",
      outlineColor: "#f28c28",
    },
    textarea: {
      width: "100%",
      minHeight: "105px",
      boxSizing: "border-box",
      padding: "12px",
      border: "1px solid #dce0e8",
      borderRadius: "7px",
      resize: "vertical",
      fontSize: "14px",
      fontFamily: "inherit",
      outlineColor: "#f28c28",
    },
    hint: {
      fontSize: "12px",
      color: "#858d9b",
      margin: 0,
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: "10px",
      paddingTop: "8px",
    },
    primaryButton: {
      border: "none",
      background: "#f28c28",
      color: "#fff",
      borderRadius: "7px",
      padding: "12px 20px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
    },
    secondaryButton: {
      border: "1px solid #dce0e8",
      background: "#fff",
      color: "#404858",
      borderRadius: "7px",
      padding: "12px 20px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
    },
    message: {
      padding: "12px 14px",
      borderRadius: "7px",
      fontSize: "14px",
      marginBottom: "18px",
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Loading store settings...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "25px" }}>
          Store Settings
        </h2>
        <p style={styles.subtitle}>
          Manage your store information, location and order pricing.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            ...styles.message,
            background: "#fff0f0",
            color: "#b42332",
            border: "1px solid #f5d0d3",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            ...styles.message,
            background: "#edf8f0",
            color: "#267345",
            border: "1px solid #ccebd5",
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSave}>
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Store Information</h3>
          <p style={styles.sectionDescription}>
            Basic details displayed in your grocery app.
          </p>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="storeName">
                Store Name *
              </label>
              <input
                id="storeName"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Fresh Grocery"
                maxLength={100}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="currency">
                Currency *
              </label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                style={styles.input}
                required
              >
                {currencies.map((currency) => (
                  <option
                    key={currency.value}
                    value={currency.value}
                  >
                    {currency.label}
                  </option>
                ))}
              </select>
              <p style={styles.hint}>
                Used for displaying prices and charges.
              </p>
            </div>
          </div>

          <div style={{ ...styles.field, marginTop: "20px" }}>
            <label style={styles.label} htmlFor="storeNotes">
              Store Notes
            </label>
            <textarea
              id="storeNotes"
              name="storeNotes"
              value={form.storeNotes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe your store or delivery information..."
              maxLength={1000}
            />
          </div>
        </section>

        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Store Location</h3>
          <p style={styles.sectionDescription}>
            Coordinates used to calculate distance from your store.
          </p>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="lat">
                Latitude *
              </label>
              <input
                id="lat"
                name="lat"
                type="number"
                value={form.lat}
                onChange={handleChange}
                style={styles.input}
                min="-90"
                max="90"
                step="any"
                placeholder="31.5204"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="lon">
                Longitude *
              </label>
              <input
                id="lon"
                name="lon"
                type="number"
                value={form.lon}
                onChange={handleChange}
                style={styles.input}
                min="-180"
                max="180"
                step="any"
                placeholder="74.3587"
                required
              />
            </div>
          </div>

          <p style={{ ...styles.hint, marginTop: "12px" }}>
            Enter your actual store coordinates, not example coordinates.
          </p>
        </section>

        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Order & Delivery Pricing</h3>
          <p style={styles.sectionDescription}>
            Set the standard delivery charge and minimum order value.
          </p>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label
                style={styles.label}
                htmlFor="defaultDeliveryCharge"
              >
                Default Delivery Charge *
              </label>
              <input
                id="defaultDeliveryCharge"
                name="defaultDeliveryCharge"
                type="number"
                value={form.defaultDeliveryCharge}
                onChange={handleChange}
                style={styles.input}
                min="0"
                step="0.01"
                required
              />
              <p style={styles.hint}>
                Standard delivery fee for an order.
              </p>
            </div>

            <div style={styles.field}>
              <label
                style={styles.label}
                htmlFor="minimumOrderAmount"
              >
                Minimum Order Amount *
              </label>
              <input
                id="minimumOrderAmount"
                name="minimumOrderAmount"
                type="number"
                value={form.minimumOrderAmount}
                onChange={handleChange}
                style={styles.input}
                min="0"
                step="0.01"
                required
              />
              <p style={styles.hint}>
                Lowest order subtotal accepted.
              </p>
            </div>
          </div>
        </section>

        <div style={styles.footer}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>

          <button
            type="submit"
            style={{
              ...styles.primaryButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StoreSettings;
