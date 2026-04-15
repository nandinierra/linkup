"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getMe } from "../services/authServices";
import { useCall } from "../context/CallContext";
import { getContacts } from "../services/contactServices";
import { BACKEND_URL } from "@/config";
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
  const [requestData, setRequestData] = useState({ incoming: [], outgoing: [], history: [] });
  const [requestLoading, setRequestLoading] = useState(false);

  // ── Route-based Tab Highlighting ──────────────────────────────
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/contacts") setActiveTab("contacts");
    else if (path === "/calls") setActiveTab("calls");
    else setActiveTab("chats");
  }, []);

  // ── Initial Load ──────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [meData, contactsData, reqRes] = await Promise.all([
          getMe(), 
          getContacts(),
          fetch(`${BACKEND_URL}/api/contacts/requests`, { credentials: "include" })
        ]);
        setLogeduser(meData.user);
        
        // Populate 'users' state with ONLY contacts (as per Rule #2)
        setUsers(Array.isArray(contactsData) ? contactsData : []);

        if (reqRes.ok) {
           const rData = await reqRes.json();
           setRequestData(rData);
        }

        const convosRes = await fetch(`${BACKEND_URL}/api/conversation`, { credentials: "include" });
        if (convosRes.ok) {
           const allConvos = await convosRes.json();
           // Only show chats with accepted contacts (except group chats which might have non-contacts but admin-added)
           // For simplicity, let's filter one-on-one chats
           const contactIds = new Set((contactsData || []).map(u => u._id));
           const filteredConvos = allConvos.filter(chat => {
              if (chat.isGroupChat) return true;
              const other = chat.participants?.find(p => p._id !== meData.user?._id);
              return other && contactIds.has(other._id);
           });
           setRecentChats(filteredConvos);
        }
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
      const res = await fetch(`${BACKEND_URL}/api/calls`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const contactIds = new Set(Array.isArray(users) ? users.map(u => u._id) : []);
        const filteredCalls = (Array.isArray(data) ? data : []).filter(call => {
            const isOutgoing = call.caller?._id === logeduser?._id;
            const other = isOutgoing ? call.receiver : call.caller;
            return other && contactIds.has(other._id);
        });
        setCallHistory(filteredCalls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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
      const res = await fetch(`${BACKEND_URL}/api/conversation`, {
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
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
      if (res.ok) {
        // Strict Cleanup: Clear all local storage to prevent session leakage
        localStorage.clear();
        // Clear all session storage as well
        sessionStorage.clear();
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
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

    const handleUpdate = async () => {
       try {
         const [contactsData, convosRes, reqRes] = await Promise.all([
           getContacts(),
           fetch(`${BACKEND_URL}/api/conversation`, { credentials: "include" }),
           fetch(`${BACKEND_URL}/api/contacts/requests`, { credentials: "include" })
         ]);
         
         setUsers(Array.isArray(contactsData) ? contactsData : []);
         
         if (convosRes.ok) {
           const allConvos = await convosRes.json();
           const contactIds = new Set((Array.isArray(contactsData) ? contactsData : []).map(u => u._id));
           const filteredConvos = (Array.isArray(allConvos) ? allConvos : []).filter(chat => {
             if (chat.isGroupChat) return true;
             const other = chat.participants?.find(p => p._id !== logeduser?._id);
             return other && contactIds.has(other._id);
           });
           setRecentChats(filteredConvos);
         }

         if (reqRes.ok) {
           const rData = await reqRes.json();
           setRequestData(rData);
         }
       } catch (err) {
         console.warn("Sidebar reactive update failed:", err);
       }
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("receive_msg", handleUpdate);
    socket.on("sidebar_update", handleUpdate);
    socket.on("messages_read", handleUpdate);
    socket.on("contact_request_accepted", handleUpdate);
    socket.on("receive_contact_request", handleUpdate);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("receive_msg", handleUpdate);
      socket.off("sidebar_update", handleUpdate);
      socket.off("messages_read", handleUpdate);
      socket.off("contact_request_accepted", handleUpdate);
      socket.off("receive_contact_request", handleUpdate);
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
              <h3 className="font-bold text-white text-sm">Link Up</h3>
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
                <div className={`p-1.5 rounded-lg transition-all relative ${active ? "bg-blue-500/10" : "group-hover:bg-white/5"}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {tab.id === "notifications" && requestData.incoming?.length > 0 && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0B121B]" />
                  )}
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
            Array.isArray(recentChats) && recentChats.length > 0 ? (
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
            ) : (Array.isArray(callHistory) && callHistory.length > 0) ? (
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

          {activeTab === "contacts" && Array.isArray(users) && (
            users.filter(u => u?._id !== logeduser?._id && u?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
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
            <div className="space-y-6">
               {/* Pending Incoming Requests */}
               {requestData.incoming?.length > 0 && (
                 <div className="space-y-3">
                    <h5 className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <Plus size={10} className="text-blue-500" /> New Requests
                    </h5>
                    {requestData.incoming.map(user => (
                       <div key={user._id} className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-3">
                          <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-9 h-9 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                             <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                             <p className="text-[9px] text-gray-500">Sent you a request</p>
                          </div>
                          <button 
                            onClick={() => router.push("/contacts")} 
                            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                       </div>
                    ))}
                 </div>
               )}

               {/* History Log */}
               <div className="space-y-3">
                  <h5 className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">Recent Activity</h5>
                  {requestData.history?.length > 0 ? (
                    requestData.history.slice().reverse().slice(0, 10).map((item, idx) => (
                      <div key={idx} className="px-3 py-2 flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="min-w-0">
                           <p className="text-[11px] text-gray-300 leading-tight">
                              {item.status === 'accepted' ? (
                                <>Connected with <b>{item.user?.name}</b></>
                              ) : (
                                <>Declined <b>{item.user?.name}</b></>
                              )}
                           </p>
                           <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter mt-1 block">
                              {formatTime(item.at)}
                           </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-40">
                      <Bell size={28} className="text-gray-700 mb-4" />
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">No notifications</p>
                    </div>
                  )}
               </div>
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
