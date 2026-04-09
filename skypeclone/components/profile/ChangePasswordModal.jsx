"use client";
import { useState } from "react";
import { X, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePassword } from "../../services/userServices";

const ChangePasswordModal = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ text: "Passwords do not match", type: "error" });
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await updatePassword({ oldPassword, newPassword });
      if (res.success) {
        setMessage({ text: "Password updated successfully!", type: "success" });
        setTimeout(onClose, 2000);
      } else {
        setMessage({ text: res.message || "Failed to update password", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Change Password</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/5 rounded-xl px-11 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/5 rounded-xl px-11 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/5 rounded-xl px-11 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
