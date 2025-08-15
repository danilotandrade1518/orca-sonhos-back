import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import { loadEnv } from './config/env';

dotenv.config();
const env = loadEnv();

const app = express();
app.use(express.json());

process.env.TZ = 'UTC';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (_req, res) => {
  res.send('OrçaSonhos API rodando!');
});

app.listen(Number(env.HTTP_PORT), () => {
  console.log(`Servidor rodando na porta ${env.HTTP_PORT}`);
});
