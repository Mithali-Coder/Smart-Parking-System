import React, { useState } from "react";

/**
 * Premium Booking Modal - Apple/Stripe inspired
 * - Clean white modal with soft shadow
 * - Minimal form design
 * - Clear visual hierarchy
 * - Instant feedback on interactions
 */
const BookingModal = ({ slot, isOpen, onClose, onConfirm }) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setVehicleNumber("");
      setError("");
    }
  }, [isOpen, slot]);

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedVehicle = vehicleNumber.trim().toUpperCase();
    if (!trimmedVehicle) {
      setError("Vehicle number is required");
      return;
    }

    if (trimmedVehicle.length < 3) {
      setError("Please enter a valid vehicle number");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(slot.id, trimmedVehicle);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-premium-lg shadow-soft-xl max-w-md w-full transform transition-all duration-150 ease-apple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            Book Parking Slot
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-150 rounded-lg p-1 hover:bg-neutral-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Slot Info Card */}
          <div className="p-4 bg-neutral-50 rounded-premium border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Slot ID</span>
              <span className="text-2xl font-semibold text-neutral-900">
                {slot.slotLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                {slot.status}
              </span>
              {slot.slotType && slot.slotType !== "CAR" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-200 text-neutral-700">
                  {slot.slotType}
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="e.g., MH12AB1234"
                className="input-field"
                autoFocus
                disabled={loading}
                maxLength={20}
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Enter the vehicle registration number
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-premium">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !vehicleNumber.trim()}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Booking...
                  </span>
                ) : (
                  "Book Slot"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
