import React, { useState , useEffect} from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail, Loader2, MessageSquare, Phone, UserPlus, ExternalLink, ShieldCheck, Users, RotateCcw } from "lucide-react";
import { useCall } from "../../context/CallContext";
import { useContact } from "../../context/ContactContext";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

const GmailContactsTab = ({ onRefresh, setRequests }) => {
    const { socket, currentUser } = useCall();
    const { suggestedContacts, setSuggestedContacts, loading: contextLoading, fetchSuggested } = useContact();
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneLoading, setPhoneLoading] = useState(false);

    const { matchedUsers, unmatchedContacts, lastSynced } = suggestedContacts;
    const connected = Boolean(lastSynced);

    // ── Persistence Logic (Handled globally in ContactContext) ───
    // The provider now auto-fetches and resets data based on currentUser._id

    // ── Google Login Hook ───────────────────────────────────────
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BACKEND_URL}/api/google/contacts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                    credentials: "include",
                });

                const data = await res.json();

                if (res.ok) {
                    setSuggestedContacts({
                        matchedUsers: data.matchedUsers,
                        unmatchedContacts: data.unmatchedContacts,
                        lastSynced: new Date()
                    });
                } else {
                    setError(data.message || "Failed to sync contacts");
                }
            } catch (err) {
                setError("Network error. Please try again.");
            }
            setLoading(false);
        },
        onError: () => {
            setError("Google login failed. Please try again.");
        },
        scope: "https://www.googleapis.com/auth/contacts.readonly",
    });

    // ── Actions ──────────────────────────────────────────────────
    const handleAddContact = async (targetUserId) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/contacts/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId }),
                credentials: "include",
            });
            if (res.ok) {
                // Optimistically update context UI
                setSuggestedContacts(prev => ({
                    ...prev,
                    matchedUsers: prev.matchedUsers.map(u => 
                        u._id === targetUserId ? { ...u, isPending: true } : u
                    )
                }));
                
                // Refresh parent requests state
                if (onRefresh) onRefresh();
                
                socket?.emit("send_contact_request", { 
                    targetUserId, 
                    senderData: {
                        _id: currentUser?._id,
                        name: currentUser?.name,
                        email: currentUser?.email,
                        profilePic: currentUser?.profilePic
                    } 
                });
            }
        } catch (err) {
            console.error("Add contact failed", err);
        }
    };

    const handleUpdatePhone = async (e) => {
        e.preventDefault();
        setPhoneLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: phoneInput }),
                credentials: "include",
            });
            if (res.ok) {
                window.location.reload(); 
            }
        } catch (err) {
            setError("Failed to update phone number");
        }
        setPhoneLoading(false);
    };

    // ── Sections ─────────────────────────────────────────────────
    if (currentUser && !currentUser.phoneNumber) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-yellow-500/10 rounded-[2.5rem] flex items-center justify-center text-yellow-500 shadow-2xl shadow-yellow-500/20">
                    <Phone size={40} />
                </div>
                <div className="max-w-md space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">One Last Step</h2>
                    <p className="text-gray-400 font-medium leading-relaxed">
                        Add your phone number to discover friends from your contacts who are already on Link Up.
                    </p>
                </div>
                <form onSubmit={handleUpdatePhone} className="flex gap-4 w-full max-w-sm">
                    <input 
                        type="text" 
                        placeholder="e.g. +91 98765 43210"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                        required
                    />
                    <button 
                        disabled={phoneLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {phoneLoading ? "Saving..." : "Save"}
                    </button>
                </form>
            </div>
        );
    }

    if (!connected && !contextLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center text-blue-400 rotate-12 shadow-2xl shadow-blue-500/20">
                        <Phone size={40} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#111926] p-2 rounded-2xl border border-white/10 text-green-500 shadow-xl">
                        <ShieldCheck size={20} />
                    </div>
                </div>
                
                <div className="max-w-md space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">Phone Discovery</h2>
                    <p className="text-gray-400 font-medium leading-relaxed">
                        Securely sync your Google Account to find people from your contact book who are already registered.
                    </p>
                </div>

                <button 
                    onClick={() => login()}
                    disabled={loading}
                    className="group relative px-10 py-5 bg-white text-black font-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl shadow-white/10 disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />}
                    {loading ? "Matching..." : "Find People from your Phone"}
                </button>
                
                {error && <p className="text-red-400 text-sm font-bold bg-red-400/10 px-6 py-3 rounded-2xl border border-red-400/20">{error}</p>}
            </div>
        );
    }

    if (contextLoading && !connected) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                 <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Checking saved matches...</p>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-16 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Cloud Sync</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Cross-referencing your phone contacts via Google</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => login()}
                        disabled={loading}
                        className="p-3 bg-white/5 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 rounded-xl transition-all border border-white/5 flex items-center gap-2 group"
                        title="Refresh Sync"
                    >
                        <RotateCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest mr-1">Update Sync</span>
                    </button>
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-green-500" size={18} />
                        <span className="text-xs font-bold text-gray-300 tracking-tight">Verified Session</span>
                    </div>
                </div>
            </div>

            {/* Platform Matches */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                        <Users size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-white">People from your Phone <span className="text-blue-500 ml-2 font-black">{matchedUsers.length}</span></h3>
                </div>

                {matchedUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matchedUsers.map((user, idx) => (
                            <div key={`${user._id}-${idx}`} className="bg-white/[0.03] border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/[0.05] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-10 -mt-10" />
                                
                                <div className="flex items-center gap-5 relative">
                                    <div className="relative">
                                        <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-14 h-14 rounded-2xl object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white truncate">{user.googleName || user.name}</h4>
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Phone Match</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{user.name}</p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button 
                                        onClick={() => handleAddContact(user._id)}
                                        disabled={user.isPending}
                                        className={`w-full py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                            user.isPending 
                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        }`}
                                    >
                                        {user.isPending ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Request Sent
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={14} />
                                                Add Contact
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-gray-500 italic text-sm font-medium">No one from your phone contacts is on the platform yet.</p>
                    </div>
                )}
            </div>

            {/* Invitations */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-500/20 rounded-xl text-gray-400">
                        <Mail size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Invite to Platform <span className="text-gray-500 ml-2 font-black">{unmatchedContacts.length}</span></h3>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {unmatchedContacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-3xl transition-all group">
                            <div className="flex items-center gap-5">
                                <img src={contact.photo || `https://ui-avatars.com/api/?name=${contact.name}&background=333&color=fff`} className="w-10 h-10 rounded-xl object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-400 group-hover:text-white transition-colors">{contact.name}</h4>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{contact.rawPhone || contact.email}</p>
                                </div>
                            </div>
                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-xl border border-white/10 transition-all flex items-center gap-2">
                                <ExternalLink size={12} /> Invite Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            <style jsx>{`
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
            `}</style>
        </div>
    );
};

export default GmailContactsTab;
