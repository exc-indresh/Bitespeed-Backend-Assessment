import { Request, Response } from 'express';
import { identifyContact } from '../services/contact.service';

export const handleIdentify = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ message: 'Email or phone number required.' });
  }

  const contact = await identifyContact(email, phoneNumber);
  res.json({ contact });
};
