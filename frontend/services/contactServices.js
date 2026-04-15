import { BACKEND_URL } from "@/config";

const API_URL = `${BACKEND_URL}/api/contacts`;

export const getContacts = async () => {
    const res = await fetch(`${API_URL}`, { credentials: "include" });
    return res.json();
};

export const getRequests = async () => {
    const res = await fetch(`${API_URL}/requests`, { credentials: "include" });
    return res.json();
};

export const sendRequest = async (targetUserId) => {
    const res = await fetch(`${API_URL}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
        credentials: "include",
    });
    return res.json();
};

export const acceptRequest = async (targetUserId) => {
    const res = await fetch(`${API_URL}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
        credentials: "include",
    });
    return res.json();
};

export const rejectRequest = async (targetUserId) => {
    const res = await fetch(`${API_URL}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
        credentials: "include",
    });
    return res.json();
};
