import express from 'express';
import dotenv from 'dotenv';
const cors = require('cors');
import contactRouter from './routes/contact.route';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/identify', contactRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
