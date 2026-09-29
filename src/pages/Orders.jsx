import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const token = localStorage.getItem("token");

const authConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const emptyOrderForm = {
  customerId: "",
  addressId: "",
  deliveryDate: "",
  deliverySlotId: "",
  deliveryAddress: "",
  paymentMethod: "Cash on Delivery",
  paymentStatus: "Pending",
  deliveryFee: 0,
  discount: 0,
  notes: "",
  status: "Pending",
  items: [],
};

const emptyItem = {
  productId: "",
  productName: "",
  productNameUr: "",
  quantity: 1,
  unitPrice: 0,
  dealId: "",
  dealItem: false,
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [deliverySlots, setDeliverySlots] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const [form, setForm] = useState(emptyOrderForm);

  const [activeFilter, setActiveFilter] = useState("All");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  // ----------------------------------------------------
  // LOAD ORDERS
  // ----------------------------------------------------

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/orders`,
        authConfig
      );

      setOrders(response.data.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // LOAD CUSTOMERS
  // ----------------------------------------------------

  const loadCustomers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/users/customers`,
        authConfig
      );

      setCustomers(response.data.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Failed to load customers"
      );
    }
  };

  // ----------------------------------------------------
  // LOAD CUSTOMER ADDRESSES
  // ----------------------------------------------------

  const loadCustomerAddresses = async (customerId) => {
    if (!customerId) {
      setCustomerAddresses([]);
      return;
    }
    const addresses = customers.find((x) => x._id === customerId)?.addresses || [];
    setCustomerAddresses(addresses);
    return addresses;
    

    // try {
    //   setLoadingAddresses(true);

    //   const response = await axios.get(
    //     `${API_URL}/addresses/user/${customerId}`,
    //     authConfig
    //   );

    //   const addresses = response.data.data || [];

    //   setCustomerAddresses(addresses);

    //   // Automatically select default address
    //   if (addresses.length > 0) {
    //     const defaultAddress =
    //       addresses.find((x) => x.isDefault) || addresses[0];

    //     setForm((prev) => ({
    //       ...prev,
    //       addressId: defaultAddress._id,
    //       deliveryAddress: defaultAddress.address || "",
    //     }));
    //   } else {
    //     setForm((prev) => ({
    //       ...prev,
    //       addressId: "",
    //       deliveryAddress: "",
    //     }));
    //   }
    // } catch (err) {
    //   console.error(err);

    //   setCustomerAddresses([]);

    //   setError(
    //     err.response?.data?.message ||
    //       "Failed to load customer addresses"
    //   );
    // } finally {
    //   setLoadingAddresses(false);
    // }
  };

  // ----------------------------------------------------
  // LOAD DELIVERY SLOTS
  // ----------------------------------------------------

  const loadDeliverySlots = async (date) => {
    if (!date) {
      setDeliverySlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
        var day = (new Date(date)).getDay();
      const response = await axios.get(
        `${API_URL}/delivery-slots/day/${day}`,
        authConfig
      );

      setDeliverySlots(response.data.data || []);
    } catch (err) {
      console.error(err);

      setDeliverySlots([]);

      setError(
        err.response?.data?.message ||
          "Failed to load delivery slots"
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // ----------------------------------------------------
  // OPEN ADD MODAL
  // ----------------------------------------------------

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyOrderForm);
    setCustomerAddresses([]);
    setDeliverySlots([]);
    setMessage("");
    setError("");
    setShowModal(true);
  };

  // ----------------------------------------------------
  // OPEN EDIT MODAL
  // ----------------------------------------------------

  const openEditModal = async (order) => {
    try {
      setEditingId(order._id);

      setMessage("");
      setError("");

      setForm({
        customerId: order.customerId?._id || order.customerId || "",
        addressId: order.deliveryAddress?.addressId || "",
        deliveryDate: order.deliveryDate
          ? order.deliveryDate.substring(0, 10)
          : "",
        deliverySlotId:
          order.deliverySlotId?._id ||
          order.deliverySlotId ||
          "",
        deliveryAddress: order.deliveryAddress?.address || "",
        paymentMethod:
          order.paymentMethod || "Cash on Delivery",
        paymentStatus: order.paymentStatus || "Pending",
        deliveryFee: order.deliveryFee || 0,
        discount: order.discount || 0,
        notes: order.notes || "",
        status: order.status || "Pending",
        items: order.items || [],
      });

      setShowModal(true);

      // Load addresses
      if (order.customerId) {
        await loadCustomerAddresses(
          order.customerId?._id || order.customerId
        );
      }

      // Load delivery slots
      if (order.deliveryDate) {
        await loadDeliverySlots(
          order.deliveryDate.substring(0, 10)
        );
      }
    } catch (err) {
      console.error(err);

      setError("Failed to open order");
    }
  };

  // ----------------------------------------------------
  // OPEN VIEW MODAL
  // ----------------------------------------------------

  const openViewModal = async (order) => {
    try {
      const response = await axios.get(
        `${API_URL}/orders/${order._id}`,
        authConfig
      );

      setSelectedOrder(response.data.data);

      setShowViewModal(true);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load order details"
      );
    }
  };

  // ----------------------------------------------------
  // OPEN TIMELINE
  // ----------------------------------------------------

  const openTimelineModal = async (order) => {
    try {
      const response = await axios.get(
        `${API_URL}/orders/${order._id}/timeline`,
        authConfig
      );

      setTimeline(response.data.data || []);
      setSelectedOrder(order);
      setShowTimelineModal(true);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load order timeline"
      );
    }
  };

  // ----------------------------------------------------
  // CUSTOMER CHANGE
  // ----------------------------------------------------

  const handleCustomerChange = async (e) => {
    const customerId = e.target.value;

    setForm((prev) => ({
      ...prev,
      customerId,
      addressId: "",
      deliveryAddress: "",
    }));

    await loadCustomerAddresses(customerId);
  };

  // ----------------------------------------------------
  // ADDRESS CHANGE
  // ----------------------------------------------------

  const handleAddressChange = (e) => {
    const addressId = e.target.value;

    const selectedAddress = customerAddresses.find(
      (x) => x._id === addressId
    );

    setForm((prev) => ({
      ...prev,
      addressId,
      deliveryAddress: selectedAddress?.address || "",
    }));
  };

  // ----------------------------------------------------
  // DATE CHANGE
  // ----------------------------------------------------

  const handleDateChange = async (e) => {
    const date = e.target.value;

    setForm((prev) => ({
      ...prev,
      deliveryDate: date,
      deliverySlotId: "",
    }));

    await loadDeliverySlots(date);
  };

  // ----------------------------------------------------
  // FORM CHANGE
  // ----------------------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ----------------------------------------------------
  // ADD ITEM
  // ----------------------------------------------------

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  // ----------------------------------------------------
  // REMOVE ITEM
  // ----------------------------------------------------

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------------------------------
  // ITEM CHANGE
  // ----------------------------------------------------

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...prev,
        items,
      };
    });
  };

  // ----------------------------------------------------
  // CALCULATE SUBTOTAL
  // ----------------------------------------------------

  const calculateSubtotal = () => {
    return form.items.reduce((total, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);

      return total + quantity * price;
    }, 0);
  };

  // ----------------------------------------------------
  // CALCULATE TOTAL
  // ----------------------------------------------------

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();

    const discount = Number(form.discount || 0);
    const deliveryFee = Number(form.deliveryFee || 0);

    return Math.max(
      0,
      subtotal - discount + deliveryFee
    );
  };

  // ----------------------------------------------------
  // SAVE ORDER
  // ----------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      if (!form.customerId) {
        setError("Please select a customer.");
        return;
      }

      if (!form.addressId) {
        setError("Please select a delivery address.");
        return;
      }

      if (!form.deliveryDate) {
        setError("Please select a delivery date.");
        return;
      }

      if (!form.deliverySlotId) {
        setError("Please select a delivery slot.");
        return;
      }

      if (!form.items.length) {
        setError("Please add at least one order item.");
        return;
      }

      const payload = {
        customerId: form.customerId,

        addressId: form.addressId,

        deliveryDate: form.deliveryDate,

        deliverySlotId: form.deliverySlotId,

        items: form.items.map((item) => ({
          productId: item.productId,

          productName: item.productName,

          productNameUr: item.productNameUr || "",

          quantity: Number(item.quantity),

          unitPrice: Number(item.unitPrice),

          dealId: item.dealId || null,

          dealItem: Boolean(item.dealId),
        })),

        deliveryFee: Number(form.deliveryFee || 0),

        discount: Number(form.discount || 0),

        paymentMethod: form.paymentMethod,

        paymentStatus: form.paymentStatus,

        notes: form.notes,

        status: form.status,
      };

      console.log(payload);
      if (editingId) {
        await axios.put(
          `${API_URL}/orders/${editingId}`,
          payload,
          authConfig
        );

        setMessage("Order updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/orders`,
          payload,
          authConfig
        );

        setMessage("Order created successfully.");
      }

      setShowModal(false);

      setForm(emptyOrderForm);

      setCustomerAddresses([]);
      setDeliverySlots([]);

      await loadOrders();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to save order"
      );
    }
  };

  // ----------------------------------------------------
  // DELETE ORDER
  // ----------------------------------------------------

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/orders/${id}`,
        authConfig
      );

      setMessage("Order deleted successfully.");

      await loadOrders();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to delete order"
      );
    }
  };

  // ----------------------------------------------------
  // STATUS CHANGE
  // ----------------------------------------------------

  const handleStatusChange = async (order, status) => {
    try {
      await axios.put(
        `${API_URL}/orders/${order._id}/status`,
        {
          status,
        },
        authConfig
      );

      await loadOrders();

      if (showViewModal) {
        const response = await axios.get(
          `${API_URL}/orders/${order._id}`,
          authConfig
        );

        setSelectedOrder(response.data.data);
      }

      setMessage("Order status updated.");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to update status"
      );
    }
  };

  // ----------------------------------------------------
  // FILTER ORDERS
  // ----------------------------------------------------

  const getFilteredOrders = () => {
    if (activeFilter === "All") {
      return orders;
    }

    if (activeFilter === "New") {
      return orders.filter(
        (x) => x.status === "Pending"
      );
    }

    if (activeFilter === "Processing") {
      return orders.filter((x) =>
        ["Confirmed", "Preparing", "Ready"].includes(
          x.status
        )
      );
    }

    if (activeFilter === "Delivery") {
      return orders.filter(
        (x) => x.status === "Out for Delivery"
      );
    }

    if (activeFilter === "Completed") {
      return orders.filter(
        (x) => x.status === "Delivered"
      );
    }

    if (activeFilter === "Cancelled") {
      return orders.filter(
        (x) => x.status === "Cancelled"
      );
    }

    return orders;
  };

  const filteredOrders = getFilteredOrders();

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  const getCustomerName = (order) => {
    if (!order.customerId) {
      return "-";
    }

    if (typeof order.customerId === "object") {
      return (
        `${order.customerId.firstName || ""} ${
          order.customerId.lastName || ""
        }`.trim() ||
        order.customerId.phone ||
        "-"
      );
    }

    const customer = customers.find(
      (x) => x._id === order.customerId
    );

    if (!customer) {
      return "-";
    }

    return (
      `${customer.firstName || ""} ${
        customer.lastName || ""
      }`.trim() ||
      customer.phone ||
      "-"
    );
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: {
        background: "#fff3cd",
        color: "#856404",
      },

      Confirmed: {
        background: "#cfe2ff",
        color: "#084298",
      },

      Preparing: {
        background: "#e2e3e5",
        color: "#41464b",
      },

      Ready: {
        background: "#cff4fc",
        color: "#055160",
      },

      "Out for Delivery": {
        background: "#d1ecf1",
        color: "#0c5460",
      },

      Delivered: {
        background: "#d1e7dd",
        color: "#0f5132",
      },

      Cancelled: {
        background: "#f8d7da",
        color: "#842029",
      },
    };

    return {
      padding: "5px 9px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      ...styles[status],
    };
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString();
  };

  // ----------------------------------------------------
  // STYLES
  // ----------------------------------------------------

  const cardStyle = {
    background: "#fff",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
    background: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "13px",
  };

  const dangerButtonStyle = {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "13px",
  };

  const smallButtonStyle = {
    background: "#f28c28",
    color: "#fff",
    border: "none",
    padding: "7px 11px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  };

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalStyle = {
    background: "#fff",
    width: "100%",
    maxWidth: "1000px",
    maxHeight: "calc(100vh - 40px)",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const modalHeaderStyle = {
    padding: "18px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  };

  const modalBodyStyle = {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
  };

  const modalFooterStyle = {
    padding: "15px 20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexShrink: 0,
  };

  const closeButtonStyle = {
    border: "none",
    background: "transparent",
    fontSize: "25px",
    cursor: "pointer",
    color: "#666",
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div
      style={{
        background: "#f5f6f8",
        minHeight: "100vh",
        padding: "25px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#333",
            }}
          >
            Orders
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              color: "#777",
              fontSize: "14px",
            }}
          >
            Manage customer orders and delivery
          </p>
        </div>

        <button
          style={buttonStyle}
          onClick={openAddModal}
        >
          + Add Order
        </button>
      </div>

      {/* MESSAGES */}

      {message && (
        <div
          style={{
            background: "#d1e7dd",
            color: "#0f5132",
            padding: "12px 15px",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#842029",
            padding: "12px 15px",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          {error}

          <button
            onClick={() => setError("")}
            style={{
              float: "right",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* FILTERS */}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {[
            "All",
            "New",
            "Processing",
            "Delivery",
            "Completed",
            "Cancelled",
          ].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                border:
                  activeFilter === filter
                    ? "1px solid #f28c28"
                    : "1px solid #ddd",

                background:
                  activeFilter === filter
                    ? "#f28c28"
                    : "#fff",

                color:
                  activeFilter === filter
                    ? "#fff"
                    : "#555",

                padding: "8px 15px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE */}

      <div style={cardStyle}>
        {loading ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading orders...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8f9fa",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px" }}>
                    Order
                  </th>

                  <th style={{ padding: "12px" }}>
                    Customer
                  </th>

                  <th style={{ padding: "12px" }}>
                    Date
                  </th>

                  <th style={{ padding: "12px" }}>
                    Delivery
                  </th>

                  <th style={{ padding: "12px" }}>
                    Total
                  </th>

                  <th style={{ padding: "12px" }}>
                    Status
                  </th>

                  <th style={{ padding: "12px" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    style={{
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      <strong>
                        #{order.orderNumber}
                      </strong>
                    </td>

                    <td style={{ padding: "12px" }}>
                      {getCustomerName(order)}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {formatDate(order.deliveryDate)}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {order.deliverySlotId?.startTime
                        ? `${order.deliverySlotId.startTime} - ${order.deliverySlotId.endTime}`
                        : "-"}
                    </td>

                    <td style={{ padding: "12px" }}>
                      Rs. {Number(order.total || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span
                        style={getStatusStyle(
                          order.status
                        )}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "5px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          style={smallButtonStyle}
                          onClick={() =>
                            openViewModal(order)
                          }
                        >
                          View
                        </button>

                        <button
                          style={secondaryButtonStyle}
                          onClick={() =>
                            openEditModal(order)
                          }
                        >
                          Edit
                        </button>

                        <button
                          style={secondaryButtonStyle}
                          onClick={() =>
                            openTimelineModal(order)
                          }
                        >
                          Timeline
                        </button>

                        <button
                          style={dangerButtonStyle}
                          onClick={() =>
                            handleDelete(order._id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredOrders.length && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#777",
                      }}
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            {/* HEADER */}

            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>
                {editingId
                  ? "Edit Order"
                  : "Create Order"}
              </h3>

              <button
                style={closeButtonStyle}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* BODY */}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }}
            >
              <div style={modalBodyStyle}>
                {/* CUSTOMER / ADDRESS */}

                <div style={cardStyle}>
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "15px",
                    }}
                  >
                    Customer & Delivery Address
                  </h4>

                  <div style={gridStyle}>
                    {/* CUSTOMER */}

                    <div>
                      <label style={labelStyle}>
                        Customer *
                      </label>

                      <select
                        name="customerId"
                        value={form.customerId}
                        onChange={handleCustomerChange}
                        style={inputStyle}
                        required
                      >
                        <option value="">
                          Select Customer
                        </option>

                        {customers.map((customer) => (
                          <option
                            key={customer._id}
                            value={customer._id}
                          >
                            {customer.firstName || ""}{" "}
                            {customer.lastName || ""}{" "}
                            {customer.phone
                              ? `(${customer.phone})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ADDRESS */}

                    <div>
                      <label style={labelStyle}>
                        Delivery Address *
                      </label>

                      <select
                        value={form.addressId}
                        onChange={handleAddressChange}
                        style={inputStyle}
                        required
                        disabled={
                          !form.customerId ||
                          loadingAddresses
                        }
                      >
                        <option value="">
                          {loadingAddresses
                            ? "Loading addresses..."
                            : "Select Address"}
                        </option>

                        {customerAddresses.map(
                          (address) => (
                            <option
                              key={address._id}
                              value={address._id}
                            >
                              {address.label
                                ? `${address.label} - `
                                : ""}
                              {address.address}
                              {address.isDefault
                                ? " (Default)"
                                : ""}
                            </option>
                          )
                        )}
                      </select>

                      {form.customerId &&
                        !loadingAddresses &&
                        customerAddresses.length ===
                          0 && (
                          <small
                            style={{
                              color: "#dc3545",
                            }}
                          >
                            This customer has no
                            saved address.
                          </small>
                        )}
                    </div>
                  </div>

                  {/* SELECTED ADDRESS */}

                  {form.addressId && (
                    <div
                      style={{
                        marginTop: "15px",
                        background: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #eee",
                      }}
                    >
                      <strong>
                        Selected Address:
                      </strong>

                      <div
                        style={{
                          marginTop: "5px",
                          color: "#555",
                        }}
                      >
                        {form.deliveryAddress}
                      </div>
                    </div>
                  )}
                </div>

                {/* DELIVERY */}

                <div style={cardStyle}>
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "15px",
                    }}
                  >
                    Delivery
                  </h4>

                  <div style={gridStyle}>
                    {/* DATE */}

                    <div>
                      <label style={labelStyle}>
                        Delivery Date *
                      </label>

                      <input
                        type="date"
                        name="deliveryDate"
                        value={form.deliveryDate}
                        onChange={handleDateChange}
                        style={inputStyle}
                        required
                      />
                    </div>

                    {/* SLOT */}

                    <div>
                      <label style={labelStyle}>
                        Delivery Slot *
                      </label>

                      <select
                        name="deliverySlotId"
                        value={form.deliverySlotId}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                        disabled={
                          !form.deliveryDate ||
                          loadingSlots
                        }
                      >
                        <option value="">
                          {loadingSlots
                            ? "Loading slots..."
                            : !form.deliveryDate
                            ? "Select delivery date first"
                            : "Select Delivery Slot"}
                        </option>

                        {deliverySlots.map((slot) => (
                          <option
                            key={slot._id}
                            value={slot._id}
                          >
                            {slot.startTime} -{" "}
                            {slot.endTime}
                            {slot.capacity
                              ? ` (${slot.capacity} orders)`
                              : ""}
                          </option>
                        ))}
                      </select>

                      {form.deliveryDate &&
                        !loadingSlots &&
                        deliverySlots.length ===
                          0 && (
                          <small
                            style={{
                              color: "#dc3545",
                            }}
                          >
                            No delivery slots available
                            for this date.
                          </small>
                        )}
                    </div>
                  </div>

                  {/* SLOT INFO */}

                  {form.deliverySlotId && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "12px",
                        background: "#fff8ef",
                        border: "1px solid #f28c28",
                        borderRadius: "6px",
                      }}
                    >
                      {(() => {
                        const slot =
                          deliverySlots.find(
                            (x) =>
                              x._id ===
                              form.deliverySlotId
                          );

                        if (!slot) {
                          return null;
                        }

                        return (
                          <>
                            <strong>
                              Selected Delivery Slot
                            </strong>

                            <div
                              style={{
                                marginTop: "5px",
                              }}
                            >
                              {slot.startTime} -{" "}
                              {slot.endTime}
                            </div>

                            {slot.capacity && (
                              <div
                                style={{
                                  marginTop: "3px",
                                  fontSize: "13px",
                                  color: "#777",
                                }}
                              >
                                Capacity:{" "}
                                {slot.capacity}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* ORDER ITEMS */}

                <div style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                      }}
                    >
                      Order Items
                    </h4>

                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={addItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  {form.items.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        background: "#f8f9fa",
                        color: "#777",
                        borderRadius: "6px",
                      }}
                    >
                      No items added.
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
                          minWidth: "750px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background:
                                "#f8f9fa",
                            }}
                          >
                            <th
                              style={{
                                padding: "10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Product ID
                            </th>

                            <th
                              style={{
                                padding: "10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Product Name
                            </th>

                            <th
                              style={{
                                padding: "10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Qty
                            </th>

                            <th
                              style={{
                                padding: "10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Unit Price
                            </th>

                            <th
                              style={{
                                padding: "10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Deal ID
                            </th>

                            <th
                              style={{
                                padding: "10px",
                              }}
                            >
                              Total
                            </th>

                            <th
                              style={{
                                padding: "10px",
                              }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {form.items.map(
                            (item, index) => (
                              <tr
                                key={index}
                                style={{
                                  borderBottom:
                                    "1px solid #eee",
                                }}
                              >
                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <input
                                    value={
                                      item.productId ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "productId",
                                        e.target
                                          .value
                                    )
                                    }
                                    style={{
                                      ...inputStyle,
                                      margin: 0,
                                    }}
                                    placeholder="Product ID"
                                    required
                                  />
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <input
                                    value={
                                      item.productName ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "productName",
                                        e.target
                                          .value
                                    )
                                    }
                                    style={{
                                      ...inputStyle,
                                      margin: 0,
                                    }}
                                    placeholder="Product name"
                                    required
                                  />
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <input
                                    type="number"
                                    min="1"
                                    value={
                                      item.quantity
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "quantity",
                                        Number(
                                          e.target
                                            .value
                                        )
                                      )
                                    }
                                    style={{
                                      ...inputStyle,
                                      margin: 0,
                                      width: "80px",
                                    }}
                                  />
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      item.unitPrice
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "unitPrice",
                                        Number(
                                          e.target
                                            .value
                                        )
                                      )
                                    }
                                    style={{
                                      ...inputStyle,
                                      margin: 0,
                                      width: "110px",
                                    }}
                                  />
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <input
                                    value={
                                      item.dealId ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        index,
                                        "dealId",
                                        e.target
                                          .value
                                    )
                                    }
                                    style={{
                                      ...inputStyle,
                                      margin: 0,
                                    }}
                                    placeholder="Optional"
                                  />
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  Rs.{" "}
                                  {(
                                    Number(
                                      item.quantity ||
                                        0
                                    ) *
                                    Number(
                                      item.unitPrice ||
                                        0
                                    )
                                  ).toFixed(2)}
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "8px",
                                  }}
                                >
                                  <button
                                    type="button"
                                    style={
                                      dangerButtonStyle
                                    }
                                    onClick={() =>
                                      removeItem(
                                        index
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTOTAL */}

                  <div
                    style={{
                      marginTop: "15px",
                      textAlign: "right",
                    }}
                  >
                    <strong>
                      Subtotal: Rs.{" "}
                      {calculateSubtotal().toFixed(
                        2
                      )}
                    </strong>
                  </div>
                </div>

                {/* PAYMENT */}

                <div style={cardStyle}>
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "15px",
                    }}
                  >
                    Payment & Charges
                  </h4>

                  <div style={gridStyle}>
                    {/* PAYMENT METHOD */}

                    <div>
                      <label style={labelStyle}>
                        Payment Method
                      </label>

                      <select
                        name="paymentMethod"
                        value={form.paymentMethod}
                        onChange={handleChange}
                        style={inputStyle}
                      >
                        <option value="Cash on Delivery">
                          Cash on Delivery
                        </option>

                        <option value="Online">
                          Online
                        </option>
                      </select>
                    </div>

                    {/* PAYMENT STATUS */}

                    <div>
                      <label style={labelStyle}>
                        Payment Status
                      </label>

                      <select
                        name="paymentStatus"
                        value={form.paymentStatus}
                        onChange={handleChange}
                        style={inputStyle}
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Paid">
                          Paid
                        </option>

                        <option value="Failed">
                          Failed
                        </option>

                        <option value="Refunded">
                          Refunded
                        </option>
                      </select>
                    </div>

                    {/* DELIVERY FEE */}

                    <div>
                      <label style={labelStyle}>
                        Delivery Fee
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="deliveryFee"
                        value={form.deliveryFee}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    {/* DISCOUNT */}

                    <div>
                      <label style={labelStyle}>
                        Discount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="discount"
                        value={form.discount}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* TOTAL */}

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background: "#fff8ef",
                      borderRadius: "6px",
                      textAlign: "right",
                      fontSize: "18px",
                    }}
                  >
                    <strong>
                      Grand Total: Rs.{" "}
                      {calculateTotal().toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* STATUS / NOTES */}

                <div style={cardStyle}>
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "15px",
                    }}
                  >
                    Order Information
                  </h4>

                  <div style={gridStyle}>
                    <div>
                      <label style={labelStyle}>
                        Order Status
                      </label>

                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        style={inputStyle}
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Confirmed">
                          Confirmed
                        </option>

                        <option value="Preparing">
                          Preparing
                        </option>

                        <option value="Ready">
                          Ready
                        </option>

                        <option value="Out for Delivery">
                          Out for Delivery
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Notes
                      </label>

                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        style={{
                          ...inputStyle,
                          minHeight: "90px",
                          resize: "vertical",
                        }}
                        placeholder="Order notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={buttonStyle}
                >
                  {editingId
                    ? "Update Order"
                    : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* VIEW ORDER MODAL */}
      {/* ================================================= */}

      {showViewModal && selectedOrder && (
        <div style={modalOverlayStyle}>
          <div
            style={{
              ...modalStyle,
              maxWidth: "850px",
            }}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Order #
                  {selectedOrder.orderNumber}
                </h3>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "13px",
                    color: "#777",
                  }}
                >
                  {formatDate(
                    selectedOrder.createdAt
                  )}
                </div>
              </div>

              <button
                style={closeButtonStyle}
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                ×
              </button>
            </div>

            <div style={modalBodyStyle}>
              {/* CUSTOMER */}

              <div style={cardStyle}>
                <h4 style={{ marginTop: 0 }}>
                  Customer
                </h4>

                <div style={gridStyle}>
                  <div>
                    <strong>Name</strong>

                    <div>
                      {getCustomerName(
                        selectedOrder
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Phone</strong>

                    <div>
                      {selectedOrder.customerId
                        ?.phone || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ADDRESS */}

              <div style={cardStyle}>
                <h4 style={{ marginTop: 0 }}>
                  Delivery Information
                </h4>

                <div>
                  <strong>Address</strong>

                  <div
                    style={{
                      marginTop: "5px",
                    }}
                  >
                    {
                      selectedOrder
                        .deliveryAddress?.address
                    }
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    display: "flex",
                    gap: "30px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>Date</strong>

                    <div>
                      {formatDate(
                        selectedOrder.deliveryDate
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Slot</strong>

                    <div>
                      {selectedOrder
                        .deliverySlotId
                        ?.startTime || "-"}{" "}
                      -{" "}
                      {selectedOrder
                        .deliverySlotId?.endTime ||
                        "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS */}

              <div style={cardStyle}>
                <h4 style={{ marginTop: 0 }}>
                  Order Items
                </h4>

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
                          background: "#f8f9fa",
                        }}
                      >
                        <th
                          style={{
                            padding: "10px",
                            textAlign:
                              "left",
                          }}
                        >
                          Product
                        </th>

                        <th
                          style={{
                            padding: "10px",
                          }}
                        >
                          Qty
                        </th>

                        <th
                          style={{
                            padding: "10px",
                          }}
                        >
                          Price
                        </th>

                        <th
                          style={{
                            padding: "10px",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedOrder.items ||
                        []).map((item, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              padding: "10px",
                            }}
                          >
                            {item.productName}

                            {item.dealItem && (
                              <span
                                style={{
                                  marginLeft:
                                    "7px",
                                  fontSize:
                                    "11px",
                                  background:
                                    "#fff3cd",
                                  padding:
                                    "3px 6px",
                                  borderRadius:
                                    "4px",
                                }}
                              >
                                Deal
                              </span>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "10px",
                              textAlign:
                                "center",
                            }}
                          >
                            {item.quantity}
                          </td>

                          <td
                            style={{
                              padding: "10px",
                              textAlign:
                                "center",
                            }}
                          >
                            Rs.{" "}
                            {Number(
                              item.unitPrice ||
                                0
                            ).toFixed(2)}
                          </td>

                          <td
                            style={{
                              padding: "10px",
                              textAlign:
                                "center",
                            }}
                          >
                            Rs.{" "}
                            {Number(
                              item.total ||
                                item.quantity *
                                  item.unitPrice ||
                                0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTAL */}

              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                  }}
                >
                  <div
                    style={{
                      minWidth: "250px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        padding: "6px 0",
                      }}
                    >
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        Rs.{" "}
                        {Number(
                          selectedOrder.subtotal ||
                            0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        padding: "6px 0",
                      }}
                    >
                      <span>
                        Discount
                      </span>

                      <strong>
                        - Rs.{" "}
                        {Number(
                          selectedOrder.discount ||
                            0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        padding: "6px 0",
                      }}
                    >
                      <span>
                        Delivery
                      </span>

                      <strong>
                        Rs.{" "}
                        {Number(
                          selectedOrder.deliveryFee ||
                            0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <hr />

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        padding: "8px 0",
                        fontSize: "18px",
                      }}
                    >
                      <strong>
                        Total
                      </strong>

                      <strong>
                        Rs.{" "}
                        {Number(
                          selectedOrder.total ||
                            0
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUS */}

              <div style={cardStyle}>
                <h4 style={{ marginTop: 0 }}>
                  Update Status
                </h4>

                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedOrder,
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Preparing">
                    Preparing
                  </option>

                  <option value="Ready">
                    Ready
                  </option>

                  <option value="Out for Delivery">
                    Out for Delivery
                  </option>

                  <option value="Delivered">
                    Delivered
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TIMELINE MODAL */}
      {/* ================================================= */}

     {showTimelineModal && selectedOrder && (
  <div style={modalOverlayStyle}>
    <div
      style={{
        ...modalStyle,
        maxWidth: "700px",
        width: "95%",
      }}
    >
      {/* Header */}
      <div style={modalHeaderStyle}>
        <div>
          <h3 style={{ margin: 0 }}>
            Order Timeline
          </h3>

          <div
            style={{
              marginTop: "5px",
              fontSize: "13px",
              color: "#777",
            }}
          >
            Order #{selectedOrder.orderNumber}
          </div>
        </div>

        <button
          style={closeButtonStyle}
          onClick={() => setShowTimelineModal(false)}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          ...modalBodyStyle,
          padding: "25px 30px",
          maxHeight: "550px",
          overflowY: "auto",
        }}
      >
        {timeline.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#777",
            }}
          >
            No timeline entries found.
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Vertical timeline line */}
            <div
              style={{
                position: "absolute",
                left: "19px",
                top: "12px",
                bottom: "12px",
                width: "2px",
                background: "#e5e5e5",
              }}
            />

            {timeline.map((entry, index) => {
              const isLast = index === timeline.length - 1;

              const statusText = (entry.status || "")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) =>
                  char.toUpperCase()
                );

              return (
                <div
                  key={entry._id || index}
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: "18px",
                    marginBottom: isLast ? 0 : "28px",
                  }}
                >
                  {/* Timeline circle */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: isLast
                        ? "#f28c28"
                        : "#fff",
                      border: isLast
                        ? "3px solid #f28c28"
                        : "3px solid #f28c28",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    {isLast ? (
                      <span
                        style={{
                          color: "#fff",
                          fontSize: "18px",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#f28c28",
                        }}
                      />
                    )}
                  </div>

                  {/* Timeline content */}
                  <div
                    style={{
                      flex: 1,
                      background: "#fafafa",
                      border: "1px solid #eee",
                      borderRadius: "10px",
                      padding: "15px 18px",
                      marginTop: "-2px",
                    }}
                  >
                    {/* Status + Date */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "15px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#333",
                          }}
                        >
                          {entry.title || statusText}
                        </div>

                        {entry.title && (
                          <div
                            style={{
                              marginTop: "3px",
                              fontSize: "12px",
                              color: "#888",
                            }}
                          >
                            {statusText}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          fontSize: "12px",
                          color: "#777",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.createdAt
                          ? new Date(
                              entry.createdAt
                            ).toLocaleDateString()
                          : ""}

                        <br />

                        <span
                          style={{
                            color: "#999",
                          }}
                        >
                          {entry.createdAt
                            ? new Date(
                                entry.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    {(entry.message || entry.note) && (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#555",
                        }}
                      >
                        {entry.message || entry.note}
                      </div>
                    )}

                    {/* Changed by */}
                    {entry.changedBy && (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "10px",
                          borderTop: "1px solid #eee",
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        Updated by:{" "}
                        <strong
                          style={{ color: "#555" }}
                        >
                          {entry.changedBy.firstName
                            ? `${entry.changedBy.firstName} ${
                                entry.changedBy.lastName || ""
                              }`
                            : entry.changedBy.phone ||
                              entry.changedBy.role ||
                              "System"}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={modalFooterStyle}>
        <button
          style={secondaryButtonStyle}
          onClick={() => setShowTimelineModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Orders;