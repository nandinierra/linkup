import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Loader2, CheckCircle } from "lucide-react";
import { useCall } from "../../context/CallContext";
// Removed react-hot-toast

const AddContactModal = ({ isOpen, onClose, setRequests }) => {
    const { currentUser, socket } = useCall();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingId, setSendingId] = useState(null);

    const searchUsers = async (q) => {
        if (!q.trim()) return setResults([]);
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/contacts/search?q=${q}`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) setResults(data);
        } catch { console.error("Search failed."); }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => searchUsers(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const sendRequest = async (targetUserId) => {
        setSendingId(targetUserId);
        try {
            const res = await fetch(`http://localhost:4000/api/contacts/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ targetUserId }),
            });
            const data = await res.json();
            if (res.ok) {
                console.log("Request sent!");
                setRequests(prev => ({ ...prev, outgoing: [...prev.outgoing, results.find(u => u._id === targetUserId)] }));
                
                // Emit socket event for real-time notification
                socket?.emit("send_contact_request", {
                    targetUserId,
                    senderData: {
                        _id: currentUser?._id,
                        name: currentUser?.name,
                        email: currentUser?.email,
                        profilePic: currentUser?.profilePic
                    }
                });

                // Update result in local list to show 'Pending' state instantly
                setResults(prev => prev.map(u => u._id === targetUserId ? { ...u, outgoingRequests: [...(u.outgoingRequests || []), currentUser._id] } : u));
            } else {
                console.error(data.message);
            }
        } catch { console.error("Processing failed."); }
        setSendingId(null);
    };

    if (!isOpen || !currentUser) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111926] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                            <UserPlus size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Find People</h2>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:rotate-90">
                        <X size={20} className="text-gray-500 hover:text-white" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Enter email or username..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-[#0B121B] border border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 outline-none focus:border-blue-500/50 transition-all text-gray-100 placeholder-gray-600"
                        />
                        {loading && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={20} />}
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {results.length === 0 && query.trim() !== "" && !loading && (
                            <p className="text-center text-gray-600 py-10 italic">No users found with that criteria.</p>
                        )}
                        {results.map(user => {
                            const isContact = user.contacts?.includes(currentUser?._id);
                            const isPendingAuth = user.incomingRequests?.includes(currentUser?._id) || user.outgoingRequests?.includes(currentUser?._id);
                            
                            return (
                                <div key={user._id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition hover:px-6 duration-300">
                                    <div className="flex items-center gap-4">
                                        <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-11 h-11 rounded-2xl object-cover" />
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-white text-sm">{user.name}</h3>
                                            <p className="text-[10px] text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                    {isContact ? (
                                        <span className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-green-500/20">
                                            <CheckCircle size={14} /> Contact
                                        </span>
                                    ) : isPendingAuth ? (
                                        <span className="px-4 py-2 bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/10">
                                            Pending
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => sendRequest(user._id)}
                                            disabled={sendingId === user._id}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-90"
                                        >
                                            {sendingId === user._id ? <Loader2 size={14} className="animate-spin" /> : "Add Contact"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddContactModal;
