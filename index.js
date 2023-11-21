import express from 'express'
import bodyParser from 'body-parser';
import mysql from 'mysql';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

const app = express();
const port = 25577;

// Configuración de la conexión a la base de datos con SSL/TLS
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'pw',
  database: 'db',
  ssl: {
    // Configuración SSL/TLS
    rejectUnauthorized: false, // En producción, establece esto en 'true'
  },
});

conn.connect((err) => { //Verificar conexión en la base de datos.
  if (err) {
    console.error('No se puede conectar a la base de datos u-u:', err);
    return;
  }
  console.log('Connected to database');
});

// ratelimiting
const limiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: 'Sending requests too fast, please slow down',
});

app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(limiter);

// mango verify
app.use((req, res, next) => {
  const mangoToVerify = 'mangokey';
  const { mango } = req.body;

  if (!mango || mango !== mangoToVerify) {
    return res.status(401).send('Unauthorized access, fuck u');
  }

  next();
});

app.post('/createUser', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send('Username is required');
  }
  const sql = "SELECT 1 FROM users WHERE username = ? LIMIT 1;";

  conn.query(sql, [username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else if (result && result.length > 0) {
      res.send('User already registered');
    } else {
      const createUserSql = "INSERT INTO users (username, easy_record, normal_record, hard_record, expert_record) VALUES (?, 0, 0, 0 ,0)";

      conn.query(createUserSql, [username], (err, result) => {
        if (err) {
          res.status(500).send('An error occurred creating the user');
        } else {
          res.send('User created');
        }
      });
    }
  });
});

app.post('/editUser', (req, res) => {

  const { username, column, mode, quantity } = req.body;

  const allowedFields = ['easy_record', 'normal_record', 'hard_record', 'expert_record'];

  if (!allowedFields.includes(column)) {
    res.status(400).send(`Field not valid: ${column}`);
  } else {
    const getPreviousValueSql = `SELECT ${column} FROM users WHERE username = ?`;
    
    conn.query(getPreviousValueSql, [username], (err, result) => {
      if (err) {
        res.status(500).send('An error occurred');
      } else {
        const previousValue = result[0][column];
        let sql;

        if (mode === 'record') {
          sql = `UPDATE users SET ${column} = ? WHERE username = ?`;
        } else if (mode === 'add') {
          sql = `UPDATE users SET ${column} = ${column} + ? WHERE username = ?`;
        } else if (mode === 'remove') {
          sql = `UPDATE users SET ${column} = ${column} - ? WHERE username = ?`;
        } else {
          res.status(400).send('Unknown edit mode');
          return;
        }

        conn.query(sql, [quantity, username], (err, result) => {
          if (err) {
            res.status(500).send(`An error occurred trying to edit ${column}`);
          } else {
            const getCurrentValueSql = `SELECT ${column} FROM users WHERE username = ?`;

            conn.query(getCurrentValueSql, [username], (err, result) => {
              if (err) {
                res.status(500).send('An error occurred');
              } else {
                const currentValue = result[0][column];
                sendDiscordLog(username, column, previousValue, currentValue);
                res.send('Edit successful');
              }
            });
          }
        });
      }
    });
  }
});

app.post('/showData/', (req, res) => {
  const { username } = req.body
  const sql = 'SELECT * FROM users WHERE username = ?';

  conn.query(sql, [username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).send(`No data found for user: ${username}`);
    }
  });
});

app.post('/setRecord', (req, res) => {
  const { username, mode, record } = req.body;
  const allowedModes = ['easy', 'normal', 'hard', 'expert'];

  if (!allowedModes.includes(mode)) {
    return res.status(400).send(`${mode} is an unknown difficulty mode`);
  }

  const targetRecord = `${mode}_record`;
  const sqlSelect = `SELECT ${targetRecord} FROM users WHERE username = ?`;

  conn.query(sqlSelect, [username], (selectErr, selectResult) => {
    if (selectErr) {
      return res.status(500).send('An error occurred while fetching data');
    }

    const currentRecord = selectResult[0][targetRecord];

    if (record > currentRecord) {
      const sqlUpdate = `UPDATE users SET ${targetRecord} = ? WHERE username = ?`;

      conn.query(sqlUpdate, [record, username], (updateErr, updateResult) => {
        if (updateErr) {
          res.status(500).send('An error occurred while updating record');
        } else {
          res.send('Record set successfully');
        }
      });
    } else {
      res.send('Record not greater than current record. No update performed.');
    }
  });
});

app.post('/generateLeaderboard/', (req, res) => {

  const { difficulty } = req.body;

  const allowedDifficulties = ['easy', 'normal', 'hard', 'expert'];

  if (!allowedDifficulties.includes(difficulty)) {
    res.status(400).send(`Invalid difficulty: ${difficulty}`);
    return;
  }

  const sql = `SELECT username AS alias, ${difficulty}_record AS cantidad FROM users ORDER BY ${difficulty}_record DESC LIMIT 30`;

  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else if (result.length > 0) {
      const leaderboard = result.map((row) => ({
        alias: row.alias,
        cantidad: row.cantidad,
      }));

      res.json({ result: leaderboard });
    } else {
      res.status(404).send(`No records found for difficulty: ${difficulty}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
