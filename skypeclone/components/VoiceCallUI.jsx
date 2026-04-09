"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Phone, Clock, PhoneMissed, MessageSquare } from "lucide-react";
import { useCall } from "../context/CallContext";

export default function VoiceCallUI() {
    const router = useRouter();
    const { callState, callInfo, isMuted, acceptCall, rejectCall, endCall, toggleMute, startCall, reCall } = useCall();
    const [duration, setDuration] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (callState === "connected") {
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [callState]);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    if (callState === "idle") return null;

    const Pill = ({ onClick, color, children, title }) => (
        <button onClick={onClick} title={title}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${color}`}>
            {children}
        </button>
    );

    const otherName = callInfo 
        ? (callInfo.isInitiator ? callInfo.receiverName : callInfo.callerName) || callInfo.receiverName || callInfo.callerName || "Contact"
        : "Contact";
    const otherPic  = callInfo
        ? (callInfo.isInitiator ? callInfo.receiverPic : callInfo.callerPic) || callInfo.receiverPic || callInfo.callerPic
        : null;

    // ── CONNECTED ─────────────────────────────────────────────────
    if (callState === "connected") {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/95 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6 text-white">
                    <div className="relative">
                        <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                            alt={otherName} className="w-32 h-32 rounded-full object-cover ring-4 ring-green-500/40 shadow-2xl" />
                        <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{otherName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2 text-green-400 font-mono text-sm">
                            <Clock size={14} />
                            <span>{fmt(duration)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 mt-4">
                        <Pill onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}
                            color={isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-200"}>
                            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </Pill>
                        <button onClick={endCall} title="End Call"
                            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/40 transition-all active:scale-90">
                            <PhoneOff size={28} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 font-medium tracking-widest uppercase mt-2">Voice Call · End-to-End Encrypted</p>
                </div>
            </div>
        );
    }

    // ── CALLING — "Calling..." while waiting (also shows during offline 5s simulation) ──
    if (callState === "calling") {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/95 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6 text-white">
                    <div className="relative">
                        <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                            alt={otherName} className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/30" />
                        <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{otherName}</h2>
                        <p className="text-blue-400 font-medium mt-2 animate-pulse">Calling...</p>
                    </div>
                    <button onClick={endCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
                        title="Cancel">
                        <PhoneOff size={22} />
                    </button>
                    <p className="text-xs text-gray-500">Tap to cancel</p>
                </div>
            </div>
        );
    }

    // ── RINGING — handles both CALLER (seeing "Ringing...") and RECEIVER (seeing "Incoming call...") ──
    if (callState === "ringing") {
        if (callInfo?.isInitiator) {
            // Caller side: recipient device ALERTED
            return (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/95 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-6 text-white">
                        <div className="relative">
                            <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                                alt={otherName} className="w-28 h-28 rounded-full object-cover ring-4 ring-green-500/30" />
                            <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{otherName}</h2>
                            <p className="text-green-400 font-medium mt-2 animate-pulse">Ringing...</p>
                        </div>
                        <button onClick={endCall}
                            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
                            title="Cancel">
                            <PhoneOff size={22} />
                        </button>
                        <p className="text-xs text-gray-500">Tap to cancel</p>
                    </div>
                </div>
            );
        }

        // Receiver side: incoming call
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-gray-900 rounded-[2.5rem] p-10 text-center max-w-sm w-full mx-4 border border-gray-800 shadow-2xl">
                    <div className="relative inline-block mb-6">
                        <img src={callInfo?.callerPic || `https://ui-avatars.com/api/?name=${callInfo?.callerName}&background=random`}
                            alt={callInfo?.callerName} className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30" />
                        <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{callInfo?.callerName}</h2>
                    <p className="text-gray-400 text-sm mt-1 mb-8 uppercase tracking-widest font-medium">Incoming Voice Call</p>
                    <div className="flex justify-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <button onClick={rejectCall}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all active:scale-90">
                                <PhoneOff size={22} />
                            </button>
                            <span className="text-xs text-gray-400">Decline</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <button onClick={acceptCall}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 transition-all active:scale-90 animate-bounce">
                                <Phone size={22} />
                            </button>
                            <span className="text-xs text-gray-400">Accept</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── NO ANSWER — covers: timeout, declined by receiver, or offline (after 5s simulation)
    // Shows "Call Again" + "Message" buttons, same as WhatsApp
    if (callState === "noAnswer") {
        const handleCallAgain = () => {
            reCall();
        };

        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/90 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-5 text-white bg-gray-900 rounded-[2rem] p-10 shadow-2xl max-w-xs w-full mx-4 border border-gray-800">
                    {/* Avatar with red ring */}
                    <div className="relative">
                        <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                            alt={otherName} className="w-20 h-20 rounded-full object-cover ring-4 ring-red-500/30" />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                            <PhoneMissed size={14} className="text-red-400" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold">{otherName}</h2>
                        <p className="text-red-400 text-sm font-medium mt-1">No Answer</p>
                    </div>
                    <div className="flex gap-3 w-full mt-1">
                        <button onClick={handleCallAgain}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-2xl font-semibold text-sm transition-all active:scale-95 border border-green-600/20">
                            <Phone size={15} /> Call Again
                        </button>
                        <button onClick={() => {
                            const cid = callInfo?.conversationId;
                            endCall(true);
                            if (cid) router.push(`/chat/${cid}`);
                        }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-semibold text-sm transition-all active:scale-95">
                            <MessageSquare size={15} /> Message
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── ENDED — brief flash before returning to idle ──────────────
    if (callState === "ended") {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/90 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                        <PhoneOff size={32} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Call Ended</h2>
                    <p className="text-gray-500 text-sm">The call has been disconnected.</p>
                </div>
            </div>
        );
    }

    return null;
}
