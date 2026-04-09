const API_URL = "http://localhost:4000/api/users";

export const getUsers = async () => {
    const res = await fetch(`${API_URL}/db`, { credentials: "include" })
    return res.json()
}

export const getMe = async () => {
    const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
    return res.json();
}

export const updateProfile = async (userData) => {
    const res = await fetch(`${API_URL}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
    });
    return res.json();
}

export const updatePassword = async (passwords) => {
    const res = await fetch(`${API_URL}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
        credentials: "include",
    });
    return res.json();
}

export const uploadAvatar = async (formData) => {
    const res = await fetch(`${API_URL}/upload-avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
    });
    return res.json();
}