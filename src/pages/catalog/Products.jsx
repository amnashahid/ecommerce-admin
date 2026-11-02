
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL , BASE_URL } from "../../services/api";

const emptyForm = {
  nameEn: "",
  nameUr: "",
  description: "",
  price: "",
  salePrice: "",
  isFeatured: false,
  isActive: true,
  categoryId: "",
  subCategoryId: "",
  brandId: "",
  sku: "",
  stockQuantity: 0,
  unit: "piece",
  sortOrder: 0,
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ----------------------------------------------------
  // Axios configuration
  // ----------------------------------------------------

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ----------------------------------------------------
  // Load initial data
  // ----------------------------------------------------

  useEffect(() => {
    loadCategories();
    loadBrands();
    loadProducts(1);
  }, []);

  // ----------------------------------------------------
  // Load products with server-side pagination
  // ----------------------------------------------------

  const loadProducts = async (
    page = pagination.page,
    limit = pagination.limit
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterCategory) {
        params.categoryId = filterCategory;
      }

      if (filterBrand) {
        params.brandId = filterBrand;
      }

      const response = await axios.get(
        `${API_URL}/products`,
        {
          params,
          ...getConfig(),
        }
      );

      setProducts(response.data.data || []);

      const paginationData = response.data.pagination || {};

      setPagination({
        page: paginationData.page ?? page,
        limit: paginationData.limit ?? limit,
        total: paginationData.total ?? 0,
        totalPages: paginationData.totalPages ?? 0,
      });

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Load categories
  // ----------------------------------------------------

  const loadCategories = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/categories`,
        getConfig()
      );

      setCategories(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // Load brands
  // ----------------------------------------------------

  const loadBrands = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/brands`,
        getConfig()
      );

      setBrands(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // Form helpers
  // ----------------------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(URL.createObjectURL(file));
  };

  // ----------------------------------------------------
  // Category / Subcategory
  // ----------------------------------------------------

  const getParentId = (category) =>
    String(category.parentCategoryId?._id ?? category.parentCategoryId ?? "");

  const parentCategories = categories.filter((category) => {
    const parentId = getParentId(category);
    return !parentId || parentId === "0";
  });

  const subCategories = categories.filter(
    (category) =>
      getParentId(category) !== "" &&
      getParentId(category) !== "0" &&
      getParentId(category) === String(form.categoryId || "")
  );

  const handleCategoryChange = (e) => {
    setForm((previous) => ({
      ...previous,
      categoryId: e.target.value,
      subCategoryId: "",
    }));
  };

  // ----------------------------------------------------
  // Submit product
  // ----------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nameEn.trim()) {
      alert("English product name is required");
      return;
    }

    if (!form.nameUr.trim()) {
      alert("Urdu product name is required");
      return;
    }

    if (!form.price) {
      alert("Price is required");
      return;
    }

    if (!form.categoryId) {
      alert("Category is required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("nameEn", form.nameEn);
      data.append("nameUr", form.nameUr);
      data.append("description", form.description);
      data.append("price", form.price);

      if (form.salePrice !== "") {
        data.append("salePrice", form.salePrice);
      }

      data.append("isFeatured", form.isFeatured);
      data.append("isActive", form.isActive);
      data.append("categoryId", form.categoryId);

      if (form.subCategoryId || editingId) {
        data.append("subCategoryId", form.subCategoryId || "");
      }

      if (form.brandId || editingId) {
        data.append("brandId", form.brandId || "");
      }

      if (form.sku) {
        data.append("sku", form.sku);
      }

      data.append("stockQuantity", form.stockQuantity);
      data.append("unit", form.unit);
      data.append("sortOrder", form.sortOrder);

      if (image) {
        data.append("image", image);
      }

      if (editingId) {
        await axios.put(
          `${API_URL}/products/${editingId}`,
          data,
          getConfig()
        );

        alert("Product updated successfully");
      } else {
        await axios.post(
          `${API_URL}/products`,
          data,
          getConfig()
        );

        alert("Product created successfully");
      }

      resetForm();

      await loadProducts(1);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to save product"
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Edit product
  // ----------------------------------------------------

  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      nameEn: product.nameEn || "",
      nameUr: product.nameUr || "",
      description: product.description || "",
      price: product.price ?? "",
      salePrice: product.salePrice ?? "",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,

      categoryId:
        product.categoryId?._id ||
        product.categoryId ||
        "",

      subCategoryId:
        product.subCategoryId?._id ||
        product.subCategoryId ||
        "",

      brandId:
        product.brandId?._id ||
        product.brandId ||
        product.brand?._id ||
        product.brand ||
        "",

      sku: product.sku || "",
      stockQuantity: product.stockQuantity ?? 0,
      unit: product.unit || "piece",
      sortOrder: product.sortOrder ?? 0,
    });

    setImage(null);

    setImagePreview(
      product.image
        ? product.image.startsWith("http")
          ? product.image
          : `${BASE_URL}${product.image}`
        : null
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------------------------
  // Delete product
  // ----------------------------------------------------

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/products/${id}`,
        getConfig()
      );

      alert("Product deleted successfully");

      // Reload current page. If it became empty,
      // go to the previous page.
      const nextPage =
        products.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadProducts(nextPage);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to delete product"
      );
    }
  };

  // ----------------------------------------------------
  // Reset form
  // ----------------------------------------------------

  const resetForm = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setImage(null);
    setImagePreview(null);
    setShowForm(false);
  };

  // ----------------------------------------------------
  // Pagination handlers
  // ----------------------------------------------------

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      loading
    ) {
      return;
    }

    loadProducts(page);
  };

  const handleLimitChange = (e) => {
    const limit = Number(e.target.value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
      limit,
    }));

    loadProducts(1, limit);
  };

  const handleSearch = () => {
    loadProducts(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === "category") {
      setFilterCategory(value);
    } else {
      setFilterBrand(value);
    }
  };

  // ----------------------------------------------------
  // Pagination page numbers
  // ----------------------------------------------------

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      end = 5;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 4;
    }

    const pages = [];

    if (start > 1) {
      pages.push(1);

      if (start > 2) {
        pages.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (
    <div
      style={{
        padding: "30px",
        background: "#f5f6f8",
        minHeight: "100vh",
      }}
    >
      {/* Header */}

      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>

          <p style={{ color: "#777" }}>
            Manage your store products
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={buttonStyle}
        >
          + Add Product
        </button>
      </div>

      {/* Product Form */}

      {showForm && (
        <div style={cardStyle}>
          <h2>
            {editingId ? "Edit Product" : "Add Product"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>

              <div>
                <label>Product Name (English)</label>
                <input
                  type="text"
                  name="nameEn"
                  value={form.nameEn}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Product Name (Urdu)</label>
                <input
                  type="text"
                  name="nameUr"
                  value={form.nameUr}
                  onChange={handleChange}
                  placeholder="پروڈکٹ کا نام"
                  dir="rtl"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Brand</label>
                <select
                  name="brandId"
                  value={form.brandId}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select Brand</option>

                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name?.en || brand.name || "Unnamed"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Category</label>
                <select
                  value={form.categoryId}
                  onChange={handleCategoryChange}
                  style={inputStyle}
                >
                  <option value="">Select Category</option>

                  {parentCategories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Sub Category</label>
                <select
                  name="subCategoryId"
                  value={form.subCategoryId}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!form.categoryId}
                >
                  <option value="">Select Sub Category</option>

                  {subCategories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g. PROD-001"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Price</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Sale Price</label>
                <input
                  type="number"
                  name="salePrice"
                  value={form.salePrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={form.stockQuantity}
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Unit</label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="ml">ML</option>
                  <option value="pack">Pack</option>
                  <option value="box">Box</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>

              <div>
                <label>Sort Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  value={form.sortOrder}
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </div>

              <div>
                <label>Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginTop: "8px" }}
                />

                {imagePreview && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={`${BASE_URL}/${imagePreview}`}
                      alt="Preview"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Product description"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={handleChange}
                  />
                  Featured Product
                </label>
              </div>

              <div>
                <label style={checkboxLabelStyle}>
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

            <div style={formButtonContainerStyle}>
              <button
                type="submit"
                disabled={loading}
                style={buttonStyle}
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Create Product"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}

      <div style={cardStyle}>
        <div style={filterGridStyle}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={inputStyle}
          />

          <select
            value={filterCategory}
            onChange={(e) =>
              handleFilterChange("category", e.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Categories</option>

            {parentCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.nameEn}
              </option>
            ))}
          </select>

          <select
            value={filterBrand}
            onChange={(e) =>
              handleFilterChange("brand", e.target.value)
            }
            style={inputStyle}
          >
            <option value="">All Brands</option>

            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name?.en || brand.name || "Unnamed"}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={buttonStyle}
          >
            Search
          </button>
        </div>
      </div>

      {/* Products Table */}

      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f1f2f4" }}>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Brand</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Featured</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" style={emptyTableStyle}>
                    {loading ? "Loading..." : "No products found"}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td style={tdStyle}>
                      {product.image ? (
                        <img
                          src={
                            product.image.startsWith("http")
                              ? product.image
                              : `${BASE_URL}${product.image}`
                          }
                          alt={product.nameEn}
                          style={productImageStyle}
                        />
                      ) : (
                        <div style={noImageStyle}>
                          No image
                        </div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <strong>{product.nameEn}</strong>

                      <div style={urduNameStyle}>
                        {product.nameUr}
                      </div>

                      {product.sku && (
                        <small style={{ color: "#999" }}>
                          SKU: {product.sku}
                        </small>
                      )}
                    </td>

                    <td style={tdStyle}>
                      {product.brandId?.name?.en ||
                        product.brandId?.name ||
                        "-"}
                    </td>

                    <td style={tdStyle}>
                      {product.categoryId?.nameEn || "-"}

                      {product.subCategoryId && (
                        <div style={subCategoryStyle}>
                          {product.subCategoryId?.nameEn || ""}
                        </div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <strong>Rs. {product.price}</strong>

                      {product.salePrice != null &&
                        product.salePrice !== "" && (
                          <div style={salePriceStyle}>
                            Sale: Rs. {product.salePrice}
                          </div>
                        )}
                    </td>

                    <td style={tdStyle}>
                      {product.stockQuantity} {product.unit}
                    </td>

                    <td style={tdStyle}>
                      {product.isFeatured ? (
                        <span style={featuredBadgeStyle}>Yes</span>
                      ) : (
                        "No"
                      )}
                    </td>

                    <td style={tdStyle}>
                      {product.isActive ? (
                        <span style={activeBadgeStyle}>
                          Active
                        </span>
                      ) : (
                        <span style={inactiveBadgeStyle}>
                          Inactive
                        </span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div style={actionContainerStyle}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={{
                            ...smallButtonStyle,
                            background: "#3498db",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product._id)}
                          style={{
                            ...smallButtonStyle,
                            background: "#e74c3c",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}

        <div style={paginationContainerStyle}>

          <div style={paginationInfoStyle}>
            Showing{" "}
            {pagination.total === 0
              ? 0
              : (pagination.page - 1) * pagination.limit + 1}
            {" - "}
            {Math.min(
              pagination.page * pagination.limit,
              pagination.total
            )}
            {" of "}
            {pagination.total} products
          </div>

          <div style={pageSizeStyle}>
            <label>Rows:</label>

            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              style={pageSizeSelectStyle}
              disabled={loading}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div style={paginationButtonsStyle}>

            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => handlePageChange(1)}
              style={paginationButtonStyle(
                false,
                pagination.page <= 1 || loading
              )}
            >
              First
            </button>

            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                handlePageChange(pagination.page - 1)
              }
              style={paginationButtonStyle(
                false,
                pagination.page <= 1 || loading
              )}
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  style={{ padding: "8px 4px" }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  disabled={loading}
                  onClick={() => handlePageChange(page)}
                  style={paginationButtonStyle(
                    pagination.page === page,
                    loading
                  )}
                >
                  {page}
                </button>
              )
            )}

            <button
              disabled={
                pagination.page >= pagination.totalPages ||
                loading
              }
              onClick={() =>
                handlePageChange(pagination.page + 1)
              }
              style={paginationButtonStyle(
                false,
                pagination.page >= pagination.totalPages || loading
              )}
            >
              Next
            </button>

            <button
              disabled={
                pagination.page >= pagination.totalPages ||
                loading
              }
              onClick={() =>
                handlePageChange(pagination.totalPages)
              }
              style={paginationButtonStyle(
                false,
                pagination.page >= pagination.totalPages || loading
              )}
            >
              Last
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Styles
// ----------------------------------------------------

const cardStyle = {
  background: "#fff",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
  gap: "15px",
  flexWrap: "wrap",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "18px",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr auto",
  gap: "12px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  marginTop: "6px",
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

const formButtonContainerStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "25px",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  fontSize: "14px",
};

const emptyTableStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#777",
};

const productImageStyle = {
  width: "55px",
  height: "55px",
  objectFit: "cover",
  borderRadius: "6px",
};

const noImageStyle = {
  width: "55px",
  height: "55px",
  background: "#eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
  color: "#999",
  fontSize: "11px",
};

const urduNameStyle = {
  color: "#777",
  fontSize: "13px",
  direction: "rtl",
};

const subCategoryStyle = {
  fontSize: "12px",
  color: "#777",
};

const salePriceStyle = {
  color: "#e74c3c",
  fontSize: "13px",
};

const featuredBadgeStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
  background: "#fff3cd",
  color: "#856404",
};

const activeBadgeStyle = {
  ...featuredBadgeStyle,
  background: "#d4edda",
  color: "#155724",
};

const inactiveBadgeStyle = {
  ...featuredBadgeStyle,
  background: "#f8d7da",
  color: "#721c24",
};

const actionContainerStyle = {
  display: "flex",
  gap: "6px",
};

const smallButtonStyle = {
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const paginationContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "15px",
  marginTop: "20px",
  paddingTop: "18px",
  borderTop: "1px solid #eee",
};

const paginationInfoStyle = {
  color: "#666",
  fontSize: "14px",
};

const pageSizeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#666",
  fontSize: "14px",
};

const pageSizeSelectStyle = {
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "5px",
  background: "#fff",
};

const paginationButtonsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "5px",
};

const paginationButtonStyle = (active, disabled) => ({
  padding: "8px 11px",
  borderRadius: "5px",
  border: active ? "1px solid #f28c28" : "1px solid #ddd",
  background: active ? "#f28c28" : "#fff",
  color: active ? "#fff" : "#333",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "13px",
  fontWeight: active ? "600" : "500",
  opacity: disabled ? 0.5 : 1,
});

export default Products;
