import express from 'express';
const { handleIdentify } = require('../controllers/contact.controller');

const router = express.Router();
router.post('/', handleIdentify);

export default router;
