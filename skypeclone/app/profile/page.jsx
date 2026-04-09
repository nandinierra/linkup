"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProfileCard from "../../components/profile/ProfileCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import SettingsPanel from "../../components/profile/SettingsPanel";
import { getMe } from "../../services/userServices";
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  Shield, 
  ChevronLeft,
  LogOut,
  ChevronRight
} from "lucide-react";

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "account", label: "Account", icon: SettingsIcon },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-600/50" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Reusing existing Sidebar but maybe hide on small screens if in profile mobile view */}
      <div className="hidden lg:block lg:w-74 border-r border-white/5">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 flex flex-col h-full bg-gray-950 relative">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/5 bg-gray-900/50 backdrop-blur-md flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Settings</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Navigation Sidebar */}
          <div className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 space-y-2 bg-gray-950/50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Settings</h3>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all group ${
                  activeTab === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 font-semibold">
                  <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-blue-500"} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight size={16} className="opacity-50" />}
              </button>
            ))}
            
            <div className="mt-auto pt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
              >
                <LogOut size={20} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Overview Section */}
              {activeTab === "profile" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Public Profile</h2>
                      <p className="text-gray-400">Manage your profile visibility and basic info</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    <ProfileCard user={user} onEdit={() => setShowEditModal(true)} />
                    
                    <div className="space-y-6">
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setShowPasswordModal(true)}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
                            <Lock size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Security</h4>
                            <p className="text-xs text-gray-500">Update password & account protection</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-orange-400 group-hover:underline">Update Password →</button>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setActiveTab("notifications")}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Bell size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Notifications</h4>
                            <p className="text-xs text-gray-500">Control desktop alerts and calls</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-purple-400 group-hover:underline">Manage Alerts →</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account / Application Settings Section */}
              {activeTab !== "profile" && (
                <div className="space-y-8">
                   <div className="flex items-center gap-4 text-gray-400 mb-2">
                    <button onClick={() => setActiveTab("profile")} className="hover:text-blue-400 transition-colors">Profile</button>
                    <ChevronRight size={14} />
                    <span className="text-white font-bold">{navItems.find(i => i.id === activeTab)?.label}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{navItems.find(i => i.id === activeTab)?.label} Settings</h2>
                    <p className="text-gray-400">Configure your session and application preferences</p>
                  </div>
                  <SettingsPanel user={user} onUpdate={(updated) => setUser(updated)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal user={user} onClose={() => setShowEditModal(false)} onUpdate={(updatedUser) => setUser(updatedUser)} />
      )}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
