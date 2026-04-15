"use client";
import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/config";
import { MessageSquare, Phone, UserPlus, Search, Clock, Users, Bell, Check, X } from "lucide-react";
import { useCall } from "../../../context/CallContext";
import { useRouter } from "next/navigation";
import RequestsPanel from "../../../components/contacts/RequestsPanel";
import AddContactModal from "../../../components/contacts/AddContactModal";
import ContactItem from "../../../components/contacts/ContactItem";

const ContactsPage = () => {
  const router = useRouter();
  const { currentUser, onlineUsers, socket } = useCall();
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("all"); // all | requests
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchContactsData = async () => {
    try {
      setLoading(true);
      const [contRes, reqRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/contacts`, { credentials: "include" }),
        fetch(`${BACKEND_URL}/api/contacts/requests`, { credentials: "include" })
      ]);
      if (contRes.ok) setContacts(await contRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const onNewRequest = () => {
      fetchContactsData();
    };

    socket.on("receive_contact_request", onNewRequest);
    socket.on("contact_request_accepted", onNewRequest);

    return () => {
      socket.off("receive_contact_request", onNewRequest);
      socket.off("contact_request_accepted", onNewRequest);
    };
  }, [socket]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0B121B] h-screen overflow-hidden overflow-y-auto">
      {/* Header */}
      <div className="h-[70px] px-8 flex items-center justify-between border-b border-white/5 bg-[#111926]/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Contacts</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{contacts.length} Connections</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/30 text-white"
          >
            <UserPlus size={18} />
            Add Contact
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Sub-Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-[#111926] p-1 rounded-xl border border-white/5">
              {[
                { id: "all", label: "My Contacts", count: contacts.length },
                { id: "requests", label: "Pending Requests", count: requests.incoming.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeSubTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {tab.label}
                  {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeSubTab === tab.id ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}`}>{tab.count}</span>}
                </button>
              ))}
            </div>

            <div className="relative group w-full md:w-80">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-blue-500">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111926] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Loading your connections...</p>
              </div>
            ) : activeSubTab === "all" ? (
              filteredContacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredContacts.map(contact => (
                    <ContactItem key={contact._id} contact={contact} isOnline={onlineUsers.has(contact._id)} />
                  ))}
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-gray-600 mb-6">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Contacts Found</h3>
                  <p className="text-gray-500 text-sm max-w-xs font-medium">Extend your circle by adding fellow designers or friends to your list.</p>
                </div>
              )
            ) : (
              <RequestsPanel requests={requests} onRefresh={fetchContactsData} />
            )}
          </div>

        </div>
      </div>

      <AddContactModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onRefresh={fetchContactsData} 
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
};

export default ContactsPage;
