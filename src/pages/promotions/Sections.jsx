import React, { useEffect, useState } from "react";
import "./Sections.css";

const API_URL = "http://localhost:5000/api";
const IMAGE_URL = "http://localhost:5000";

const emptyForm = {
  nameEn: "",
  nameUr: "",
  description: "",
  isActive: true,
  products: [],
};

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem("token");

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchSections = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/sections`, {
        headers: authHeaders,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load sections");
      }

      setSections(data.data || data.sections || []);
    } catch (error) {
      console.error("Fetch sections error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: authHeaders,
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
    fetchSections();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, products: [] });
    setProductSearch("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setProductSearch("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/sections/${id}`, {
        headers: authHeaders,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load section");
      }

      const section = data.data || data.section;

      if (!section) {
        throw new Error("Section data not found");
      }

      setEditingId(section._id);
      setForm({
        nameEn: section.nameEn || "",
        nameUr: section.nameUr || "",
        description: section.description || "",
        isActive: section.isActive !== false,
        products: (section.products || []).map(
          (item) => item.productId?._id || item.productId
        ),
      });
      setProductSearch("");
      setShowModal(true);
    } catch (error) {
      console.error("Edit section error:", error);
      alert(error.message);
    }
  };

  const addProduct = (productId) => {
    setForm((prev) =>
      prev.products.includes(productId)
        ? prev
        : { ...prev, products: [...prev.products, productId] }
    );
  };

  const removeProduct = (productId) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((id) => id !== productId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nameEn.trim()) {
      alert("English section name is required");
      return;
    }

    if (!form.nameUr.trim()) {
      alert("Urdu section name is required");
      return;
    }

    const payload = {
      nameEn: form.nameEn.trim(),
      nameUr: form.nameUr.trim(),
      description: form.description.trim(),
      isActive: Boolean(form.isActive),
      products: form.products.map((productId) => ({ productId })),
    };

    try {
      setSaving(true);

      const response = await fetch(
        editingId
          ? `${API_URL}/sections/${editingId}`
          : `${API_URL}/sections`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to save section"
        );
      }

      alert(
        editingId
          ? "Section updated successfully"
          : "Section created successfully"
      );

      setSaving(false);
      closeModal();
      await fetchSections();
    } catch (error) {
      console.error("Save section error:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this section?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/sections/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete section");
      }

      alert("Section deleted successfully");
      fetchSections();
    } catch (error) {
      console.error("Delete section error:", error);
      alert(error.message);
    }
  };

  const search = productSearch.toLowerCase().trim();

  const filteredProducts = products.filter(
    (product) =>
      !search ||
      product.nameEn?.toLowerCase().includes(search) ||
      product.nameUr?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search)
  );

  const getProduct = (productId) =>
    products.find((product) => product._id === productId);

  const imageSrc = (image) =>
    `${IMAGE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  return (
    <div
      className="sections-page"
      style={{
        padding: "30px",
        background: "#f5f6f8",
        minHeight: "100vh",
      }}
    >
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Sections</h1>
          <p style={{ color: "#777", marginTop: "5px" }}>
            Create and manage product sections
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openCreateModal}
        >
          + Add Section
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading sections...</div>
        ) : sections.length === 0 ? (
          <div className="empty">No sections found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sections.map((section) => (
                <tr key={section._id}>
                  <td>
                    <div className="deal-name">
                      <strong>{section.nameEn}</strong>
                      <span>{section.nameUr}</span>
                    </div>
                  </td>

                  <td>{section.products?.length || 0}</td>

                  <td>
                    <span
                      className={
                        section.isActive
                          ? "status active"
                          : "status inactive"
                      }
                    >
                      {section.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleEdit(section._id)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(section._id)}
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
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Edit Section" : "Add Section"}</h2>
                <p>Select the products for this section.</p>
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

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="section">
                  <h3>Section Information</h3>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Section Name (English)</label>
                      <input
                        type="text"
                        name="nameEn"
                        value={form.nameEn}
                        onChange={handleChange}
                        placeholder="e.g. Best Sellers"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Section Name (Urdu)</label>
                      <input
                        type="text"
                        name="nameUr"
                        value={form.nameUr}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Section description..."
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

                <div className="section">
                  <h3>Add Products</h3>

                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product by name or SKU..."
                    className="product-search"
                  />

                  <div className="product-list">
                    {filteredProducts.length === 0 ? (
                      <div className="empty-small">No products found.</div>
                    ) : (
                      filteredProducts.slice(0, 20).map((product) => {
                        const selected = form.products.includes(
                          product._id
                        );

                        return (
                          <div
                            className={`product-item ${
                              selected ? "selected" : ""
                            }`}
                            key={product._id}
                          >
                            <div className="product-info">
                              {product.image ? (
                                <img
                                  src={imageSrc(product.image)}
                                  alt={product.nameEn}
                                  className="product-image"
                                />
                              ) : (
                                <div className="product-placeholder">
                                  No Image
                                </div>
                              )}

                              <div>
                                <strong>{product.nameEn}</strong>
                                <span>SKU: {product.sku || "-"}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={
                                selected ? "btn-added" : "btn-add-product"
                              }
                              disabled={selected}
                              onClick={() => addProduct(product._id)}
                            >
                              {selected ? "Added" : "Add"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="section">
                  <h3>
                    Products in Section
                    <span className="count">{form.products.length}</span>
                  </h3>

                  {form.products.length === 0 ? (
                    <div className="empty-products">
                      No products added yet. Search and add products above.
                    </div>
                  ) : (
                    <div className="selected-products">
                      {form.products.map((productId) => {
                        const product = getProduct(productId);

                        if (!product) {
                          return null;
                        }

                        return (
                          <div className="selected-product" key={productId}>
                            <div className="selected-product-info">
                              {product.image ? (
                                <img
                                  src={imageSrc(product.image)}
                                  alt={product.nameEn}
                                  className="selected-image"
                                />
                              ) : (
                                <div className="selected-placeholder">
                                  No Image
                                </div>
                              )}

                              <div>
                                <strong>{product.nameEn}</strong>
                                <span>
                                  Rs.{" "}
                                  {Number(
                                    product.price || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => removeProduct(productId)}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Section"
                    : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
