import 'dotenv/config';
import { app } from './app.js';
import { initPrisma } from './lib/prisma.js';

const PORT = process.env.PORT ?? 3001;

async function main() {
  await initPrisma();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch(console.error);
