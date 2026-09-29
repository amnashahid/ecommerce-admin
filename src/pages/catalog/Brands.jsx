
import { useEffect, useState } from "react";
import axios from "axios";
import "./Brands.css";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  nameEn: "",
  nameUr: "",
  isActive: true,
  image: null,
};

function Brands() {
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);

  const [search, setSearch] = useState("");

  // ------------------------------------
  // JWT
  // ------------------------------------

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ------------------------------------
  // Axios headers
  // ------------------------------------

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // ------------------------------------
  // GET ALL BRANDS
  // ------------------------------------

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/brands`,
        authConfig()
      );
      setBrands(response.data.data || response.data);
      setSuccess("Brands loaded successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load brands."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // ------------------------------------
  // SEARCH
  // ------------------------------------

  const filteredBrands = brands.filter((brand) => {
    const value = search.toLowerCase();

    return (
      brand.name.en?.toLowerCase().includes(value) ||
      brand.name.ur?.includes(search)
    );
  });

  // ------------------------------------
  // OPEN ADD
  // ------------------------------------

  const openAdd = () => {
    setEditingBrand(null);

    setForm({
      nameEn: "",
      nameUr: "",
      isActive: true,
      image: null,
    });

    setImagePreview(null);
    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ------------------------------------
  // OPEN EDIT
  // ------------------------------------

  const openEdit = (brand) => {
    setEditingBrand(brand);

    setForm({
      nameEn: brand.name.en || "",
      nameUr: brand.name.ur || "",
      isActive: brand.isActive ?? true,
      image: null,
    });

    setImagePreview(
        brand.image ||
        null
    );

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ------------------------------------
  // CLOSE MODAL
  // ------------------------------------

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBrand(null);
    setForm(initialForm);
    setImagePreview(null);
    setError("");
  };

  // ------------------------------------
  // INPUT CHANGE
  // ------------------------------------

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = e.target;

    if (type === "file") {
      const file = files?.[0];

      setForm((prev) => ({
        ...prev,
        image: file || null,
      }));

      if (file) {
        setImagePreview(
          URL.createObjectURL(file)
        );
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ------------------------------------
  // CREATE / UPDATE
  // ------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.nameEn.trim()) {
      setError(
        "English brand name is required."
      );
      return;
    }

    if (!form.nameUr.trim()) {
      setError(
        "Urdu brand name is required."
      );
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();

      data.append(
        "nameEn",
        form.nameEn
      );

      data.append(
        "nameUr",
        form.nameUr
      );

      data.append(
        "isActive",
        form.isActive
          ? "true"
          : "false"
      );

      if (form.image) {
        data.append(
          "image",
          form.image
        );
      }
      if (editingBrand) {
        await axios.put(
          `${API_URL}/brands/${editingBrand._id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        setSuccess(
          "Brand updated successfully."
        );
      } else {
        await axios.post(
          `${API_URL}/brands`,
          data,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        setSuccess(
          "Brand created successfully."
        );
      }

      await loadBrands();

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to save brand."
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------
  // DELETE
  // ------------------------------------

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.name.en}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(
        `${API_URL}/brands/${brand._id}`,
        authConfig()
      );

      await loadBrands();

      setSuccess(
        "Brand deleted successfully."
      );

      setTimeout(
        () => setSuccess(""),
        2000
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to delete brand."
      );
    }
  };

  return (
    <div className="brands-page">

      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <div className="page-header">

        <div>
          <h1>Brands</h1>

          <p>
            Manage your store brands
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAdd}
        >
          + Add Brand
        </button>

      </div>

      {/* -------------------------------- */}
      {/* MESSAGES */}
      {/* -------------------------------- */}

      {error && !showModal && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && !showModal && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* -------------------------------- */}
      {/* SEARCH */}
      {/* -------------------------------- */}

      <div className="toolbar">

        <input
          type="text"
          placeholder="Search brands..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="search-input"
        />

        <span className="brand-count">
          {filteredBrands.length} brands
        </span>

      </div>

      {/* -------------------------------- */}
      {/* TABLE */}
      {/* -------------------------------- */}

      <div className="table-container">

        <table>

          <thead>
            <tr>

              <th>Image</th>

              <th>English Name</th>

              <th>Urdu Name</th>

              <th>Status</th>

              <th className="actions-column">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="empty"
                >
                  Loading brands...
                </td>
              </tr>
            ) : filteredBrands.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="empty"
                >
                  No brands found.
                </td>
              </tr>
            ) : (
              filteredBrands.map(
                (brand) => (
                  <tr key={brand._id}>

                    {/* IMAGE */}

                    <td>
                      {
                      brand.image ? (
                        <img
                          src={`${
                           BASE_URL +    brand.image
                          }`}
                          alt={
                            brand.name.en
                          }
                          className="brand-image"

  style={{ width: "100px", height: "100px" }}
  onLoad={() => console.log("IMAGE LOADED")}
  onError={(e) => console.log("IMAGE ERROR", e)}
                        />
                      ) : (
                        <div className="no-image">
                          No Image
                        </div>
                      )}

                    </td>

                    {/* ENGLISH */}

                    <td>
                      <strong>
                        {brand.name.en}
                      </strong>
                    </td>

                    {/* URDU */}

                    <td
                      dir="rtl"
                      className="urdu"
                    >
                      {brand.name.ur}
                    </td>

                    {/* STATUS */}

                    <td>

                      {brand.isActive ? (
                        <span className="badge active">
                          Active
                        </span>
                      ) : (
                        <span className="badge inactive">
                          Inactive
                        </span>
                      )}

                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="actions">

                        <button
                          className="btn btn-edit"
                          onClick={() =>
                            openEdit(brand)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-delete"
                          onClick={() =>
                            handleDelete(
                              brand
                            )
                          }
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

      {/* -------------------------------- */}
      {/* MODAL */}
      {/* -------------------------------- */}

      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            {/* HEADER */}

            <div className="modal-header">

              <h2>
                {editingBrand
                  ? "Edit Brand"
                  : "Add Brand"}
              </h2>

              <button
                className="close-button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="brand-form"
            >

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  {success}
                </div>
              )}

              {/* ENGLISH */}

              <div className="form-group">

                <label>
                  Brand Name (English)
                </label>

                <input
                  type="text"
                  name="nameEn"
                  value={
                    form.nameEn
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Nestle"
                />

              </div>

              {/* URDU */}

              <div className="form-group">

                <label>
                  Brand Name (Urdu)
                </label>

                <input
                  type="text"
                  name="nameUr"
                  value={
                    form.nameUr
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="مثلاً نیسلے"
                  dir="rtl"
                />

              </div>

              {/* IMAGE */}

              <div className="form-group">

                <label>
                  Brand Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* PREVIEW */}

              {imagePreview && (
                <div className="preview">

                  <label>
                    Image Preview
                  </label>

                  <img
                    src={`${
                           BASE_URL +  imagePreview
                          }`}
                    alt="Preview"
                  />

                </div>
              )}

              {/* ACTIVE */}

              <div className="checkbox-group">

                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    form.isActive
                  }
                  onChange={
                    handleChange
                  }
                  id="isActive"
                />

                <label htmlFor="isActive">
                  Active
                </label>

              </div>

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBrand
                    ? "Update Brand"
                    : "Create Brand"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Brands;

