"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./goats-tailwind.css";
import { API_URL } from "../../services/api";
import {
  LayoutDashboard,
  PawPrint,
  Heart,
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Menu,
  Calendar,
  TrendingUp,
  Users,
  Syringe,
  Power,
} from "lucide-react";


const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const emptyGoatForm = {
  name: "",
  ageValue: "",
  ageUnit: "months",
  gender: "female",
  purchasePrice: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function GoatFarmDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [goats, setGoats] = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showGoatModal, setShowGoatModal] = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);
  const [goatForm, setGoatForm] = useState(emptyGoatForm);
  const [savingGoat, setSavingGoat] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "feed",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "cash",
    notes: "",
  });

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [editingBreeding, setEditingBreeding] = useState(null);
  const [savingBreeding, setSavingBreeding] = useState(false);
  const [breedingForm, setBreedingForm] = useState({
    femaleGoat: "",
    maleGoats: [],
    breedingDate: new Date().toISOString().split("T")[0],
    pregnancyStatus: "unknown",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [statusFilter, setStatusFilter] = useState("active");

  const [dewormGoat, setDewormGoat] = useState(null);
  const [dewormDate, setDewormDate] = useState("");
  const [savingDeworm, setSavingDeworm] = useState(false);

  const [statusGoat, setStatusGoat] = useState(null);
  const [statusActive, setStatusActive] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const [notification, setNotification] = useState("");

  const notify = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  // -----------------------------
  // API DATA
  // -----------------------------

  const getArray = (response) => {
    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.goats)) return data.goats;
    if (Array.isArray(data?.expenses)) return data.expenses;
    if (Array.isArray(data?.records)) return data.records;

    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [goatResponse, breedingResponse, expenseResponse] =
        await Promise.all([
          api.get("/goats"),
          api.get("/breeding"),
          api.get("/expenses"),
        ]);

      setGoats(getArray(goatResponse));
      setBreedingRecords(getArray(breedingResponse));
      setExpenses(getArray(expenseResponse));
    } catch (error) {
      console.error("Dashboard loading error:", error);
      notify(
        error.response?.data?.message ||
          "Unable to load farm records. Check your API URL."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------
  // GOAT FORM
  // -----------------------------

  const openAddGoat = () => {
    setEditingGoat(null);
    setGoatForm(emptyGoatForm);
    setShowGoatModal(true);
  };

  const openEditGoat = (goat) => {
    setEditingGoat(goat);

    setGoatForm({
      name: goat.name || "",
      ageValue: goat.ageAtPurchase?.value ?? "",
      ageUnit: goat.ageAtPurchase?.unit || "months",
      gender: goat.gender || "female",
      purchasePrice: goat.purchasePrice ?? "",
      purchaseDate: goat.purchaseDate
        ? new Date(goat.purchaseDate).toISOString().split("T")[0]
        : "",
      notes: goat.notes || "",
    });

    setShowGoatModal(true);
  };

  const handleGoatFormChange = (e) => {
    const { name, value } = e.target;

    setGoatForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveGoat = async (e) => {
    e.preventDefault();

    if (!goatForm.name.trim()) {
      notify("Please enter goat name.");
      return;
    }

    if (!goatForm.ageValue || Number(goatForm.ageValue) < 0) {
      notify("Please enter a valid age.");
      return;
    }

    if (!goatForm.purchasePrice || Number(goatForm.purchasePrice) < 0) {
      notify("Please enter a valid purchase price.");
      return;
    }

    const payload = {
      name: goatForm.name.trim(),
      ageAtPurchase: {
        value: Number(goatForm.ageValue),
        unit: goatForm.ageUnit,
      },
      gender: goatForm.gender,
      purchasePrice: Number(goatForm.purchasePrice),
      purchaseDate: goatForm.purchaseDate || null,
      notes: goatForm.notes,
    };

    try {
      setSavingGoat(true);

      if (editingGoat) {
        // UPDATE GOAT
        await api.put(`/goats/${editingGoat._id}`, payload);
        notify("Goat updated successfully.");
      } else {
        // ADD GOAT
        await api.post("/goats", payload);
        notify("Goat added successfully.");
      }

      setShowGoatModal(false);
      setEditingGoat(null);
      setGoatForm(emptyGoatForm);

      await loadData();
    } catch (error) {
      console.error("Save goat error:", error);
      notify(
        error.response?.data?.message || "Unable to save goat."
      );
    } finally {
      setSavingGoat(false);
    }
  };

  // -----------------------------
  // DELETE / DEACTIVATE GOAT
  // -----------------------------

  const deleteGoat = async (goat) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goat.name}"?\n\nThe goat will be deactivated and will no longer appear in the active inventory.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/goats/${goat._id}`);

      notify("Goat deactivated successfully.");

      await loadData();
    } catch (error) {
      console.error("Delete goat error:", error);
      notify(
        error.response?.data?.message || "Unable to delete goat."
      );
    }
  };

  // -----------------------------
  // DEWORMING DATE / STATUS
  // -----------------------------

  const toDateInput = (value) =>
    value ? new Date(value).toISOString().split("T")[0] : "";

  const openDewormModal = (goat) => {
    setDewormGoat(goat);
    setDewormDate(
      toDateInput(goat.dewormingDate) ||
        new Date().toISOString().split("T")[0]
    );
  };

  const saveDewormingDate = async (e) => {
    e.preventDefault();

    if (!dewormDate) {
      notify("Please select a deworming date.");
      return;
    }

    try {
      setSavingDeworm(true);
      await api.patch(`/goats/${dewormGoat._id}/deworming-date`, {
        dewormingDate: dewormDate,
      });
      setDewormGoat(null);
      notify("Deworming date updated successfully.");
      await loadData();
    } catch (error) {
      console.error("Update deworming date error:", error);
      notify(
        error.response?.data?.message ||
          "Unable to update deworming date."
      );
    } finally {
      setSavingDeworm(false);
    }
  };

  const openStatusModal = (goat) => {
    setStatusGoat(goat);
    setStatusActive(goat.isActive !== false);
  };

  const saveGoatStatus = async (e) => {
    e.preventDefault();

    try {
      setSavingStatus(true);
      await api.patch(`/goats/${statusGoat._id}/status`, {
        isActive: statusActive,
      });
      setStatusGoat(null);
      notify("Goat status updated successfully.");
      await loadData();
    } catch (error) {
      console.error("Update goat status error:", error);
      notify(
        error.response?.data?.message ||
          "Unable to update goat status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  // -----------------------------
  // EXPENSES
  // -----------------------------

  const emptyExpenseForm = () => ({
    title: "",
    category: "feed",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "cash",
    notes: "",
  });

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpenseForm(emptyExpenseForm());
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || "",
      category: expense.category || "feed",
      amount: expense.amount ?? "",
      expenseDate: toDateInput(expense.expenseDate),
      description: expense.description || "",
      paymentMethod: expense.paymentMethod || "cash",
      notes: expense.notes || "",
    });
    setShowExpenseModal(true);
  };

  const deleteExpense = async (expense) => {
    const confirmed = window.confirm(
      `Delete the expense "${expense.title}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${expense._id}`);
      notify("Expense deleted successfully.");
      await loadData();
    } catch (error) {
      console.error("Delete expense error:", error);
      notify(
        error.response?.data?.message || "Unable to delete expense."
      );
    }
  };

  const saveExpense = async (e) => {
    e.preventDefault();

    try {
      setSavingExpense(true);

      const payload = {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, payload);
        notify("Expense updated successfully.");
      } else {
        await api.post("/expenses", payload);
        notify("Expense added successfully.");
      }

      closeExpenseModal();
      await loadData();
    } catch (error) {
      console.error("Save expense error:", error);
      notify(
        error.response?.data?.message || "Unable to save expense."
      );
    } finally {
      setSavingExpense(false);
    }
  };

  // -----------------------------
  // BREEDING
  // -----------------------------

  const emptyBreedingForm = () => ({
    femaleGoat: "",
    maleGoats: [],
    breedingDate: new Date().toISOString().split("T")[0],
    pregnancyStatus: "unknown",
    expectedDeliveryDate: "",
    notes: "",
  });

  const closeBreedingModal = () => {
    setShowBreedingModal(false);
    setEditingBreeding(null);
    setBreedingForm(emptyBreedingForm());
  };

  const openEditBreeding = (record) => {
    const idOf = (item) =>
      item && typeof item === "object" ? item._id : item;

    setEditingBreeding(record);
    setBreedingForm({
      femaleGoat: idOf(record.femaleGoat) || "",
      maleGoats: Array.isArray(record.maleGoats)
        ? record.maleGoats.map(idOf)
        : [],
      breedingDate: toDateInput(record.breedingDate),
      pregnancyStatus: record.pregnancyStatus || "unknown",
      expectedDeliveryDate: toDateInput(record.expectedDeliveryDate),
      notes: record.notes || "",
    });
    setShowBreedingModal(true);
  };

  const deleteBreeding = async (record) => {
    const confirmed = window.confirm(
      `Delete the breeding record for "${getGoatName(
        record.femaleGoat
      )}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/breeding/${record._id}`);
      notify("Breeding record deleted successfully.");
      await loadData();
    } catch (error) {
      console.error("Delete breeding error:", error);
      notify(
        error.response?.data?.message ||
          "Unable to delete breeding record."
      );
    }
  };

  const saveBreeding = async (e) => {
    e.preventDefault();

    if (!breedingForm.femaleGoat) {
      notify("Please select a female goat.");
      return;
    }

    if (!breedingForm.maleGoats.length) {
      notify("Please select at least one possible male goat.");
      return;
    }

    try {
      setSavingBreeding(true);

      const payload = {
        ...breedingForm,
        expectedDeliveryDate: breedingForm.expectedDeliveryDate || null,
      };

      if (editingBreeding) {
        await api.put(`/breeding/${editingBreeding._id}`, payload);
        notify("Breeding record updated successfully.");
      } else {
        await api.post("/breeding", payload);
        notify("Breeding record added successfully.");
      }

      closeBreedingModal();
      await loadData();
    } catch (error) {
      console.error("Save breeding error:", error);
      notify(
        error.response?.data?.message ||
          "Unable to save breeding record."
      );
    } finally {
      setSavingBreeding(false);
    }
  };

  const toggleMaleGoat = (id) => {
    setBreedingForm((previous) => ({
      ...previous,
      maleGoats: previous.maleGoats.includes(id)
        ? previous.maleGoats.filter((item) => item !== id)
        : [...previous.maleGoats, id],
    }));
  };

  // -----------------------------
  // FILTERS AND STATS
  // -----------------------------

  const activeGoats = goats.filter((goat) => goat.isActive !== false);

  const filteredGoats = useMemo(() => {
    const query = search.toLowerCase();

    return goats.filter((goat) => {
      const isActive = goat.isActive !== false;

      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;

      return (goat.name || "").toLowerCase().includes(query);
    });
  }, [goats, search, statusFilter]);

  const totalPurchaseValue = activeGoats.reduce(
    (total, goat) => total + Number(goat.purchasePrice || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const males = activeGoats.filter(
    (goat) => goat.gender === "male"
  );

  const females = activeGoats.filter(
    (goat) => goat.gender === "female"
  );

  const formatCurrency = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

  const getGoatName = (goatOrId) => {
    if (!goatOrId) return "Unknown";

    const id =
      typeof goatOrId === "object"
        ? goatOrId._id
        : goatOrId;

    const goat = goats.find(
      (item) => item._id === id
    );

    return goat?.name || goatOrId?.name || "Unknown";
  };

  // -----------------------------
  // UI HELPERS
  // -----------------------------

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-800">
            {value}
          </h2>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );

  const modalOverlay =
    "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4";
  const modalCard =
    "my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white text-gray-800 shadow-2xl";
  const modalHeader =
    "flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4";
  const modalTitle = "m-0 text-lg font-bold text-gray-800";
  const closeBtn =
    "rounded-lg border-0 bg-transparent p-2 text-gray-500 hover:bg-gray-200";
  const labelCls =
    "mb-1.5 block text-sm font-semibold text-gray-700";
  const inputCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200";
  const modalFooter =
    "flex justify-end gap-3 border-t border-gray-200 pt-4";
  const cancelBtn =
    "rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
  const saveBtn =
    "rounded-lg border-0 bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "goats", label: "Goat Inventory", icon: PawPrint },
    { id: "breeding", label: "Breeding Records", icon: Heart },
    { id: "expenses", label: "Expenses", icon: Wallet },
  ];

  // -----------------------------
  // MAIN UI
  // -----------------------------

  return (
    <div className="goat-page min-h-screen bg-gray-100 text-gray-800">
      {notification && (
        <div className="fixed right-5 top-5 z-[100] rounded-lg bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {notification}
        </div>
      )}

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 bg-[#263b2b] p-5 text-white md:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-lg bg-green-700 p-2">
              <PawPrint size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold">Goat Farm</h1>
              <p className="text-xs text-green-200">
                Management System
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                    activeTab === item.id
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-green-800"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1">
          {/* TOPBAR */}
          <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <Menu className="md:hidden" />
              <div>
                <h2 className="text-xl font-bold capitalize">
                  {activeTab === "goats"
                    ? "Goat Inventory"
                    : activeTab === "breeding"
                    ? "Breeding Records"
                    : activeTab}
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your farm records
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </header>

          <div className="p-5 md:p-8">
            {loading ? (
              <div className="py-20 text-center text-gray-500">
                Loading farm records...
              </div>
            ) : (
              <>
                {/* DASHBOARD */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Farm Overview
                      </h2>
                      <p className="text-sm text-gray-500">
                        Overview of your goats, breeding and expenses.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        title="Total Active Goats"
                        value={activeGoats.length}
                        icon={PawPrint}
                        color="bg-green-100 text-green-700"
                      />

                      <StatCard
                        title="Female Goats"
                        value={females.length}
                        icon={Heart}
                        color="bg-pink-100 text-pink-700"
                      />

                      <StatCard
                        title="Male Goats"
                        value={males.length}
                        icon={Users}
                        color="bg-blue-100 text-blue-700"
                      />

                      <StatCard
                        title="Total Expenses"
                        value={formatCurrency(totalExpenses)}
                        icon={Wallet}
                        color="bg-orange-100 text-orange-700"
                      />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-xl border bg-white p-5">
                        <h3 className="mb-4 font-bold">
                          Farm Summary
                        </h3>

                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Active goats
                            </span>
                            <strong>{activeGoats.length}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Breeding records
                            </span>
                            <strong>{breedingRecords.length}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Total purchase value
                            </span>
                            <strong>
                              {formatCurrency(totalPurchaseValue)}
                            </strong>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Total expenses
                            </span>
                            <strong>
                              {formatCurrency(totalExpenses)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border bg-white p-5">
                        <h3 className="mb-4 font-bold">
                          Quick Actions
                        </h3>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={openAddGoat}
                            className="flex items-center justify-center gap-2 rounded-lg bg-green-700 p-4 text-white hover:bg-green-800"
                          >
                            <Plus size={18} />
                            Add Goat
                          </button>

                          <button
                            onClick={() => setShowBreedingModal(true)}
                            className="flex items-center justify-center gap-2 rounded-lg bg-pink-600 p-4 text-white hover:bg-pink-700"
                          >
                            <Heart size={18} />
                            Add Breeding
                          </button>

                          <button
                            onClick={() => setShowExpenseModal(true)}
                            className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 p-4 text-white hover:bg-orange-700"
                          >
                            <Wallet size={18} />
                            Add Expense
                          </button>

                          <button
                            onClick={() => setActiveTab("goats")}
                            className="flex items-center justify-center gap-2 rounded-lg border p-4 hover:bg-gray-50"
                          >
                            <PawPrint size={18} />
                            View Inventory
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GOAT INVENTORY */}
                {activeTab === "goats" && (
                  <div className="space-y-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="text-xl font-bold">
                          Goat Inventory
                        </h2>
                        <p className="text-sm text-gray-500">
                          Add, update and manage your goats.
                        </p>
                      </div>

                      <button
                        onClick={openAddGoat}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-white hover:bg-green-800"
                      >
                        <Plus size={18} />
                        Add New Goat
                      </button>
                    </div>

                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full max-w-sm">
                          <Search
                            className="absolute left-3 top-3 text-gray-400"
                            size={18}
                          />

                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search goat by name..."
                            className={`${inputCls} pl-10`}
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className={`${inputCls} sm:w-44`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="all">All</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-5 py-4">Goat Name</th>
                              <th className="px-5 py-4">Age at Purchase</th>
                              <th className="px-5 py-4">Gender</th>
                              <th className="px-5 py-4">Purchase Date</th>
                              <th className="px-5 py-4">Purchase Price</th>
                              <th className="px-5 py-4">Last Deworming</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="sticky right-0 bg-gray-50 px-5 py-4 text-right shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y">
                            {filteredGoats.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="8"
                                  className="px-5 py-12 text-center text-gray-500"
                                >
                                  No goats found.
                                </td>
                              </tr>
                            ) : (
                              filteredGoats.map((goat) => (
                                <tr
                                  key={goat._id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-5 py-4 font-semibold">
                                    {goat.name}
                                  </td>

                                  <td className="px-5 py-4">
                                    {goat.ageAtPurchase?.value ?? "-"}{" "}
                                    {goat.ageAtPurchase?.unit || ""}
                                  </td>

                                  <td className="px-5 py-4 capitalize">
                                    {goat.gender}
                                  </td>

                                  <td className="px-5 py-4">
                                    {goat.purchaseDate
                                      ? new Date(
                                          goat.purchaseDate
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>

                                  <td className="px-5 py-4">
                                    {formatCurrency(goat.purchasePrice)}
                                  </td>

                                  <td className="px-5 py-4">
                                    {goat.dewormingDate
                                      ? new Date(
                                          goat.dewormingDate
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>

                                  <td className="px-5 py-4">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        goat.isActive !== false
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      {goat.isActive !== false
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </td>

                                  {/* ACTIONS */}
                                  <td className="sticky right-0 bg-white px-5 py-4 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => openDewormModal(goat)}
                                        title="Update deworming date"
                                        className="rounded-lg border-0 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100"
                                      >
                                        <Syringe size={17} />
                                      </button>

                                      <button
                                        onClick={() => openStatusModal(goat)}
                                        title="Change status"
                                        className="rounded-lg border-0 bg-purple-50 p-2 text-purple-700 hover:bg-purple-100"
                                      >
                                        <Power size={17} />
                                      </button>

                                      <button
                                        onClick={() => openEditGoat(goat)}
                                        title="Edit goat"
                                        className="rounded-lg border-0 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                      >
                                        <Edit size={17} />
                                      </button>

                                      <button
                                        onClick={() => deleteGoat(goat)}
                                        title="Delete goat"
                                        className="rounded-lg border-0 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                      >
                                        <Trash2 size={17} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t px-5 py-3 text-sm text-gray-500">
                        Showing {filteredGoats.length} goats
                      </div>
                    </div>
                  </div>
                )}

                {/* BREEDING RECORDS */}
                {activeTab === "breeding" && (
                  <div className="space-y-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="text-xl font-bold">
                          Breeding Records
                        </h2>
                        <p className="text-sm text-gray-500">
                          Track female goats and possible male goats.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowBreedingModal(true)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-white"
                      >
                        <Plus size={18} />
                        Add Breeding Record
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-5 py-4">Female Goat</th>
                              <th className="px-5 py-4">Possible Male Goats</th>
                              <th className="px-5 py-4">Breeding Date</th>
                              <th className="px-5 py-4">Pregnancy Status</th>
                              <th className="px-5 py-4">Expected Delivery</th>
                              <th className="sticky right-0 bg-gray-50 px-5 py-4 text-right shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y">
                            {breedingRecords.map((record) => (
                              <tr key={record._id}>
                                <td className="px-5 py-4 font-semibold">
                                  {getGoatName(record.femaleGoat)}
                                </td>

                                <td className="px-5 py-4">
                                  {Array.isArray(record.maleGoats)
                                    ? record.maleGoats
                                        .map(getGoatName)
                                        .join(", ")
                                    : "-"}
                                </td>

                                <td className="px-5 py-4">
                                  {record.breedingDate
                                    ? new Date(
                                        record.breedingDate
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>

                                <td className="px-5 py-4 capitalize">
                                  {record.pregnancyStatus || "Unknown"}
                                </td>

                                <td className="px-5 py-4">
                                  {record.expectedDeliveryDate
                                    ? new Date(
                                        record.expectedDeliveryDate
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>

                                <td className="sticky right-0 bg-white px-5 py-4 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => openEditBreeding(record)}
                                      title="Edit breeding record"
                                      className="rounded-lg border-0 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                    >
                                      <Edit size={17} />
                                    </button>

                                    <button
                                      onClick={() => deleteBreeding(record)}
                                      title="Delete breeding record"
                                      className="rounded-lg border-0 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {breedingRecords.length === 0 && (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="px-5 py-10 text-center text-gray-500"
                                >
                                  No breeding records found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXPENSES */}
                {activeTab === "expenses" && (
                  <div className="space-y-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="text-xl font-bold">
                          Farm Expenses
                        </h2>
                        <p className="text-sm text-gray-500">
                          Keep track of daily farm expenses.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-white"
                      >
                        <Plus size={18} />
                        Add Expense
                      </button>
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                      <p className="text-sm text-gray-500">
                        Total recorded expenses
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-orange-600">
                        {formatCurrency(totalExpenses)}
                      </h2>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-5 py-4">Title</th>
                              <th className="px-5 py-4">Category</th>
                              <th className="px-5 py-4">Date</th>
                              <th className="px-5 py-4">Amount</th>
                              <th className="px-5 py-4">Description</th>
                              <th className="sticky right-0 bg-gray-50 px-5 py-4 text-right shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y">
                            {expenses.map((expense) => (
                              <tr key={expense._id}>
                                <td className="px-5 py-4 font-semibold">
                                  {expense.title}
                                </td>

                                <td className="px-5 py-4 capitalize">
                                  {expense.category}
                                </td>

                                <td className="px-5 py-4">
                                  {expense.expenseDate
                                    ? new Date(
                                        expense.expenseDate
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>

                                <td className="px-5 py-4 font-semibold">
                                  {formatCurrency(expense.amount)}
                                </td>

                                <td className="px-5 py-4">
                                  {expense.description ||
                                    expense.notes ||
                                    "-"}
                                </td>

                                <td className="sticky right-0 bg-white px-5 py-4 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => openEditExpense(expense)}
                                      title="Edit expense"
                                      className="rounded-lg border-0 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                                    >
                                      <Edit size={17} />
                                    </button>

                                    <button
                                      onClick={() => deleteExpense(expense)}
                                      title="Delete expense"
                                      className="rounded-lg border-0 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {expenses.length === 0 && (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="px-5 py-10 text-center text-gray-500"
                                >
                                  No expenses found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ADD / EDIT GOAT MODAL */}
      {showGoatModal && (
        <div className={modalOverlay}>
          <div className={modalCard}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>
                {editingGoat ? "Edit Goat" : "Add New Goat"}
              </h2>

              <button
                type="button"
                onClick={() => setShowGoatModal(false)}
                className={closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveGoat} className="space-y-5 p-6">
              <div>
                <label className={labelCls}>Goat Name *</label>
                <input
                  name="name"
                  value={goatForm.name}
                  onChange={handleGoatFormChange}
                  required
                  placeholder="Enter goat name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Age at Purchase *</label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="ageValue"
                    value={goatForm.ageValue}
                    onChange={handleGoatFormChange}
                    required
                    placeholder="Age"
                    className={`${inputCls} min-w-0 flex-1`}
                  />

                  <select
                    name="ageUnit"
                    value={goatForm.ageUnit}
                    onChange={handleGoatFormChange}
                    className={`${inputCls} !w-32`}
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Gender *</label>
                  <select
                    name="gender"
                    value={goatForm.gender}
                    onChange={handleGoatFormChange}
                    className={inputCls}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={goatForm.purchaseDate}
                    onChange={handleGoatFormChange}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Purchase Price (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  name="purchasePrice"
                  value={goatForm.purchasePrice}
                  onChange={handleGoatFormChange}
                  required
                  placeholder="Enter purchase price"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  name="notes"
                  value={goatForm.notes}
                  onChange={handleGoatFormChange}
                  rows="3"
                  placeholder="Additional information..."
                  className={`${inputCls} resize-y`}
                />
              </div>

              <div className={modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowGoatModal(false)}
                  className={cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingGoat}
                  className={saveBtn}
                >
                  {savingGoat
                    ? "Saving..."
                    : editingGoat
                    ? "Update Goat"
                    : "Save Goat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEWORMING DATE MODAL */}
      {dewormGoat && (
        <div className={modalOverlay}>
          <div className={`${modalCard} !max-w-md`}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>Update Deworming Date</h2>
              <button
                type="button"
                onClick={() => setDewormGoat(null)}
                className={closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveDewormingDate} className="space-y-5 p-6">
              <p className="text-sm text-gray-500">
                Goat:{" "}
                <strong className="text-gray-800">
                  {dewormGoat.name}
                </strong>
              </p>

              <div>
                <label className={labelCls}>Deworming Date *</label>
                <input
                  type="date"
                  required
                  value={dewormDate}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) => setDewormDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className={modalFooter}>
                <button
                  type="button"
                  onClick={() => setDewormGoat(null)}
                  className={cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDeworm}
                  className={saveBtn}
                >
                  {savingDeworm ? "Saving..." : "Save Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOAT STATUS MODAL */}
      {statusGoat && (
        <div className={modalOverlay}>
          <div className={`${modalCard} !max-w-md`}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>Change Goat Status</h2>
              <button
                type="button"
                onClick={() => setStatusGoat(null)}
                className={closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveGoatStatus} className="space-y-5 p-6">
              <p className="text-sm text-gray-500">
                Goat:{" "}
                <strong className="text-gray-800">
                  {statusGoat.name}
                </strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, label: "Active" },
                  { value: false, label: "Inactive" },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setStatusActive(option.value)}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                      statusActive === option.value
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className={modalFooter}>
                <button
                  type="button"
                  onClick={() => setStatusGoat(null)}
                  className={cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className={saveBtn}
                >
                  {savingStatus ? "Saving..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {showExpenseModal && (
        <div className={modalOverlay}>
          <div className={modalCard}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>
                {editingExpense ? "Edit Farm Expense" : "Add Farm Expense"}
              </h2>
              <button
                type="button"
                onClick={closeExpenseModal}
                className={closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveExpense} className="space-y-5 p-6">
              <div>
                <label className={labelCls}>Expense Title *</label>
                <input
                  required
                  value={expenseForm.title}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      title: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="e.g. Goat feed"
                />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  <option value="feed">Feed</option>
                  <option value="medicine">Medicine</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Amount (PKR) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className={labelCls}>Expense Date</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      expenseDate: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows="3"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  className={`${inputCls} resize-y`}
                />
              </div>

              <div className={modalFooter}>
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  className={cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingExpense}
                  className={saveBtn}
                >
                  {savingExpense
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT BREEDING MODAL */}
      {showBreedingModal && (
        <div className={modalOverlay}>
          <div className={modalCard}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>
                {editingBreeding
                  ? "Edit Breeding Record"
                  : "Add Breeding Record"}
              </h2>
              <button
                type="button"
                onClick={closeBreedingModal}
                className={closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveBreeding} className="space-y-5 p-6">
              <div>
                <label className={labelCls}>Female Goat *</label>

                <select
                  required
                  value={breedingForm.femaleGoat}
                  onChange={(e) =>
                    setBreedingForm({
                      ...breedingForm,
                      femaleGoat: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">Select female goat</option>
                  {females.map((goat) => (
                    <option key={goat._id} value={goat._id}>
                      {goat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Possible Male Goats *</label>

                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3">
                  {males.map((goat) => (
                    <label
                      key={goat._id}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={breedingForm.maleGoats.includes(
                          goat._id
                        )}
                        onChange={() => toggleMaleGoat(goat._id)}
                      />
                      {goat.name}
                    </label>
                  ))}

                  {males.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No active male goats available.
                    </p>
                  )}
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Select more than one male if you are unsure which
                  goat was responsible.
                </p>
              </div>

              <div>
                <label className={labelCls}>Breeding Date *</label>
                <input
                  type="date"
                  required
                  value={breedingForm.breedingDate}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) =>
                    setBreedingForm({
                      ...breedingForm,
                      breedingDate: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Pregnancy Status</label>
                <select
                  value={breedingForm.pregnancyStatus}
                  onChange={(e) =>
                    setBreedingForm({
                      ...breedingForm,
                      pregnancyStatus: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  <option value="unknown">Unknown</option>
                  <option value="pending">Pending</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="not_pregnant">Not Pregnant</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Expected Delivery Date</label>
                <input
                  type="date"
                  value={breedingForm.expectedDeliveryDate}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) =>
                    setBreedingForm({
                      ...breedingForm,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  rows="2"
                  value={breedingForm.notes}
                  onChange={(e) =>
                    setBreedingForm({
                      ...breedingForm,
                      notes: e.target.value,
                    })
                  }
                  className={`${inputCls} resize-y`}
                />
              </div>

              <div className={modalFooter}>
                <button
                  type="button"
                  onClick={closeBreedingModal}
                  className={cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingBreeding}
                  className={saveBtn}
                >
                  {savingBreeding
                    ? "Saving..."
                    : editingBreeding
                    ? "Update Breeding"
                    : "Save Breeding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}