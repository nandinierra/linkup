"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Video } from "lucide-react";
import { useCall } from "../context/CallContext";
import { BACKEND_URL } from "@/config";

export default function CallDetailView({ callId, conversationId, currentUser }) {
    const router = useRouter();
    const [callRecord, setCallRecord] = useState(null);
    const [conversation, setConversation] = useState(null);
    const { startCall } = useCall();

    useEffect(() => {
        const load = async () => {
            try {
                // Load call record
                const callRes = await fetch(`${BACKEND_URL}/api/calls/${callId}`, {
                    credentials: "include",
                });
                if (callRes.ok) setCallRecord(await callRes.json());

                // Load conversation for participant info
                const convRes = await fetch(`${BACKEND_URL}/api/conversation/${conversationId}`, {
                    credentials: "include",
                });
                if (convRes.ok) setConversation(await convRes.json());
            } catch {}
        };
        if (callId && conversationId) load();
    }, [callId, conversationId, callId, conversationId]);

    const handleMessage = () => {
        router.push(`/chat/${conversationId}`);
    };

    if (!callRecord || !conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0B121B]">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isOutgoing = callRecord.caller?._id === currentUser?._id;
    const other = isOutgoing ? callRecord.receiver : callRecord.caller;
    const status = callRecord.status;

    const Icon = status === "missed"
        ? PhoneMissed
        : isOutgoing ? PhoneOutgoing : PhoneIncoming;

    const iconColor = status === "missed" ? "text-red-400"
        : status === "rejected" ? "text-orange-400"
        : isOutgoing ? "text-blue-400" : "text-green-400";

    const statusLabel = status === "missed"
        ? "Missed voice call"
        : status === "rejected"
            ? isOutgoing ? "Call declined" : "You declined"
            : isOutgoing ? "Outgoing voice call" : "Incoming voice call";

    const fmtDuration = callRecord.duration > 0
        ? ` · ${Math.floor(callRecord.duration / 60)}m ${callRecord.duration % 60}s`
        : "";

    const callTime = new Date(callRecord.createdAt).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit"
    });

    const callDate = (() => {
        const d = new Date(callRecord.createdAt);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
        return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
    })();

    const handleCallBack = () => {
        if (!other) return;
        startCall({
            receiverId: other._id,
            receiverName: other.name,
            receiverPic: other.profilePic,
            conversationId,
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#0B121B] overflow-hidden">
            {/* Header — same style as chat header */}
            <div className="h-[70px] flex-shrink-0 px-6 flex justify-between items-center border-b border-white/5 bg-[#111926]">
                <div className="flex items-center gap-3">
                    <img
                        src={other?.profilePic || `https://ui-avatars.com/api/?name=${other?.name}&background=random`}
                        className="w-10 h-10 rounded-2xl object-cover"
                    />
                    <div>
                        <h3 className="text-white font-semibold text-sm">{other?.name}</h3>
                        <p className="text-[10px] text-gray-500">Voice call history</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCallBack}
                        title="Call"
                        className="p-2 rounded-xl text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all active:scale-90"
                    >
                        <Phone size={19} />
                    </button>
                    <button
                        onClick={handleMessage}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all font-semibold text-sm"
                        title="Message"
                    >
                        <MessageSquare size={19} />
                    </button>
                </div>
            </div>

            {/* Body — call log like the screenshot */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Date divider */}
                <div className="flex justify-center mb-6">
                    <span className="text-[10px] font-semibold bg-white/5 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                        {callDate}
                    </span>
                </div>

                {/* Call entry row */}
                <div className="flex items-center justify-between bg-[#111926] rounded-2xl px-5 py-4 border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-gray-800/60 flex items-center justify-center`}>
                            <Icon size={18} className={iconColor} />
                        </div>
                        <div>
                            <p className={`font-semibold text-sm ${status === "missed" ? "text-red-400" : "text-white"}`}>
                                {statusLabel} at {callTime}
                            </p>
                            {fmtDuration && (
                                <p className="text-xs text-gray-500 mt-0.5">Duration{fmtDuration}</p>
                            )}
                        </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        status === "missed"
                            ? "bg-red-500/10 text-red-400"
                            : status === "rejected"
                                ? "bg-orange-500/10 text-orange-400"
                                : status === "completed"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-gray-500/10 text-gray-400"
                    }`}>
                        {status === "missed" ? "Unanswered"
                            : status === "rejected" ? "Declined"
                            : status === "completed" ? "Completed"
                            : status}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleCallBack}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-2xl font-semibold text-sm transition-all active:scale-95 border border-green-600/20"
                    >
                        <Phone size={16} /> Call Again
                    </button>
                    <button
                        onClick={handleMessage}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-2xl font-semibold text-sm transition-all active:scale-95 border border-blue-600/20"
                    >
                        <MessageSquare size={16} /> Message
                    </button>
                </div>
            </div>
        </div>
    );
}
