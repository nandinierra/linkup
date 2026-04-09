"use client";
import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneCall, Clock } from "lucide-react";

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

export default function CallInterface({ socket, conversationId, user, isInitiator, isVideoCall, onEndCall, participantData }) {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
    const [callStatus, setCallStatus] = useState("initiating"); // initiating, calling, connected, ended
    const [duration, setDuration] = useState(0);
    const [peers, setPeers] = useState([]); // For Group Calls
    
    const userVideo = useRef();
    const remoteVideo = useRef();
    const pc = useRef(null); // RTCPeerConnection for 1-1
    const timerRef = useRef(null);

    useEffect(() => {
        setupMedia();
        return () => cleanup();
    }, []);

    const setupMedia = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: isVideoCall,
                audio: true,
            });
            setStream(currentStream);
            if (userVideo.current) userVideo.current.srcObject = currentStream;

            if (participantData && !participantData.isGroupChat) {
                // 1-to-1 CALL LOGIC
                handleOneToOneSignaling(currentStream);
            } else {
                // FALLBACK TO GROUP MESH IF IT IS A GROUP
                handleGroupSignaling(currentStream);
            }
        } catch (err) {
            console.error("Media Access Denied", err);
            onEndCall();
        }
    };

    // --- 1-to-1 WebRTC SIGNALING (Core Production Standard) ---
    const handleOneToOneSignaling = async (currentStream) => {
        const Peer = require("simple-peer"); // We'll keep simple-peer for compatibility or use native RTCPeerConnection
        const receiverId = participantData.id || participantData._id;

        if (isInitiator) {
            setCallStatus("calling");
            const peer = new Peer({ initiator: true, trickle: true, stream: currentStream, config: STUN_SERVERS });
            pc.current = peer;

            peer.on("signal", (signal) => {
                socket.emit("call-user", {
                    to: receiverId,
                    from: user._id || user.id,
                    offer: signal,
                    callType: isVideoCall ? "video" : "voice",
                    conversationId,
                    callerName: user.name,
                    callerPic: user.profilePic
                });
            });

            peer.on("stream", (remote) => {
                setRemoteStream(remote);
                setCallStatus("connected");
                startTimer();
            });

            socket.on("call-accepted", ({ answer }) => {
                peer.signal(answer);
            });

            socket.on("call-rejected", () => {
                setCallStatus("ended");
                setTimeout(onEndCall, 2000);
            });
        } else {
            // Receiver accepts implicitly when the interface mounts (because they clicked 'Accept')
            const peer = new Peer({ initiator: false, trickle: true, stream: currentStream, config: STUN_SERVERS });
            pc.current = peer;

            peer.on("signal", (signal) => {
                socket.emit("accept-call", { to: receiverId, answer: signal });
            });

            peer.on("stream", (remote) => {
                setRemoteStream(remote);
                setCallStatus("connected");
                startTimer();
            });

            // Signal the sender's offer
            if (participantData.offer) peer.signal(participantData.offer);
        }

        // Common listeners
        socket.on("ice-candidate", ({ candidate }) => pc.current?.signal(candidate));
        socket.on("call-ended", () => {
            setCallStatus("ended");
            setTimeout(onEndCall, 1500);
        });
    };

    // --- GROUP MESH LOGIC (Fallback) ---
    const handleGroupSignaling = (currentStream) => {
        setCallStatus("connected"); // Group calls start connected for room management
        const Peer = require("simple-peer");

        if (isInitiator) {
           socket.emit("start-group-call", { conversationId, isVideoCall, callerData: user });
        } else {
           socket.emit("join-group-call", { conversationId, userData: user });
        }

        socket.on("user-joined-group", ({ socketId, userData }) => {
            const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
            peer.on("signal", signal => {
                socket.emit("sending_signal", { userToSignal: socketId, callerID: socket.id, signal, userData: user });
            });
            setPeers(prev => [...prev, { peerID: socketId, peer, userData }]);
        });
        
        // ... (rest of old mesh logic mapping)
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const cleanup = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        if (pc.current) pc.current.destroy();
        socket.emit("end-call", { to: participantData?.id || participantData?._id, conversationId });
        socket.off("call-accepted");
        socket.off("call-rejected");
        socket.off("call-ended");
        socket.off("ice-candidate");
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream && isVideoCall) {
            stream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-gray-950 flex flex-col items-center justify-center text-white">
            
            {/* Call Header */}
            <div className="absolute top-10 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur px-6 py-2 rounded-full border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium uppercase tracking-widest text-gray-300">
                        {callStatus === "calling" ? "Calling..." : callStatus === "connected" ? "Connected" : "Signal Connection..."}
                    </span>
                    {callStatus === "connected" && <span className="ml-2 text-xs font-mono">{formatDuration(duration)}</span>}
                </div>
            </div>

            {/* Video Container */}
            <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 p-12 mt-8">
                {/* Local View */}
                <div className="relative bg-gray-900 rounded-[3rem] overflow-hidden border border-gray-800 shadow-2xl">
                    {isVideoOff ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="me" className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-700" />
                        </div>
                    ) : (
                        <video ref={userVideo} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                    )}
                    <div className="absolute bottom-6 left-6 text-sm font-bold bg-black/40 px-3 py-1 rounded-lg backdrop-blur">You</div>
                </div>

                {/* Remote View */}
                <div className="relative bg-gray-900 rounded-[3rem] overflow-hidden border border-gray-800 shadow-2xl">
                    {callStatus !== "connected" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 gap-6">
                            <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-blue-500/30 animate-pulse">
                                <img src={participantData.callerPic || participantData.profilePic || `https://ui-avatars.com/api/?name=${participantData.callerName || "User"}&background=random`} alt="other" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-2xl font-bold">{participantData.callerName || "User"}</h2>
                            <p className="text-blue-400 font-medium animate-bounce">{callStatus === "calling" ? "Ringing..." : "Waiting..."}</p>
                        </div>
                    ) : (
                        <RemoteVideo stream={remoteStream} />
                    )}
                    <div className="absolute bottom-6 left-6 text-sm font-bold bg-black/40 px-3 py-1 rounded-lg backdrop-blur">
                        {participantData.callerName || "User"}
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-12 flex items-center gap-6 bg-gray-900/80 backdrop-blur-xl px-12 py-6 rounded-[2.5rem] border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <button onClick={toggleMute} className={`p-4 rounded-full transition-all hover:scale-110 active:scale-95 ${isMuted ? "bg-red-500 text-white" : "bg-gray-800 text-gray-100"}`}>
                    {isMuted ? <MicOff /> : <Mic />}
                </button>
                <button onClick={() => cleanup() || onEndCall()} className="bg-red-600 hover:bg-red-700 p-5 rounded-full text-white shadow-lg shadow-red-600/30 hover:scale-110 active:scale-90 transition-all">
                    <PhoneOff size={32} />
                </button>
                <button onClick={toggleVideo} className={`p-4 rounded-full transition-all hover:scale-110 active:scale-95 ${isVideoOff ? "bg-red-500 text-white" : "bg-gray-800 text-gray-100"}`}>
                    {isVideoOff ? <VideoOff /> : <Video />}
                </button>
            </div>
            
            <style jsx>{`
                .mirror { transform: scaleX(-1); }
            `}</style>
        </div>
    );
}

const RemoteVideo = ({ stream }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
    }, [stream]);
    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
};
