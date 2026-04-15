"use client"
import { useState, useEffect } from "react"
import { BACKEND_URL } from "@/config"
import { useRouter } from "next/navigation"
import { getMe } from "../../services/authServices"
import { 
  Video, 
  MessageSquare, 
  Phone, 
  Monitor, 
  Settings, 
  Plus, 
  Clock, 
  Users, 
  Mic, 
  ArrowRight 
} from "lucide-react"

const DashboardPage = () => {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)

                // Fetch real call history for Recent Activity
                const callsRes = await fetch(`${BACKEND_URL}/api/calls`, { credentials: "include" });
                if (callsRes.ok) {
                    const calls = await callsRes.json();
                    setRecentActivity(calls.slice(0, 5)); // show top 5
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadUser()
    }, [])

    const ActionCard = ({ icon: Icon, title, description, color = "bg-blue-600" }) => (
        <div 
          onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search"]');
              if (searchInput) searchInput.focus();
          }}
          className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 group flex flex-col items-center text-center"
        >
            <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{description}</p>
        </div>
    )

    if (loading) return null;

    return (
        <div className="flex-1 flex flex-col bg-[#0B121B] text-white overflow-hidden">
            {/* Header */}
            <div className="h-[70px] px-8 flex items-center justify-between border-b border-white/5 bg-[#111926]/50 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button 
                        className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/30"
                    >
                        <Video size={18} />
                        Meet Now
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    <button 
                        onClick={() => router.push("/profile")}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-12">
                    {/* Hero Section */}
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                        <h2 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {user?.name || "User"}!</h2>
                        <p className="text-gray-400 font-medium">
                            Everything looks good today. You have <span className="text-blue-400">2 meetings</span> scheduled.
                        </p>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <ActionCard icon={MessageSquare} title="New Chat" description="Message someone new" />
                        <ActionCard icon={Video} title="Start Meeting" description="Instant video call" />
                        <ActionCard icon={Phone} title="Make a Call" description="Dial a phone number" />
                        <ActionCard icon={Monitor} title="Share Screen" description="Present your work" color="bg-gray-700" />
                    </div>

                    {/* Bottom Split Layout */}
                    <div className="grid lg:grid-cols-5 gap-10 items-start">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="text-blue-500" size={20} />
                                    Recent Activity
                                </h3>
                                <button className="text-blue-400 hover:underline text-xs font-bold uppercase tracking-wider">
                                    View All
                                </button>
                            </div>

                            <div className="space-y-3">
                                {recentActivity.length > 0 ? recentActivity.map((activity) => {
                                    const isMissed = activity.status === "missed";
                                    const otherUser = activity.receiver?._id === user?._id ? activity.caller : activity.receiver;
                                    const name = otherUser?.name || "User";
                                    const timeStr = new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const dateStr = new Date(activity.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? "Today" : "Earlier";

                                    return (
                                        <div key={activity._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors group">
                                            <div className={`w-10 h-10 ${isMissed ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                                <Phone size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">
                                                    <span className="text-blue-400">{name}</span> {isMissed ? "missed a call from you" : "started a call"}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">{dateStr} • {timeStr}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="p-8 text-center text-xs text-gray-500 bg-white/5 rounded-2xl border border-dotted border-white/10">No recent activity found.</p>
                                )}
                            </div>
                        </div>

                        {/* Large Connect Card */}
                        <div className="lg:col-span-3 h-full">
                            <div className="h-full bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                                
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/40 animate-pulse-slow">
                                        <MessageSquare size={40} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 border border-white/10 rounded-xl flex items-center justify-center text-blue-400 shadow-xl">
                                        <Plus size={20} />
                                    </div>
                                </div>
                                
                                <h3 className="text-3xl font-black mb-4 tracking-tight">Connect with your world</h3>
                                <p className="text-gray-400 mb-10 max-w-md mx-auto font-medium leading-relaxed">
                                    Select a contact from the sidebar or start a new conversation to begin chatting.
                                </p>
                                <button
                                    onClick={() => {
                                        const searchInput = document.querySelector('input[placeholder*="Search"]');
                                        if (searchInput) searchInput.focus();
                                    }}
                                    className="bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 group shadow-xl active:scale-95"
                                >
                                    Start New Conversation
                                    <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.1);
                }
                @keyframes pulse-slow {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(0.98); }
                }
                .animate-pulse-slow {
                  animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    )
}

export default DashboardPage