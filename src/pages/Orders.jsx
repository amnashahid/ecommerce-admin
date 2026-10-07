import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const STATUS_FLOW = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_META = {
  Pending: {
    icon: "○",
    color: "#f59e0b",
    bg: "#fff7ed",
    description: "Order has been placed and is waiting for confirmation.",
  },
  Confirmed: {
    icon: "✓",
    color: "#3b82f6",
    bg: "#eff6ff",
    description: "Order has been confirmed.",
  },
  Preparing: {
    icon: "⚙",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    description: "Order is being prepared.",
  },
  Ready: {
    icon: "✓",
    color: "#06b6d4",
    bg: "#ecfeff",
    description: "Order is ready for dispatch.",
  },
  "Out for Delivery": {
    icon: "➜",
    color: "#f97316",
    bg: "#fff7ed",
    description: "Order is on its way to the customer.",
  },
  Delivered: {
    icon: "✓",
    color: "#16a34a",
    bg: "#f0fdf4",
    description: "Order has been delivered successfully.",
  },
  Cancelled: {
    icon: "×",
    color: "#dc2626",
    bg: "#fef2f2",
    description: "Order has been cancelled.",
  },
};

const EMPTY_ITEM = {
  productId: "",
  productName: "",
  productNameUr: "",
  quantity: 1,
  unitPrice: 0,
  dealId: "",
  dealItem: false,
};

const EMPTY_FORM = {
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

const authConfig = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

/* =========================================================
   HELPERS
========================================================= */

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        value.orderId ||
        value.value ||
        ""
    );
  }

  return String(value);
};

const getOrderId = (order) => {
  if (!order) return "";

  const directId =
    order._id ||
    order.id ||
    order.orderId;

  if (directId) {
    return getId(directId);
  }

  if (order.order) {
    const nestedId =
      order.order._id ||
      order.order.id ||
      order.order.orderId;

    if (nestedId) {
      return getId(nestedId);
    }
  }

  return "";
};

const normalizeStatus = (status) => {
  if (!status) return "";

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
};

const getStatusName = (item) => {
  if (!item) return "";

  return (
    item.status ||
    item.newStatus ||
    item.orderStatus ||
    item.statusName ||
    ""
  );
};

const getTimelineMessage = (item) => {
  if (!item) return "";

  return (
    item.message ||
    item.note ||
    item.description ||
    item.reason ||
    ""
  );
};

const getTimelineDate = (item) => {
  if (!item) return null;

  return (
    item.createdAt ||
    item.updatedAt ||
    item.date ||
    item.timestamp ||
    item.created_on ||
    null
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "No timestamp";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getArrayResponse = (response, type = "") => {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.deliverySlots)) return data.deliverySlots;

  if (Array.isArray(data?.data?.orders)) {
    return data.data.orders;
  }

  if (Array.isArray(data?.data?.customers)) {
    return data.data.customers;
  }

  if (Array.isArray(data?.data?.deliverySlots)) {
    return data.data.deliverySlots;
  }

  if (type === "orders" && Array.isArray(data?.result)) {
    return data.result;
  }

  return [];
};

const getObjectResponse = (response, fallback = null) => {
  const data = response?.data;

  if (data?.data && typeof data.data === "object") {
    if (data.data.order && typeof data.data.order === "object") {
      return data.data.order;
    }

    return data.data;
  }

  if (data?.order && typeof data.order === "object") {
    return data.order;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data;
  }

  return fallback;
};

const getCustomerName = (order, customers) => {
  if (!order) return "—";

  if (typeof order.customerId === "object") {
    return (
      order.customerId?.name ||
      "Customer"
    );
  }

  if (order.customer?.name) {
    return order.customer.name;
  }

  const customerId = getId(order.customerId);

  const customer = customers.find(
    (item) => getId(item) === customerId
  );

  if (!customer) return customerId || "—";

  return (
    customer.name ||
    customer.fullName ||
    customer.email ||
    "Customer"
  );
};

const getCustomerPhone = (order, customers) => {
  if (!order) return "";

  if (typeof order.customerId === "object") {
    return (
      order.customerId?.phone ||
      ""
    );
  }

  if (order.customer?.phone) {
    return order.customer.phone;
  }

  const customerId = getId(order.customerId);

  const customer = customers.find(
    (item) => getId(item) === customerId
  );

  return customer?.phone || customer?.mobile || "";
};

const getOrderTotal = (order) => {
  if (!order) return 0;

  // if (
  //   order.totalAmount !== undefined &&
  //   order.totalAmount !== null
  // ) {
  //   return Number(order.totalAmount) || 0;
  // }

  // if (
  //   order.grandTotal !== undefined &&
  //   order.grandTotal !== null
  // ) {
  //   return Number(order.grandTotal) || 0;
  // }

  // if (
  //   order.total !== undefined &&
  //   order.total !== null
  // ) {
  //   return Number(order.total) || 0;
  // }

  const itemTotal = (order.items || []).reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(
          item.unitPrice ??
            item.price ??
            0
        ),
    0
  );
  return (
    itemTotal +
    Number(order.deliveryFee || 0) -
    Number(order.discount || 0)
  );
};

const getItemPrice = (item) => {
  return Number(
    item?.unitPrice ??
      item?.price ??
      item?.salePrice ??
      0
  );
};

const getItemName = (item) => {
  return (
    item?.productName ||
    item?.nameEn ||
    item?.product?.nameEn ||
    item?.product?.name ||
    "Product"
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliverySlots, setDeliverySlots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [timelineStatus, setTimelineStatus] =
    useState("Pending");
  const [updatingTimelineStatus, setUpdatingTimelineStatus] =
    useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/orders`,
        authConfig()
      );

      const data = getArrayResponse(response, "orders");

      console.log("ORDERS API RESPONSE:", response.data);
      console.log("NORMALIZED ORDERS:", data);

      setOrders(data);
    } catch (err) {
      console.error("Load orders error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/users/customers`,
        authConfig()
      );

      setCustomers(
        getArrayResponse(response, "customers")
      );
    } catch (err) {
      console.error("Load customers error:", err);
    }
  };

  const loadSingleOrder = async (orderId, fallback = null) => {
    const id = getId(orderId);

    if (!id) {
      throw new Error("Order ID is missing.");
    }

    const response = await axios.get(
      `${API_URL}/orders/${id}`,
      authConfig()
    );

    console.log(
      "SINGLE ORDER API RESPONSE:",
      response.data
    );

    const order = getObjectResponse(response, fallback);

    if (!order) {
      throw new Error("Order was not returned by the server.");
    }

    return {
      ...order,
      _id: getOrderId(order) || id,
    };
  };

  const loadOrderTimeline = async (orderId) => {
    const id = getId(orderId);

    console.log("TIMELINE ORDER ID:", id);

    if (!id) {
      throw new Error(
        "Order ID is missing from the selected order."
      );
    }

    const response = await axios.get(
      `${API_URL}/orders/${id}/timeline`,
      authConfig()
    );

    console.log(
      "ORDER TIMELINE API RESPONSE:",
      response.data
    );

    const responseData = response?.data;

    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.timeline)) {
      return responseData.timeline;
    }

    if (Array.isArray(responseData?.data?.timeline)) {
      return responseData.data.timeline;
    }

    return [];
  };

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filter !== "All") {
      if (filter === "New") {
        result = result.filter(
          (order) =>
            normalizeStatus(order.status) ===
            normalizeStatus("Pending")
        );
      }

      if (filter === "Processing") {
        result = result.filter((order) =>
          ["Confirmed", "Preparing", "Ready"].includes(
            order.status
          )
        );
      }

      if (filter === "Delivery") {
        result = result.filter(
          (order) =>
            normalizeStatus(order.status) ===
            normalizeStatus("Out for Delivery")
        );
      }

      if (filter === "Completed") {
        result = result.filter(
          (order) =>
            normalizeStatus(order.status) ===
            normalizeStatus("Delivered")
        );
      }

      if (filter === "Cancelled") {
        result = result.filter(
          (order) =>
            normalizeStatus(order.status) ===
            normalizeStatus("Cancelled")
        );
      }
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((order) => {
        const id = getOrderId(order);

        const customer = getCustomerName(
          order,
          customers
        );

        const phone = getCustomerPhone(
          order,
          customers
        );

        return (
          id.toLowerCase().includes(query) ||
          customer.toLowerCase().includes(query) ||
          phone.toLowerCase().includes(query) ||
          String(order.status || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [orders, customers, filter, search]);

  const orderSummary = useMemo(() => {
    const statuses = orders.map((order) =>
      normalizeStatus(order.status)
    );

    return {
      total: orders.length,
      pending: statuses.filter(
        (status) => status === normalizeStatus("Pending")
      ).length,
      inProgress: statuses.filter((status) =>
        ["confirmed", "preparing", "ready", "out for delivery"].includes(
          status
        )
      ).length,
      delivered: statuses.filter(
        (status) => status === normalizeStatus("Delivered")
      ).length,
    };
  }, [orders]);

  /* =======================================================
     FORM
  ======================================================= */

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      items: [],
    });

    setEditingId("");
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setMessage("");
    setShowFormModal(true);
  };

  const openEditModal = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      setError(
        "This order does not contain a valid ID. Check the Orders API response."
      );
      console.error("ORDER WITHOUT ID:", order);
      return;
    }

    try {
      setError("");

      const latestOrder = await loadSingleOrder(
        orderId,
        order
      );

      setEditingId(orderId);

      setForm({
        customerId: getId(
          latestOrder.customerId
        ),
        addressId: getId(
          latestOrder.addressId
        ),
        deliveryDate:
          latestOrder.deliveryDate
            ? String(
                latestOrder.deliveryDate
              ).substring(0, 10)
            : "",
        deliverySlotId: getId(
          latestOrder.deliverySlotId
        ),
        deliveryAddress:
          latestOrder.deliveryAddress || "",
        paymentMethod:
          latestOrder.paymentMethod ||
          "Cash on Delivery",
        paymentStatus:
          latestOrder.paymentStatus ||
          "Pending",
        deliveryFee:
          latestOrder.deliveryFee || 0,
        discount:
          latestOrder.discount || 0,
        notes: latestOrder.notes || "",
        status:
          latestOrder.status || "Pending",
        items: (latestOrder.items || []).map(
          (item) => ({
            productId: getId(
              item.productId
            ),
            productName:
              getItemName(item),
            productNameUr:
              item.productNameUr || "",
            quantity:
              Number(item.quantity) || 1,
            unitPrice:
              getItemPrice(item),
            dealId:
              getId(item.dealId),
            dealItem:
              Boolean(item.dealItem),
          })
        ),
      });

      setShowFormModal(true);
    } catch (err) {
      console.error("Open edit error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load order."
      );
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...EMPTY_ITEM,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  };

  const saveOrder = async (event) => {
    event.preventDefault();

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!form.items.length) {
      setError(
        "Please add at least one order item."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        customerId: form.customerId,
        addressId:
          form.addressId || null,
        deliveryDate:
          form.deliveryDate || null,
        deliverySlotId:
          form.deliverySlotId || null,

        deliveryAddress:
          form.deliveryAddress || "",

        items: form.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productNameUr:
            item.productNameUr || "",
          quantity:
            Number(item.quantity) || 1,
          unitPrice:
            Number(item.unitPrice) || 0,
          dealId:
            item.dealId || null,
          dealItem:
            Boolean(item.dealId),
        })),

        deliveryFee:
          Number(form.deliveryFee || 0),

        discount:
          Number(form.discount || 0),

        paymentMethod:
          form.paymentMethod,

        paymentStatus:
          form.paymentStatus,

        notes: form.notes,

        status:
          form.status,
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/orders/${editingId}`,
          payload,
          authConfig()
        );

        setMessage(
          "Order updated successfully."
        );
      } else {
        await axios.post(
          `${API_URL}/orders`,
          payload,
          authConfig()
        );

        setMessage(
          "Order created successfully."
        );
      }

      setShowFormModal(false);
      resetForm();

      await loadOrders();
    } catch (err) {
      console.error("Save order error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to save order."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     VIEW ORDER
  ======================================================= */

  const openViewModal = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      setError(
        "Order ID is missing from this order."
      );
      console.error(
        "VIEW ORDER WITHOUT ID:",
        order
      );
      return;
    }

    try {
      setError("");

        // const latestOrder =
        //   await loadSingleOrder(
        //     orderId,
        //     order
        //   );

      setSelectedOrder(...[order]);
      setShowViewModal(true);
    } catch (err) {
      console.error("View order error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load order."
      );
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteOrder = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      setError(
        "Order ID is missing. The order cannot be deleted."
      );
      console.error(
        "DELETE ORDER WITHOUT ID:",
        order
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await axios.delete(
        `${API_URL}/orders/${orderId}`,
        authConfig()
      );

      setMessage(
        "Order deleted successfully."
      );

      await loadOrders();
    } catch (err) {
      console.error("Delete order error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to delete order."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     TIMELINE
  ======================================================= */

  const openTimelineModal = async (order) => {
    console.log(
      "TIMELINE CLICKED ORDER:",
      order
    );

    const orderId = getOrderId(order);

    console.log(
      "RESOLVED TIMELINE ORDER ID:",
      orderId
    );

    setTimeline([]);
    setTimelineError("");

    if (!orderId) {
      setSelectedOrder(order);
      setTimelineStatus(
        order?.status || "Pending"
      );
      setShowTimelineModal(true);

      setTimelineError(
        "Order ID is missing from this order record. Open the browser console and check the order object returned by GET /orders."
      );

      return;
    }

    setSelectedOrder({
      ...order,
      _id: orderId,
    });

    setTimelineStatus(
      order?.status || "Pending"
    );

    setShowTimelineModal(true);
    setTimelineLoading(true);

    try {
      const latestOrder =
        await loadSingleOrder(
          orderId,
          order
        );

      const normalizedLatestOrder = {
        ...latestOrder,
        _id:
          getOrderId(latestOrder) ||
          orderId,
      };

      setSelectedOrder(
        normalizedLatestOrder
      );

      setTimelineStatus(
        normalizedLatestOrder.status ||
          order.status ||
          "Pending"
      );

      const timelineData =
        await loadOrderTimeline(
          orderId
        );

      console.log(
        "NORMALIZED TIMELINE:",
        timelineData
      );

      setTimeline(
        Array.isArray(timelineData)
          ? timelineData
          : []
      );
    } catch (err) {
      console.error(
        "Timeline API ERROR:",
        err
      );

      setTimelineError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to load order timeline."
      );

      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const getLatestTimelineForStatus = (
    status
  ) => {
    const matches = timeline.filter(
      (item) =>
        normalizeStatus(
          getStatusName(item)
        ) === normalizeStatus(status)
    );

    if (!matches.length) {
      return null;
    }

    return [...matches].sort((a, b) => {
      const dateA = new Date(
        getTimelineDate(a) || 0
      ).getTime();

      const dateB = new Date(
        getTimelineDate(b) || 0
      ).getTime();

      return dateB - dateA;
    })[0];
  };

  const isTimelineReached = (status) => {
    return Boolean(
      getLatestTimelineForStatus(status)
    );
  };

  const getTimelineStepState = (
    status,
    index
  ) => {
    const currentStatus =
      selectedOrder?.status ||
      "Pending";

    const currentIndex =
      STATUS_FLOW.findIndex(
        (item) =>
          normalizeStatus(item) ===
          normalizeStatus(currentStatus)
      );

    const reached =
      isTimelineReached(status);

    const statusIndex = index;

    if (
      normalizeStatus(status) ===
      normalizeStatus("Cancelled")
    ) {
      if (reached) return "completed";
      if (
        normalizeStatus(currentStatus) ===
        normalizeStatus("Cancelled")
      ) {
        return "current";
      }
      return "future";
    }

    if (reached) {
      if (
        normalizeStatus(status) ===
        normalizeStatus(currentStatus)
      ) {
        return "current";
      }

      return "completed";
    }

    if (
      normalizeStatus(status) ===
      normalizeStatus(currentStatus)
    ) {
      return "current";
    }

    if (
      currentIndex >= 0 &&
      statusIndex < currentIndex
    ) {
      return "not-recorded";
    }

    return "future";
  };

  const updateTimelineStatus = async () => {
    const orderId =
      getOrderId(selectedOrder);

    console.log(
      "STATUS UPDATE ORDER:",
      selectedOrder
    );

    console.log(
      "STATUS UPDATE ORDER ID:",
      orderId
    );

    if (!orderId) {
      setTimelineError(
        "Order ID is missing from the selected order."
      );
      return;
    }

    if (!timelineStatus) {
      setTimelineError(
        "Please select a status."
      );
      return;
    }

    if (
      normalizeStatus(
        selectedOrder?.status
      ) ===
      normalizeStatus(timelineStatus)
    ) {
      setTimelineError(
        "Order is already at this status."
      );
      return;
    }

    try {
      setUpdatingTimelineStatus(true);
      setTimelineError("");
      setMessage("");

      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        {
          status: timelineStatus,
        },
        authConfig()
      );

      const latestOrder =
        await loadSingleOrder(
          orderId,
          selectedOrder
        );

      const normalizedOrder = {
        ...latestOrder,
        _id:
          getOrderId(latestOrder) ||
          orderId,
      };

      const latestTimeline =
        await loadOrderTimeline(
          orderId
        );

      setSelectedOrder(
        normalizedOrder
      );

      setTimeline(
        Array.isArray(latestTimeline)
          ? latestTimeline
          : []
      );

      setTimelineStatus(
        normalizedOrder.status ||
          timelineStatus
      );

      await loadOrders();

      setMessage(
        `Order status changed to "${normalizedOrder.status || timelineStatus}".`
      );
    } catch (err) {
      console.error(
        "Timeline status update error:",
        err
      );

      setTimelineError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingTimelineStatus(false);
    }
  };

  /* =======================================================
     QUICK STATUS FROM TABLE
  ======================================================= */

  const handleStatusChange = async (
    order,
    status
  ) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      setError(
        "Order ID is missing from this order."
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        {
          status,
        },
        authConfig()
      );

      await loadOrders();

      setMessage(
        `Order status changed to ${status}.`
      );
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to update order status."
      );
    }
  };

  /* =======================================================
     TOTALS
  ======================================================= */

  const formSubtotal = form.items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(item.unitPrice || 0),
    0
  );

  const formTotal =
    formSubtotal +
    Number(form.deliveryFee || 0) -
    Number(form.discount || 0);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="orders-page">
      <style>{`
        .orders-page *,
        .orders-page *::before,
        .orders-page *::after {
          box-sizing: border-box;
        }

        .orders-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at top left, rgba(255, 237, 213, .52), transparent 34%),
            #f5f7fb;
          padding: 36px clamp(20px, 3vw, 48px);
          color: #182230;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .orders-container {
          max-width: 1480px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
        }

        .page-title {
          margin: 0;
          color: #172033;
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 800;
          letter-spacing: -1.1px;
          line-height: 1.1;
        }

        .page-subtitle {
          margin: 9px 0 0;
          color: #748094;
          font-size: 14px;
        }

        .primary-button {
          border: 0;
          background: linear-gradient(135deg, #f49732, #ed7b1a);
          color: white;
          padding: 12px 17px;
          border-radius: 11px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 7px 15px rgba(237, 123, 26, .2);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .primary-button:hover {
          background: linear-gradient(135deg, #ed8723, #df6f12);
          box-shadow: 0 10px 20px rgba(237, 123, 26, .27);
          transform: translateY(-2px);
        }

        .primary-button:focus-visible,
        .action-button:focus-visible,
        .filter-button:focus-visible,
        .close-button:focus-visible,
        .secondary-button:focus-visible {
          outline: 3px solid rgba(242, 140, 40, .3);
          outline-offset: 2px;
        }

        .orders-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .summary-card {
          position: relative;
          overflow: hidden;
          min-height: 112px;
          padding: 18px 20px;
          border: 1px solid #e8ecf2;
          border-radius: 15px;
          background: rgba(255, 255, 255, .92);
          box-shadow: 0 5px 18px rgba(28, 39, 60, .035);
        }

        .summary-card::after {
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: var(--summary-color, #f28c28);
          content: "";
          opacity: .9;
        }

        .summary-label {
          color: #758196;
          font-size: 12px;
          font-weight: 650;
          letter-spacing: .15px;
        }

        .summary-value {
          display: block;
          margin-top: 8px;
          color: #182230;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -.7px;
          line-height: 1;
        }

        .summary-caption {
          margin-top: 7px;
          color: #9aa3b2;
          font-size: 11px;
        }

        .toolbar {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 15px;
          padding: 14px;
          margin-bottom: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          box-shadow: 0 5px 18px rgba(28, 39, 60, .035);
        }

        .search-box {
          flex: 1;
          min-width: 240px;
          position: relative;
        }

        .search-box input {
          width: 100%;
          height: 43px;
          border: 1px solid #e2e7ee;
          border-radius: 10px;
          padding: 0 14px;
          outline: none;
          font-size: 14px;
          color: #293446;
          background: #fbfcfe;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .search-box input::placeholder {
          color: #a0a9b7;
        }

        .search-box input:focus {
          border-color: #f28c28;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(242, 140, 40, .11);
        }

        .filter-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-button {
          border: 1px solid transparent;
          background: #f6f7f9;
          padding: 9px 12px;
          border-radius: 9px;
          cursor: pointer;
          color: #697588;
          font-size: 12px;
          font-weight: 600;
          transition: color .16s ease, background .16s ease, border-color .16s ease;
        }

        .filter-button:hover {
          background: #fff8f0;
          color: #c96c13;
        }

        .filter-button.active {
          background: #fff2e3;
          border-color: #ffd5ad;
          color: #c96c13;
        }

        .alert {
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 14px;
          font-size: 14px;
        }

        .alert-error {
          background: #fff0f0;
          border: 1px solid #ffd1d1;
          color: #b42318;
        }

        .alert-success {
          background: #ecfdf3;
          border: 1px solid #b7ebc9;
          color: #087443;
        }

        .table-card {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(28, 39, 60, .045);
        }

        .table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 19px 21px;
          border-bottom: 1px solid #edf0f4;
        }

        .table-title {
          margin: 0;
          color: #202b3b;
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -.15px;
        }

        .table-description {
          margin-top: 4px;
          color: #8b96a7;
          font-size: 12px;
        }

        .result-count {
          flex-shrink: 0;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f4f6f9;
          color: #697588;
          font-size: 11px;
          font-weight: 700;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .orders-page table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .orders-page th {
          text-align: left;
          padding: 13px 16px;
          background: #f8f9fb;
          border-bottom: 1px solid #e9edf2;
          color: #8390a2;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .65px;
          white-space: nowrap;
        }

        .orders-page td {
          padding: 15px 16px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: middle;
          color: #4e596b;
          font-size: 13px;
        }

        .orders-page tbody tr {
          transition: background .15s ease;
        }

        .orders-page tbody tr:hover {
          background: #fffaf5;
        }

        .orders-page tbody tr:last-child td {
          border-bottom: 0;
        }

        .order-id {
          font-weight: 800;
          color: #263247;
          letter-spacing: .1px;
        }

        .customer-name {
          font-weight: 700;
          margin-bottom: 3px;
          color: #354155;
        }

        .customer-phone {
          font-size: 12px;
          color: #929dad;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-select {
          max-width: 150px;
          border: 1px solid #e2e7ee;
          border-radius: 8px;
          padding: 7px 26px 7px 9px;
          background: #fff;
          font-size: 12px;
          outline: none;
          color: #475467;
          cursor: pointer;
        }

        .status-select:focus {
          border-color: #f28c28;
          box-shadow: 0 0 0 3px rgba(242, 140, 40, .1);
        }

        .actions {
          display: flex;
          gap: 5px;
          flex-wrap: nowrap;
        }

        .action-button {
          border: 1px solid #e3e7ed;
          background: white;
          border-radius: 7px;
          padding: 7px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          color: #687487;
          transition: color .15s ease, background .15s ease, border-color .15s ease;
          white-space: nowrap;
        }

        .action-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .action-button:hover {
          border-color: #f28c28;
          color: #c96c13;
          background: #fffaf5;
        }

        .action-button.timeline {
          border-color: #f7d5b2;
          color: #bd6818;
          background: #fff8f0;
        }

        .action-button.danger {
          color: #b42318;
        }

        .action-button.danger:hover {
          border-color: #f3c2bd;
          background: #fff5f4;
        }

        .empty-state {
          padding: 70px 20px;
          text-align: center;
          color: #8490a1;
        }

        .loading {
          padding: 70px;
          text-align: center;
          color: #8490a1;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, .58);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
          backdrop-filter: blur(3px);
        }

        .modal {
          background: white;
          width: min(900px, 100%);
          max-height: 90vh;
          border: 1px solid rgba(255, 255, 255, .65);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 28px 90px rgba(14, 24, 42, .28);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-shrink: 0;
          background: linear-gradient(110deg, #fffaf4, #fff 65%);
        }

        .modal-title {
          margin: 0;
          color: #202b3b;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .modal-subtitle {
          margin: 4px 0 0;
          color: #8b96a7;
          font-size: 12px;
        }

        .close-button {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 0;
          background: #f4f4f5;
          cursor: pointer;
          font-size: 18px;
          color: #555;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 15px 24px;
          border-top: 1px solid #edf0f4;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
          background: #fbfcfd;
        }

        .secondary-button {
          border: 1px solid #e0e5ec;
          background: white;
          color: #586579;
          padding: 10px 15px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color .16s ease, color .16s ease, background .16s ease;
        }

        .secondary-button:hover {
          border-color: #f2bd8d;
          color: #bd6818;
          background: #fffaf5;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 12px;
          color: #666;
          font-weight: 700;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 9px;
          padding: 10px 11px;
          font-size: 14px;
          outline: none;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #f28c28;
          box-shadow: 0 0 0 3px rgba(242,140,40,.08);
        }

        .form-textarea {
          min-height: 90px;
          resize: vertical;
        }

        .section-box {
          border: 1px solid #e9e9e9;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
        }

        .section-box-title {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 13px;
        }

        .item-row {
          display: grid;
          grid-template-columns: 1.5fr .7fr .7fr 38px;
          gap: 8px;
          margin-bottom: 9px;
        }

        .remove-item {
          border: 0;
          border-radius: 8px;
          background: #fff0f0;
          color: #d92d20;
          cursor: pointer;
          font-weight: 800;
        }

        .add-item {
          border: 1px dashed #f28c28;
          color: #d96f0b;
          background: #fffaf5;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 700;
        }

        .totals {
          margin-left: auto;
          width: min(320px,100%);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 13px;
        }

        .total-row.grand {
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 3px;
          color: #222;
          font-size: 17px;
          font-weight: 800;
        }

        /* VIEW */

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .detail-card {
          background: #fbfcfe;
          border: 1px solid #e9edf2;
          border-radius: 12px;
          padding: 15px;
        }

        .detail-label {
          color: #8a95a6;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: .55px;
          margin-bottom: 5px;
        }

        .detail-value {
          font-weight: 700;
          color: #344054;
          font-size: 14px;
          line-height: 1.45;
        }

        .items-table {
          width: 100%;
          min-width: 0;
        }

        .items-table th,
        .items-table td {
          padding: 10px;
        }

        .section-box {
          border-color: #e9edf2;
          border-radius: 13px;
        }

        .section-box-title {
          color: #344054;
          letter-spacing: -.1px;
        }

        /* =====================================================
           TIMELINE MODAL
        ===================================================== */

        .timeline-modal {
          width: min(720px, 100%);
          max-height: 82vh;
        }

        .timeline-header {
          background:
            linear-gradient(
              135deg,
              #fff9f2 0%,
              #ffffff 65%
            );
        }

        .timeline-order-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .timeline-order-id {
          font-weight: 800;
          color: #222;
        }

        .timeline-current-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          background: #fff0dc;
          color: #d96f0b;
          font-size: 11px;
          font-weight: 800;
        }

        .timeline-status-panel {
          background: #f9fafb;
          border: 1px solid #e8eaed;
          border-radius: 13px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .timeline-status-panel-title {
          font-size: 12px;
          font-weight: 800;
          color: #444;
          margin-bottom: 9px;
        }

        .timeline-status-controls {
          display: flex;
          gap: 9px;
          align-items: center;
        }

        .timeline-status-controls select {
          flex: 1;
          height: 42px;
          border: 1px solid #d8d8d8;
          border-radius: 9px;
          background: white;
          padding: 0 11px;
          font-weight: 600;
          outline: none;
        }

        .timeline-status-controls select:focus {
          border-color: #f28c28;
        }

        .update-status-button {
          height: 42px;
          padding: 0 17px;
          border: 0;
          border-radius: 9px;
          background: #f28c28;
          color: white;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .update-status-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .timeline-error {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #fff1f1;
          border: 1px solid #ffd0d0;
          color: #b42318;
          font-size: 12px;
        }

        .timeline-scroll {
          max-height: 440px;
          overflow-y: auto;
          padding: 4px 8px 4px 2px;
        }

        .timeline-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .timeline-scroll::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 10px;
        }

        .timeline-scroll::-webkit-scrollbar-thumb {
          background: #d4d4d4;
          border-radius: 10px;
        }

        .timeline {
          position: relative;
          padding: 5px 5px 5px 3px;
        }

        .timeline::before {
          content: "";
          position: absolute;
          left: 20px;
          top: 21px;
          bottom: 21px;
          width: 2px;
          background: #e6e6e6;
        }

        .timeline-item {
          position: relative;
          display: flex;
          gap: 15px;
          min-height: 77px;
        }

        .timeline-node {
          position: relative;
          z-index: 2;
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,.1);
        }

        .timeline-content {
          flex: 1;
          min-width: 0;
          padding: 1px 0 19px;
        }

        .timeline-content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .timeline-status-name {
          font-size: 14px;
          font-weight: 800;
        }

        .timeline-state {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .timeline-time {
          color: #8b8b8b;
          font-size: 11px;
          margin-top: 3px;
        }

        .timeline-message {
          margin-top: 6px;
          color: #666;
          font-size: 12px;
          line-height: 1.45;
          background: #fafafa;
          border: 1px solid #eee;
          border-radius: 7px;
          padding: 7px 9px;
        }

        .timeline-not-reached {
          color: #aaa;
          font-size: 11px;
          margin-top: 5px;
          font-style: italic;
        }

        .timeline-item.completed .timeline-node {
          color: white;
        }

        .timeline-item.current .timeline-node {
          color: white;
          box-shadow:
            0 0 0 5px rgba(242,140,40,.12),
            0 2px 7px rgba(0,0,0,.12);
        }

        .timeline-item.current
          .timeline-status-name {
          color: #d96f0b;
        }

        .timeline-item.future .timeline-node,
        .timeline-item.not-recorded .timeline-node {
          background: #f1f2f4;
          color: #aaa;
          box-shadow: none;
        }

        .timeline-item.future
          .timeline-status-name,
        .timeline-item.not-recorded
          .timeline-status-name {
          color: #999;
        }

        .timeline-current-label {
          display: inline-flex;
          margin-left: 7px;
          background: #fff0dc;
          color: #d96f0b;
          padding: 3px 6px;
          border-radius: 5px;
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 900;
          vertical-align: middle;
        }

        .timeline-loading {
          padding: 50px 20px;
          text-align: center;
          color: #888;
        }

        .timeline-empty {
          padding: 14px;
          border: 1px dashed #ddd;
          border-radius: 9px;
          color: #888;
          text-align: center;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .timeline-legend {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #eee;
          font-size: 11px;
          color: #777;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #16a34a;
        }

        .legend-dot.current {
          background: #f28c28;
        }

        .legend-dot.pending {
          background: #ddd;
        }

        @media (max-width: 750px) {
          .orders-page {
            padding: 22px 16px;
          }

          .orders-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .summary-card {
            min-height: 100px;
            padding: 15px;
          }

          .summary-value {
            font-size: 24px;
          }

          .toolbar {
            align-items: stretch;
          }

          .search-box {
            min-width: 100%;
          }

          .filter-group {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }

          .filter-button {
            flex: 0 0 auto;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 16px;
          }

          .page-header .primary-button {
            width: 100%;
          }

          .form-grid,
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full {
            grid-column: auto;
          }

          .timeline-modal {
            max-height: 90vh;
          }

          .timeline-status-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .timeline-scroll {
            max-height: 45vh;
          }

          .table-heading {
            padding: 16px;
          }

          .modal-overlay {
            padding: 12px;
          }

          .modal-header,
          .modal-body {
            padding: 18px;
          }

          .modal-footer {
            padding: 13px 18px;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 420px) {
          .orders-summary {
            gap: 8px;
          }

          .summary-card {
            padding: 13px 12px;
          }

          .summary-label {
            font-size: 11px;
          }

          .summary-value {
            font-size: 22px;
          }

          .table-description {
            max-width: 210px;
          }
        }
      `}</style>

      <div className="orders-container">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Orders
            </h1>

            <p className="page-subtitle">
              Manage customer orders, delivery,
              payment and order status.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openCreateModal}
          >
            + Create Order
          </button>
        </div>

        <section className="orders-summary" aria-label="Order overview">
          <div className="summary-card" style={{ "--summary-color": "#f28c28" }}>
            <span className="summary-label">All orders</span>
            <strong className="summary-value">
              {loading ? "—" : orderSummary.total}
            </strong>
            <p className="summary-caption">Orders in your store</p>
          </div>
          <div className="summary-card" style={{ "--summary-color": "#e4a11b" }}>
            <span className="summary-label">Awaiting confirmation</span>
            <strong className="summary-value">
              {loading ? "—" : orderSummary.pending}
            </strong>
            <p className="summary-caption">New orders to review</p>
          </div>
          <div className="summary-card" style={{ "--summary-color": "#6778dc" }}>
            <span className="summary-label">In progress</span>
            <strong className="summary-value">
              {loading ? "—" : orderSummary.inProgress}
            </strong>
            <p className="summary-caption">Being prepared or delivered</p>
          </div>
          <div className="summary-card" style={{ "--summary-color": "#2ea879" }}>
            <span className="summary-label">Delivered</span>
            <strong className="summary-value">
              {loading ? "—" : orderSummary.delivered}
            </strong>
            <p className="summary-caption">Successfully completed</p>
          </div>
        </section>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search order, customer, phone or status..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="filter-group">
            {[
              "All",
              "New",
              "Processing",
              "Delivery",
              "Completed",
              "Cancelled",
            ].map((item) => (
              <button
                key={item}
                className={`filter-button ${
                  filter === item
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter(item)
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="table-card">
          <div className="table-heading">
            <div>
              <h2 className="table-title">Order list</h2>
              <p className="table-description">
                Review customer details, delivery dates and order status.
              </p>
            </div>
            <span className="result-count">
              {loading
                ? "Loading"
                : `${filteredOrders.length} ${filteredOrders.length === 1 ? "order" : "orders"}`}
            </span>
          </div>

          {loading ? (
            <div className="loading">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div
                style={{
                  fontSize: 38,
                  marginBottom: 10,
                }}
              >
                🛒
              </div>

              <strong>
                No orders found
              </strong>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 13,
                }}
              >
                Try changing your search or
                filter.
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Delivery</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order, index) => {
                      const orderId =
                        getOrderId(order);

                      const customerName =
                        getCustomerName(
                          order,
                          customers
                        );

                      const customerPhone =
                        getCustomerPhone(
                          order,
                          customers
                        );

                      const status =
                        order.status ||
                        "Pending";

                      return (
                        <tr
                          key={
                            orderId ||
                            `order-${index}`
                          }
                        >
                          <td>
                            <div className="order-id">
                              #
                              {orderId ||
                                "N/A"}
                            </div>

                            <div
                              style={{
                                color: "#999",
                                fontSize: 11,
                                marginTop: 3,
                              }}
                            >
                              {order.items
                                ?.length ||
                                0}{" "}
                              item(s)
                            </div>
                          </td>

                          <td>
                            <div className="customer-name">
                              {
                                customerName
                              }
                            </div>

                            {customerPhone && (
                              <div className="customer-phone">
                                {
                                  customerPhone
                                }
                              </div>
                            )}
                          </td>

                          <td>
                            {formatDate(
                              order.createdAt ||
                                order.orderDate ||
                                order.deliveryDate
                            )}
                          </td>

                          <td>
                            <div>
                              {formatDate(
                                order.deliveryDate
                              )}
                            </div>

                            <div
                              style={{
                                color: "#999",
                                fontSize: 11,
                                marginTop: 3,
                              }}
                            >
                              {order.deliverySlot
                                ?.name ||
                                order.deliverySlotName ||
                                ""}
                            </div>
                          </td>

                          <td>
                            <strong>
                              Rs.{" "}
                              {getOrderTotal(
                                order
                              ).toLocaleString()}
                            </strong>
                          </td>

                          <td>
                            {/* <select
                              className="status-select"
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order,
                                  e.target.value
                                )
                              }
                            >
                              {STATUS_FLOW.map(
                                (item) => (
                                  <option
                                    key={item}
                                    value={
                                      item
                                    }
                                  >
                                    {item}
                                  </option>
                                )
                              )}
                            </select> */}
                            {status}
                          </td>

                          <td>
                            <div className="actions">
                              <button
                                className="action-button"
                                onClick={() =>
                                  openViewModal(
                                    order
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                className="action-button"
                                onClick={() =>
                                  openEditModal(
                                    order
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="action-button timeline"
                                onClick={() =>
                                  openTimelineModal(
                                    order
                                  )
                                }
                              >
                                Timeline
                              </button>

                              <button
                                className="action-button danger"
                                onClick={() =>
                                  deleteOrder(
                                    order
                                  )
                                }
                                disabled={
                                  deleting
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

   {showFormModal && (
  <div className="modal-overlay">
    <form
      className="order-form-modal"
      onSubmit={saveOrder}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="order-modal-header">
        <div className="order-modal-heading">
          <div className="order-modal-icon">
            {editingId ? "✎" : "+"}
          </div>

          <div>
            <div className="order-modal-eyebrow">
              {editingId
                ? "ORDER MANAGEMENT"
                : "NEW ORDER"}
            </div>

            <h2>
              {editingId
                ? "Edit Order"
                : "Create Order"}
            </h2>

            <p>
              {editingId
                ? "Update customer, delivery and payment information."
                : "Create a new customer order and add its products."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="order-modal-close"
          onClick={() =>
            setShowFormModal(false)
          }
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* =====================================================
          BODY
      ===================================================== */}
      <div className="order-modal-body">
        {error && (
          <div className="order-form-error">
            <div className="order-error-icon">
              !
            </div>

            <div>
              <strong>Unable to save order</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ===================================================
            CUSTOMER & DELIVERY
        =================================================== */}
        <section className="order-form-section">
          <div className="order-section-header">
            <div className="order-section-number">
              01
            </div>

            <div>
              <h3>Customer & Delivery</h3>
              <p>
                Select the customer and enter delivery
                information.
              </p>
            </div>
          </div>

          <div className="order-form-grid">
            <div className="order-form-group">
              <label>
                Customer
                <span>*</span>
              </label>

              <select
                className="order-form-control"
                value={form.customerId}
                onChange={(e) =>
                  updateForm(
                    "customerId",
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Select customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={getId(customer)}
                    value={getId(customer)}
                  >
                    {customer.name || "Customer"}
                  </option>
                ))}
              </select>
            </div>

            <div className="order-form-group">
              <label>Address ID</label>

              <input
                className="order-form-control"
                value={form.addressId}
                onChange={(e) =>
                  updateForm(
                    "addressId",
                    e.target.value
                  )
                }
                placeholder="Enter address ID"
              />
            </div>

            <div className="order-form-group order-form-full">
              <label>Delivery Address</label>

              <input
                className="order-form-control"
                value={form.deliveryAddress}
                onChange={(e) =>
                {
                  var f=form
                  debugger
                  updateForm(
                    "deliveryAddress",
                    e.target.value
                  )
                }}  
                placeholder="Enter complete delivery address"
              />
            </div>

            <div className="order-form-group">
              <label>Delivery Date</label>

              <div className="order-input-with-icon">
                <span>📅</span>

                <input
                  type="date"
                  className="order-form-control"
                  value={form.deliveryDate}
                  onChange={(e) =>
                    updateForm(
                      "deliveryDate",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="order-form-group">
              <label>Delivery Slot ID</label>

              <input
                className="order-form-control"
                value={form.deliverySlotId}
                onChange={(e) =>
                  updateForm(
                    "deliverySlotId",
                    e.target.value
                  )
                }
                placeholder="Enter delivery slot ID"
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            ORDER ITEMS
        =================================================== */}
        <section className="order-form-section">
          <div className="order-section-header order-items-header">
            <div className="order-section-number">
              02
            </div>

            <div className="order-section-title-wrap">
              <div>
                <h3>Order Items</h3>
                <p>
                  Add the products included in this order.
                </p>
              </div>

              <span className="order-items-count">
                {form.items.length}{" "}
                {form.items.length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>

          {form.items.length === 0 ? (
            <div className="order-items-empty">
              <div className="order-items-empty-icon">
                🛒
              </div>

              <strong>No products added</strong>

              <p>
                Add products to build this order.
              </p>

              <button
                type="button"
                className="order-add-first-item"
                onClick={addItem}
              >
                + Add Product
              </button>
            </div>
          ) : (
            <div className="order-items-list">
              {form.items.map((item, index) => (
                <div
                  className="order-item-card"
                  key={index}
                >
                  <div className="order-item-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="order-item-product">
                    <label>Product</label>

                    <input
                      className="order-form-control"
                      placeholder="Product ID / name"
                      value={
                        item.productName ||
                        item.productId
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "productName",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="order-item-qty">
                    <label>Quantity</label>

                    <input
                      className="order-form-control"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(
                            e.target.value
                          )
                        )
                      }
                    />
                  </div>

                  <div className="order-item-price">
                    <label>Unit Price</label>

                    <div className="price-input">
                      <span>Rs.</span>

                      <input
                        className="order-form-control"
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unitPrice",
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="order-item-subtotal">
                    <label>Subtotal</label>

                    <strong>
                      Rs.{" "}
                      {(
                        Number(
                          item.quantity || 0
                        ) *
                        Number(
                          item.unitPrice || 0
                        )
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="order-remove-item"
                    onClick={() =>
                      removeItem(index)
                    }
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.items.length > 0 && (
            <button
              type="button"
              className="order-add-item-btn"
              onClick={addItem}
            >
              <span>+</span>
              Add Another Product
            </button>
          )}
        </section>

        {/* ===================================================
            PAYMENT
        =================================================== */}
        <section className="order-form-section">
          <div className="order-section-header">
            <div className="order-section-number">
              03
            </div>

            <div>
              <h3>Payment & Charges</h3>
              <p>
                Configure payment, delivery charges and
                order status.
              </p>
            </div>
          </div>

          <div className="order-form-grid">
            <div className="order-form-group">
              <label>Payment Method</label>

              <select
                className="order-form-control"
                value={form.paymentMethod}
                onChange={(e) =>
                  updateForm(
                    "paymentMethod",
                    e.target.value
                  )
                }
              >
                <option>
                  Cash on Delivery
                </option>

                <option>Online</option>

                <option>
                  Bank Transfer
                </option>
              </select>
            </div>

            <div className="order-form-group">
              <label>Payment Status</label>

              <select
                className="order-form-control"
                value={form.paymentStatus}
                onChange={(e) =>
                  updateForm(
                    "paymentStatus",
                    e.target.value
                  )
                }
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Failed</option>
                <option>Refunded</option>
              </select>
            </div>

            <div className="order-form-group">
              <label>Delivery Fee</label>

              <div className="currency-input">
                <span>Rs.</span>

                <input
                  type="number"
                  min="0"
                  className="order-form-control"
                  value={form.deliveryFee}
                  onChange={(e) =>
                    updateForm(
                      "deliveryFee",
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            </div>

            <div className="order-form-group">
              <label>Discount</label>

              <div className="currency-input">
                <span>Rs.</span>

                <input
                  type="number"
                  min="0"
                  className="order-form-control"
                  value={form.discount}
                  onChange={(e) =>
                    updateForm(
                      "discount",
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            </div>

            <div className="order-form-group">
              <label>Order Status</label>

              <select
                className="order-form-control"
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
              >
                {STATUS_FLOW.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ===================================================
            NOTES
        =================================================== */}
        <section className="order-form-section">
          <div className="order-section-header">
            <div className="order-section-number">
              04
            </div>

            <div>
              <h3>Order Notes</h3>
              <p>
                Add any additional information for this
                order.
              </p>
            </div>
          </div>

          <textarea
            className="order-form-textarea"
            value={form.notes}
            onChange={(e) =>
              updateForm(
                "notes",
                e.target.value
              )
            }
            placeholder="Add delivery instructions, customer requests or other notes..."
          />
        </section>

        {/* ===================================================
            TOTALS
        =================================================== */}
        <div className="order-total-card">
          <div className="order-total-content">
            <div className="order-total-heading">
              <span>Order Summary</span>
              <small>
                {form.items.length}{" "}
                {form.items.length === 1
                  ? "product"
                  : "products"}
              </small>
            </div>

            <div className="order-total-row">
              <span>Subtotal</span>

              <strong>
                Rs.{" "}
                {formSubtotal.toLocaleString()}
              </strong>
            </div>

            <div className="order-total-row">
              <span>Delivery Fee</span>

              <strong>
                Rs.{" "}
                {Number(
                  form.deliveryFee || 0
                ).toLocaleString()}
              </strong>
            </div>

            <div className="order-total-row discount">
              <span>Discount</span>

              <strong>
                - Rs.{" "}
                {Number(
                  form.discount || 0
                ).toLocaleString()}
              </strong>
            </div>

            <div className="order-grand-total">
              <div>
                <span>Grand Total</span>
                <small>Amount payable</small>
              </div>

              <strong>
                Rs.{" "}
                {formTotal.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="order-modal-footer">
        <div className="order-footer-info">
          <span className="footer-status-dot" />

          {editingId
            ? "Changes will be saved to this order"
            : "Review the order before creating it"}
        </div>

        <div className="order-footer-buttons">
          <button
            type="button"
            className="order-cancel-btn"
            onClick={() =>
              setShowFormModal(false)
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="order-save-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="save-spinner" />
                Saving...
              </>
            ) : (
              <>
                <span>
                  {editingId ? "✓" : "+"}
                </span>

                {editingId
                  ? "Update Order"
                  : "Create Order"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  </div>
)}
      {/* =====================================================
          VIEW ORDER MODAL
      ===================================================== */}

{showViewModal && selectedOrder && (
  <div className="modal-overlay">
    <div className="order-view-modal">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="order-view-header">
        <div className="order-view-header-left">

          <div className="order-view-icon">
            #
          </div>

          <div>
            <div className="order-view-eyebrow">
              ORDER DETAILS
            </div>

            <h2 className="order-view-title">
              Order #
              {getOrderId(selectedOrder)}
            </h2>

            <p className="order-view-subtitle">
              Complete information about this order
            </p>
          </div>

        </div>

        <button
          type="button"
          className="order-view-close"
          onClick={() =>
            setShowViewModal(false)
          }
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* =====================================================
          BODY
      ===================================================== */}
      <div className="order-view-body">

        {/* ===================================================
            TOP STATUS
        =================================================== */}
        <div className="order-view-status-bar">

          <div>
            <span className="order-view-small-label">
              CURRENT STATUS
            </span>

            <div className="order-view-status-row">
              <span
                className={`order-status-badge status-${String(
                  selectedOrder.status ||
                    "Pending"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <span className="status-dot" />

                {selectedOrder.status ||
                  "Pending"}
              </span>

              <span className="order-view-status-hint">
                Order status
              </span>
            </div>
          </div>

          <div className="order-view-status-actions">
            <button
              type="button"
              className="view-timeline-mini-btn"
              onClick={() => {
                setShowViewModal(false);
                openTimelineModal(
                  selectedOrder
                );
              }}
            >
              <span>◷</span>
              View Timeline
            </button>
          </div>

        </div>

        {/* ===================================================
            ORDER INFORMATION
        =================================================== */}
        <div className="order-view-info-grid">

          {/* CUSTOMER */}
          <div className="order-info-card">

            <div className="order-info-card-icon">
              👤
            </div>

            <div className="order-info-card-content">
              <span className="order-info-label">
                CUSTOMER
              </span>

              <strong>
                {getCustomerName(
                  selectedOrder,
                  customers
                )}
              </strong>

              {selectedOrder.customerId &&
                typeof selectedOrder.customerId ===
                  "object" && (
                  <>
                    {selectedOrder.customerId.email && (
                      <small>
                        {
                          selectedOrder.customerId
                            .email
                        }
                      </small>
                    )}

                    {selectedOrder.customerId.phone && (
                      <small>
                        {
                          selectedOrder.customerId
                            .phone
                        }
                      </small>
                    )}
                  </>
                )}
            </div>

          </div>

          {/* DELIVERY DATE */}
          <div className="order-info-card">

            <div className="order-info-card-icon">
              📅
            </div>

            <div className="order-info-card-content">
              <span className="order-info-label">
                DELIVERY DATE
              </span>

              <strong>
                {selectedOrder.deliveryDate
                  ? formatDate(
                      selectedOrder.deliveryDate
                    )
                  : "Not scheduled"}
              </strong>

              {selectedOrder.deliverySlotId && (
                <small>
                  Delivery slot selected
                </small>
              )}
            </div>

          </div>

          {/* PAYMENT */}
          <div className="order-info-card">

            <div className="order-info-card-icon">
              💳
            </div>

            <div className="order-info-card-content">
              <span className="order-info-label">
                PAYMENT
              </span>

              <strong>
                {selectedOrder.paymentMethod ||
                  "Not specified"}
              </strong>

              <small
                className={`payment-status ${
                  String(
                    selectedOrder.paymentStatus ||
                      "Pending"
                  ).toLowerCase()
                }`}
              >
                {selectedOrder.paymentStatus ||
                  "Pending"}
              </small>
            </div>

          </div>

          {/* ITEMS COUNT */}
          <div className="order-info-card">

            <div className="order-info-card-icon">
              🛒
            </div>

            <div className="order-info-card-content">
              <span className="order-info-label">
                ORDER ITEMS
              </span>

              <strong>
                {(
                  selectedOrder.items || []
                ).length}{" "}
                {(
                  selectedOrder.items || []
                ).length === 1
                  ? "Product"
                  : "Products"}
              </strong>

              <small>
                {(
                  selectedOrder.items || []
                ).reduce(
                  (total, item) =>
                    total +
                    Number(
                      item.quantity || 0
                    ),
                  0
                )}{" "}
                total units
              </small>
            </div>

          </div>

        </div>

        {/* ===================================================
            DELIVERY ADDRESS
        =================================================== */}
        <div className="order-view-section">

          <div className="order-view-section-header">
            <div className="order-view-section-icon">
              📍
            </div>

            <div>
              <h3>Delivery Address</h3>

              <p>
                Address where this order will be delivered
              </p>
            </div>
          </div>

          <div className="order-address-box">
            <span className="address-pin">
              📍
            </span>

            <div>
              <strong>
                Delivery Location
              </strong>

              <p>
                {selectedOrder.deliveryAddress ||
                  "No delivery address provided."}
              </p>
            </div>
          </div>

        </div>

        {/* ===================================================
            ORDER ITEMS
        =================================================== */}
        <div className="order-view-section">

          <div className="order-view-section-header">
            <div className="order-view-section-icon">
              🛍️
            </div>

            <div>
              <h3>Order Items</h3>

              <p>
                Products included in this order
              </p>
            </div>

            <span className="order-items-pill">
              {(selectedOrder.items || []).length}{" "}
              {(
                selectedOrder.items || []
              ).length === 1
                ? "Item"
                : "Items"}
            </span>
          </div>

          <div className="order-view-items">

            {(selectedOrder.items || []).length ===
            0 ? (
              <div className="order-view-empty">
                <span>🛒</span>

                <strong>
                  No items found
                </strong>

                <p>
                  This order does not contain any products.
                </p>
              </div>
            ) : (
              selectedOrder.items.map(
                (item, index) => {
                  const price =
                    getItemPrice(item);

                  const quantity =
                    Number(
                      item.quantity || 0
                    );

                  const product =
                    item.productId &&
                    typeof item.productId ===
                      "object"
                      ? item.productId
                      : null;

                  const productName =
                    product?.nameEn ||
                    product?.nameUr ||
                    getItemName(item) ||
                    "Product";
                  const productImage =
                    (product?.image  ? `${BASE_URL}${product.image}` : null);
                  const itemTotal =
                    price * quantity;

                  return (
                    <div
                      className="order-view-item"
                      key={
                        item._id ||
                        index
                      }
                    >

                      {/* NUMBER */}
                      <div className="order-view-item-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      {/* IMAGE */}
                      <div className="order-view-product-image">
                        {productImage ? (
                          <img
                            src={
                              productImage
                            }
                            alt={
                              productName
                            }
                            onError={(
                              e
                            ) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <span>
                            🛍️
                          </span>
                        )}
                      </div>

                      {/* PRODUCT INFO */}
                      <div className="order-view-product-info">

                        <strong>
                          {productName}
                        </strong>

                        {product?.nameUr &&
                          product.nameUr !==
                            product.nameEn && (
                            <small>
                              {
                                product.nameUr
                              }
                            </small>
                          )}

                        {product?._id && (
                          <span>
                            Product ID:{" "}
                            {String(
                              product._id
                            )}
                          </span>
                        )}

                      </div>

                      {/* QTY */}
                      <div className="order-view-item-qty">

                        <span>
                          QTY
                        </span>

                        <strong>
                          {quantity}
                        </strong>

                      </div>

                      {/* PRICE */}
                      <div className="order-view-item-price">

                        <span>
                          UNIT PRICE
                        </span>

                        <strong>
                          Rs.{" "}
                          {price.toLocaleString()}
                        </strong>

                      </div>

                      {/* TOTAL */}
                      <div className="order-view-item-total">

                        <span>
                          TOTAL
                        </span>

                        <strong>
                          Rs.{" "}
                          {itemTotal.toLocaleString()}
                        </strong>

                      </div>

                    </div>
                  );
                }
              )
            )}

          </div>
        </div>

        {/* ===================================================
            SUMMARY
        =================================================== */}
        <div className="order-view-summary-grid">

          {/* LEFT SUMMARY */}
          <div className="order-view-section order-view-summary-section">

            <div className="order-view-section-header">
              <div className="order-view-section-icon">
                🧾
              </div>

              <div>
                <h3>Order Summary</h3>

                <p>
                  Charges and final amount
                </p>
              </div>
            </div>

            <div className="order-summary-lines">

              <div className="order-summary-line">
                <span>
                  Items Subtotal
                </span>

                <strong>
                  Rs.{" "}
                  {(
                    (selectedOrder.items ||
                      []).reduce(
                      (total, item) =>
                        total +
                        getItemPrice(
                          item
                        ) *
                          Number(
                            item.quantity ||
                              0
                          ),
                      0
                    )
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="order-summary-line">
                <span>
                  Delivery Fee
                </span>

                <strong>
                  Rs.{" "}
                  {Number(
                    selectedOrder.deliveryFee ||
                      0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="order-summary-line discount">
                <span>
                  Discount
                </span>

                <strong>
                  - Rs.{" "}
                  {Number(
                    selectedOrder.discount ||
                      0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="order-summary-divider" />

              <div className="order-grand-total-new">

                <div>
                  <span>
                    Grand Total
                  </span>

                  <small>
                    Amount payable
                  </small>
                </div>

                <strong>
                  Rs.{" "}
                  {getOrderTotal(
                    selectedOrder
                  ).toLocaleString()}
                </strong>

              </div>

            </div>

          </div>

          {/* RIGHT PAYMENT CARD */}
          <div className="order-view-section">

            <div className="order-view-section-header">
              <div className="order-view-section-icon">
                💰
              </div>

              <div>
                <h3>Payment Information</h3>

                <p>
                  Payment details for this order
                </p>
              </div>
            </div>

            <div className="payment-detail-list">

              <div className="payment-detail-row">
                <span>
                  Method
                </span>

                <strong>
                  {selectedOrder.paymentMethod ||
                    "—"}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Status
                </span>

                <strong
                  className={`payment-badge ${String(
                    selectedOrder.paymentStatus ||
                      "Pending"
                  ).toLowerCase()}`}
                >
                  {selectedOrder.paymentStatus ||
                    "Pending"}
                </strong>
              </div>

              <div className="payment-detail-row">
                <span>
                  Delivery Fee
                </span>

                <strong>
                  Rs.{" "}
                  {Number(
                    selectedOrder.deliveryFee ||
                      0
                  ).toLocaleString()}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            NOTES
        =================================================== */}
        {selectedOrder.notes && (
          <div className="order-view-section">

            <div className="order-view-section-header">
              <div className="order-view-section-icon">
                📝
              </div>

              <div>
                <h3>Order Notes</h3>

                <p>
                  Additional information for this order
                </p>
              </div>
            </div>

            <div className="order-notes-box">
              {selectedOrder.notes}
            </div>

          </div>
        )}

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="order-view-footer">

        <div className="order-footer-meta">
          <span className="footer-status-dot" />

          Order #
          {getOrderId(selectedOrder)}
        </div>

        <div className="order-view-footer-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setShowViewModal(false);

              openTimelineModal(
                selectedOrder
              );
            }}
          >
            ◷ View Timeline
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setShowViewModal(false);

              openEditModal(
                selectedOrder
              );
            }}
          >
            ✎ Edit Order
          </button>

        </div>

      </div>

    </div>
  </div>
)}

      {/* =====================================================
          TIMELINE MODAL
      ===================================================== */}
{showTimelineModal && (
  <div
    className="timeline-overlay"
    onClick={() => setShowTimelineModal(false)}
  >
    <div
      className="timeline-modal-new"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="timeline-header-new">
        <div>
          <div className="timeline-eyebrow">ORDER TRACKING</div>

          <h2>Order Timeline</h2>

          <div className="timeline-order-meta">
            <span className="timeline-order-number">
              #{selectedOrder?.orderNumber || "N/A"}
            </span>

            <span className="timeline-meta-dot">•</span>

            <span>
              {selectedOrder?.customer?.name ||
                selectedOrder?.customerName ||
                "Customer"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="timeline-close-btn"
          onClick={() => setShowTimelineModal(false)}
        >
          ✕
        </button>
      </div>

      {/* CURRENT STATUS SUMMARY */}
      <div className="timeline-status-summary">
        <div className="timeline-status-summary-left">
          <div className="timeline-status-icon">
            ✓
          </div>

          <div>
            <div className="timeline-summary-label">
              CURRENT STATUS
            </div>

            <div className="timeline-current-status">
              {selectedOrder?.status || "Pending"}
            </div>
          </div>
        </div>

        <div className="timeline-summary-right">
          <span className="timeline-summary-label">
            ORDER TOTAL
          </span>

          <strong>
            Rs.{" "}
            {Number(
              selectedOrder?.totalAmount ||
                selectedOrder?.total ||
                0
            ).toLocaleString()}
          </strong>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="timeline-progress-section">
        <div className="timeline-section-heading">
          <div>
            <h3>Order Progress</h3>
            <p>Track the current stage of this order</p>
          </div>
        </div>

        <div className="timeline-progress-scroll">
          <div className="timeline-progress">
            {[
              "Pending",
              "Confirmed",
              "Preparing",
              "Ready",
              "Out for Delivery",
              "Delivered",
            ].map((status, index) => {
              const currentStatus =
                selectedOrder?.status || "Pending";

              const statusIndex = [
                "Pending",
                "Confirmed",
                "Preparing",
                "Ready",
                "Out for Delivery",
                "Delivered",
              ].indexOf(currentStatus);

              const isCompleted = index < statusIndex;
              const isCurrent = index === statusIndex;

              return (
                <React.Fragment key={status}>
                  <div
                    className={`progress-step ${
                      isCompleted
                        ? "completed"
                        : isCurrent
                        ? "current"
                        : ""
                    }`}
                  >
                    <div className="progress-circle">
                      {isCompleted ? "✓" : index + 1}
                    </div>

                    <div className="progress-label">
                      {status}
                    </div>
                  </div>

                  {index < 5 && (
                    <div
                      className={`progress-line ${
                        isCompleted
                          ? "completed"
                          : ""
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* UPDATE STATUS */}
      <div className="timeline-update-card">
        <div className="timeline-update-heading">
          <div className="timeline-update-icon">
            ↻
          </div>

          <div>
            <h3>Update Order Status</h3>
            <p>
              Change the current status of this order
            </p>
          </div>
        </div>

        <div className="timeline-update-controls">
          <select
            value={timelineStatus}
            onChange={(e) =>
              setTimelineStatus(e.target.value)
            }
            className="timeline-status-select"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Out for Delivery">
              Out for Delivery
            </option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            className="timeline-update-btn"
            onClick={updateTimelineStatus}
            disabled={updatingTimelineStatus}
          >
            {updatingTimelineStatus ? (
              <>
                <span className="timeline-spinner" />
                Updating...
              </>
            ) : (
              <>
                Update Status
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {timelineError && (
          <div className="timeline-error">
            <span>!</span>
            {timelineError}
          </div>
        )}
      </div>

      {/* TIMELINE HISTORY */}
      <div className="timeline-history-section">
        <div className="timeline-section-heading">
          <div>
            <h3>Status History</h3>
            <p>
              Actual status changes recorded for this order
            </p>
          </div>

          <span className="timeline-history-count">
            {timeline?.length || 0}{" "}
            {(timeline?.length || 0) === 1
              ? "event"
              : "events"}
          </span>
        </div>

        <div className="timeline-history-scroll">
          {timelineLoading ? (
            <div className="timeline-loading">
              <div className="timeline-large-spinner" />
              <span>Loading timeline...</span>
            </div>
          ) : timeline?.length > 0 ? (
            <div className="history-list">
              {timeline.map((entry, index) => {
                const status =
                  entry?.status ||
                  entry?.newStatus ||
                  entry?.orderStatus ||
                  entry?.statusName ||
                  "Unknown";

                const message =
                  entry?.message ||
                  entry?.note ||
                  entry?.description ||
                  "";

                const date =
                  entry?.createdAt ||
                  entry?.updatedAt ||
                  entry?.date ||
                  entry?.timestamp ||
                  entry?.created_on;

                const isLatest = index === 0;

                return (
                  <div
                    className={`history-item ${
                      isLatest ? "latest" : ""
                    }`}
                    key={
                      entry?._id ||
                      entry?.id ||
                      `${status}-${index}`
                    }
                  >
                    <div className="history-rail">
                      <div
                        className={`history-dot ${
                          isLatest ? "active" : ""
                        }`}
                      >
                        {isLatest ? "✓" : ""}
                      </div>

                      {index <
                        timeline.length - 1 && (
                        <div className="history-line" />
                      )}
                    </div>

                    <div className="history-card">
                      <div className="history-card-top">
                        <div>
                          <span
                            className={`history-status-badge status-${status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {status}
                          </span>

                          {isLatest && (
                            <span className="history-current-badge">
                              CURRENT
                            </span>
                          )}
                        </div>

                        {date && (
                          <span className="history-date">
                            {new Date(date).toLocaleString(
                              undefined,
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>

                      {message && (
                        <div className="history-message">
                          {message}
                        </div>
                      )}

                      {entry?.changedBy && (
                        <div className="history-user">
                          Changed by:{" "}
                          <strong>
                            {entry.changedBy?.name ||
                              entry.changedBy?.email ||
                              entry.changedBy}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="timeline-empty">
              <div className="timeline-empty-icon">
                ◷
              </div>

              <h4>No timeline history</h4>

              <p>
                No status changes have been recorded for
                this order yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="timeline-footer-new">
        <button
          type="button"
          className="timeline-refresh-btn"
          onClick={() => {
            if (selectedOrder) {
              loadOrderTimeline(
                selectedOrder
              );
            }
          }}
        >
          ↻ Refresh Timeline
        </button>

        <button
          type="button"
          className="timeline-close-main-btn"
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