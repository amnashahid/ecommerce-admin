import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";
const IMAGE_URL = "http://localhost:5000";

const emptyForm = {
  nameEn: "",
  nameUr: "",
  description: "",
  isActive: true,
  startDate: "",
  endDate: "",
  sortOrder: 0,
  products: [],
};

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem("token");

  // =========================================================
  // LOAD DEALS
  // =========================================================

  const fetchDeals = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/deals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load deals");
      }

      setDeals(data.data || data.deals || []);
    } catch (error) {
      console.error("Fetch deals error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load products");
      }

      setProducts(data.data || data.products || []);
    } catch (error) {
      console.error("Fetch products error:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      products: [],
    });

    setProductSearch("");
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setProductSearch("");
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================================
  // EDIT DEAL
  // =========================================================

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/deals/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load deal");
      }

      const deal = data.data || data.deal;

      if (!deal) {
        throw new Error("Deal data not found");
      }

      const dealProducts = (deal.products || []).map((item) => {
        const productId =
          item.productId?._id ||
          item.productId?.id ||
          item.productId;

        return {
          productId: productId,
          quantity: item.quantity || 1,
          dealPrice:
            item.dealPrice !== undefined
              ? item.dealPrice
              : 0,
        };
      });

      setEditingId(deal._id);

      setForm({
        nameEn: deal.nameEn || "",
        nameUr: deal.nameUr || "",
        description: deal.description || "",
        isActive: deal.isActive !== false,
        startDate: deal.startDate
          ? formatDateForInput(deal.startDate)
          : "",
        endDate: deal.endDate
          ? formatDateForInput(deal.endDate)
          : "",
        sortOrder: deal.sortOrder || 0,
        products: dealProducts,
      });

      setProductSearch("");
      setShowModal(true);
    } catch (error) {
      console.error("Edit deal error:", error);
      alert(error.message);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDateForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "";
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const addProduct = (product) => {
    const productId = product._id;

    const alreadyExists = form.products.some(
      (item) => item.productId === productId
    );

    if (alreadyExists) {
      alert("This product is already added to the deal");
      return;
    }

    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: productId,
          quantity: 1,
          dealPrice: product.price || 0,
        },
      ],
    }));
  };

  // =========================================================
  // REMOVE PRODUCT
  // =========================================================

  const removeProduct = (productId) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter(
        (item) => item.productId !== productId
      ),
    }));
  };

  // =========================================================
  // UPDATE PRODUCT QUANTITY
  // =========================================================

  const updateQuantity = (productId, value) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: value,
            }
          : item
      ),
    }));
  };

  // =========================================================
  // UPDATE DEAL PRICE
  // =========================================================

  const updateDealPrice = (productId, value) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((item) =>
        item.productId === productId
          ? {
              ...item,
              dealPrice: value,
            }
          : item
      ),
    }));
  };

  // =========================================================
  // SAVE DEAL
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SAVE DEAL CLICKED");

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!form.nameEn.trim()) {
      alert("English deal name is required");
      return;
    }

    if (!form.nameUr.trim()) {
      alert("Urdu deal name is required");
      return;
    }

    if (form.products.length === 0) {
      alert("Please add at least one product");
      return;
    }

    for (const item of form.products) {
      if (!item.productId) {
        alert("Invalid product selected");
        return;
      }

      if (
        item.quantity === "" ||
        Number(item.quantity) < 1
      ) {
        alert("Product quantity must be at least 1");
        return;
      }

      if (
        item.dealPrice === "" ||
        item.dealPrice === null ||
        item.dealPrice === undefined ||
        Number(item.dealPrice) < 0
      ) {
        alert("Please enter a valid deal price");
        return;
      }
    }

    // -------------------------
    // PAYLOAD
    // -------------------------

    const payload = {
      nameEn: form.nameEn.trim(),
      nameUr: form.nameUr.trim(),
      description: form.description.trim(),

      isActive: Boolean(form.isActive),

      startDate: form.startDate
        ? form.startDate
        : null,

      endDate: form.endDate
        ? form.endDate
        : null,

      sortOrder: Number(form.sortOrder) || 0,

      products: form.products.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        dealPrice: Number(item.dealPrice),
      })),
    };

    console.log("Sending payload:");
    console.log(payload);

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/deals/${editingId}`
        : `${API_URL}/deals`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to save deal"
        );
      }

      alert(
        editingId
          ? "Deal updated successfully"
          : "Deal created successfully"
      );

      closeModal();

      await fetchDeals();
    } catch (error) {
      console.error("SAVE DEAL ERROR:", error);

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE DEAL
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this deal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/deals/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete deal"
        );
      }

      alert("Deal deleted successfully");

      fetchDeals();
    } catch (error) {
      console.error("Delete deal error:", error);
      alert(error.message);
    }
  };

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts = products.filter((product) => {
    const search = productSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      product.nameEn
        ?.toLowerCase()
        .includes(search) ||
      product.nameUr
        ?.toLowerCase()
        .includes(search) ||
      product.sku
        ?.toLowerCase()
        .includes(search)
    );
  });

  // =========================================================
  // GET PRODUCT
  // =========================================================

  const getProduct = (productId) => {
    return products.find(
      (product) => product._id === productId
    );
  };

  // =========================================================
  // CALCULATE TOTALS
  // =========================================================

  const calculateNormalTotal = () => {
    return form.products.reduce((total, item) => {
      const product = getProduct(item.productId);

      if (!product) {
        return total;
      }

      return (
        total +
        Number(product.price || 0) *
          Number(item.quantity || 0)
      );
    }, 0);
  };

  const calculateDealTotal = () => {
    return form.products.reduce((total, item) => {
      return (
        total +
        Number(item.dealPrice || 0) *
          Number(item.quantity || 0)
      );
    }, 0);
  };

  const normalTotal = calculateNormalTotal();
  const dealTotal = calculateDealTotal();
  const savings = normalTotal - dealTotal;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="deals-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">
        <div>
          <h1>Deals</h1>
          <p>Create and manage product deals</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openCreateModal}
        >
          + Add Deal
        </button>
      </div>

      {/* =====================================================
          DEALS TABLE
      ===================================================== */}

      <div className="table-container">

        {loading ? (
          <div className="loading">
            Loading deals...
          </div>
        ) : deals.length === 0 ? (
          <div className="empty">
            No deals found.
          </div>
        ) : (
          <table>

            <thead>
              <tr>
                <th>Name</th>
                <th>Products</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {deals.map((deal) => (
                <tr key={deal._id}>

                  <td>
                    <div className="deal-name">
                      <strong>
                        {deal.nameEn}
                      </strong>

                      <span>
                        {deal.nameUr}
                      </span>
                    </div>
                  </td>

                  <td>
                    {deal.products?.length || 0}
                  </td>

                  <td>
                    {deal.isActive ? (
                      <span className="status active">
                        Active
                      </span>
                    ) : (
                      <span className="status inactive">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td>
                    {deal.startDate
                      ? new Date(
                          deal.startDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {deal.endDate
                      ? new Date(
                          deal.endDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {deal.sortOrder || 0}
                  </td>

                  <td>

                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() =>
                        handleEdit(deal._id)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() =>
                        handleDelete(deal._id)
                      }
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

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
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

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="modal-header">

              <div>
                <h2>
                  {editingId
                    ? "Edit Deal"
                    : "Add Deal"}
                </h2>

                <p>
                  Select products and configure
                  the deal.
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleSubmit}>

              <div className="modal-body">

                {/* =============================================
                    DEAL INFORMATION
                ============================================= */}

                <div className="section">

                  <h3>Deal Information</h3>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Deal Name (English)
                      </label>

                      <input
                        type="text"
                        name="nameEn"
                        value={form.nameEn}
                        onChange={handleChange}
                        placeholder="e.g. Family Grocery Deal"
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Deal Name (Urdu)
                      </label>

                      <input
                        type="text"
                        name="nameUr"
                        value={form.nameUr}
                        onChange={handleChange}
                        placeholder="مثلاً فیملی گروسری ڈیل"
                        required
                      />

                    </div>

                  </div>

                  <div className="form-group">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Deal description..."
                    />

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Start Date
                      </label>

                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        End Date
                      </label>

                      <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Sort Order
                      </label>

                      <input
                        type="number"
                        name="sortOrder"
                        value={form.sortOrder}
                        onChange={handleChange}
                        min="0"
                      />

                    </div>

                    <div className="form-group checkbox-group">

                      <label>

                        <input
                          type="checkbox"
                          name="isActive"
                          checked={form.isActive}
                          onChange={handleChange}
                        />

                        Active

                      </label>

                    </div>

                  </div>

                </div>

                {/* =============================================
                    PRODUCT SEARCH
                ============================================= */}

                <div className="section">

                  <h3>
                    Add Products
                  </h3>

                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) =>
                      setProductSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search product by name or SKU..."
                    className="product-search"
                  />

                  <div className="product-list">

                    {filteredProducts.length ===
                    0 ? (
                      <div className="empty-small">
                        No products found.
                      </div>
                    ) : (
                      filteredProducts
                        .slice(0, 20)
                        .map((product) => {

                          const selected =
                            form.products.some(
                              (item) =>
                                item.productId ===
                                product._id
                            );

                          return (
                            <div
                              className={`product-item ${
                                selected
                                  ? "selected"
                                  : ""
                              }`}
                              key={product._id}
                            >

                              <div className="product-info">

                                {product.image ? (
                                  <img
                                    src={`${IMAGE_URL}${product.image.startsWith("/") ? "" : "/"}${product.image}`}
                                    alt={
                                      product.nameEn
                                    }
                                    className="product-image"
                                  />
                                ) : (
                                  <div className="product-placeholder">
                                    No Image
                                  </div>
                                )}

                                <div>

                                  <strong>
                                    {
                                      product.nameEn
                                    }
                                  </strong>

                                  <span>
                                    SKU:{" "}
                                    {product.sku ||
                                      "-"}
                                  </span>

                                  <span>
                                    Rs.{" "}
                                    {Number(
                                      product.price ||
                                        0
                                    ).toLocaleString()}
                                  </span>

                                </div>

                              </div>

                              <button
                                type="button"
                                className={
                                  selected
                                    ? "btn-added"
                                    : "btn-add-product"
                                }
                                disabled={selected}
                                onClick={() =>
                                  addProduct(
                                    product
                                  )
                                }
                              >
                                {selected
                                  ? "Added"
                                  : "Add"}
                              </button>

                            </div>
                          );
                        })
                    )}

                  </div>

                </div>

                {/* =============================================
                    SELECTED PRODUCTS
                ============================================= */}

                <div className="section">

                  <h3>
                    Products in Deal
                    <span className="count">
                      {form.products.length}
                    </span>
                  </h3>

                  {form.products.length ===
                  0 ? (
                    <div className="empty-products">
                      No products added yet.
                      Search and add products
                      above.
                    </div>
                  ) : (

                    <div className="selected-products">

                      {form.products.map(
                        (item) => {

                          const product =
                            getProduct(
                              item.productId
                            );

                          if (!product) {
                            return null;
                          }

                          return (
                            <div
                              className="selected-product"
                              key={
                                item.productId
                              }
                            >

                              <div className="selected-product-info">

                                {product.image ? (
                                  <img
                                    src={`${IMAGE_URL}${product.image.startsWith("/") ? "" : "/"}${product.image}`}
                                    alt={
                                      product.nameEn
                                    }
                                    className="selected-image"
                                  />
                                ) : (
                                  <div className="selected-placeholder">
                                    No Image
                                  </div>
                                )}

                                <div>

                                  <strong>
                                    {
                                      product.nameEn
                                    }
                                  </strong>

                                  <span>
                                    Normal Price:
                                    {" "}
                                    Rs.{" "}
                                    {Number(
                                      product.price ||
                                        0
                                    ).toLocaleString()}
                                  </span>

                                </div>

                              </div>

                              <div className="product-input">

                                <label>
                                  Qty
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(e) =>
                                    updateQuantity(
                                      item.productId,
                                      e.target.value
                                    )
                                  }
                                />

                              </div>

                              <div className="product-input">

                                <label>
                                  Deal Price
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.dealPrice
                                  }
                                  onChange={(e) =>
                                    updateDealPrice(
                                      item.productId,
                                      e.target.value
                                    )
                                  }
                                />

                              </div>

                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() =>
                                  removeProduct(
                                    item.productId
                                  )
                                }
                              >
                                ×
                              </button>

                            </div>
                          );
                        }
                      )}

                    </div>

                  )}

                </div>

                {/* =============================================
                    TOTALS
                ============================================= */}

                {form.products.length >
                  0 && (
                  <div className="totals">

                    <div>
                      <span>
                        Normal Total
                      </span>

                      <strong>
                        Rs.{" "}
                        {normalTotal.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Deal Total
                      </span>

                      <strong>
                        Rs.{" "}
                        {dealTotal.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Savings
                      </span>

                      <strong>
                        Rs.{" "}
                        {savings.toLocaleString()}
                      </strong>
                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
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
                    ? "Update Deal"
                    : "Save Deal"}
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

        .deals-page {
          padding: 24px;
          background: #f5f6f8;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
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
          overflow: auto;
          box-shadow: 0 1px 5px rgba(0,0,0,0.08);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 15px;
          background: #fafafa;
          border-bottom: 1px solid #eee;
          font-size: 13px;
          color: #555;
        }

        td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }

        .deal-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .deal-name span {
          color: #777;
        }

        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.active {
          background: #dcfce7;
          color: #166534;
        }

        .status.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-edit,
        .btn-delete {
          border: none;
          padding: 7px 12px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 6px;
        }

        .btn-edit {
          background: #fff7ed;
          color: #ea580c;
        }

        .btn-delete {
          background: #fee2e2;
          color: #dc2626;
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
          max-width: 950px;
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

        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 25px;
        }

        .section h3 {
          margin: 0 0 15px;
          font-size: 16px;
          color: #333;
        }

        .count {
          display: inline-flex;
          margin-left: 8px;
          background: #f97316;
          color: white;
          border-radius: 20px;
          padding: 2px 8px;
          font-size: 11px;
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
        .form-group textarea,
        .product-search {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .product-search:focus {
          border-color: #f97316;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .checkbox-group input {
          width: auto;
        }

        /* =====================================================
           PRODUCT LIST
        ===================================================== */

        .product-search {
          margin-bottom: 12px;
        }

        .product-list {
          max-height: 250px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 8px;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .product-item:last-child {
          border-bottom: none;
        }

        .product-item.selected {
          background: #fff7ed;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-info > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .product-info span {
          font-size: 12px;
          color: #777;
        }

        .product-image,
        .product-placeholder {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
          background: #eee;
        }

        .product-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #888;
        }

        .btn-add-product {
          border: none;
          background: #f97316;
          color: white;
          padding: 7px 14px;
          border-radius: 5px;
          cursor: pointer;
        }

        .btn-added {
          border: none;
          background: #ddd;
          color: #777;
          padding: 7px 14px;
          border-radius: 5px;
        }

        /* =====================================================
           SELECTED PRODUCTS
        ===================================================== */

        .selected-products {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .selected-product {
          display: grid;
          grid-template-columns: 1fr 100px 130px 35px;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 8px;
        }

        .selected-product-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .selected-product-info > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .selected-product-info span {
          font-size: 12px;
          color: #777;
        }

        .selected-image,
        .selected-placeholder {
          width: 45px;
          height: 45px;
          object-fit: cover;
          border-radius: 6px;
          background: #eee;
        }

        .selected-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }

        .product-input label {
          display: block;
          font-size: 11px;
          color: #777;
          margin-bottom: 4px;
        }

        .product-input input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }

        .remove-btn {
          border: none;
          background: #fee2e2;
          color: #dc2626;
          width: 30px;
          height: 30px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 18px;
        }

        .empty-products {
          padding: 25px;
          text-align: center;
          border: 1px dashed #ddd;
          color: #888;
          border-radius: 8px;
        }

        .empty-small {
          padding: 20px;
          text-align: center;
          color: #888;
        }

        /* =====================================================
           TOTALS
        ===================================================== */

        .totals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #fafafa;
          padding: 15px;
          border-radius: 8px;
        }

        .totals div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .totals span {
          color: #777;
          font-size: 12px;
        }

        .totals strong {
          font-size: 16px;
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
        }

        .save-btn {
          min-width: 120px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .deals-page {
            padding: 15px;
          }

          .page-header {
            align-items: flex-start;
            gap: 15px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .selected-product {
            grid-template-columns: 1fr;
          }

          .totals {
            grid-template-columns: 1fr;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal {
            max-height: 96vh;
          }

        }

      `}</style>

    </div>
  );
}