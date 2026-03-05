import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    sender_id: {
        type: String, 
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
