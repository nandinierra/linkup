import React from "react";
import { Check, X, Clock } from "lucide-react";
// Removed react-hot-toast

const RequestsPanel = ({ requests, setRequests, setContacts }) => {
    const { incoming, outgoing } = requests;

    const handleAction = async (targetUserId, action) => {
        try {
            const res = await fetch(`http://localhost:4000/api/contacts/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ targetUserId }),
            });
            const data = await res.json();
            if (res.ok) {
                if (action === "accept") {
                    const acceptedUser = incoming.find(u => u._id === targetUserId);
                    setContacts(prev => [acceptedUser, ...prev]);
                    setRequests(prev => ({ ...prev, incoming: prev.incoming.filter(u => u._id !== targetUserId) }));
                    console.log("Request accepted!");
                } else if (action === "reject") {
                    setRequests(prev => ({ ...prev, incoming: prev.incoming.filter(u => u._id !== targetUserId) }));
                    console.log("Request rejected.");
                }
            } else {
                console.error(data.message);
            }
        } catch (err) {
            console.error("Failed to process request.");
        }
    };

    return (
        <div className="space-y-12">
            {/* Incoming Requests */}
            <section>
                <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                    <Clock size={12} className="text-blue-500" />
                    Incoming Requests
                    {incoming.length > 0 && <span className="text-blue-400">({incoming.length})</span>}
                </h2>
                {incoming.length === 0 ? (
                    <div className="p-8 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl text-center text-gray-500 text-sm italic">
                        No pending incoming requests.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {incoming.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group transition-all">
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                        className="w-11 h-11 rounded-2xl object-cover"
                                        alt={user.name}
                                    />
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-white text-sm">{user.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleAction(user._id, "accept")}
                                        className="w-9 h-9 flex items-center justify-center bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-xl transition-all"
                                        title="Accept"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(user._id, "reject")}
                                        className="w-9 h-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                                        title="Reject"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Outgoing Requests */}
            <section>
                <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                    <Clock size={12} className="text-orange-500" />
                    Outgoing Requests (Pending)
                </h2>
                {outgoing.length === 0 ? (
                    <div className="p-8 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl text-center text-gray-500 text-sm italic">
                        No pending outgoing requests.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {outgoing.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                        className="w-11 h-11 rounded-2xl object-cover opacity-60"
                                        alt={user.name}
                                    />
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-gray-400 text-sm">{user.name}</h3>
                                        <p className="text-[10px] text-gray-600">Pending invitation</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-orange-500/50 uppercase tracking-widest px-3 py-1 bg-orange-500/5 rounded-full border border-orange-500/10">
                                    Waiting...
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RequestsPanel;
