import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import DataTable from "../../components/admin/DataTable.jsx";
import Modal from "../../components/admin/Modal.jsx";
import FormInput from "../../components/admin/FormInput.jsx";

const ParkingManagement = () => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "Mall",
    totalLevels: 1,
    status: "active",
    isActive: true
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const res = await apiClient.get("/admin/parkings");
      setParkings(res.data.parkings || []);
    } catch (error) {
      console.error("Failed to fetch parkings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingParking(null);
    setFormData({
      name: "",
      location: "",
      type: "Mall",
      totalLevels: 1,
      status: "active",
      isActive: true
    });
    setError("");
    setModalOpen(true);
  };

  const handleEdit = (parking) => {
    setEditingParking(parking);
    setFormData({
      name: parking.name,
      location: parking.location || parking.address || "",
      type: parking.type || "Mall",
      totalLevels: parking.totalLevels || 1,
      status: parking.status || "active",
      isActive: parking.isActive !== false
    });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async (parking) => {
    if (!window.confirm(`Are you sure you want to delete "${parking.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/parkings/${parking._id}`);
      fetchParkings();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete parking");
    }
  };

  const handleToggleStatus = async (parking) => {
    try {
      await apiClient.put(`/admin/parkings/${parking._id}/status`, {
        isActive: !parking.isActive
      });
      fetchParkings();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingParking) {
        await apiClient.put(`/admin/parkings/${editingParking._id}`, formData);
      } else {
        await apiClient.post("/admin/parkings", formData);
      }
      setModalOpen(false);
      fetchParkings();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save parking");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "location",
      label: "Location",
      render: (value, row) => row.location || row.address || "-"
    },
    {
      key: "type",
      label: "Type",
      render: (value) => value || "Mall"
    },
    { key: "totalLevels", label: "Levels" },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value !== false
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value !== false ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "attendants",
      label: "Attendants",
      render: (value) => (value?.length || 0) + " assigned"
    }
  ];

  const actions = [
    { type: "edit", label: "Edit", variant: "primary" },
    { type: "toggle", label: "Toggle Status", variant: "warning" },
    { type: "delete", label: "Delete", variant: "danger" }
  ];

  const handleAction = (type, parking) => {
    switch (type) {
      case "edit":
        handleEdit(parking);
        break;
      case "delete":
        handleDelete(parking);
        break;
      case "toggle":
        handleToggleStatus(parking);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parking Management</h1>
          <p className="text-gray-600 mt-1">Manage parking locations and configurations</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Parking
        </button>
      </div>

      <DataTable
        columns={columns}
        data={parkings}
        loading={loading}
        actions={actions}
        onAction={handleAction}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingParking ? "Edit Parking" : "Create Parking"}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Parking Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={error}
          />
          <FormInput
            label="Location"
            name="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Pune, Mumbai"
            required
          />
          <FormInput
            label="Type"
            name="type"
            type="select"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "Mall", label: "Mall" },
              { value: "Building", label: "Building" },
              { value: "Open Parking", label: "Open Parking" }
            ]}
          />
          <FormInput
            label="Total Levels"
            name="totalLevels"
            type="number"
            value={formData.totalLevels}
            onChange={(e) => setFormData({ ...formData, totalLevels: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
          <FormInput
            label="Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" }
            ]}
          />
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
              {editingParking ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParkingManagement;
