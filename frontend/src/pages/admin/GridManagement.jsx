import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import DataTable from "../../components/admin/DataTable.jsx";
import Modal from "../../components/admin/Modal.jsx";
import FormInput from "../../components/admin/FormInput.jsx";
import GridViewModal from "../../components/admin/GridViewModal.jsx";

const GridManagement = () => {
  const [parkings, setParkings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    levelNumber: 1,
    levelName: "",
    rows: "A,B,C,D", // Comma-separated string input
    columns: 6,
    displayOrder: 1
  });
  const [error, setError] = useState("");
  
  // Grid view modal state
  const [gridViewOpen, setGridViewOpen] = useState(false);
  const [viewingLevel, setViewingLevel] = useState(null);

  useEffect(() => {
    fetchParkings();
  }, []);

  useEffect(() => {
    if (selectedParking) {
      fetchLevels(selectedParking);
    }
  }, [selectedParking]);

  const fetchParkings = async () => {
    try {
      const res = await apiClient.get("/admin/parkings");
      setParkings(res.data.parkings || []);
      if (res.data.parkings?.length > 0 && !selectedParking) {
        setSelectedParking(res.data.parkings[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch parkings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async (parkingId) => {
    try {
      const res = await apiClient.get(`/admin/parkings/${parkingId}/levels`);
      setLevels(res.data.levels || []);
    } catch (error) {
      console.error("Failed to fetch levels:", error);
    }
  };

  const handleCreate = () => {
    setEditingLevel(null);
    setFormData({
      levelNumber: levels.length + 1,
      levelName: "",
      rows: "A,B,C,D",
      columns: 6,
      displayOrder: levels.length + 1
    });
    setError("");
    setModalOpen(true);
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      levelNumber: level.levelNumber,
      levelName: level.levelName,
      rows: Array.isArray(level.rows) ? level.rows.join(",") : level.rows,
      columns: level.columns,
      displayOrder: level.displayOrder
    });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async (level) => {
    if (!window.confirm(`Are you sure you want to delete "${level.levelName}"? This will also delete all slots in this level.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/levels/${level._id}`);
      fetchLevels(selectedParking);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete level");
    }
  };

  const handleViewGrid = (level) => {
    setViewingLevel(level);
    setGridViewOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Parse rows from comma-separated string
    const rowsArray = formData.rows.split(",").map(r => r.trim()).filter(r => r);
    if (rowsArray.length === 0) {
      setError("Rows must contain at least one value (e.g., A,B,C)");
      return;
    }

    try {
      const payload = {
        ...formData,
        rows: rowsArray // Send as array
      };

      if (editingLevel) {
        await apiClient.put(`/admin/levels/${editingLevel._id}`, payload);
      } else {
        await apiClient.post(`/admin/parkings/${selectedParking}/levels`, payload);
      }
      setModalOpen(false);
      fetchLevels(selectedParking);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save level");
    }
  };

  const columns = [
    { key: "levelNumber", label: "Level #" },
    { key: "levelName", label: "Name" },
    {
      key: "rows",
      label: "Rows",
      render: (value) => Array.isArray(value) ? value.join(", ") : value
    },
    { key: "columns", label: "Columns" },
    {
      key: "slotCount",
      label: "Slot Count",
      render: (value, row) => {
        // Calculate slot count from rows × columns
        const rowCount = Array.isArray(row.rows) ? row.rows.length : (typeof row.rows === 'string' ? row.rows.split(',').length : 0);
        const calculatedCount = rowCount * (row.columns || 0);
        // Use API-provided slotCount if available, otherwise calculate
        const displayCount = value !== undefined ? value : calculatedCount;
        return (
          <span className="font-semibold text-gray-900">
            {displayCount}
          </span>
        );
      }
    },
    { key: "displayOrder", label: "Display Order" },
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
    { 
      type: "view", 
      label: "View Grid", 
      variant: "secondary",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    { type: "edit", label: "Edit", variant: "primary" },
    { type: "delete", label: "Delete", variant: "danger" }
  ];

  const handleAction = (type, level) => {
    switch (type) {
      case "view":
        handleViewGrid(level);
        break;
      case "edit":
        handleEdit(level);
        break;
      case "delete":
        handleDelete(level);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grid Management</h1>
          <p className="text-gray-600 mt-1">Configure parking layouts and slot arrangements</p>
        </div>
        {selectedParking && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Create Level
          </button>
        )}
      </div>

      {/* Parking Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Parking
        </label>
        <select
          value={selectedParking || ""}
          onChange={(e) => setSelectedParking(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a parking...</option>
          {parkings.map((parking) => (
            <option key={parking._id} value={parking._id}>
              {parking.name}
            </option>
          ))}
        </select>
      </div>

      {selectedParking ? (
        <DataTable
          columns={columns}
          data={levels}
          loading={loading}
          actions={actions}
          onAction={handleAction}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
          Please select a parking to manage its grid layout
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLevel ? "Edit Level" : "Create Level"}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Level Number"
            name="levelNumber"
            type="number"
            value={formData.levelNumber}
            onChange={(e) => setFormData({ ...formData, levelNumber: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
          <FormInput
            label="Level Name"
            name="levelName"
            value={formData.levelName}
            onChange={(e) => setFormData({ ...formData, levelName: e.target.value })}
            placeholder="e.g., Ground Floor, Level 1"
            required
          />
          <FormInput
            label="Rows (comma-separated)"
            name="rows"
            value={formData.rows}
            onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
            placeholder="e.g., A,B,C,D"
            required
          />
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Enter row labels separated by commas (e.g., A,B,C or 1,2,3)
          </p>
          <FormInput
            label="Number of Columns"
            name="columns"
            type="number"
            value={formData.columns}
            onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
          <FormInput
            label="Display Order"
            name="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
          <p className="text-xs text-gray-500 mb-4">
            Note: Creating a level will automatically generate all slots for the grid. Higher display order appears first.
          </p>
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
              {editingLevel ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Grid View Modal */}
      <GridViewModal
        isOpen={gridViewOpen}
        onClose={() => {
          setGridViewOpen(false);
          setViewingLevel(null);
        }}
        level={viewingLevel}
        parkingId={selectedParking}
      />
    </div>
  );
};

export default GridManagement;
