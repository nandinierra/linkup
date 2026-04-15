"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Mic, MicOff, PhoneOff, Phone, Clock, PhoneMissed, 
    MessageSquare, Video, VideoOff, Maximize, Minimize,
    User, Camera
} from "lucide-react";
import { useCall } from "../context/CallContext";

export default function VoiceCallUI() {
    const router = useRouter();
    const { 
        callState, callInfo, isMuted, isCameraOff,
        acceptCall, rejectCall, endCall, toggleMute, toggleCamera, 
        reCall, localStream, remoteStream 
    } = useCall();
    
    const [duration, setDuration] = useState(0);
    const [isPipLocal, setIsPipLocal] = useState(true);
    const timerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (callState === "connected") {
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [callState]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callState]);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    if (callState === "idle") return null;

    const Pill = ({ onClick, color, children, title, active = true }) => (
        <button onClick={onClick} title={title}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${active ? color : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}>
            {children}
        </button>
    );

    const otherName = callInfo 
        ? (callInfo.isInitiator ? callInfo.receiverName : callInfo.callerName) || "Contact"
        : "Contact";
    const otherPic  = callInfo
        ? (callInfo.isInitiator ? callInfo.receiverPic : callInfo.callerPic)
        : null;

    // ── CONNECTED ─────────────────────────────────────────────────
    if (callState === "connected") {
        const isVideo = callInfo?.isVideo;

        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950 transition-all duration-700">
                
                {/* ── VIDEO DISPLAY LAYER ── */}
                {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Remote Video (Full Screen) */}
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Local Video (Floating / PiP) */}
                        <div className={`absolute transition-all duration-500 shadow-2xl overflow-hidden border-2 border-white/10 rounded-2xl ${isPipLocal ? 'bottom-24 right-6 w-32 md:w-48 aspect-video' : 'inset-0 w-full h-full'}`}>
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'scale-x-[-1]'}`} 
                            />
                            {isCameraOff && (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-400">
                                    <VideoOff size={32} />
                                </div>
                            )}
                            <button 
                                onClick={() => setIsPipLocal(!isPipLocal)}
                                className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white transition-opacity opacity-0 group-hover:opacity-100"
                            >
                                {isPipLocal ? <Maximize size={14} /> : <Minimize size={14} />}
                            </button>
                        </div>

                        {/* Remote User Name Overlay (Subtle) */}
                        <div className="absolute top-8 left-8 text-white/50 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 flex items-center gap-3">
                            <span className="text-xs font-bold tracking-tighter uppercase">{otherName}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    /* ── VOICE AVATAR LAYER ── */
                    <div className="flex flex-col items-center gap-6 text-white animate-in zoom-in-95 duration-500">
                        <div className="relative">
                            <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                                alt={otherName} className="w-32 h-32 rounded-full object-cover ring-4 ring-green-500/40 shadow-2xl" />
                            <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{otherName}</h2>
                        </div>
                    </div>
                )}

                {/* ── COMMON CONTROL BAR ── */}
                <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-2 mb-2 text-white/60 font-mono text-sm bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
                        <Clock size={14} className="text-green-500" />
                        <span>{fmt(duration)}</span>
                    </div>

                    <div className="flex items-center gap-6 p-4 bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <Pill onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}
                            color={isMuted ? "bg-red-500 text-white" : "bg-white/5 hover:bg-white/10 text-gray-200"}>
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </Pill>

                        {isVideo && (
                            <Pill onClick={toggleCamera} title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                                color={isCameraOff ? "bg-red-500 text-white" : "bg-white/5 hover:bg-white/10 text-gray-200"}>
                                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                            </Pill>
                        )}

                        <button onClick={endCall} title="End Call"
                            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-600/40 transition-all active:scale-90">
                            <PhoneOff size={24} />
                        </button>

                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── CALLING / RINGING / NO ANSWER (Unified UI approach) ──────
    const isIncoming = (callState === "ringing" && !callInfo?.isInitiator);
    const statusText = callState === "calling" ? "Calling..." : (callState === "ringing" ? (callInfo?.isInitiator ? "Ringing..." : "Incoming Call...") : "No Answer");
    const statusColor = callState === "noAnswer" ? "text-red-400" : (callState === "ringing" ? "text-green-400" : "text-blue-400");

    if (callState === "calling" || callState === "ringing" || callState === "noAnswer") {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/95 backdrop-blur-xl animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-8 text-white w-full max-w-sm px-6">
                    <div className="relative">
                        <img src={otherPic || `https://ui-avatars.com/api/?name=${otherName}&background=random`}
                            alt={otherName} className={`w-36 h-36 rounded-[2.5rem] object-cover shadow-2xl transition-all duration-1000 ${callState === 'ringing' ? 'ring-4 ring-green-500/30' : 'ring-4 ring-blue-500/20'}`} />
                        {callState !== 'noAnswer' && <span className={`absolute inset-0 rounded-[2.5rem] animate-ping opacity-20 ${callState === 'ringing' ? 'bg-green-500' : 'bg-blue-500'}`} />}
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-black tracking-tight">{otherName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {callInfo?.isVideo ? <Video size={14} className={statusColor} /> : <Mic size={14} className={statusColor} />}
                            <p className={`font-black uppercase tracking-widest text-[10px] ${statusColor}`}>{statusText}</p>
                        </div>
                    </div>

                    {isIncoming ? (
                        <div className="flex gap-10 mt-4">
                            <div className="flex flex-col items-center gap-3">
                                <button onClick={rejectCall} className="w-20 h-20 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/20 flex items-center justify-center transition-all active:scale-90">
                                    <PhoneOff size={28} />
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Decline</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <button onClick={acceptCall} className="w-20 h-20 rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/40 flex items-center justify-center transition-all active:scale-95 animate-bounce">
                                    <Phone size={28} />
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Accept</span>
                            </div>
                        </div>
                    ) : callState === "noAnswer" ? (
                        <div className="flex gap-4 w-full mt-4">
                            <button onClick={() => reCall()} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Video size={18} /> Call Again
                            </button>
                            <button onClick={() => endCall(true)} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center">
                                <MessageSquare size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={endCall} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-600/40 transition-all active:scale-90 mt-4">
                            <PhoneOff size={28} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (callState === "ended") {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
                        <PhoneOff size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mt-4">Call Ended</h2>
                </div>
            </div>
        );
    }

    return null;
}
