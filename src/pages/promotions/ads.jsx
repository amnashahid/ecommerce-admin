
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./Ads.css";
import { API_URL , BASE_URL } from "../../services/api";

const initialForm = {
  title: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

export default function Ads() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");

  // JWT authentication
  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token");
  };

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // GET ALL ADS
  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/ads`,
        authConfig()
      );

      const result = response.data.data || response.data;
      setAds(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to load ads."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  // SEARCH
  const filteredAds = ads.filter((ad) => {
    const value = search.toLowerCase();

    return (
      ad.title?.toLowerCase().includes(value) ||
      ad.description?.toLowerCase().includes(value)
    );
  });

  // OPEN ADD MODAL
  const openAdd = () => {
    setEditingAd(null);
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const openEdit = (ad) => {
    setEditingAd(ad);

    setForm({
      title: ad.title || "",
      description: ad.description || "",
      imageUrl: ad.imageUrl || "",
      isActive: ad.isActive ?? true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // CLOSE MODAL
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingAd(null);
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // CREATE / UPDATE AD
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Ad title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Ad description is required.");
      return;
    }

    const imageUrl = form.imageUrl.trim();

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError("Please enter a valid HTTP or HTTPS image URL.");
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: imageUrl || null,
      isActive: form.isActive,
    };

    try {
      setSaving(true);

      if (editingAd) {
        await axios.put(
          `${API_URL}/ads/${editingAd._id}`,
          payload,
          authConfig()
        );

        setSuccess("Ad updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/ads`,
          payload,
          authConfig()
        );

        setSuccess("Ad created successfully.");
      }

      await loadAds();

      setShowModal(false);
      setEditingAd(null);
      setForm({ ...initialForm });
      setSuccess(
        editingAd
          ? "Ad updated successfully."
          : "Ad created successfully."
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to save ad."
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE AD
  const handleDelete = async (ad) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${ad.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await axios.delete(
        `${API_URL}/ads/${ad._id}`,
        authConfig()
      );

      setAds((prev) => prev.filter((item) => item._id !== ad._id));
      setSuccess("Ad deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to delete ad."
      );
    }
  };

  // TOGGLE ACTIVE STATUS
  const handleToggleActive = async (ad) => {
    try {
      setError("");
      setSuccess("");

      await axios.put(
        `${API_URL}/ads/${ad._id}`,
        { isActive: !ad.isActive },
        authConfig()
      );

      setAds((prev) =>
        prev.map((item) =>
          item._id === ad._id
            ? { ...item, isActive: !item.isActive }
            : item
        )
      );

      setSuccess(
        `Ad ${ad.isActive ? "deactivated" : "activated"} successfully.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to update ad status."
      );
    }
  };

  return (
    <div className="ads-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Ads</h1>
          <p>Manage promotional ads for your grocery app.</p>
        </div>

        <button className="btn btn-primary" onClick={openAdd}>
          + Add Ad
        </button>
      </div>

      {/* MESSAGES */}
      {error && !showModal && (
        <div className="alert alert-error">{error}</div>
      )}

      {success && !showModal && (
        <div className="alert alert-success">{success}</div>
      )}

      {/* SEARCH */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search ads by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <span className="ad-count">
          {filteredAds.length} {filteredAds.length === 1 ? "ad" : "ads"}
        </span>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty">
                  Loading ads...
                </td>
              </tr>
            ) : filteredAds.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  No ads found.
                </td>
              </tr>
            ) : (
              filteredAds.map((ad) => (
                <tr key={ad._id}>
                  <td>
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="ad-image"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>

                  <td>
                    <strong>{ad.title}</strong>
                  </td>

                  <td>
                    <div className="ad-description">
                      {ad.description}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        ad.isActive ? "active" : "inactive"
                      }`}
                    >
                      {ad.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    {ad.createdAt
                      ? new Date(ad.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => openEdit(ad)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-toggle"
                        onClick={() => handleToggleActive(ad)}
                      >
                        {ad.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(ad)}
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>{editingAd ? "Edit Ad" : "Add Ad"}</h2>
                <p>
                  Enter the promotional content to display in your app.
                </p>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ad-form">
              {error && (
                <div className="alert alert-error">{error}</div>
              )}

              {success && (
                <div className="alert alert-success">{success}</div>
              )}

              <div className="form-group">
                <label htmlFor="title">Ad Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength={150}
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekend Grocery Offers"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  maxLength={1000}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter the ad description..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL (optional)</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/ad-image.jpg"
                />
                <small>
                  Leave empty if this ad does not need an image.
                </small>
              </div>

              {/* IMAGE PREVIEW */}
              {form.imageUrl.trim() && (
                <div className="preview">
                  <label>Image Preview</label>
                  <img
                    src={form.imageUrl}
                    alt="Ad preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    onLoad={(e) => {
                      e.currentTarget.style.display = "block";
                    }}
                  />
                </div>
              )}

              <div className="checkbox-group">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                <label htmlFor="isActive">Active — show in mobile app</label>
              </div>

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
                    : editingAd
                      ? "Update Ad"
                      : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
