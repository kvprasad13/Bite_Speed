import express from 'express';
const router = express.Router();
import {createContact,getAllContacts} from '../controllers/contact';

router.route('/identify').post(createContact).get(getAllContacts);

export default router; 
