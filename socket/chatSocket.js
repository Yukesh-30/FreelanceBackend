import sql from '../config/dbConfig.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const initChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected to chat:', socket.id);

        socket.on('join_contract_room', async ({ contract_id, user_id }) => {
            try {
                // Verify contract is active and user is participant
                const contracts = await sql`
                    SELECT * FROM contracts 
                    WHERE id = ${contract_id} 
                      AND status = 'ACTIVE'
                      AND (client_id = ${user_id} OR freelancer_id = ${user_id})
                `;

                if (contracts.length === 0) {
                    return socket.emit('error', { message: 'Contract is not active or you are not a participant' });
                }

                const contract = contracts[0];

                // Create conversation document if not exists
                // Now we search by participants array instead of just contract_id
                let conversation = await Conversation.findOne({
                    participants: { $all: [contract.client_id, contract.freelancer_id] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        contract_id, // keep a reference to the first contract that initiated it
                        participants: [contract.client_id, contract.freelancer_id]
                    });
                }

                // Join socket room by conversation ID instead of contract ID
                // to mix all contracts between these two users
                const room_id = conversation._id.toString();
                socket.join(room_id);
                console.log(`User ${user_id} joined room ${room_id}`);

                socket.emit('joined_room', { contract_id, conversation_id: room_id });

            } catch (error) {
                console.error("Socket join error:", error);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        socket.on('send_message', async ({ contract_id, sender_id, text, conversation_id }) => {
            try {
                // Verify active status before sending to ensure contract isn't closed
                const contracts = await sql`SELECT status FROM contracts WHERE id = ${contract_id}`;
                if (contracts.length === 0 || contracts[0].status !== 'ACTIVE') {
                    return socket.emit('error', { message: 'Contract is no longer active' });
                }

                const newMessage = await Message.create({
                    conversation_id,
                    sender_id,
                    text
                });

                // Broadcast to everyone in the conversation room
                io.to(conversation_id).emit('receive_message', newMessage);

            } catch (error) {
                console.error("Socket send message error:", error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from chat:', socket.id);
        });
    });
};
