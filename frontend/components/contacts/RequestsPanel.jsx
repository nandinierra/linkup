import React from "react";
import { Check, X, Clock } from "lucide-react";
import { useCall } from "../../context/CallContext";
import { BACKEND_URL } from "@/config";

const RequestsPanel = ({ requests, setRequests, setContacts }) => {
    const { socket, currentUser } = useCall();
    const { incoming, outgoing } = requests;

    const handleAction = async (targetUserId, action) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/contacts/${action}`, {
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
                    
                    // Emit socket event for real-time update
                    socket?.emit("accept_contact_request", { 
                        targetUserId, 
                        accepterData: {
                            _id: currentUser?._id,
                            name: currentUser?.name,
                            email: currentUser?.email,
                            profilePic: currentUser?.profilePic
                        }
                    });

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
                            <div key={user._id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl transition-all">
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

            {/* Request History Log */}
            {requests.history && requests.history.length > 0 && (
                <section className="pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-gray-500" />
                            Interaction History
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {requests.history.slice().reverse().map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.01]/50 border border-white/5 rounded-2xl opacity-70 hover:opacity-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img 
                                            src={item.user?.profilePic || `https://ui-avatars.com/api/?name=${item.user?.name}&background=333&color=fff`} 
                                            className={`w-9 h-9 rounded-xl object-cover ${item.status === 'rejected' ? 'grayscale opacity-50' : ''}`}
                                        />
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0B121B] ${
                                            item.status === 'accepted' ? 'bg-green-500' : 'bg-red-500/50'
                                        }`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-gray-200">
                                            {item.user?.name}
                                        </p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                                            item.status === 'accepted' ? 'text-green-500/60' : 'text-red-500/60'
                                        }`}>
                                            {item.status === 'accepted' ? 'Joined your contacts' : 'Request Declined'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">
                                        {new Date(item.at).toLocaleDateString()}
                                    </p>
                                    <p className="text-[8px] text-gray-400 font-medium opacity-40">
                                        {item.type === 'outgoing' ? 'Sent by you' : 'Received'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default RequestsPanel;
