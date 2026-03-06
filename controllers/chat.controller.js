import sql from '../config/dbConfig.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { internelServerError } from '../helper/response.js';

export const getMessages = async (req, res) => {
    const { contract_id } = req.params;
    const { user_id } = req.query; // Ensure user_id is provided via query to verify access

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    try {
        // Verify user is part of the contract and get both participants
        const contracts = await sql`
            SELECT id, client_id, freelancer_id FROM contracts 
            WHERE id = ${contract_id} 
              AND (client_id = ${user_id} OR freelancer_id = ${user_id})
        `;

        if (contracts.length === 0) {
            return res.status(403).json({ message: "You are not authorized to view this chat or contract doesn't exist" });
        }

        const contract = contracts[0];

        // Find conversation where participants array contains EXACTLY these two users 
        // We use $all to ensure both are present. For strict exact match (no others), 
        // we could also check size, but standard chats here only have 2 participants.
        const conversation = await Conversation.findOne({
            participants: { $all: [contract.client_id, contract.freelancer_id] }
        });

        if (!conversation) {
            return res.status(200).json({ messages: [] }); // No messages yet
        }

        const messages = await Message.find({ conversation_id: conversation._id }).sort({ createdAt: 1 });
        return res.status(200).json({ messages });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ message: internelServerError() });
    }
};

export const getConversations = async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    try {
        const conversations = await Conversation.find({ participants: user_id }).sort({ updatedAt: -1 });
        return res.status(200).json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return res.status(500).json({ message: internelServerError() });
    }
};
