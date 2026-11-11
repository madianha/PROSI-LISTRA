import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import kontakRouter from './routes/kontak.js';
import jasaRouter   from './routes/jasa.js';

const app  = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/kontak', kontakRouter);
app.use('/api/jasa',   jasaRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

