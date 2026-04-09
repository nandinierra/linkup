"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getMe } from "../../../services/authServices";
import { Phone as PhoneIcon, Plus, Send, Trash2, Share, MoreVertical, Info, CheckCheck } from "lucide-react";
import { useCall } from "../../../context/CallContext";
import CallDetailView from "../../../components/CallDetailView";

const ChatInterface = () => {
    const { conversationId } = useParams();
    const searchParams = useSearchParams();
    const viewMode     = searchParams?.get("view");    // "call" | null
    const callId       = searchParams?.get("callId");
    const { socket, startCall, currentUser, onlineUsers } = useCall();

    const chatRef = useRef(null);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [typingUserId, setTypingUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [menuMessageId, setMenuMessageId] = useState(null); // tracking open 3-dot menu
    const [infoMessage, setInfoMessage] = useState(null);     // tracking message for info overlay
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [lastSeenText, setLastSeenText] = useState("");

    // ── Update Last Seen (If Offline) ─────────────────────────────
    const refreshLastSeen = () => {
        if (!activeChat || !currentUser || activeChat.isGroupChat) return;
        const other = activeChat.participants?.find(p => p._id !== (currentUser?._id || currentUser?.id));
        if (!other) return;

        fetch(`http://localhost:4000/api/users/${other._id}`, { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                const u = data.user;
                if (!u) return;
                const lastSeen = new Date(u.lastSeen);
                const now = new Date();
                const diffMs = now - lastSeen;
                const diffMins = Math.floor(diffMs / 60000);

                if (diffMins < 1) setLastSeenText("just now");
                else if (diffMins < 60) setLastSeenText(`${diffMins} min${diffMins === 1 ? "" : "s"} ago`);
                else if (diffMins < 1440) setLastSeenText(`${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? "" : "s"} ago`);
                else setLastSeenText(`on ${lastSeen.toLocaleDateString()}`);
            }).catch(() => {
                setLastSeenText("Offline");
            });
    };

    useEffect(() => {
        if (!activeChat || activeChat.isGroupChat) return;
        const other = activeChat.participants?.find(p => p._id !== (currentUser?._id || currentUser?.id));
        if (other && !onlineUsers.has(other._id)) {
            refreshLastSeen();
        }
    }, [activeChat, onlineUsers, currentUser?._id]);

    // ── Helper: Deduplicated state update ────────────────────────
    const mergeMessages = (newMsgs, existing = []) => {
        const merged = [...existing, ...newMsgs];
        const uniqueMap = new Map();
        merged.forEach(m => {
            const id = m._id?.toString() || m._id;
            if (id) uniqueMap.set(id, m);
        });
        const unique = Array.from(uniqueMap.values());
        return unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    // ── Listen for socket events ───────────────────────────────────
    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit("join_room", conversationId);

        const onMsg = (msg) => {
            setMessages(prev => mergeMessages([msg], prev));
            const senderId = msg.senderId?._id || msg.senderId;
            const myId = currentUser?._id || currentUser?.id;
            if (senderId && myId && senderId.toString() !== myId.toString()) {
                fetch(`http://localhost:4000/api/messages/read/${conversationId}`, { method: "PUT", credentials: "include" }).catch(() => {});
            }
        };
        const onTyping = ({ userId }) => setTypingUserId(userId);
        const onStopTyping = () => setTypingUserId(null);
        const onMsgDeleted = ({ messageId, text }) =>
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeletedForEveryone: true, text } : m));
        const onMsgRead = ({ userId }) => {
            setMessages(prev => prev.map(m => (!m.readBy?.includes(userId)) ? { ...m, readBy: [...(m.readBy || []), userId] } : m));
        };
        socket.on("receive_msg", onMsg);
        socket.on("typing", onTyping);
        socket.on("stop_typing", onStopTyping);
        socket.on("message_deleted_everyone", onMsgDeleted);
        socket.on("messages_read", onMsgRead);

        return () => {
            socket.off("receive_msg", onMsg);
            socket.off("typing", onTyping);
            socket.off("stop_typing", onStopTyping);
            socket.off("message_deleted_everyone", onMsgDeleted);
            socket.off("messages_read", onMsgRead);
        };
    }, [socket, conversationId, currentUser?._id, activeChat]);

    // ── Mark existing messages as read ──
    useEffect(() => {
        if (!conversationId || messages.length === 0) return;
        const hasUnread = messages.some(m => m.senderId?._id !== (currentUser?._id || currentUser?.id) && !m.readBy?.includes(currentUser?._id || currentUser?.id));
        if (hasUnread) {
            fetch(`http://localhost:4000/api/messages/read/${conversationId}`, {
                method: "PUT", credentials: "include"
            }).catch(() => {});
        }
    }, [conversationId, messages.length, currentUser?._id]);

    // ── Load conversation + messages ──────────────────────────────
    useEffect(() => {
        const load = async () => {
            if (!conversationId || typeof conversationId === "object") return;
            try {
                const [convRes, msgRes] = await Promise.all([
                    fetch(`http://localhost:4000/api/conversation/${conversationId}`, { credentials: "include" }),
                    fetch(`http://localhost:4000/api/messages/${conversationId}?limit=30`, { credentials: "include" })
                ]);
                if (convRes.ok) setActiveChat(await convRes.json());
                if (msgRes.ok) {
                    const data = await msgRes.json();
                    setMessages(mergeMessages(data));
                    setCursor(data[0]?._id);
                    setTimeout(() => {
                        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
                    }, 80);
                }
            } catch (err) {
                console.error("ChatInterface load fetch failed:", err);
            }
        };
        load();
    }, [conversationId]);

    // ── Auto-scroll to bottom ─────────────────────────────────────
    useEffect(() => {
        if (chatRef.current) {
            const el = chatRef.current;
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
            if (isNearBottom) el.scrollTop = el.scrollHeight;
        }
    }, [messages.length]);

    // ── Event Handlers ────────────────────────────────────────────
    const handleScroll = async (e) => {
        if (e.target.scrollTop < 60 && cursor && !loading) {
            setLoading(true);
            const prev = e.target.scrollHeight;
            try {
                const res = await fetch(`http://localhost:4000/api/messages/${conversationId}?limit=20&cursor=${cursor}`, { credentials: "include" });
                const older = await res.json();
                const reversed = older.reverse();
                setMessages(p => mergeMessages(reversed, p));
                setCursor(older[0]?._id);
                setTimeout(() => {
                    const newH = chatRef.current?.scrollHeight;
                    if (chatRef.current) chatRef.current.scrollTop = newH - prev;
                }, 0);
            } catch { }
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !socket) return;
        try {
            const res = await fetch("http://localhost:4000/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ conversationId, text: messageInput }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => mergeMessages([msg], prev));
                setMessageInput("");
            }
        } catch { }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (!socket || !currentUser) return;
        const uid = currentUser._id || currentUser.id;
        socket.emit("typing", { conversationId, userId: uid });
        if (window._typingTimeout) clearTimeout(window._typingTimeout);
        window._typingTimeout = setTimeout(() => {
            socket?.emit("stop_typing", { conversationId, userId: uid });
        }, 1500);
    };

    // ── Delete Actions ────────────────────────────────────────────
    const deleteForMe = async (messageId) => {
        const res = await fetch(`http://localhost:4000/api/messages/${messageId}/me`, { method: "DELETE", credentials: "include" });
        if (res.ok) setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const deleteForEveryone = async (messageId) => {
        const res = await fetch(`http://localhost:4000/api/messages/${messageId}/everyone`, { method: "DELETE", credentials: "include" });
        if (res.ok) setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeletedForEveryone: true, text: "This message was deleted" } : m));
    };

    const clearChat = async () => {
        if (!confirm("Clear all messages for yourself?")) return;
        const res = await fetch(`http://localhost:4000/api/messages/clear/${conversationId}`, { method: "DELETE", credentials: "include" });
        if (res.ok) setMessages([]);
    };

    // ── Voice Call ────────────────────────────────────────────────
    const handleVoiceCall = () => {
        if (!activeChat || !currentUser || activeChat.isGroupChat) return;
        const other = activeChat.participants?.find(p => p._id !== (currentUser?._id || currentUser?.id));
        if (!other) return alert("Could not find participant.");
        startCall({ receiverId: other._id, receiverName: other.name, receiverPic: other.profilePic, conversationId });
    };

    // ── Header Info ───────────────────────────────────────────────
    const getHeader = () => {
        if (!activeChat || !currentUser) return { name: "Loading...", status: "", isOnline: false, pic: "" };
        if (activeChat.isGroupChat) {
            return { name: activeChat.groupName, status: `${activeChat.participants?.length || 0} members`, isOnline: false, pic: activeChat.groupPic };
        }
        const other = activeChat.participants?.find(p => p._id !== (currentUser?._id || currentUser?.id));
        const isOnline = other ? onlineUsers.has(other._id) : false;
        const status = isOnline ? "Online" : (lastSeenText ? `Last seen ${lastSeenText}` : "Offline");
        return { name: other?.name || "User", status, isOnline, pic: other?.profilePic };
    };
    const { name: hName, status: hStatus, isOnline: hIsOnline, pic: hPic } = getHeader();

    // ── Utils ─────────────────────────────────────────────────────
    const fmtTime = (str) => {
        if (!str) return "";
        return new Date(str).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const getDateDivider = (msg, index) => {
        const d = new Date(msg.createdAt);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const isFirst = index === 0;
        const isDifferentDay = index > 0 && d.toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
        if (!isFirst && !isDifferentDay) return null;
        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
        const days = Math.ceil((today - d) / 86400000);
        if (days <= 7) return d.toLocaleDateString([], { weekday: "long" });
        return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
    };

    const typingUser = activeChat?.participants?.find(p => p._id === typingUserId);

    // ── Conditional Return For Call View ─────────────────────────
    if (viewMode === "call" && callId) {
        return (
            <div className="flex h-full w-full overflow-hidden">
                <CallDetailView callId={callId} conversationId={conversationId} currentUser={currentUser} />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden transition-all duration-300">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0B121B] overflow-hidden">
                {/* Header */}
                <div className="h-[70px] flex-shrink-0 px-6 flex justify-between items-center border-b border-white/5 bg-[#111926]">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}>
                        <div className="relative">
                            <img
                                src={hPic || `https://ui-avatars.com/api/?name=${hName}&background=random`}
                                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                            />
                            {hIsOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#111926] rounded-full"></div>}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">{hName}</h3>
                            <p className={`text-[10px] font-medium ${hIsOnline ? "text-green-400" : "text-gray-500"}`}>{hStatus}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!activeChat?.isGroupChat && (
                            <button onClick={handleVoiceCall} title="Start voice call" className="p-2.5 rounded-xl text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all active:scale-90"><PhoneIcon size={19} /></button>
                        )}
                        <button onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)} className={`p-2.5 rounded-xl transition-all active:scale-90 ${isInfoPanelOpen ? "text-blue-400 bg-blue-500/10" : "text-gray-400 hover:text-white hover:bg-white/10"}`}><Info size={19} /></button>
                        <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"><Share size={19} /></button>
                        <button onClick={clearChat} title="Clear chat" className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"><Trash2 size={19} /></button>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                )}

                {/* Messages Area */}
                <div ref={chatRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {messages.map((msg, index) => {
                        const isMe = (msg.senderId?._id || msg.senderId) === (currentUser?._id || currentUser?.id);
                        const senderName = msg.senderId?.name || "User";
                        const time = fmtTime(msg.createdAt);
                        const dateDivider = getDateDivider(msg, index);
                        
                        // Clean deleted text as requested
                        const displayMessage = msg.isDeletedForEveryone ? "This message was deleted" : msg.text;

                        return (
                            <React.Fragment key={msg._id}>
                                {dateDivider && (
                                    <div className="flex justify-center my-4">
                                        <span className="text-[10px] font-semibold bg-white/5 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">{dateDivider}</span>
                                    </div>
                                )}
                                <div className={`group flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                                    {!isMe && (
                                        <img src={msg.senderId?.profilePic || `https://ui-avatars.com/api/?name=${senderName}&background=random`} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 pointer-events-none" />
                                    )}
                                    <div className={`relative max-w-[66%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {activeChat?.isGroupChat && !isMe && <span className="text-[10px] text-blue-400 font-medium mb-1 ml-1">{senderName}</span>}
                                        <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isDeletedForEveryone ? "bg-gray-800/50 italic text-gray-500 border border-white/5" : isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#1E2B3A] text-gray-100 rounded-bl-sm"}`}>
                                            {displayMessage}
                                            {!msg.isDeletedForEveryone && (
                                                <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] opacity-70">
                                                    {time}
                                                    {isMe && (msg.readBy?.length > 1 ? <span className="text-cyan-300 ml-0.5">✓✓</span> : <span className="text-gray-300 ml-0.5">✓</span>)}
                                                </span>
                                            )}
                                            {!msg.isDeletedForEveryone && <span className="opacity-0 text-[9px] ml-2 select-none">{time}{isMe ? " ✓✓" : ""}</span>}
                                        </div>

                                        {!msg.isDeletedForEveryone && (
                                            <div className={`absolute ${isMe ? "-left-10" : "-right-10"} top-2 group-hover:block hidden z-10 text-gray-500 hover:text-white transition cursor-pointer`} onClick={() => setMenuMessageId(menuMessageId === msg._id ? null : msg._id)}>
                                                <MoreVertical size={16} />
                                                {menuMessageId === msg._id && (
                                                    <div className={`absolute top-full mt-1 w-40 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-1 z-[50] ${isMe ? "left-0" : "right-0"}`}>
                                                        <button onClick={() => { deleteForMe(msg._id); setMenuMessageId(null); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-gray-300 flex items-center gap-2"><Trash2 size={13} /> Delete for me</button>
                                                        {isMe && <button onClick={() => { deleteForEveryone(msg._id); setMenuMessageId(null); }} className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 flex items-center gap-2 underline underline-offset-4 decoration-red-500/30"><Trash2 size={13} /> Delete for everyone</button>}
                                                        <button onClick={() => { setInfoMessage(msg); setMenuMessageId(null); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-white/90 flex items-center gap-2 border-t border-white/5 mt-1 pt-2"><Info size={13} /> Message info</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Message Info Modal */}
                {infoMessage && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setInfoMessage(null)}>
                        <div className="bg-[#1C2633] text-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-white/5 flex justify-between items-center"><h3 className="text-lg font-semibold">Message information</h3><button onClick={() => setInfoMessage(null)} className="p-2 hover:bg-white/10 rounded-full transition">&times;</button></div>
                            <div className="p-6 space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-xl border ${infoMessage.readBy?.length > 1 ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-gray-800 border-gray-700 text-gray-500"}`}><CheckCheck size={20} /></div>
                                    <div><p className="font-bold text-sm">Read</p><p className="text-xs text-gray-400 mt-1">{infoMessage.readBy?.length > 1 ? `Today at ${new Date(infoMessage.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}` : "No one has read this yet"}</p></div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400"><CheckCheck size={20} /></div>
                                    <div><p className="font-bold text-sm">Delivered</p><p className="text-xs text-gray-400 mt-1">Today at {new Date(infoMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</p></div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-5 mt-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Original Message</p>
                                <div className={`text-sm py-2 px-3 rounded-xl inline-block ${(infoMessage.senderId?._id || infoMessage.senderId) === (currentUser?._id || currentUser?.id) ? "bg-blue-600" : "bg-gray-800"}`}>{infoMessage.text}</div>
                            </div>
                        </div>
                    </div>
                )}

                {typingUser && <div className="px-6 pb-1"><span className="text-[11px] text-gray-500 italic animate-pulse">{typingUser.name} is typing...</span></div>}

                {/* Message Input */}
                <div className="px-5 pb-5 flex-shrink-0">
                    <div className="flex items-center gap-3 bg-[#1A2332] rounded-2xl px-4 py-2.5 border border-white/5 focus-within:border-blue-500/40 transition-all shadow-inner">
                        <button className="text-gray-500 hover:text-white transition-colors flex-shrink-0"><Plus size={20} /></button>
                        <input type="text" placeholder="Type a message..." value={messageInput} onChange={handleInputChange} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} className="flex-1 bg-transparent outline-none text-sm text-gray-100 placeholder-gray-600" />
                        <button onClick={sendMessage} disabled={!messageInput.trim()} className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-blue-500/20"><Send size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Right Side Info Panel */}
            {isInfoPanelOpen && (
                <div className="w-[310px] bg-[#111926] border-l border-white/5 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="p-8 flex flex-col items-center">
                        <div className="relative mb-6">
                            <img src={hPic || `https://ui-avatars.com/api/?name=${hName}&background=random`} className="w-24 h-24 rounded-[2rem] object-cover shadow-2xl" />
                            {hStatus === "Online" && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#111926] rounded-full"></div>}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{hName}</h2>
                        <p className="text-xs text-gray-500 mb-8 text-center">{activeChat?.isGroupChat ? "Group Chat" : "Senior Product Designer"}</p>
                        
                        <div className="flex gap-4 mb-10 w-full justify-center">
                            <button onClick={handleVoiceCall} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><PhoneIcon size={18} /></button>
                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><Share size={18} /></button>
                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><Trash2 size={18} /></button>
                        </div>

                        <div className="w-full space-y-8">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Shared Files</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><Send size={16} /></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-300 truncate">Project_UX_v2.pdf</p><p className="text-[10px] text-gray-500">2.4 MB · Mar 21</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all"><Send size={16} /></div>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-300 truncate">Landing_Draft.png</p><p className="text-[10px] text-gray-500">1.1 MB · Today</p></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Common Groups</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 group cursor-pointer"><div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold uppercase">DT</div><p className="text-sm font-semibold text-gray-400 group-hover:text-white transition">Design Team</p></div>
                                    <div className="flex items-center gap-3 group cursor-pointer"><div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold uppercase">PR</div><p className="text-sm font-semibold text-gray-400 group-hover:text-white transition">Product Review</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;