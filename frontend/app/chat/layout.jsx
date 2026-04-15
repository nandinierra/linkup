"use client";
import Sidebar from "../../components/Sidebar";
import VoiceCallUI from "../../components/VoiceCallUI";
import { CallProvider } from "../../context/CallContext";
import { useState, useEffect } from "react";
import { getMe } from "../../services/authServices";

/**
 * ChatLayout wraps the entire /chat section.
 * It:
 *   1. Loads the current user once
 *   2. Provides the global CallContext to all children
 *   3. Renders the global VoiceCallUI overlay (ringing, calling, connected)
 */
const ChatLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default ChatLayout;
