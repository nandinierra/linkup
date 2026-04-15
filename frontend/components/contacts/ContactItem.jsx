import React from "react";
import { MessageSquare, Phone, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCall } from "../../context/CallContext";

const ContactItem = ({ contact }) => {
    const router = useRouter();
    const { onlineUsers } = useCall();
    
    // Determine online status from real-time socket state, falling back to database field
    const isOnline = onlineUsers.has(contact._id) || contact.isOnline;

    const getStatusText = () => {
        if (isOnline) return "Online";
        if (!contact.lastSeen) return "Offline";
        const lastSeen = new Date(contact.lastSeen);
        const diff = Date.now() - lastSeen;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return lastSeen.toLocaleDateString();
    };

    return (
        <div className="group flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl transition-all hover:translate-x-1 duration-300">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img 
                        src={contact.profilePic || `https://ui-avatars.com/api/?name=${contact.name}&background=random`} 
                        className="w-12 h-12 rounded-2xl object-cover shadow-lg group-hover:ring-2 ring-blue-500/50 transition-all"
                        alt={contact.name}
                    />
                    {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B121B] rounded-full shadow-lg pulse-animation"></div>
                    )}
                </div>
                <div className="flex flex-col">
                    <h3 className="font-bold text-white text-[15px]">{contact.name}</h3>
                    <p className={`text-[10px] font-semibold tracking-wide uppercase ${isOnline ? "text-green-400" : "text-gray-500"}`}>
                        {getStatusText()}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                    onClick={() => router.push(`/chat?with=${contact._id}`)}
                    className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all active:scale-90"
                    title="Message"
                >
                    <MessageSquare size={18} />
                </button>
                <button 
                    className="p-2.5 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-xl transition-all active:scale-90"
                    title="Call"
                >
                    <Phone size={18} />
                </button>
                <button className="p-2.5 text-gray-500 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};

export default ContactItem;
