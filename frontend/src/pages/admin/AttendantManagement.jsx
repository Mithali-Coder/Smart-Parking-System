import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import DataTable from "../../components/admin/DataTable.jsx";
import Modal from "../../components/admin/Modal.jsx";
import FormInput from "../../components/admin/FormInput.jsx";

const AttendantManagement = () => {
  const [attendants, setAttendants] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    assignedParkings: [],
    isActive: true
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendantsRes, parkingsRes] = await Promise.all([
        apiClient.get("/admin/attendants"),
        apiClient.get("/admin/parkings")
      ]);
      setAttendants(attendantsRes.data.attendants || []);
      setParkings(parkingsRes.data.parkings || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAttendant(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      assignedParkings: [],
      isActive: true
    });
    setError("");
    setModalOpen(true);
  };

  const handleEdit = (attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      name: attendant.name,
      email: attendant.email,
      phone: attendant.phone || "",
      password: "",
      assignedParkings: attendant.assignedParking?.map((p) => p._id || p) || [],
      isActive: attendant.isActive !== false
    });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async (attendant) => {
    if (!window.confirm(`Are you sure you want to delete "${attendant.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/attendants/${attendant._id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete attendant");
    }
  };

  const handleToggleStatus = async (attendant) => {
    try {
      await apiClient.put(`/admin/attendants/${attendant._id}/status`, {
        isActive: !attendant.isActive
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (attendant) => {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      await apiClient.post(`/admin/attendants/${attendant._id}/reset-password`, {
        password: newPassword
      });
      alert("Password reset successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset password");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editingAttendant && !formData.password) {
      setError("Password is required for new attendants");
      return;
    }

    try {
      if (editingAttendant) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await apiClient.put(`/admin/attendants/${editingAttendant._id}`, updateData);
      } else {
        await apiClient.post("/admin/attendants", formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save attendant");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "phone",
      label: "Phone",
      render: (value) => value || "-"
    },
    {
      key: "assignedParking",
      label: "Assigned Parkings",
      render: (value) => {
        if (!value || value.length === 0) return "None";
        return value.map((p) => p.name || p).join(", ");
      }
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value !== false ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  const actions = [
    { type: "edit", label: "Edit", variant: "primary" },
    { type: "reset", label: "Reset Password", variant: "warning" },
    { type: "toggle", label: "Toggle Status", variant: "warning" },
    { type: "delete", label: "Delete", variant: "danger" }
  ];

  const handleAction = (type, attendant) => {
    switch (type) {
      case "edit":
        handleEdit(attendant);
        break;
      case "delete":
        handleDelete(attendant);
        break;
      case "toggle":
        handleToggleStatus(attendant);
        break;
      case "reset":
        handleResetPassword(attendant);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendant Management</h1>
          <p className="text-gray-600 mt-1">Manage attendants and their parking assignments</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Attendant
        </button>
      </div>

      <DataTable
        columns={columns}
        data={attendants}
        loading={loading}
        actions={actions}
        onAction={handleAction}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAttendant ? "Edit Attendant" : "Create Attendant"}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingAttendant}
          />
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <FormInput
            label={editingAttendant ? "New Password (leave blank to keep current)" : "Password"}
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingAttendant}
            minLength={6}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Parkings
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {parkings.map((parking) => (
                <label key={parking._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assignedParkings.includes(parking._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedParkings: [...formData.assignedParkings, parking._id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          assignedParkings: formData.assignedParkings.filter((id) => id !== parking._id)
                        });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">{parking.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingAttendant ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendantManagement;
