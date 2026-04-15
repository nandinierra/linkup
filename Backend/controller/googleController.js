import { google } from "googleapis";
import userModel from "../model/userModel.js";

/**
 * Normalizes phone numbers for standard comparison (e.g., +91 98765-43210 -> 919876543210)
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    // Remove all non-numeric characters (+, -, spaces, etc.)
    let cleaned = phone.replace(/\D/g, "");
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "");
    // Default to Indian country code (91) if it's a plain 10-digit number
    if (cleaned.length === 10) {
        cleaned = "91" + cleaned;
    }
    return cleaned;
};

/**
 * POST /api/google/contacts
 * Syncs Gmail contacts with registered users on the platform using Phone Number Discovery.
 */
export const syncGmailContacts = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ message: "Access token is required" });

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token });

        const people = google.people({ version: "v1", auth: oauth2Client });

        // Fetch connections (contacts) including phoneNumbers
        const response = await people.people.connections.list({
            resourceName: "people/me",
            pageSize: 1000,
            personFields: "names,emailAddresses,photos,phoneNumbers",
        });

        const connections = response.data.connections || [];
        
        // Extract names and phone numbers
        const googleContacts = connections.map(person => {
            const rawPhone = person.phoneNumbers?.[0]?.value;
            const normalizedPhone = normalizePhone(rawPhone);
            const name = person.names?.[0]?.displayName || "Unknown User";
            const photo = person.photos?.[0]?.url || "";
            const email = person.emailAddresses?.[0]?.value || "";
            return { rawPhone, normalizedPhone, name, photo, email };
        }).filter(c => c.normalizedPhone); // Only keep those with a valid phone number

        const normalizedPhoneList = googleContacts.map(c => c.normalizedPhone);

        // Get current user to check existing relationships
        const currentUser = await userModel.findById(req.user.id);
        const existingRelationIds = new Set([
            ...currentUser.contacts.map(id => id.toString()),
            ...currentUser.incomingRequests.map(id => id.toString()),
            ...currentUser.outgoingRequests.map(id => id.toString())
        ]);

        // THE MATCHMAKER: Perform a single database query on indexed phoneNumber field
        const allMatchedUsers = await userModel.find({
            phoneNumber: { $in: normalizedPhoneList },
            _id: { $ne: req.user.id } 
        }).select("name email phoneNumber profilePic isOnline lastSeen isBusy");

        // Filter matched users: Only those NOT already in contacts or requests
        const suggestedUsers = allMatchedUsers.filter(u => !existingRelationIds.has(u._id.toString()));

        // Map matched users to include their Google name for display
        const finalMatches = suggestedUsers.map(user => {
            const googleContact = googleContacts.find(c => c.normalizedPhone === user.phoneNumber);
            return {
                ...user.toObject(),
                googleName: googleContact?.name || user.name
            };
        });

        // Identify unmatched contacts for the Invite section
        const matchedPhones = new Set(allMatchedUsers.map(u => u.phoneNumber));
        const unmatchedContacts = googleContacts.filter(c => !matchedPhones.has(c.normalizedPhone));

        // PERSISTENCE: Save these results to the user document so we don't have to re-sync every time
        await userModel.findByIdAndUpdate(req.user.id, {
            suggestedContacts: {
                matchedUsers: finalMatches,
                unmatchedContacts,
                lastSynced: new Date()
            }
        });

        res.status(200).json({
            matchedUsers: finalMatches,
            unmatchedContacts,
            totalContacts: googleContacts.length
        });

    } catch (err) {
        console.error("Google Sync Error:", err);
        res.status(500).json({ message: "Failed to fetch Google contacts", error: err.message });
    }
};

/**
 * GET /api/google/suggested
 * Retrieves cached discovery results from the database.
 */
export const getSuggestedContacts = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        
        if (!user.suggestedContacts || !user.suggestedContacts.lastSynced) {
            return res.status(200).json({ 
                matchedUsers: [], 
                unmatchedContacts: [], 
                lastSynced: null 
            });
        }

        res.status(200).json(user.suggestedContacts);
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve suggested contacts" });
    }
};
