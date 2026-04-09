"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CallProvider } from "../context/CallContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VoiceCallUI from "../components/VoiceCallUI";
import { useState, useEffect } from "react";
import { getMe } from "../services/authServices";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getMe().then(res => {
      if (res?.user) setCurrentUser(res.user);
    }).catch(err => {
      console.warn("Auth check failed, user might be offline or logged out", err);
    });
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
          <CallProvider currentUser={currentUser}>
            {children}
            {/* Global overlay for voice/video calls */}
            <VoiceCallUI />
          </CallProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
