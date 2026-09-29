import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const emptyAddress = {
  label: "Home",
  address: "",
  location: "",
  latitude: "",
  longitude: "",
  isDefault: true,
};

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  language: "en",
  role: "customer",
  isActive: true,
  addresses: [{ ...emptyAddress }],
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);

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
  // LOAD USERS
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/users`,
        authConfig
      );

      setUsers(response.data.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load users"
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
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================================
  // ADDRESS CHANGE
  // ============================================

  const handleAddressChange = (index, e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => {
      const addresses = [...previous.addresses];

      addresses[index] = {
        ...addresses[index],
        [name]:
          type === "checkbox"
            ? checked
            : value,
      };

      // Only one default address
      if (name === "isDefault" && checked) {
        addresses.forEach((address, i) => {
          address.isDefault = i === index;
        });
      }

      return {
        ...previous,
        addresses,
      };
    });
  };

  // ============================================
  // ADD ADDRESS
  // ============================================

  const addAddress = () => {
    setForm((previous) => ({
      ...previous,
      addresses: [
        ...previous.addresses,
        {
          label: "Home",
          address: "",
          location: "",
          latitude: "",
          longitude: "",
          isDefault:
            previous.addresses.length === 0,
        },
      ],
    }));
  };

  // ============================================
  // REMOVE ADDRESS
  // ============================================

  const removeAddress = (index) => {
    if (form.addresses.length === 1) {
      alert(
        "A user must have at least one address."
      );
      return;
    }

    setForm((previous) => {
      const addresses = previous.addresses.filter(
        (_, i) => i !== index
      );

      // Make first address default if
      // default address was removed
      if (
        !addresses.some(
          (address) => address.isDefault
        )
      ) {
        addresses[0].isDefault = true;
      }

      return {
        ...previous,
        addresses,
      };
    });
  };

  // ============================================
  // CREATE / UPDATE
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim()) {
      alert("First name is required");
      return;
    }

    if (!form.phone.trim()) {
      alert("Phone is required");
      return;
    }

    if (!form.role) {
      alert("Customer type is required");
      return;
    }

    if (form.addresses.length === 0) {
      alert("Please add at least one address");
      return;
    }

    for (let i = 0; i < form.addresses.length; i++) {
      const address = form.addresses[i];

      if (!address.address.trim()) {
        alert(
          `Address ${i + 1}: complete address is required`
        );
        return;
      }
    }

    try {
      setLoading(true);

      const data = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        language: form.language,
        role: form.role,
        isActive: form.isActive,

        addresses: form.addresses.map(
          (address) => ({
            label: address.label.trim(),
            address: address.address.trim(),
            location:
              address.location?.trim() || "",
            latitude:
              address.latitude === ""
                ? undefined
                : Number(address.latitude),
            longitude:
              address.longitude === ""
                ? undefined
                : Number(address.longitude),
            isDefault: address.isDefault,
          })
        ),
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/users/${editingId}`,
          data,
          authConfig
        );

        alert("User updated successfully");
      } else {
        await axios.post(
          `${API_URL}/users`,
          data,
          authConfig
        );

        alert("User created successfully");
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to save user"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EDIT
  // ============================================

  const handleEdit = (user) => {
    setEditingId(user._id);

    let addresses = [];

    if (
      user.addresses &&
      Array.isArray(user.addresses) &&
      user.addresses.length > 0
    ) {
      addresses = user.addresses.map(
        (address) => ({
          label: address.label || "Home",
          address: address.address || "",
          location: address.location || "",
          latitude:
            address.latitude ?? "",
          longitude:
            address.longitude ?? "",
          isDefault:
            address.isDefault === true,
        })
      );
    } else {
      // Compatibility with old users
      addresses = [
        {
          label: "Home",
          address: user.address || "",
          location: user.location || "",
          latitude:
            user.latitude ?? "",
          longitude:
            user.longitude ?? "",
          isDefault: true,
        },
      ];
    }

    // Ensure one default address
    if (
      !addresses.some(
        (address) => address.isDefault
      )
    ) {
      addresses[0].isDefault = true;
    }

    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      email: user.email || "",
      language: user.language || "en",
      role: user.role || "customer",
      isActive: user.isActive !== false,
      addresses,
    });

    setShowForm(true);
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(
        `${API_URL}/users/${id}`,
        authConfig
      );

      alert("User deleted successfully");

      await loadUsers();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESET
  // ============================================

  const resetForm = () => {
    setForm({
      ...emptyForm,
      addresses: [
        {
          ...emptyAddress,
        },
      ],
    });

    setEditingId(null);
    setShowForm(false);
  };

  // ============================================
  // OPEN ADD FORM
  // ============================================

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
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
      {/* HEADER */}

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
            Users
          </h1>

          <p
            style={{
              color: "#777",
              marginTop: "5px",
            }}
          >
            Manage administrators and customers
          </p>
        </div>

        <button
          onClick={openAddForm}
          style={buttonStyle}
        >
          + Add User
        </button>
      </div>

      {/* ========================================
          USERS TABLE
      ======================================== */}

      <div style={cardStyle}>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          User List
        </h2>

        {loading && users.length === 0 ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#777",
            }}
          >
            No users found.
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
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f2f4",
                  }}
                >
                  <th style={thStyle}>
                    User
                  </th>

                  <th style={thStyle}>
                    Type
                  </th>

                  <th style={thStyle}>
                    Phone
                  </th>

                  <th style={thStyle}>
                    Email
                  </th>

                  <th style={thStyle}>
                    Addresses
                  </th>

                  <th style={thStyle}>
                    Language
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
                {users.map((user) => (
                  <tr key={user._id}>
                    {/* USER */}

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#fff0df",
                            color: "#f28c28",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontWeight: "bold",
                            fontSize: "16px",
                          }}
                        >
                          {(
                            user.firstName ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            {user.firstName ||
                              ""}{" "}
                            {user.lastName ||
                              ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}

                    <td style={tdStyle}>
                      {user.role ===
                      "admin" ? (
                        <span
                          style={{
                            ...badgeStyle,
                            background:
                              "#e8eaf6",
                            color:
                              "#3949ab",
                          }}
                        >
                          Admin
                        </span>
                      ) : (
                        <span
                          style={{
                            ...badgeStyle,
                            background:
                              "#fff0df",
                            color:
                              "#d96f00",
                          }}
                        >
                          Customer
                        </span>
                      )}
                    </td>

                    {/* PHONE */}

                    <td style={tdStyle}>
                      {user.phone || "-"}
                    </td>

                    {/* EMAIL */}

                    <td style={tdStyle}>
                      {user.email || "-"}
                    </td>

                    {/* ADDRESSES */}

                    <td style={tdStyle}>
                      {user.addresses?.length ||
                        0}
                    </td>

                    {/* LANGUAGE */}

                    <td style={tdStyle}>
                      {user.language === "ur"
                        ? "Urdu"
                        : "English"}
                    </td>

                    {/* STATUS */}

                    <td style={tdStyle}>
                      {user.isActive ? (
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
                          display: "flex",
                          gap: "7px",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleEdit(user)
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
                              user._id
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================
          POPUP
      ======================================== */}

      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            {/* MODAL HEADER */}

            <div style={modalHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>
                  {editingId
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#777",
                    fontSize:
                      "13px",
                  }}
                >
                  Manage user information
                  and addresses
                </p>
              </div>

              <button
                onClick={resetForm}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  padding: "25px",
                }}
              >
                {/* BASIC INFORMATION */}

                <h3 style={sectionTitle}>
                  Basic Information
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  {/* FIRST NAME */}

                  <div>
                    <label>
                      First Name
                    </label>

                    <input
                      type="text"
                      name="firstName"
                      value={
                        form.firstName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="First name"
                      style={inputStyle}
                    />
                  </div>

                  {/* LAST NAME */}

                  <div>
                    <label>
                      Last Name
                    </label>

                    <input
                      type="text"
                      name="lastName"
                      value={
                        form.lastName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Last name"
                      style={inputStyle}
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label>
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="03001234567"
                      style={inputStyle}
                      disabled={
                        !!editingId
                      }
                    />

                    {editingId && (
                      <small
                        style={{
                          color:
                            "#777",
                        }}
                      >
                        Phone number
                        cannot be
                        changed.
                      </small>
                    )}
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="user@example.com"
                      style={inputStyle}
                    />
                  </div>

                  {/* LANGUAGE */}

                  <div>
                    <label>
                      Language
                    </label>

                    <select
                      name="language"
                      value={
                        form.language
                      }
                      onChange={
                        handleChange
                      }
                      style={inputStyle}
                    >
                      <option value="en">
                        English
                      </option>

                      <option value="ur">
                        Urdu
                      </option>
                    </select>
                  </div>

                  {/* CUSTOMER TYPE */}

                  <div>
                    <label>
                      Customer Type
                    </label>

                    <select
                      name="role"
                      value={form.role}
                      onChange={
                        handleChange
                      }
                      style={inputStyle}
                    >
                      <option value="customer">
                        Customer
                      </option>

                      <option value="admin">
                        Admin
                      </option>
                    </select>
                  </div>

                  {/* ACTIVE */}

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <label
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                        cursor:
                          "pointer",
                      }}
                    >
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

                      Active
                    </label>
                  </div>
                </div>

                {/* ADDRESSES */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginTop:
                      "30px",
                    marginBottom:
                      "15px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        ...sectionTitle,
                        marginBottom:
                          "3px",
                      }}
                    >
                      Addresses
                    </h3>

                    <small
                      style={{
                        color:
                          "#777",
                      }}
                    >
                      A user can have
                      multiple delivery
                      addresses.
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addAddress
                    }
                    style={
                      secondaryButtonStyle
                    }
                  >
                    + Add Address
                  </button>
                </div>

                {/* ADDRESS LIST */}

                {form.addresses.map(
                  (
                    address,
                    index
                  ) => (
                    <div
                      key={index}
                      style={
                        addressCardStyle
                      }
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                          }}
                        >
                          Address{" "}
                          {index + 1}
                        </h4>

                        {form
                          .addresses
                          .length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeAddress(
                                index
                              )
                            }
                            style={{
                              ...smallButton,
                              background:
                                "#e74c3c",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        {/* LABEL */}

                        <div>
                          <label>
                            Address Label
                          </label>

                          <select
                            name="label"
                            value={
                              address.label
                            }
                            onChange={(
                              e
                            ) =>
                              handleAddressChange(
                                index,
                                e
                              )
                            }
                            style={
                              inputStyle
                            }
                          >
                            <option value="Home">
                              Home
                            </option>

                            <option value="Office">
                              Office
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </div>

                        {/* LOCATION */}

                        <div>
                          <label>
                            Location
                          </label>

                          <input
                            type="text"
                            name="location"
                            value={
                              address.location
                            }
                            onChange={(
                              e
                            ) =>
                              handleAddressChange(
                                index,
                                e
                              )
                            }
                            placeholder="Johar Town, Lahore"
                            style={
                              inputStyle
                            }
                          />
                        </div>

                        {/* ADDRESS */}

                        <div
                          style={{
                            gridColumn:
                              "1 / -1",
                          }}
                        >
                          <label>
                            Complete
                            Address
                          </label>

                          <textarea
                            name="address"
                            value={
                              address.address
                            }
                            onChange={(
                              e
                            ) =>
                              handleAddressChange(
                                index,
                                e
                              )
                            }
                            placeholder="House 123, Street 5, Johar Town, Lahore"
                            rows="3"
                            style={{
                              ...inputStyle,
                              resize:
                                "vertical",
                            }}
                          />
                        </div>

                        {/* LATITUDE */}

                        <div>
                          <label>
                            Latitude
                          </label>

                          <input
                            type="number"
                            step="any"
                            name="latitude"
                            value={
                              address.latitude
                            }
                            onChange={(
                              e
                            ) =>
                              handleAddressChange(
                                index,
                                e
                              )
                            }
                            placeholder="31.4697"
                            style={
                              inputStyle
                            }
                          />
                        </div>

                        {/* LONGITUDE */}

                        <div>
                          <label>
                            Longitude
                          </label>

                          <input
                            type="number"
                            step="any"
                            name="longitude"
                            value={
                              address.longitude
                            }
                            onChange={(
                              e
                            ) =>
                              handleAddressChange(
                                index,
                                e
                              )
                            }
                            placeholder="74.2728"
                            style={
                              inputStyle
                            }
                          />
                        </div>

                        {/* DEFAULT */}

                        <div
                          style={{
                            gridColumn:
                              "1 / -1",
                          }}
                        >
                          <label
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              cursor:
                                "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              name="isDefault"
                              checked={
                                address.isDefault
                              }
                              onChange={(
                                e
                              ) =>
                                handleAddressChange(
                                  index,
                                  e
                                )
                              }
                            />

                            Default
                            delivery
                            address
                          </label>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* MODAL FOOTER */}

              <div
                style={
                  modalFooterStyle
                }
              >
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  style={
                    cancelButtonStyle
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={buttonStyle}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const addressCardStyle = {
  background: "#f8f9fa",
  border: "1px solid #e5e5e5",
  borderRadius: "8px",
  padding: "18px",
  marginBottom: "15px",
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: "15px",
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

const secondaryButtonStyle = {
  background: "#fff0df",
  color: "#d96f00",
  border: "1px solid #f28c28",
  padding: "9px 14px",
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
  borderBottom: "1px solid #ddd",
  fontSize: "13px",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
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

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
  boxSizing: "border-box",
};

const modalStyle = {
  width: "100%",
  maxWidth: "950px",
  background: "#fff",
  borderRadius: "10px",
  boxShadow:
    "0 10px 40px rgba(0,0,0,0.2)",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  boxSizing: "border-box",
};

const modalHeaderStyle = {
  position: "sticky",
  top: 0,
  background: "#fff",
  padding: "20px 25px",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 2,
};

const modalFooterStyle = {
  position: "sticky",
  bottom: 0,
  background: "#fff",
  padding: "15px 25px",
  borderTop: "1px solid #eee",
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  zIndex: 2,
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "28px",
  cursor: "pointer",
  color: "#777",
};

export default Users;