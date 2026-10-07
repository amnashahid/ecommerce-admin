import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: 0,
  usageLimit: "",
  startDate: "",
  expiryDate: "",
  isActive: true,
};

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // =========================================================
  // AUTH HEADERS
  // =========================================================

  const getAuthHeaders = (includeContentType = false) => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  // =========================================================
  // FORMAT DATE FOR DATETIME LOCAL INPUT
  // =========================================================

  const formatDateTimeForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "";
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // =========================================================
  // LOAD PROMO CODES
  // =========================================================

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/promo-codes`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            "Failed to load promo codes"
        );
      }

      setPromoCodes(
        data.data ||
          data.promoCodes ||
          data.results ||
          []
      );
    } catch (error) {
      console.error("FETCH PROMO CODES ERROR:", error);

      alert(
        error.message ||
          "Failed to load promo codes"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD ON PAGE
  // =========================================================

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingId(null);

    const start = new Date();

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    setForm({
      ...emptyForm,
      startDate: formatDateTimeForInput(start),
      expiryDate: formatDateTimeForInput(expiry),
    });

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
    });
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================================
  // EDIT PROMO CODE
  // =========================================================

  const handleEdit = async (id) => {
    try {
      setSaving(false);

      const response = await fetch(
        `${API_URL}/promo-codes/${id}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            "Failed to load promo code"
        );
      }

      const promo =
        data.data ||
        data.promoCode ||
        data.result;

      if (!promo) {
        throw new Error(
          "Promo code data not found"
        );
      }

      setEditingId(promo._id);

      setForm({
        code: promo.code || "",

        description:
          promo.description || "",

        discountType:
          promo.discountType ||
          "percentage",

        discountValue:
          promo.discountValue !== undefined &&
          promo.discountValue !== null
            ? promo.discountValue
            : "",

        maxDiscount:
          promo.maxDiscount !== undefined &&
          promo.maxDiscount !== null
            ? promo.maxDiscount
            : "",

        minOrderAmount:
          promo.minOrderAmount !== undefined &&
          promo.minOrderAmount !== null
            ? promo.minOrderAmount
            : 0,

        usageLimit:
          promo.usageLimit !== undefined &&
          promo.usageLimit !== null
            ? promo.usageLimit
            : "",

        startDate: promo.startDate
          ? formatDateTimeForInput(
              promo.startDate
            )
          : "",

        expiryDate: promo.expiryDate
          ? formatDateTimeForInput(
              promo.expiryDate
            )
          : "",

        isActive:
          promo.isActive !== false,
      });

      setShowModal(true);
    } catch (error) {
      console.error(
        "EDIT PROMO CODE ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to load promo code"
      );
    }
  };

  // =========================================================
  // SAVE PROMO CODE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    // =======================================================
    // VALIDATION
    // =======================================================

    const code = form.code
      .trim()
      .toUpperCase();

    if (!code) {
      alert("Promo code is required");
      return;
    }

    if (
      !form.discountValue ||
      Number(form.discountValue) <= 0
    ) {
      alert(
        "Discount value must be greater than 0"
      );
      return;
    }

    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      alert(
        "Percentage discount cannot be greater than 100%"
      );
      return;
    }

    if (!form.expiryDate) {
      alert("Expiry date is required");
      return;
    }

    const startDate = form.startDate
      ? new Date(form.startDate)
      : new Date();

    const expiryDate = new Date(
      form.expiryDate
    );

    if (isNaN(startDate.getTime())) {
      alert("Invalid start date");
      return;
    }

    if (isNaN(expiryDate.getTime())) {
      alert("Invalid expiry date");
      return;
    }

    if (expiryDate <= startDate) {
      alert(
        "Expiry date must be after start date"
      );
      return;
    }

    if (
      form.maxDiscount !== "" &&
      Number(form.maxDiscount) < 0
    ) {
      alert(
        "Maximum discount cannot be negative"
      );
      return;
    }

    if (
      form.minOrderAmount !== "" &&
      Number(form.minOrderAmount) < 0
    ) {
      alert(
        "Minimum order amount cannot be negative"
      );
      return;
    }

    if (
      form.usageLimit !== "" &&
      Number(form.usageLimit) < 1
    ) {
      alert(
        "Usage limit must be at least 1"
      );
      return;
    }

    // =======================================================
    // PAYLOAD
    // =======================================================

    const payload = {
      code,

      description:
        form.description.trim(),

      discountType:
        form.discountType,

      discountValue:
        Number(form.discountValue),

      maxDiscount:
        form.discountType ===
          "percentage" &&
        form.maxDiscount !== ""
          ? Number(form.maxDiscount)
          : null,

      minOrderAmount:
        form.minOrderAmount === ""
          ? 0
          : Number(form.minOrderAmount),

      usageLimit:
        form.usageLimit === ""
          ? null
          : Number(form.usageLimit),

      startDate:
        startDate.toISOString(),

      expiryDate:
        expiryDate.toISOString(),

      isActive:
        Boolean(form.isActive),
    };

    console.log(
      "PROMO CODE PAYLOAD:",
      payload
    );

    // =======================================================
    // SAVE
    // =======================================================

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/promo-codes/${editingId}`
        : `${API_URL}/promo-codes`;

      const method = editingId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,

        headers:
          getAuthHeaders(true),

        body: JSON.stringify(
          payload
        ),
      });

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }

      console.log(
        "PROMO CODE RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            "Failed to save promo code"
        );
      }

      alert(
        editingId
          ? "Promo code updated successfully"
          : "Promo code created successfully"
      );

      // Reset
      setShowModal(false);
      setEditingId(null);
      setForm({
        ...emptyForm,
      });

      // Reload
      await fetchPromoCodes();
    } catch (error) {
      console.error(
        "SAVE PROMO CODE ERROR:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while saving promo code"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this promo code?"
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/promo-codes/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            "Failed to delete promo code"
        );
      }

      alert(
        "Promo code deleted successfully"
      );

      await fetchPromoCodes();
    } catch (error) {
      console.error(
        "DELETE PROMO CODE ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to delete promo code"
      );
    }
  };

  // =========================================================
  // TOGGLE STATUS
  // =========================================================

  const handleToggleStatus = async (
    promo
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/promo-codes/${promo._id}`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body: JSON.stringify({
            isActive:
              !promo.isActive,
          }),
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            "Failed to update promo code"
        );
      }

      await fetchPromoCodes();
    } catch (error) {
      console.error(
        "TOGGLE PROMO CODE ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to update promo code"
      );
    }
  };

  // =========================================================
  // EXPIRED
  // =========================================================

  const isExpired = (
    expiryDate
  ) => {
    if (!expiryDate) return false;

    return (
      new Date(expiryDate) <
      new Date()
    );
  };

  // =========================================================
  // USAGE LIMIT
  // =========================================================

  const isUsageLimitReached = (
    promo
  ) => {
    return (
      promo.usageLimit !== null &&
      promo.usageLimit !== undefined &&
      Number(
        promo.usedCount || 0
      ) >=
        Number(
          promo.usageLimit
        )
    );
  };

  // =========================================================
  // DISCOUNT FORMAT
  // =========================================================

  const formatDiscount = (
    promo
  ) => {
    if (
      promo.discountType ===
      "percentage"
    ) {
      return `${promo.discountValue}%`;
    }

    return `Rs. ${Number(
      promo.discountValue || 0
    ).toLocaleString()}`;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="promo-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">

        <div>
          <h1>Promo Codes</h1>

          <p>
            Create and manage promotional
            discount codes
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={
            openCreateModal
          }
        >
          + Add Promo Code
        </button>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="table-container">

        {loading ? (
          <div className="loading">
            Loading promo codes...
          </div>
        ) : promoCodes.length ===
          0 ? (
          <div className="empty">
            No promo codes found.
          </div>
        ) : (
          <table>

            <thead>

              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min. Order</th>
                <th>Usage</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {promoCodes.map(
                (promo) => {

                  const expired =
                    isExpired(
                      promo.expiryDate
                    );

                  const usageLimitReached =
                    isUsageLimitReached(
                      promo
                    );

                  return (
                    <tr
                      key={
                        promo._id
                      }
                    >

                      {/* CODE */}

                      <td>

                        <div className="promo-code-name">

                          <strong>
                            {
                              promo.code
                            }
                          </strong>

                          {promo.description && (
                            <span>
                              {
                                promo.description
                              }
                            </span>
                          )}

                        </div>

                      </td>

                      {/* DISCOUNT */}

                      <td>

                        <div className="discount-value">

                          <strong>
                            {formatDiscount(
                              promo
                            )}
                          </strong>

                          {promo.discountType ===
                            "percentage" &&
                            promo.maxDiscount !==
                              null &&
                            promo.maxDiscount !==
                              undefined && (
                              <span>
                                Max Rs.{" "}
                                {Number(
                                  promo.maxDiscount
                                ).toLocaleString()}
                              </span>
                            )}

                        </div>

                      </td>

                      {/* MIN ORDER */}

                      <td>
                        Rs.{" "}
                        {Number(
                          promo.minOrderAmount ||
                            0
                        ).toLocaleString()}
                      </td>

                      {/* USAGE */}

                      <td>

                        {Number(
                          promo.usedCount ||
                            0
                        )}

                        {" / "}

                        {promo.usageLimit !==
                          null &&
                        promo.usageLimit !==
                          undefined
                          ? promo.usageLimit
                          : "Unlimited"}

                      </td>

                      {/* START */}

                      <td>
                        {promo.startDate
                          ? new Date(
                              promo.startDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* EXPIRY */}

                      <td>
                        {promo.expiryDate
                          ? new Date(
                              promo.expiryDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* STATUS */}

                      <td>

                        {expired ? (
                          <span className="status expired">
                            Expired
                          </span>
                        ) : usageLimitReached ? (
                          <span className="status expired">
                            Limit Reached
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`status ${
                              promo.isActive
                                ? "active"
                                : "inactive"
                            }`}
                            onClick={() =>
                              handleToggleStatus(
                                promo
                              )
                            }
                          >
                            {promo.isActive
                              ? "Active"
                              : "Inactive"}
                          </button>
                        )}

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() =>
                            handleEdit(
                              promo._id
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() =>
                            handleDelete(
                              promo._id
                            )
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>
        )}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div
            className="modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Promo Code"
                    : "Add Promo Code"}
                </h2>

                <p>
                  Create a discount code
                  for your customers.
                </p>

              </div>

              <button
                type="button"
                className="close-btn"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="modal-body">

                {/* =================================================
                    BASIC INFORMATION
                ================================================= */}

                <div className="section">

                  <h3>
                    Promo Code Information
                  </h3>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Promo Code *
                      </label>

                      <input
                        type="text"
                        name="code"
                        value={
                          form.code
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. SAVE20"
                        style={{
                          textTransform:
                            "uppercase",
                        }}
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        name="description"
                        value={
                          form.description
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="20% off your order"
                      />

                    </div>

                  </div>

                </div>

                {/* =================================================
                    DISCOUNT
                ================================================= */}

                <div className="section">

                  <h3>
                    Discount
                  </h3>

                  <div className="form-grid">

                    {/* TYPE */}

                    <div className="form-group">

                      <label>
                        Discount Type *
                      </label>

                      <select
                        name="discountType"
                        value={
                          form.discountType
                        }
                        onChange={
                          handleChange
                        }
                      >

                        <option value="percentage">
                          Percentage
                        </option>

                        <option value="fixed">
                          Fixed Amount
                        </option>

                      </select>

                    </div>

                    {/* VALUE */}

                    <div className="form-group">

                      <label>
                        Discount Value *
                      </label>

                      <div className="input-with-suffix">

                        <input
                          type="number"
                          name="discountValue"
                          value={
                            form.discountValue
                          }
                          onChange={
                            handleChange
                          }
                          min="0"
                          max={
                            form.discountType ===
                            "percentage"
                              ? "100"
                              : undefined
                          }
                          step="0.01"
                          placeholder={
                            form.discountType ===
                            "percentage"
                              ? "20"
                              : "300"
                          }
                          required
                        />

                        <span>
                          {form.discountType ===
                          "percentage"
                            ? "%"
                            : "Rs."}
                        </span>

                      </div>

                    </div>

                    {/* MAX DISCOUNT */}

                    {form.discountType ===
                      "percentage" && (

                      <div className="form-group">

                        <label>
                          Maximum Discount
                        </label>

                        <div className="input-with-prefix">

                          <span>
                            Rs.
                          </span>

                          <input
                            type="number"
                            name="maxDiscount"
                            value={
                              form.maxDiscount
                            }
                            onChange={
                              handleChange
                            }
                            min="0"
                            step="0.01"
                            placeholder="500"
                          />

                        </div>

                        <small>
                          Leave empty for
                          unlimited
                        </small>

                      </div>

                    )}

                    {/* MINIMUM ORDER */}

                    <div className="form-group">

                      <label>
                        Minimum Order Amount
                      </label>

                      <div className="input-with-prefix">

                        <span>
                          Rs.
                        </span>

                        <input
                          type="number"
                          name="minOrderAmount"
                          value={
                            form.minOrderAmount
                          }
                          onChange={
                            handleChange
                          }
                          min="0"
                          step="0.01"
                          placeholder="1000"
                        />

                      </div>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    USAGE
                ================================================= */}

                <div className="section">

                  <h3>
                    Usage & Validity
                  </h3>

                  <div className="form-grid">

                    {/* USAGE */}

                    <div className="form-group">

                      <label>
                        Usage Limit
                      </label>

                      <input
                        type="number"
                        name="usageLimit"
                        value={
                          form.usageLimit
                        }
                        onChange={
                          handleChange
                        }
                        min="1"
                        placeholder="100"
                      />

                      <small>
                        Leave empty for
                        unlimited usage
                      </small>

                    </div>

                    {/* START */}

                    <div className="form-group">

                      <label>
                        Start Date
                      </label>

                      <input
                        type="datetime-local"
                        name="startDate"
                        value={
                          form.startDate
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                    {/* EXPIRY */}

                    <div className="form-group">

                      <label>
                        Expiry Date *
                      </label>

                      <input
                        type="datetime-local"
                        name="expiryDate"
                        value={
                          form.expiryDate
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>

                    {/* ACTIVE */}

                    <div className="form-group checkbox-group">

                      <label>

                        <input
                          type="checkbox"
                          name="isActive"
                          checked={
                            form.isActive
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <span>
                          Active
                        </span>

                      </label>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    PREVIEW
                ================================================= */}

                <div className="section">

                  <h3>
                    Discount Preview
                  </h3>

                  <div className="promo-preview">

                    <div className="preview-code">

                      {form.code
                        ? form.code.toUpperCase()
                        : "PROMO CODE"}

                    </div>

                    <div className="preview-details">

                      <strong>

                        {form.discountValue
                          ? form.discountType ===
                            "percentage"
                            ? `${form.discountValue}% OFF`
                            : `Rs. ${Number(
                                form.discountValue
                              ).toLocaleString()} OFF`
                          : "Discount"}

                      </strong>

                      <span>

                        {form.minOrderAmount
                          ? `Minimum order Rs. ${Number(
                              form.minOrderAmount
                            ).toLocaleString()}`
                          : "No minimum order"}

                      </span>

                    </div>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary save-btn"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Promo Code"
                    : "Save Promo Code"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .promo-page {
          padding: 24px;
          background: #f5f6f8;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 20px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          color: #222;
        }

        .page-header p {
          margin: 5px 0 0;
          color: #777;
        }

        .btn-primary {
          border: none;
          background: #f97316;
          color: white;
          padding: 11px 20px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .btn-primary:hover {
          background: #ea580c;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .table-container {
          background: white;
          border-radius: 10px;
          overflow-x: auto;
          box-shadow: 0 1px 5px rgba(0,0,0,0.08);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        th {
          text-align: left;
          padding: 15px;
          background: #fafafa;
          border-bottom: 1px solid #eee;
          font-size: 13px;
          color: #555;
          white-space: nowrap;
        }

        td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
          vertical-align: middle;
        }

        .promo-code-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .promo-code-name strong {
          color: #f97316;
          font-size: 15px;
          letter-spacing: 0.5px;
        }

        .promo-code-name span {
          color: #777;
          font-size: 12px;
        }

        .discount-value {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .discount-value strong {
          font-size: 15px;
        }

        .discount-value span {
          font-size: 11px;
          color: #777;
        }

        .status {
          display: inline-block;
          border: none;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .status.active {
          background: #dcfce7;
          color: #166534;
        }

        .status.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .status.expired {
          background: #f3f4f6;
          color: #6b7280;
          cursor: default;
        }

        .btn-edit,
        .btn-delete {
          border: none;
          padding: 7px 12px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 6px;
          font-size: 13px;
        }

        .btn-edit {
          background: #fff7ed;
          color: #ea580c;
        }

        .btn-edit:hover {
          background: #ffedd5;
        }

        .btn-delete {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-delete:hover {
          background: #fecaca;
        }

        .loading,
        .empty {
          padding: 50px;
          text-align: center;
          color: #777;
        }

        /* =====================================================
           MODAL
        ===================================================== */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          z-index: 9999;
        }

        .modal {
          width: 100%;
          max-width: 850px;
          max-height: 92vh;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-shrink: 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 21px;
          color: #222;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #777;
          font-size: 13px;
        }

        .close-btn {
          border: none;
          background: transparent;
          font-size: 28px;
          cursor: pointer;
          color: #777;
          line-height: 1;
        }

        .close-btn:hover {
          color: #222;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 25px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section h3 {
          margin: 0 0 15px;
          font-size: 16px;
          color: #333;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #444;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          background: white;
          color: #222;
          color-scheme: light;
        }

        .form-group input,
        .form-group select {
          height: 42px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.08);
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #888;
          font-size: 11px;
        }

        /* =====================================================
           PREFIX / SUFFIX
        ===================================================== */

        .input-with-suffix,
        .input-with-prefix {
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          height: 42px;
          background: white;
        }

        .input-with-suffix:focus-within,
        .input-with-prefix:focus-within {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.08);
        }

        .input-with-suffix input,
        .input-with-prefix input {
          border: none;
          border-radius: 0;
          height: 40px;
          flex: 1;
          min-width: 0;
        }

        .input-with-suffix input:focus,
        .input-with-prefix input:focus {
          border: none;
          outline: none;
          box-shadow: none;
        }

        .input-with-suffix span,
        .input-with-prefix span {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 12px;
          background: #f8f8f8;
          color: #777;
          font-size: 13px;
          flex-shrink: 0;
        }

        /* =====================================================
           CHECKBOX
        ===================================================== */

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          cursor: pointer;
        }

        .checkbox-group input {
          width: 16px;
          height: 16px;
          margin: 0;
          cursor: pointer;
          accent-color: #f97316;
        }

        /* =====================================================
           PREVIEW
        ===================================================== */

        .promo-preview {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 18px;
          border: 1px dashed #f97316;
          border-radius: 10px;
          background: #fff7ed;
        }

        .preview-code {
          padding: 12px 18px;
          background: #f97316;
          color: white;
          border-radius: 7px;
          font-weight: 700;
          letter-spacing: 1px;
          font-size: 16px;
        }

        .preview-details {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .preview-details strong {
          font-size: 17px;
          color: #222;
        }

        .preview-details span {
          color: #777;
          font-size: 12px;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid #eee;
          flex-shrink: 0;
        }

        .btn-secondary {
          border: 1px solid #ddd;
          background: white;
          color: #555;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: #f8f8f8;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .save-btn {
          min-width: 150px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .promo-page {
            padding: 15px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-header h1 {
            font-size: 23px;
          }

          .page-header .btn-primary {
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .promo-preview {
            flex-direction: column;
            align-items: flex-start;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal {
            max-height: 96vh;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .modal-footer {
            flex-direction: column-reverse;
          }

          .modal-footer button {
            width: 100%;
          }

        }

      `}</style>

    </div>
  );
}