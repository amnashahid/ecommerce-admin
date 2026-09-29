
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL =  import.meta.env.VITE_API_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;

const emptyForm = {
  index: "",
  title: "",
  link: "",
  isActive: true,
};

const Banners = () => {
  const [banners, setBanners] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ============================================
  // LOAD BANNERS
  // ============================================

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/banners`
      );

      setBanners(response.data.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load banners"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FORM CHANGE
  // ============================================

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

  // ============================================
  // IMAGE CHANGE
  // ============================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate image
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );

      e.target.value = "";
      return;
    }

    // 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size cannot exceed 5 MB"
      );

      e.target.value = "";
      return;
    }

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  // ============================================
  // CREATE / UPDATE
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.index) {
      alert("Banner index is required");
      return;
    }

    const index = Number(form.index);

    if (
      !Number.isInteger(index) ||
      index < 1
    ) {
      alert(
        "Banner index must be a positive integer"
      );
      return;
    }

    // Image is required for new banner
    if (!editingId && !image) {
      alert("Banner image is required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("index", index);
      data.append("title", form.title);
      data.append("link", form.link);
      data.append(
        "isActive",
        form.isActive
      );

      if (image) {
        data.append("image", image);
      }

      if (editingId) {
        await axios.put(
          `${API_URL}/banners/${editingId}`,
          data,
          authConfig
        );

        alert(
          "Banner updated successfully"
        );
      } else {
        await axios.post(
          `${API_URL}/banners`,
          data,
          authConfig
        );

        alert(
          "Banner created successfully"
        );
      }

      resetForm();
      await loadBanners();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save banner"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EDIT
  // ============================================

  const handleEdit = (banner) => {
    setEditingId(banner._id);

    setForm({
      index: banner.index || "",
      title: banner.title || "",
      link: banner.link || "",
      isActive:
        banner.isActive !== false,
    });

    setImage(null);

    if (banner.image) {
      setImagePreview(
        banner.image.startsWith("http")
          ? banner.image
          : `${BASE_URL}${banner.image}`
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

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this banner?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(
        `${API_URL}/banners/${id}`,
        authConfig
      );

      alert(
        "Banner deleted successfully"
      );

      await loadBanners();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete banner"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESET FORM
  // ============================================

  const resetForm = () => {
    setForm(emptyForm);

    setImage(null);
    setImagePreview(null);

    setEditingId(null);

    setShowForm(false);
  };

  // ============================================
  // IMAGE URL
  // ============================================

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `${BASE_URL}${image}`;
  };

  // ============================================
  // UI
  // ============================================

  return (
    <div
      style={{
        padding: "30px",
        background: "#f5f6f8",
        minHeight: "100vh",
      }}
    >
      {/* ========================================
          HEADER
      ======================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Banners
          </h1>

          <p
            style={{
              color: "#777",
              marginTop: "5px",
            }}
          >
            Manage your store banners
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={buttonStyle}
        >
          + Add Banner
        </button>
      </div>

      {/* ========================================
          FORM
      ======================================== */}

      {showForm && (
        <div style={cardStyle}>
          <h2>
            {editingId
              ? "Edit Banner"
              : "Add Banner"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* INDEX */}

              <div>
                <label>
                  Display Position / Index
                </label>

                <input
                  type="number"
                  name="index"
                  min="1"
                  value={form.index}
                  onChange={handleChange}
                  placeholder="1"
                  style={inputStyle}
                />

                <small
                  style={{
                    color: "#777",
                  }}
                >
                  1 = first banner, 2 = second
                  banner, etc.
                </small>
              </div>

              {/* TITLE */}

              <div>
                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Banner title"
                  style={inputStyle}
                />
              </div>

              {/* LINK */}

              <div>
                <label>
                  Link
                </label>

                <input
                  type="text"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  placeholder="/products"
                  style={inputStyle}
                />

                <small
                  style={{
                    color: "#777",
                  }}
                >
                  Optional. Example:
                  /products/sale
                </small>
              </div>

              {/* IMAGE */}

              <div>
                <label>
                  Banner Image
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{
                    display: "block",
                    marginTop: "8px",
                  }}
                />

                <small
                  style={{
                    color: "#777",
                  }}
                >
                  JPG, PNG or WEBP. Max 5 MB.
                </small>
              </div>

              {/* ACTIVE */}

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      form.isActive
                    }
                    onChange={handleChange}
                  />

                  Active
                </label>
              </div>
            </div>

            {/* IMAGE PREVIEW */}

            {imagePreview && (
              <div
                style={{
                  marginTop: "25px",
                }}
              >
                <label>
                  Preview
                </label>

                <div
                  style={{
                    marginTop: "8px",
                    background: "#eee",
                    borderRadius: "8px",
                    padding: "10px",
                    maxWidth: "700px",
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    style={{
                      width: "100%",
                      maxHeight: "250px",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* BUTTONS */}

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
                  ? "Update Banner"
                  : "Create Banner"}
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

      {/* ========================================
          BANNERS
      ======================================== */}

      <div style={cardStyle}>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Banner List
        </h2>

        {loading && banners.length === 0 ? (
          <p>Loading...</p>
        ) : banners.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#777",
            }}
          >
            No banners found.
          </div>
        ) : (
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
                    Index
                  </th>

                  <th style={thStyle}>
                    Banner
                  </th>

                  <th style={thStyle}>
                    Title
                  </th>

                  <th style={thStyle}>
                    Link
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
                {banners.map(
                  (banner) => (
                    <tr
                      key={
                        banner._id
                      }
                    >
                      {/* INDEX */}

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                          fontWeight:
                            "bold",
                          fontSize:
                            "18px",
                        }}
                      >
                        {banner.index}
                      </td>

                      {/* IMAGE */}

                      <td style={tdStyle}>
                        {banner.image ? (
                          <img
                            src={getImageUrl(
                              banner.image
                            )}
                            alt={
                              banner.title ||
                              "Banner"
                            }
                            style={{
                              width:
                                "220px",
                              height:
                                "90px",
                              objectFit:
                                "cover",
                              borderRadius:
                                "6px",
                              border:
                                "1px solid #ddd",
                            }}
                          />
                        ) : (
                          <span>
                            No image
                          </span>
                        )}
                      </td>

                      {/* TITLE */}

                      <td style={tdStyle}>
                        {banner.title ||
                          "-"}
                      </td>

                      {/* LINK */}

                      <td style={tdStyle}>
                        {banner.link ||
                          "-"}
                      </td>

                      {/* STATUS */}

                      <td style={tdStyle}>
                        {banner.isActive ? (
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

                      {/* ACTIONS */}

                      <td style={tdStyle}>
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "7px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleEdit(
                                banner
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
                                banner._id
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
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const cardStyle = {
  background: "#fff",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.06)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  marginTop: "6px",
  marginBottom: "5px",
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
  padding: "5px 9px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
};

const smallButton = {
  color: "#fff",
  border: "none",
  padding: "7px 11px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

export default Banners;