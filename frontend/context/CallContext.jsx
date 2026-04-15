"use client";
import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/config";

const CallContext = createContext(null);
const API = BACKEND_URL;

export const CallProvider = ({ children, currentUser }) => {
    const socketRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);

    // ── Call State ────────────────────────────────────────────────
    const [callState, setCallState]   = useState("idle");
    const [callInfo,  setCallInfo]    = useState(null);
    const [isMuted,   setIsMuted]     = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [remoteStream, setRemoteStream] = useState(null);
    const [localStream, setLocalStream] = useState(null);

    const callStateRef = useRef("idle");
    const updateCallState = useCallback((state) => {
        callStateRef.current = state;
        setCallState(state);
    }, []);

    // ── WebRTC / Media refs ───────────────────────────────────────
    const peerRef              = useRef(null);
    const streamRef            = useRef(null);
    const audioRef             = useRef(null);
    const callTimeoutRef       = useRef(null);
    const autoResetTimerRef    = useRef(null);
    const callRecordIdRef      = useRef(null);
    const callStartTimeRef     = useRef(null);
    const iceCandidateBuffer   = useRef([]);

    // ── Ringing tone ──────────────────────────────────────────────
    const audioCtxRef = useRef(null);
    const ringIntervalRef = useRef(null);

    const _startRing = useCallback(() => {
        try {
            if (ringIntervalRef.current) return;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;

            const beep = () => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 440;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.8);
            };

            beep();
            ringIntervalRef.current = setInterval(beep, 2000);
        } catch {}
    }, []);

    const _stopRing = useCallback(() => {
        try {
            if (ringIntervalRef.current) {
                clearInterval(ringIntervalRef.current);
                ringIntervalRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
        } catch {}
    }, []);

    // ── Media cleanup ─────────────────────────────────────────────
    const _cleanupMedia = useCallback(() => {
        _stopRing();
        iceCandidateBuffer.current = [];
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch {}
            peerRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.srcObject = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsCameraOff(false);
    }, [_stopRing]);

    // ── Remote Media handling ───────────────────────────────
    const _handleRemoteStream = useCallback((stream) => {
        _stopRing();
        setRemoteStream(stream);
        
        // Audio fallback for Safari/Chrome autoplay policies
        if (!audioRef.current) {
            const audio = document.createElement("audio");
            audio.autoplay = true;
            audio.style.display = "none";
            document.body.appendChild(audio);
            audioRef.current = audio;
        }
        audioRef.current.srcObject = stream;
    }, [_stopRing]);

    // ── Call record helpers ───────────────────────────────────────
    const _createCallRecord = useCallback(async (receiverId, conversationId, type) => {
        try {
            const res = await fetch(`${API}/api/calls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ receiverId, conversationId, type }),
            });
            const data = await res.json();
            callRecordIdRef.current = data._id;
            return data._id;
        } catch { return null; }
    }, []);

    const _updateCallRecord = useCallback(async (id, status, duration) => {
        if (!id) return;
        try {
            await fetch(`${API}/api/calls/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status, duration }),
            });
        } catch {}
    }, []);

    const _finalizeCall = useCallback((status) => {
        const duration = callStartTimeRef.current
            ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
            : 0;
        if (callRecordIdRef.current) {
            _updateCallRecord(callRecordIdRef.current, status, duration);
        }
        callRecordIdRef.current  = null;
        callStartTimeRef.current = null;
        _cleanupMedia();
        setCallInfo(null);
        updateCallState("ended");
        if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = setTimeout(() => {
            updateCallState("idle");
            autoResetTimerRef.current = null;
        }, 3000);
    }, [_cleanupMedia, _updateCallRecord, updateCallState]);

    const _createPeer = useCallback(async (initiator, stream) => {
        const Peer = (await import("simple-peer")).default;

        const peer = new Peer({
            initiator,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:global.stun.twilio.com:3478" },
                ],
            },
        });

        peer.on("stream", (remoteStream) => {
            _handleRemoteStream(remoteStream);
        });

        peer.on("connect", () => {
            callStartTimeRef.current = Date.now();
            updateCallState("connected");
        });

        peer.on("error", (err) => {
            console.error("[Peer error]", err);
            if (callStateRef.current === "connected") _finalizeCall("completed");
        });

        peer.on("close", () => {
            if (callStateRef.current === "connected" || callStateRef.current === "calling") {
                _finalizeCall("completed");
            }
        });

        return peer;
    }, [_handleRemoteStream, _finalizeCall, updateCallState]);

    // ── Socket Management ──────────────────────────────────────────
    useEffect(() => {
        if (!currentUser?._id) return;
        if (socketRef.current?.connected) return;

        const socket = io(API, {
            withCredentials: true,
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("register_socket", currentUser._id);
            setSocketReady(true);
        });

        socket.on("incomingCall", ({ callerId, callerName, callerPic, conversationId, signal, callRecordId, isVideo }) => {
            if (callStateRef.current !== "idle") {
                socket.emit("rejectCall", { callerId });
                return;
            }
            setCallInfo({ callerId, callerName, callerPic, conversationId, signal, callRecordId, isVideo });
            updateCallState("ringing");
            _startRing();
            socket.emit("ringing_notify", { callerId });
        });

        socket.on("ringing_received", () => {
            if (callStateRef.current === "calling") updateCallState("ringing");
        });

        socket.on("callAccepted", ({ signal }) => {
            clearTimeout(callTimeoutRef.current);
            if (peerRef.current) peerRef.current.signal(signal);
        });

        socket.on("iceCandidate", ({ candidate }) => {
            if (!candidate) return;
            if (peerRef.current) {
                try { peerRef.current.signal(candidate); } catch {}
            } else {
                iceCandidateBuffer.current.push(candidate);
            }
        });

        socket.on("callRejected", () => {
            clearTimeout(callTimeoutRef.current);
            if (callRecordIdRef.current) _updateCallRecord(callRecordIdRef.current, "rejected", 0);
            callRecordIdRef.current = null;
            _cleanupMedia();
            updateCallState("noAnswer");
            if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
            autoResetTimerRef.current = setTimeout(() => { updateCallState("idle"); setCallInfo(null); }, 6000);
        });

        socket.on("userOffline", () => {
            clearTimeout(callTimeoutRef.current);
            if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
            autoResetTimerRef.current = setTimeout(() => {
                _cleanupMedia();
                updateCallState("noAnswer");
                autoResetTimerRef.current = setTimeout(() => { updateCallState("idle"); setCallInfo(null); }, 6000);
            }, 5000);
        });

        socket.on("callEnded", () => _finalizeCall("completed"));

        const handleStatus = ({ userId, status }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (status === "online") next.add(userId); else next.delete(userId);
                return next;
            });
        };
        socket.on("status_change", handleStatus);
        socket.on("UPDATE_USER_STATUS", handleStatus);
        socket.on("online_users_list", (ids) => setOnlineUsers(new Set(ids)));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [currentUser?._id, _startRing, _cleanupMedia, _finalizeCall, _updateCallRecord, updateCallState]);

    // ── Actions ───────────────────────────────────────────────────
    const startCall = useCallback(async ({ receiverId, receiverName, receiverPic, conversationId, isVideo = false }) => {
        if (!socketRef.current || callStateRef.current !== "idle") return;

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
        } catch {
            alert("Camera/Microphone access is required.");
            return;
        }
        streamRef.current = stream;
        setLocalStream(stream);

        const callId = await _createCallRecord(receiverId, conversationId, isVideo ? "video" : "voice");
        const peer   = await _createPeer(true, stream);
        peerRef.current = peer;

        let offerSent = false;
        peer.on("signal", (data) => {
            if (!offerSent && (data.type === "offer" || data.sdp)) {
                offerSent = true;
                socketRef.current.emit("callUser", {
                    receiverId,
                    callerId: currentUser._id,
                    callerName: currentUser.name,
                    callerPic: currentUser.profilePic,
                    conversationId,
                    signal: data,
                    callRecordId: callId,
                    isVideo,
                });
            } else if (data.candidate) {
                socketRef.current.emit("iceCandidate", { to: receiverId, candidate: data });
            }
        });

        setCallInfo({ receiverId, receiverName, receiverPic, conversationId, isInitiator: true, isVideo });
        updateCallState("calling");

        callTimeoutRef.current = setTimeout(() => {
            _cleanupMedia();
            socketRef.current?.emit("endCall", { receiverId, conversationId });
            updateCallState("noAnswer");
        }, 45000);
    }, [currentUser, _createCallRecord, _createPeer, _cleanupMedia, updateCallState]);

    const acceptCall = useCallback(async () => {
        if (!callInfo?.signal || !socketRef.current) return;
        _stopRing();

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callInfo.isVideo });
        } catch {
            alert("Permissions required.");
            rejectCall();
            return;
        }
        streamRef.current = stream;
        setLocalStream(stream);

        const peer = await _createPeer(false, stream);
        peerRef.current = peer;

        let answerSent = false;
        peer.on("signal", (data) => {
            if (!answerSent && (data.type === "answer" || data.sdp)) {
                answerSent = true;
                socketRef.current.emit("acceptCall", {
                    callerId: callInfo.callerId,
                    signal: data,
                });
            } else if (data.candidate) {
                socketRef.current.emit("iceCandidate", { to: callInfo.callerId, candidate: data });
            }
        });

        peer.signal(callInfo.signal);
        const buffered = iceCandidateBuffer.current.splice(0);
        buffered.forEach(c => { try { peer.signal(c); } catch {} });

        callRecordIdRef.current = callInfo.callRecordId || null;
        updateCallState("connected");
    }, [callInfo, _createPeer, _stopRing, updateCallState]);

    const rejectCall = useCallback(() => {
        if (!callInfo || !socketRef.current) return;
        _stopRing();
        socketRef.current.emit("rejectCall", { callerId: callInfo.callerId });
        _cleanupMedia();
        setCallInfo(null);
        updateCallState("idle");
    }, [callInfo, _stopRing, _cleanupMedia, updateCallState]);

    const endCall = useCallback((resetImmediate = false) => {
        if (!socketRef.current) return;
        const targetId = callInfo?.isInitiator ? callInfo.receiverId : callInfo?.callerId;
        if (targetId) socketRef.current.emit("endCall", { receiverId: targetId, conversationId: callInfo?.conversationId });
        
        if (resetImmediate) {
            _cleanupMedia();
            setCallInfo(null);
            updateCallState("idle");
        } else {
            _finalizeCall("completed");
        }
    }, [callInfo, _finalizeCall, _cleanupMedia, updateCallState]);

    const toggleMute = useCallback(() => {
        const track = streamRef.current?.getAudioTracks()?.[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        const track = streamRef.current?.getVideoTracks()?.[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsCameraOff(!track.enabled);
        }
    }, []);

    const reCall = () => {
        if (!callInfo) return;
        const dest = callInfo.isInitiator ? callInfo.receiverId : callInfo.callerId;
        const cid = callInfo.conversationId;
        const vid = callInfo.isVideo;
        _cleanupMedia();
        setCallInfo(null);
        updateCallState("idle");
        setTimeout(() => startCall({ receiverId: dest, conversationId: cid, isVideo: vid }), 150);
    };

    return (
        <CallContext.Provider value={{
            socket: socketRef.current,
            socketReady,
            callState,
            callInfo,
            isMuted,
            isCameraOff,
            onlineUsers,
            localStream,
            remoteStream,
            startCall,
            reCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleCamera,
            currentUser,
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
