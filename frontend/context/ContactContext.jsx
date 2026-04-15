"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { BACKEND_URL } from "@/config";

const ContactContext = createContext();

export const ContactProvider = ({ children, currentUser }) => {
    const initialState = {
        matchedUsers: [],
        unmatchedContacts: [],
        lastSynced: null
    };

    const [suggestedContacts, setSuggestedContacts] = useState(initialState);
    const [loading, setLoading] = useState(false);

    // ── Session Isolation Logic ──────────────────────────────────
    useEffect(() => {
        if (!currentUser?._id) {
            setSuggestedContacts(initialState);
            return;
        }
        
        // Auto-fetch the current user's persistent discovery results on login
        fetchSuggested();
    }, [currentUser?._id]);

    const fetchSuggested = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/google/suggested`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setSuggestedContacts(data);
            }
        } catch (err) {
            console.error("Failed to fetch suggested contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ContactContext.Provider value={{ 
            suggestedContacts, 
            setSuggestedContacts, 
            loading, 
            fetchSuggested 
        }}>
            {children}
        </ContactContext.Provider>
    );
};

export const useContact = () => useContext(ContactContext);
