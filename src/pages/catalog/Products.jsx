
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;
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

  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ----------------------------------------------------
  // Load data
  // ----------------------------------------------------

  useEffect(() => {
    loadCategories();
    loadBrands();
    loadProducts();
  }, []);

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  }); 
  
  const getToken = () => {
    return localStorage.getItem("token");
  };
  const loadProducts = async () => {
    try {
      setLoading(true);

      const params = {};

      if (search) {
        params.search = search;
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
        }
      );

      setProducts(response.data.data || []);
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
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setImage(file);

    setImagePreview(URL.createObjectURL(file));
  };

  // ----------------------------------------------------
  // Category / Subcategory
  // ----------------------------------------------------

  const parentCategories = categories.filter(
    (category) =>
      !category.parentCategoryId ||
      category.parentCategoryId === 0 ||
      category.parentCategoryId === "0"
  );

  const subCategories = categories.filter(
    (category) =>
      category.parentCategoryId &&
      category.parentCategoryId.toString() ===
        form.categoryId?.toString()
  );

  const handleCategoryChange = (e) => {
    setForm((previous) => ({
      ...previous,
      categoryId: e.target.value,
      subCategoryId: "",
    }));
  };

  // ----------------------------------------------------
  // Submit
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

      data.append(
        "isFeatured",
        form.isFeatured
      );

      data.append(
        "isActive",
        form.isActive
      );

      data.append(
        "categoryId",
        form.categoryId
      );

      if (form.subCategoryId) {
        data.append(
          "subCategoryId",
          form.subCategoryId
        );
      }

      if (form.brandId) {
        data.append(
          "brandId",
          form.brandId
        );
      }

      if (form.sku) {
        data.append("sku", form.sku);
      }

      data.append(
        "stockQuantity",
        form.stockQuantity
      );

      data.append("unit", form.unit);

      data.append(
        "sortOrder",
        form.sortOrder
      );

      if (image) {
        data.append("image", image);
      }

      if (editingId) {
        await axios.put(
          `${API_URL}/products/${editingId}`,
          data,
          axiosConfig
        );

        alert("Product updated successfully");
      } else {
        await axios.post(
          `${API_URL}/products`,
          data,
          axiosConfig
        );

        alert("Product created successfully");
      }

      resetForm();
      await loadProducts();
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
  // Edit
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
      isActive:
        product.isActive !== false,
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
        "",
      sku: product.sku || "",
      stockQuantity:
        product.stockQuantity ?? 0,
      unit: product.unit || "piece",
      sortOrder:
        product.sortOrder ?? 0,
    });

    setImage(null);

    if (product.image) {
      setImagePreview(
        product.image.startsWith("http")
          ? product.image
          : `${BASE_URL}${product.image}`
      );
    } else {
      setImagePreview(null);
    }

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------------------------
  // Delete
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
        axiosConfig
      );

      alert("Product deleted successfully");

      loadProducts();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    }
  };

  // ----------------------------------------------------
  // Reset
  // ----------------------------------------------------

  const resetForm = () => {
    setForm(emptyForm);

    setEditingId(null);

    setImage(null);
    setImagePreview(null);

    setShowForm(false);
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            Products
          </h1>

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

      {/* Form */}

      {showForm && (
        <div style={cardStyle}>
          <h2>
            {editingId
              ? "Edit Product"
              : "Add Product"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              {/* English name */}

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

              {/* Urdu */}

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

              {/* Brand */}

              <div>
                <label>Brand</label>

                <select
                  name="brandId"
                  value={form.brandId}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select Brand
                  </option>

                  {brands.map((brand) => (
                    <option
                      key={brand._id}
                      value={brand._id}
                    >
                      {brand.name.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}

              <div>
                <label>Category</label>

                <select
                  value={form.categoryId}
                  onChange={handleCategoryChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select Category
                  </option>

                  {parentCategories.map(
                    (category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.nameEn}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Subcategory */}

              <div>
                <label>Sub Category</label>

                <select
                  name="subCategoryId"
                  value={form.subCategoryId}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!form.categoryId}
                >
                  <option value="">
                    Select Sub Category
                  </option>

                  {subCategories.map(
                    (category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.nameEn}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SKU */}

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

              {/* Price */}

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

              {/* Sale price */}

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

              {/* Stock */}

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

              {/* Unit */}

              <div>
                <label>Unit</label>

                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="piece">
                    Piece
                  </option>

                  <option value="kg">
                    Kg
                  </option>

                  <option value="gram">
                    Gram
                  </option>

                  <option value="liter">
                    Liter
                  </option>

                  <option value="ml">
                    ML
                  </option>

                  <option value="pack">
                    Pack
                  </option>

                  <option value="box">
                    Box
                  </option>

                  <option value="dozen">
                    Dozen
                  </option>
                </select>
              </div>

              {/* Sort order */}

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

              {/* Image */}

              <div>
                <label>Product Image</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    marginTop: "8px",
                  }}
                />

                {imagePreview && (
                  <div
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border:
                          "1px solid #ddd",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Description */}

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label>
                  Description
                </label>

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

              {/* Featured */}

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={
                      form.isFeatured
                    }
                    onChange={handleChange}
                  />

                  Featured Product
                </label>
              </div>

              {/* Active */}

              <div>
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

                  Active
                </label>
              </div>
            </div>

            {/* Buttons */}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "25px",
              }}
            >
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr auto",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={inputStyle}
          />

          <select
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Categories
            </option>

            {parentCategories.map(
              (category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.nameEn}
                </option>
              )
            )}
          </select>

          <select
            value={filterBrand}
            onChange={(e) =>
              setFilterBrand(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              All Brands
            </option>

            {brands.map((brand) => (
              <option
                key={brand._id}
                value={brand._id}
              >
                {brand.name.en}
              </option>
            ))}
          </select>

          <button
            onClick={loadProducts}
            style={buttonStyle}
          >
            Search
          </button>
        </div>
      </div>

      {/* Products table */}

      <div style={cardStyle}>
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#f1f2f4",
                }}
              >
                <th style={thStyle}>
                  Image
                </th>

                <th style={thStyle}>
                  Product
                </th>

                <th style={thStyle}>
                  Brand
                </th>

                <th style={thStyle}>
                  Category
                </th>

                <th style={thStyle}>
                  Price
                </th>

                <th style={thStyle}>
                  Stock
                </th>

                <th style={thStyle}>
                  Featured
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
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        "center",
                      padding: "40px",
                      color: "#777",
                    }}
                  >
                    {loading
                      ? "Loading..."
                      : "No products found"}
                  </td>
                </tr>
              ) : (
                products.map(
                  (product) => (
                    <tr
                      key={
                        product._id
                      }
                    >
                      <td
                        style={tdStyle}
                      >
                        {product.image ? (
                          <img
                            src={
                             `${BASE_URL}${product.image}`
                            }
                            alt={
                              product.nameEn
                            }
                            style={{
                              width:
                                "55px",
                              height:
                                "55px",
                              objectFit:
                                "cover",
                              borderRadius:
                                "6px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width:
                                "55px",
                              height:
                                "55px",
                              background:
                                "#eee",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius:
                                "6px",
                              color:
                                "#999",
                            }}
                          >
                            No image
                          </div>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <strong>
                          {
                            product.nameEn
                          }
                        </strong>

                        <div
                          style={{
                            color:
                              "#777",
                            fontSize:
                              "13px",
                            direction:
                              "rtl",
                          }}
                        >
                          {
                            product.nameUr
                          }
                        </div>

                        {product.sku && (
                          <small
                            style={{
                              color:
                                "#999",
                            }}
                          >
                            SKU:{" "}
                            {
                              product.sku
                            }
                          </small>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {
                          brands.findLast(x=>x._id ===  product
                            .brandId
                            ?._id )?.name.en||
                          "-"
                        }
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {
                          product
                            .categoryId
                            ?.nameEn ||
                          "-"
                        }

                        {product.subCategoryId && (
                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#777",
                            }}
                          >
                            {
                              product
                                .subCategoryId
                                ?.nameEn
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <strong>
                          Rs.{" "}
                          {product.price}
                        </strong>

                        {product.salePrice && (
                          <div
                            style={{
                              color:
                                "#e74c3c",
                              fontSize:
                                "13px",
                            }}
                          >
                            Sale: Rs.{" "}
                            {
                              product.salePrice
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {
                          product.stockQuantity
                        }{" "}
                        {
                          product.unit
                        }
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {product.isFeatured ? (
                          <span
                            style={{
                              ...badgeStyle,
                              background:
                                "#fff3cd",
                              color:
                                "#856404",
                            }}
                          >
                            Yes
                          </span>
                        ) : (
                          "No"
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {product.isActive ? (
                          <span
                            style={{
                              ...badgeStyle,
                              background:
                                "#d4edda",
                              color:
                                "#155724",
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              ...badgeStyle,
                              background:
                                "#f8d7da",
                              color:
                                "#721c24",
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "6px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                            style={{
                              ...smallButton,
                              background:
                                "#3498db",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                product._id
                              )
                            }
                            style={{
                              ...smallButton,
                              background:
                                "#e74c3c",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
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
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.06)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, 1fr)",
  gap: "18px",
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

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom:
    "1px solid #ddd",
  fontSize: "13px",
};

const tdStyle = {
  padding: "12px",
  borderBottom:
    "1px solid #eee",
  fontSize: "14px",
};

const badgeStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
};

const smallButton = {
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

export default Products;
