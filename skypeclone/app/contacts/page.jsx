"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import ContactList from "../../components/contacts/ContactList";
import RequestsPanel from "../../components/contacts/RequestsPanel";
import GmailContactsTab from "../../components/contacts/GmailContactsTab";
import AddContactModal from "../../components/contacts/AddContactModal";
import { useCall } from "../../context/CallContext";
import { UserPlus, Users, MessageSquare, Phone, Search } from "lucide-react";
// Removed react-hot-toast for immediate project stability

const ContactsPage = () => {
    const { socket, currentUser } = useCall();
    const [activeTab, setActiveTab] = useState("contacts"); // contacts | requests
    const [contacts, setContacts] = useState([]);
    const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchContactsData = async () => {
        setLoading(true);
        try {
            const [contactsRes, requestsRes] = await Promise.all([
                fetch("http://localhost:4000/api/contacts", { credentials: "include" }),
                fetch("http://localhost:4000/api/contacts/requests", { credentials: "include" })
            ]);
            if (contactsRes.ok) setContacts(await contactsRes.json());
            if (requestsRes.ok) setRequests(await requestsRes.json());
        } catch (err) {
            console.error("Failed to fetch:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!currentUser) return;
        fetchContactsData();
    }, [currentUser]);

    useEffect(() => {
        if (!socket) return;

        const handleNewRequest = ({ senderData }) => {
            setRequests(prev => ({ ...prev, incoming: [senderData, ...prev.incoming] }));
            console.log(`${senderData.name} sent you a contact request!`);
        };

        const handleRequestAccepted = ({ accepterData }) => {
            setContacts(prev => [accepterData, ...prev]);
            setRequests(prev => ({ ...prev, outgoing: prev.outgoing.filter(u => u._id !== accepterData._id) }));
            console.log(`${accepterData.name} accepted your request!`);
        };

        socket.on("receive_contact_request", handleNewRequest);
        socket.on("contact_request_accepted", handleRequestAccepted);

        return () => {
            socket.off("receive_contact_request", handleNewRequest);
            socket.off("contact_request_accepted", handleRequestAccepted);
        };
    }, [socket]);

    return (
        <div className="flex h-screen w-full bg-[#0B121B] text-gray-100 overflow-hidden">
            
            {/* Sidebar Left */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#0B121B] border-l border-white/5 relative overflow-hidden backdrop-blur-3xl">
                {/* Header Area */}
                <div className="h-[140px] flex-shrink-0 px-8 flex flex-col justify-center border-b border-white/5 bg-white/[0.02]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                <Users size={24} />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            <UserPlus size={18} />
                            <span>Add New</span>
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-8 text-sm font-medium">
                        <button 
                            onClick={() => setActiveTab("contacts")}
                            className={`pb-3 relative transition-all ${activeTab === "contacts" ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            Contacts
                            {activeTab === "contacts" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab("requests")}
                            className={`pb-3 relative transition-all ${activeTab === "requests" ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            Requests
                            {(requests.incoming.length > 0) && (
                                <span className="absolute -top-2 -right-4 bg-blue-600 text-[10px] text-white px-1.5 py-0.5 rounded-full ring-2 ring-[#0B121B]">
                                    {requests.incoming.length}
                                </span>
                            )}
                            {activeTab === "requests" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab("gmail")}
                            className={`pb-3 relative transition-all ${activeTab === "gmail" ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            Gmail Contacts
                            {activeTab === "gmail" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === "contacts" ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="relative mb-8">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Search your contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                                />
                            </div>
                            <ContactList 
                                contacts={contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))} 
                                loading={loading} 
                            />
                        </div>
                    ) : activeTab === "requests" ? (
                        <div className="max-w-4xl mx-auto">
                            <RequestsPanel 
                                requests={requests} 
                                setRequests={setRequests}
                                setContacts={setContacts}
                            />
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto">
                            <GmailContactsTab />
                        </div>
                    )}
                </div>
            </div>

            {/* Add Contact Modal */}
            {isAddModalOpen && (
                <AddContactModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    setRequests={setRequests}
                />
            )}
        </div>
    );
};

export default ContactsPage;
