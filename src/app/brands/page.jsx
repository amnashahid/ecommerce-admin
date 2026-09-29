"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [form, setForm] = useState({
    nameEn: "",
    nameUr: "",
    isActive: true,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  // ---------------------------------------
  // Get JWT token
  // ---------------------------------------

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ---------------------------------------
  // Axios config
  // ---------------------------------------

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // ---------------------------------------
  // GET Brands
  // ---------------------------------------

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/brands`,
        getConfig()
      );

      setBrands(response.data.data || response.data);
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

  // ---------------------------------------
  // Open Add Modal
  // ---------------------------------------

  const openAddModal = () => {
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

  // ---------------------------------------
  // Open Edit Modal
  // ---------------------------------------

  const openEditModal = (brand) => {
    setEditingBrand(brand);

    setForm({
      nameEn: brand.nameEn || "",
      nameUr: brand.nameUr || "",
      isActive: brand.isActive ?? true,
      image: null,
    });

    setImagePreview(brand.imageUrl || brand.image || null);

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ---------------------------------------
  // Close Modal
  // ---------------------------------------

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBrand(null);
    setImagePreview(null);
  };

  // ---------------------------------------
  // Input Change
  // ---------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files?.[0];

      setForm((prev) => ({
        ...prev,
        image: file || null,
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

  // ---------------------------------------
  // CREATE / UPDATE
  // ---------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.nameEn.trim()) {
      setError("English brand name is required.");
      return;
    }

    if (!form.nameUr.trim()) {
      setError("Urdu brand name is required.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("nameEn", form.nameEn);
      formData.append("nameUr", form.nameUr);
      formData.append(
        "isActive",
        form.isActive ? "true" : "false"
      );

      if (form.image) {
        formData.append("image", form.image);
      }

      if (editingBrand) {
        // UPDATE

        await axios.put(
          `${API_URL}/brands/${editingBrand._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setSuccess("Brand updated successfully.");
      } else {
        // CREATE

        await axios.post(
          `${API_URL}/brands`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setSuccess("Brand created successfully.");
      }

      await loadBrands();

      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------
  // DELETE
  // ---------------------------------------

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.nameEn}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(
        `${API_URL}/brands/${brand._id}`,
        getConfig()
      );

      await loadBrands();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to delete brand."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
safdsfs
      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Brands
          </h1>

          <p className="text-sm text-gray-500">
            Manage your store brands
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white hover:bg-orange-600"
        >
          + Add Brand
        </button>

      </div>

      {/* Error */}


    </div>
  );
}