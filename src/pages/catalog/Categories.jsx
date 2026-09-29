import { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;


const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    nameEn: "",
    nameUr: "",
    parentCategoryId: "0",
    isActive: true,
    sortOrder: 0,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ============================================
  // GET CATEGORIES
  // ============================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/categories`,
        axiosConfig
      );
      setCategories(response.data.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ============================================
  // MAIN CATEGORIES
  // ============================================

  const mainCategories = categories.filter(
    (category) => !category.parentCategoryId
  );

  // ============================================
  // GET SUBCATEGORIES
  // ============================================

  const getSubCategories = (parentId) => {
    return categories.filter(
      (category) =>
        category.parentCategoryId?._id === parentId ||
        category.parentCategoryId === parentId
    );
  };

  const toggleSubcategories = (categoryId) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryId]: !previous[categoryId],
    }));
  };

  // ============================================
  // OPEN ADD MODAL
  // ============================================

  const handleAdd = (parentCategoryId = "0") => {
    setEditingCategory(null);

    setForm({
      nameEn: "",
      nameUr: "",
      parentCategoryId,
      isActive: true,
      sortOrder: 0,
      image: null,
    });

    setImagePreview(null);
    setShowModal(true);
  };

  // ============================================
  // OPEN EDIT MODAL
  // ============================================

  const handleEdit = (category) => {
    setEditingCategory(category);

    setForm({
      nameEn: category.nameEn || "",
      nameUr: category.nameUr || "",
      parentCategoryId:
        category.parentCategoryId?._id ||
        category.parentCategoryId ||
        "0",
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
      image: null,
    });

    setImagePreview(category.image || null);

    setShowModal(true);
  };

  // ============================================
  // FORM CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];

      setForm((prev) => ({
        ...prev,
        image: file,
      }));

      if (file) {
        setImagePreview(URL.createObjectURL(file));
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================================
  // SAVE
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("nameEn", form.nameEn);
      data.append("nameUr", form.nameUr);
      data.append(
        "parentCategoryId",
        form.parentCategoryId
      );
      data.append("isActive", form.isActive);
      data.append("sortOrder", form.sortOrder);

      if (form.image) {
        data.append("image", form.image);
      }
      
      if (editingCategory) {
        await axios.put(
          `${API_URL}/categories/${editingCategory._id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert("Category updated successfully");
      } else {
        await axios.post(
          `${API_URL}/categories`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,"Content-Type":
                "multipart/form-data",
            },
          }
        );

        alert("Category created successfully");
      }

      setShowModal(false);

      fetchCategories();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save category"
      );
    }
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.nameEn}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_URL}/categories/${category._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Category deleted successfully");

      fetchCategories();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete category"
      );
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="categories-page">
      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Categories</h1>

          <p>
            Manage your store categories and subcategories
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => handleAdd()}
        >
          + Add Category
        </button>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="loading">
          Loading categories...
        </div>
      )}

      {/* CATEGORY LIST */}

      {!loading && mainCategories.length === 0 && (
        <div className="empty-state">
          <h3>No categories found</h3>

          <p>
            Create your first category to get started.
          </p>

          <button
            className="btn-primary"
            onClick={() => handleAdd()}
          >
            + Add Category
          </button>
        </div>
      )}

      {!loading && mainCategories.length > 0 && (
        <div className="category-list">

          {mainCategories.map((category) => {

            const subCategories =
              getSubCategories(category._id);

            return (
              <div
                className="category-card"
                key={category._id}
              >

                {/* MAIN CATEGORY */}

                <div className="category-row">

                  <div className="category-info">

                    {category.image ? (
                      <img
                        src={`${BASE_URL}${category.image}`}
                        alt={category.nameEn}
                        className="category-image"
                      />
                    ) : (
                      <div className="category-image-placeholder">
                        📁
                      </div>
                    )}

                    <div>

                      <h3>
                        {category.nameEn}
                      </h3>

                      <div className="urdu-name">
                        {category.nameUr}
                      </div>

                      <span
                        className={
                          category.isActive
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                  </div>

                  <div className="category-actions">

                    <button
                      className="btn-small btn-add"
                      onClick={() =>
                        handleAdd(category._id)
                      }
                    >
                      + Subcategory
                    </button>

                    <button
                      className="btn-small btn-edit"
                      onClick={() =>
                        handleEdit(category)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="btn-small btn-delete"
                      onClick={() =>
                        handleDelete(category)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

                {/* SUBCATEGORIES */}

                <div className="subcategories">
                  <button
                    type="button"
                    className="subcategories-heading"
                    aria-expanded={Boolean(expandedCategories[category._id])}
                    aria-controls={`subcategory-table-${category._id}`}
                    onClick={() => toggleSubcategories(category._id)}
                  >
                    <span className="subcategories-title">Subcategories</span>
                    <span className="subcategories-count">{subCategories.length}</span>
                    <span className="subcategories-chevron" aria-hidden="true" />
                  </button>

                  {expandedCategories[category._id] && (
                    <div
                      className="subcategory-table-wrap"
                      id={`subcategory-table-${category._id}`}
                    >
                    <table className="subcategory-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>English Name</th>
                          <th>Urdu Name</th>
                          <th>Sort Order</th>
                          <th>Status</th>
                          <th className="subcategory-actions-heading">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subCategories.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="subcategory-empty">
                              No subcategories yet. Add one from this category's actions.
                            </td>
                          </tr>
                        ) : (
                          subCategories.map((subCategory) => (
                            <tr key={subCategory._id}>
                              <td>
                                {subCategory.image ? (
                                  <img
                                    src={`${BASE_URL}${subCategory.image}`}
                                    alt={subCategory.nameEn}
                                    className="subcategory-image"
                                  />
                                ) : (
                                  <div className="subcategory-image-placeholder">
                                    No image
                                  </div>
                                )}
                              </td>
                              <td><strong>{subCategory.nameEn}</strong></td>
                              <td className="subcategory-urdu" dir="rtl">
                                {subCategory.nameUr}
                              </td>
                              <td>{subCategory.sortOrder ?? 0}</td>
                              <td>
                                <span className={subCategory.isActive ? "status active" : "status inactive"}>
                                  {subCategory.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <div className="category-actions">
                                  <button
                                    className="btn-small btn-edit"
                                    onClick={() => handleEdit(subCategory)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn-small btn-delete"
                                    onClick={() => handleDelete(subCategory)}
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
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* MODAL */}

      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : form.parentCategoryId !== "0"
                    ? "Add Subcategory"
                    : "Add Category"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* ENGLISH NAME */}

              <div className="form-group">

                <label>
                  English Name
                </label>

                <input
                  type="text"
                  name="nameEn"
                  value={form.nameEn}
                  onChange={handleChange}
                  placeholder="e.g. Beverages"
                  required
                />

              </div>

              {/* URDU NAME */}

              <div className="form-group">

                <label>
                  Urdu Name
                </label>

                <input
                  type="text"
                  name="nameUr"
                  value={form.nameUr}
                  onChange={handleChange}
                  placeholder="مثلاً مشروبات"
                  dir="rtl"
                  required
                />

              </div>

              {/* PARENT CATEGORY */}

              <div className="form-group">

                <label>
                  Parent Category
                </label>

                <select
                  name="parentCategoryId"
                  value={form.parentCategoryId}
                  onChange={handleChange}
                >

                  <option value="0">
                    Main Category
                  </option>

                  {mainCategories.map(
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

              {/* SORT ORDER */}

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

              {/* IMAGE */}

              <div className="form-group">

                <label>
                  Image
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                />

              </div>

              {/* IMAGE PREVIEW */}

              {imagePreview && (
                <div className="image-preview">

                  <img
                    src={imagePreview}
                    alt="Preview"
                  />

                </div>
              )}

              {/* ACTIVE */}

              <div className="checkbox-group">

                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />

                <label htmlFor="isActive">
                  Active
                </label>

              </div>

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCategory
                    ? "Update"
                    : "Create"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Categories;