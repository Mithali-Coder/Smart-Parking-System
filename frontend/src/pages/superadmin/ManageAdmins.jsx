import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import {
  Shield, Plus, Search, MoreVertical, Edit2, Trash2,
  Key, ToggleLeft, ToggleRight, Building2, Users, X, Check
} from "lucide-react";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const CreateAdminModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/super-admin/admins", form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#13131a", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Create Admin Account</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#6b7280" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(244,63,94,0.1)", color: "#fda4af", border: "1px solid rgba(244,63,94,0.2)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", key: "email", type: "email", placeholder: "admin@example.com" },
            { label: "Password", key: "password", type: "password", placeholder: "Min 6 characters" },
            { label: "Phone (optional)", key: "phone", type: "tel", placeholder: "+91 98765 43210" },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                style={inputStyle}
                required={field.key !== "phone"}
                onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ admin, onClose, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.post(`/super-admin/admins/${admin._id}/reset-password`, { newPassword: password });
      onSuccess("Password reset successfully");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#13131a", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Reset Password</h2>
          <button onClick={onClose} style={{ color: "#6b7280" }}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Reset password for <span className="text-white font-medium">{admin.name}</span></p>
        {error && <div className="mb-3 p-2 rounded-lg text-xs" style={{ background: "rgba(244,63,94,0.1)", color: "#fda4af" }}>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>New Password</label>
            <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required minLength={6}
              onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white" }}>
              {loading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const res = await apiClient.get("/super-admin/admins");
      setAdmins(res.data.admins || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const toggleStatus = async (adminId) => {
    try {
      const res = await apiClient.put(`/super-admin/admins/${adminId}/status`);
      showToast(res.data.message);
      fetchAdmins();
    } catch (e) { showToast("Failed to toggle status"); }
    setActiveMenu(null);
  };

  const deleteAdmin = async (adminId, name) => {
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/super-admin/admins/${adminId}`);
      showToast("Admin deleted");
      fetchAdmins();
    } catch (e) { showToast("Failed to delete"); }
    setActiveMenu(null);
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Admins</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>{admins.length} admin accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4b5563" }} />
        <input
          type="text"
          placeholder="Search admins by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: "40px" }}
          onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
      </div>

      {/* Admin Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 animate-spin" style={{ borderColor: "rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#4b5563" }}>
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-white">No admins found</p>
          <p className="text-sm mt-1">Create the first admin account above</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(admin => (
            <div
              key={admin._id}
              className="rounded-2xl p-5 relative"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
                >
                  {admin.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>{admin.email}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === admin._id ? null : admin._id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "#6b7280" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === admin._id && (
                    <div
                      className="absolute right-0 top-8 z-20 w-44 rounded-xl py-1 shadow-xl"
                      style={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {[
                        { label: admin.isActive ? "Deactivate" : "Activate", icon: admin.isActive ? ToggleLeft : ToggleRight, action: () => toggleStatus(admin._id), color: admin.isActive ? "#f59e0b" : "#22c55e" },
                        { label: "Reset Password", icon: Key, action: () => { setResetTarget(admin); setActiveMenu(null); }, color: "#8b5cf6" },
                        { label: "Delete", icon: Trash2, action: () => deleteAdmin(admin._id, admin.name), color: "#ef4444" },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left"
                          style={{ color: item.color }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: "Parkings", value: admin.parkingCount ?? 0, icon: Building2 },
                  { label: "Attendants", value: admin.attendantCount ?? 0, icon: Users },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <stat.icon className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
                    <div>
                      <p className="text-sm font-bold text-white">{stat.value}</p>
                      <p className="text-[10px]" style={{ color: "#6b7280" }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: admin.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: admin.isActive ? "#86efac" : "#fca5a5",
                    border: `1px solid ${admin.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}
                >
                  {admin.isActive ? "● Active" : "● Inactive"}
                </span>
                {admin.phone && (
                  <span className="text-xs" style={{ color: "#4b5563" }}>{admin.phone}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAdminModal onClose={() => setShowCreate(false)} onSuccess={() => { fetchAdmins(); showToast("Admin created successfully"); }} />
      )}
      {resetTarget && (
        <ResetPasswordModal admin={resetTarget} onClose={() => setResetTarget(null)} onSuccess={showToast} />
      )}

      {/* Click outside to close menu */}
      {activeMenu && <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />}
    </div>
  );
};

export default ManageAdmins;
