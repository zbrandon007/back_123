import express from 'express';
import mysql from 'mysql';
import cors from 'cors';

import { MYSQLDATABASE, MYSQLHOST, MYSQLPASSWORD, MYSQLPORT, MYSQLUSER, PORT } from './config.js';

const app = express();
app.use(cors());
app.use(express.json());

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: MYSQLHOST,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
    port: MYSQLPORT,
  });

  db.connect(err => {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      setTimeout(handleDisconnect, 2000); 
    } else {
      console.log('Connected as id ' + db.threadId);
    }
  });

  db.on('error', err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Connection lost. Reconnecting...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

app.get('/songs', (req, res) => {
  db.query('SELECT * FROM songs', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.get('/search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  const sqlQuery = `
    SELECT * FROM songs
    WHERE title LIKE ? OR artist LIKE ?
  `;
  const searchQuery = `%${query}%`;

  db.query(sqlQuery, [searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log('Server running on port ', PORT);
});
