"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getUsers } from "../services/userServices";
import { getMe } from "../services/authServices";
import { useCall } from "../context/CallContext";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Phone, 
  Settings, 
  Plus, 
  MessageSquare, 
  Users, 
  Bell,
  Search,
  MoreVertical,
  LogOut
} from "lucide-react";

/**
 * Sidebar Component - Redesigned with 4-Tab Navigation & Centralized Presence
 */
const Sidebar = () => {
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params?.conversationId;
  const { socket, callState, startCall, onlineUsers } = useCall();

  const [users, setUsers] = useState([]);
  const [logeduser, setLogeduser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [globalTyping, setGlobalTyping] = useState({});
  const [activeTab, setActiveTab] = useState("chats"); 
  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);

  // ── Route-based Tab Highlighting ──────────────────────────────
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/contacts") setActiveTab("contacts");
    else if (path === "/calls") setActiveTab("calls");
    else setActiveTab("chats");
  }, []);

  // ── ... (omitting middle parts for clarity if needed, but I'll replace the navigation block directly)

  // ── Initial Load ──────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [meData, usersData] = await Promise.all([getMe(), getUsers()]);
        setLogeduser(meData.user);
        setUsers(usersData.users);

        const convosRes = await fetch("http://localhost:4000/api/conversation", { credentials: "include" });
        if (convosRes.ok) setRecentChats(await convosRes.json());
      } catch (err) {
        console.warn("Sidebar data load failed:", err);
      }
    };
    loadData();
  }, []);

  // ── Call History Fetch ────────────────────────────────────────
  const fetchCallHistory = async () => {
    setCallHistoryLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/calls", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCallHistory(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch { }
    setCallHistoryLoading(false);
  };

  useEffect(() => {
    if (callState === "idle") {
      const t = setTimeout(() => fetchCallHistory(), 800);
      return () => clearTimeout(t);
    }
  }, [callState]);

  // ── Actions ──────────────────────────────────────────────────
  const createOrFetchConversation = async (user) => {
    try {
      const res = await fetch("http://localhost:4000/api/conversation", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: user?._id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data._id}`);
      }
    } catch {}
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:4000/auth/logout", { method: "POST", credentials: "include" });
      if (res.ok) router.push("/login");
    } catch {}
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { day: "2-digit", month: "short" });
  };

  // ── Socket Listeners ────────────────────────────────────────
  useEffect(() => {
    if (!socket || !logeduser) return;

    recentChats.forEach(chat => socket.emit("join_room", chat?._id));

    const handleTyping = ({ conversationId, userId }) => {
      const chat = recentChats?.find(c => c?._id === conversationId);
      const typer = chat?.participants?.find(p => p?._id === userId);
      if (typer) setGlobalTyping(prev => ({ ...prev, [conversationId]: typer.name }));
    };

    const handleStopTyping = ({ conversationId }) => {
      setGlobalTyping(prev => { const u = { ...prev }; delete u[conversationId]; return u; });
    };

    const handleUpdate = () => {
       fetch("http://localhost:4000/api/conversation", { credentials: "include" })
         .then(r => r.json()).then(setRecentChats).catch(() => {});
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("receive_msg", handleUpdate);
    socket.on("sidebar_update", handleUpdate);
    socket.on("messages_read", handleUpdate);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("receive_msg", handleUpdate);
      socket.off("sidebar_update", handleUpdate);
      socket.off("messages_read", handleUpdate);
    };
  }, [socket, recentChats.length, logeduser?._id]);

  return (
    <div className="w-80 bg-[#0B121B] flex flex-col border-r border-white/5 shadow-2xl relative z-20">
        {/* Profile Header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 relative group">
            <div className="relative">
              <img 
                src={logeduser?.profilePic || `https://ui-avatars.com/api/?name=${logeduser?.name || "User"}&background=random`} 
                alt="Profile" 
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-blue-500 transition-all cursor-pointer" 
                onClick={() => router.push("/profile")}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0B121B] rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Skype Clone</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.1em]">{logeduser?.name || "User"}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push("/profile")} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
               <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search people, groups, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16202D] text-[11px] text-white rounded-xl pl-9 pr-4 py-3 border border-white/5 focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="grid grid-cols-4 px-2 border-b border-white/5 mb-2">
          {[
            { id: "chats", label: "Chats", icon: MessageSquare },
            { id: "calls", label: "Calls", icon: Phone },
            { id: "contacts", label: "Contacts", icon: Users },
            { id: "notifications", label: "Notifications", icon: Bell }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "contacts") {
                    router.push("/contacts");
                  } else {
                    setActiveTab(tab.id);
                    if (tab.id === "calls") fetchCallHistory();
                  }
                }}
                className={`flex flex-col items-center gap-1.5 py-3 transition-all relative group ${active ? "text-blue-500" : "text-gray-500 hover:text-gray-300"}`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-blue-500/10" : "group-hover:bg-white/5"}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.05em] transition-opacity ${active ? "opacity-100" : "opacity-60"}`}>{tab.label}</span>
                {active && <div className="absolute -bottom-[1px] left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
              </button>
            )
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar space-y-0.5">
          {activeTab === "chats" && (
            recentChats.length > 0 ? (
              recentChats
                .filter(c => {
                  const n = c.isGroupChat ? c.groupName : c.participants?.find(p => p._id !== logeduser?._id)?.name;
                  return n?.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(chat => {
                  const other = chat.participants?.find(p => p._id !== logeduser?._id);
                  const isOnline = !chat.isGroupChat && other && onlineUsers.has(other._id);
                  const isActive = activeConversationId === chat._id;
                  const isTyping = globalTyping[chat._id];

                  return (
                    <div
                      key={chat._id}
                      onClick={() => router.push(`/chat/${chat._id}`)}
                      className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-4 relative ${isActive ? "bg-blue-600/10 shadow-lg" : "hover:bg-white/5"}`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={(chat.isGroupChat ? chat.groupPic : other?.profilePic) || `https://ui-avatars.com/api/?name=${(chat.isGroupChat ? chat.groupName : other?.name) || "U"}&background=random`} 
                          className={`w-11 h-11 rounded-2xl object-cover ring-2 ${isActive ? "ring-blue-500/40" : "ring-transparent"} group-hover:ring-blue-500/20 transition-all`}
                        />
                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B121B] rounded-full shadow-xl" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className={`text-sm font-bold truncate ${isActive ? "text-blue-400" : "text-gray-100"}`}>{chat.isGroupChat ? chat.groupName : other?.name}</h4>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{formatTime(chat.lastMessage?.createdAt)}</span>
                        </div>
                        <p className={`text-xs truncate transition-colors ${isTyping ? "text-blue-400 font-bold animate-pulse" : isActive ? "text-gray-300" : "text-gray-500"}`}>
                           {isTyping ? `${isTyping} is typing...` : chat.lastMessage?.text || "Started a conversation"}
                        </p>
                      </div>
                      {chat.unseenCount > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-lg shadow-blue-500/40 border border-white/10">
                          {chat.unseenCount}
                        </div>
                      )}
                      {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />}
                    </div>
                  );
                })
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-40">
                  <MessageSquare size={32} className="text-gray-600 mb-3" />
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">No conversations</p>
                </div>
            )
          )}

          {activeTab === "calls" && (
            callHistoryLoading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : callHistory.length > 0 ? (
              callHistory.map(call => {
                const isOutgoing = call.caller?._id === logeduser?._id;
                const other = isOutgoing ? call.receiver : call.caller;
                const isMissed = call.status === "missed";
                return (
                  <div key={call._id} className="p-3 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-4 cursor-default group">
                    <img src={other?.profilePic || `https://ui-avatars.com/api/?name=${other?.name}&background=random`} className="w-11 h-11 rounded-2xl object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-100 truncate">{other?.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {isMissed ? <PhoneMissed size={12} className="text-red-500" /> : isOutgoing ? <PhoneOutgoing size={12} className="text-blue-400" /> : <PhoneIncoming size={12} className="text-gray-500" />}
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isMissed ? "text-red-500/80" : "text-gray-500"}`}>
                          {isMissed ? "Missed" : isOutgoing ? "Outgoing" : "Incoming"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-bold mb-2">{formatTime(call.createdAt)}</p>
                      <button 
                        onClick={() => {
                          if (other?._id) {
                            startCall({ receiverId: other._id, receiverName: other?.name, receiverPic: other?.profilePic });
                          }
                        }}
                        className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all active:scale-90"
                      >
                        <Phone size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-40">
                  <Phone size={32} className="text-gray-600 mb-3" />
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">No call history</p>
                </div>
            )
          )}

          {activeTab === "contacts" && (
            users.filter(u => u._id !== logeduser?._id && u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
              const isOnline = onlineUsers.has(u._id);
              return (
                <div 
                  key={u._id} 
                  onClick={() => createOrFetchConversation(u)}
                  className="p-3 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-4 cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <img src={u.profilePic || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-11 h-11 rounded-2xl object-cover" />
                    {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B121B] rounded-full shadow-lg" />}
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-bold text-gray-100 truncate">{u.name}</h4>
                     <p className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? "text-green-500" : "text-gray-500"}`}>{isOnline ? "Online" : "Available"}</p>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 bg-white/5 text-gray-400 hover:text-blue-500 rounded-lg transition-all"><MessageSquare size={16} /></button>
                </div>
              );
            })
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <Bell size={28} className="text-gray-700 mb-4 animate-bounce" />
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Clear for takeoff</h4>
              <p className="text-[10px] text-gray-600 font-medium">You're all caught up with your notifications.</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-[#080E15]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group font-bold tracking-tight"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
        `}</style>
    </div>
  );
};

export default Sidebar;
