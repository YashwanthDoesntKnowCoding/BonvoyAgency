const app = require('./app');
const db = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await db.execute('SELECT 1');
    app.listen(PORT, () => {
      console.log(`Bonvoyagency API connected to MySQL and running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Could not connect to MySQL: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();
