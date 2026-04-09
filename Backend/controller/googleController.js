import { google } from "googleapis";
import userModel from "../model/userModel.js";

/**
 * POST /api/google/contacts
 * Syncs Gmail contacts with registered users on the platform.
 */
export const syncGmailContacts = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ message: "Access token is required" });

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token });

        const people = google.people({ version: "v1", auth: oauth2Client });

        // Fetch connections (contacts)
        const response = await people.people.connections.list({
            resourceName: "people/me",
            pageSize: 1000,
            personFields: "names,emailAddresses,photos",
        });

        const connections = response.data.connections || [];
        
        // Extract and normalize emails from Google
        const googleContacts = connections.map(person => {
            const email = person.emailAddresses?.[0]?.value?.toLowerCase().trim();
            const name = person.names?.[0]?.displayName || "Unknown User";
            const photo = person.photos?.[0]?.url || "";
            return { email, name, photo };
        }).filter(c => c.email); // Remove those without emails

        const gmailEmails = googleContacts.map(c => c.email);

        // Find matches in our database
        // We find users whose email is in the gmailEmails list
        const matchedUsers = await userModel.find({
            email: { $in: gmailEmails },
            _id: { $ne: req.user.id } // Don't include myself
        }).select("name email profilePic isOnline lastSeen isBusy");

        // Create a set of matched emails for easy lookup
        const matchedEmails = new Set(matchedUsers.map(u => u.email));

        // Unmatched contacts (not on platform)
        const unmatchedContacts = googleContacts.filter(c => !matchedEmails.has(c.email));

        res.status(200).json({
            matchedUsers,
            unmatchedContacts,
            totalContacts: googleContacts.length
        });

    } catch (err) {
        console.error("Google Sync Error:", err);
        res.status(500).json({ message: "Failed to fetch Google contacts", error: err.message });
    }
};
