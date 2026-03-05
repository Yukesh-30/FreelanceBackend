import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    contract_id: {
        type: String, 
        required: true,
        unique: true,
    },
    participants: [{
        type: String, 
    }],
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);
