import React from "react";
import ContactItem from "./ContactItem";
import { UserPlus } from "lucide-react";

const ContactList = ({ contacts, loading }) => {
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-white/[0.03] rounded-2xl border border-white/5" />
                ))}
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                    <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No contacts found</h3>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                    Start growing your network by adding new friends or team members via email or username.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {contacts.map(contact => (
                <ContactItem key={contact._id} contact={contact} />
            ))}
        </div>
    );
};

export default ContactList;
