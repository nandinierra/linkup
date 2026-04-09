"use client";
import { useState } from "react";
import { Bell, Shield, Eye, Smartphone, Save, Loader2 } from "lucide-react";
import { updateProfile } from "../../services/userServices";

const SettingsPanel = ({ user, onUpdate }) => {
  const [settings, setSettings] = useState({
    notifications: user?.settings?.notifications ?? true,
    readReceipts: user?.settings?.readReceipts ?? true,
    privacy: true, // Mock for now
    appearOffline: false, // Mock for now
  });
  const [loading, setLoading] = useState(false);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateProfile({ settings });
      if (res.success) {
        onUpdate(res.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const SettingRow = ({ icon: Icon, title, description, value, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl transition hover:bg-white/10">
      <div className="flex gap-4 items-center">
        <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          value ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Smartphone className="text-blue-500" size={20} />
          Application Settings
        </h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      <div className="grid gap-4">
        <SettingRow
          icon={Bell}
          title="Push Notifications"
          description="Receive desktop notifications for new messages"
          value={settings.notifications}
          onToggle={() => toggleSetting("notifications")}
        />
        <SettingRow
          icon={Eye}
          title="Read Receipts"
          description="Let others know when you've read their messages"
          value={settings.readReceipts}
          onToggle={() => toggleSetting("readReceipts")}
        />
        <SettingRow
          icon={Shield}
          title="Enhanced Privacy"
          description="Hide your last seen and profile details from strangers"
          value={settings.privacy}
          onToggle={() => toggleSetting("privacy")}
        />
        <SettingRow
          icon={Smartphone}
          title="Online Status"
          description="Automatically show as offline when inactive"
          value={settings.appearOffline}
          onToggle={() => toggleSetting("appearOffline")}
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
