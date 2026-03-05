import express from 'express';
import { getMessages, getConversations } from '../../controllers/chat.controller.js';

const router = express.Router();

router.get('/conversations', getConversations);
router.get('/:contract_id/messages', getMessages);

export default router;
