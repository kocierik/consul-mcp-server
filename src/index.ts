import { startServer } from './server.js';

startServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

