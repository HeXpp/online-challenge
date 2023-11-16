import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

const app = express();
const port = 8080;

const dbConfig = {
  host: 'localhost',
  user: 'user',
  password: 'pw',
  database: 'db'
};

const conn = mysql.createConnection(dbConfig);

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
  const mangoToVerify = 'mango';
  const { mango } = req.body;

  if (!mango || mango !== mangoToVerify) {
    return res.status(401).send('Unauthorized access, fuck u');
  }

  next();
});

app.post('/createUser', (req, res) => {
  const { username } = req.body;

  const sql = "SELECT 1 FROM users WHERE username = ? LIMIT 1";

  conn.query(sql, [username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else if (result && result.length > 0) {
      res.send('User already registered');
    } else {
      const createUserSql = "INSERT INTO users (username, progress, lives, difficulty, level_group, dsm_2, easy_record, normal_record, hard_record, expert_record) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0)";

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

app.post('/resetDifficulty', (req, res) => {
  const { username, difficulty } = req.body;

  const allowedDifficulties = ['easy', 'normal', 'hard', 'expert'];

  if (!allowedDifficulties.includes(difficulty)) {
    res.status(400).send(`Invalid difficulty: ${difficulty}`);
    return;
  }

  const columnsToReset = [
    `${difficulty}_progress`,
    'dsm_2',
    'level_group'
  ];

  const resetSql = `UPDATE users SET ${columnsToReset.map(column => `${column} = 0`).join(', ')} WHERE username = ?`;

  conn.query(resetSql, [username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else {
      res.send(`Progress for difficulty ${difficulty} reset successfully`);
    }
  });
});

app.post('/editUser', (req, res) => {
  const { username, column, mode, quantity } = req.body;

  if (column === 'progress' || mode === 'replace') {
    // Si se está editando el progreso o en el modo "replace", verifique si es necesario actualizar el récord
    const getPreviousRecordSql = `SELECT progress, difficulty FROM users WHERE username = ?`;

    conn.query(getPreviousRecordSql, [username], (err, result) => {
      if (err) {
        res.status(500).send('An error occurred');
      } else {
        const { difficulty } = result[0];
		let difficultyLevel;

		switch (difficulty) {
		  case 0:
			difficultyLevel = 'easy';
			break;
		  case 1:
			difficultyLevel = 'normal';
			break;
		  case 2:
			difficultyLevel = 'hard';
			break;
		  case 3:
			difficultyLevel = 'expert';
			break;
		  default:
			difficultyLevel = 'unknown';
		}

		const recordColumn = `${difficultyLevel}_record`;

        if (mode === 'record') {
          // Actualizar el progreso y, si es necesario, el récord
          const updateSql = `UPDATE users SET progress = ?, ${recordColumn} = GREATEST(${recordColumn}, progress) WHERE username = ?`;

          conn.query(updateSql, [quantity, username], (err, result) => {
            if (err) {
              res.status(500).send(`An error occurred trying to edit ${column}: ${err.message}`);
            } else {
              res.send('Edit successful');
            }
          });
        } else if (mode === 'add') {
          // Solo actualizar el progreso
          const updateSql = `UPDATE users SET progress = ? WHERE username = ?`;

          conn.query(updateSql, [quantity, username], (err, result) => {
            if (err) {
              res.status(500).send(`An error occurred trying to edit ${column}: ${err.message}`);
            } else {
              res.send('Edit successful');
            }
          });
        } else if (mode === 'replace') {
          // Modo "replace": actualizar la columna con el nuevo valor
          const updateSql = `UPDATE users SET ${column} = ? WHERE username = ?`;

          conn.query(updateSql, [quantity, username], (err, result) => {
            if (err) {
              res.status(500).send(`An error occurred trying to edit ${column}: ${err.message}`);
            } else {
              res.send('Edit successful');
            }
          });
        } else {
          res.status(400).send('Unknown edit mode');
        }
      }
    });
  } else {
    res.status(400).send(`Field not valid: ${column}`);
  }
});





app.post('/showData', (req, res) => {
  const { username } = req.body;
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

app.post('/setDifficulty', (req, res) => {

  const { username, mode } = req.body;
  const allowedModes = ['easy', 'normal', 'hard', 'expert'];

  if (!allowedModes.includes(mode)) {
    res.status(400).send(`${mode} is an unknown difficulty mode`);
    return;
  }

  let difficultyValue = 0;
  switch (mode) {
    case 'easy':
      difficultyValue = 0;
      break;
    case 'normal':
      difficultyValue = 1;
      break;
    case 'hard':
      difficultyValue = 2;
      break;
    case 'expert':
      difficultyValue = 3;
      break;
  }

  const sql = 'UPDATE users SET difficulty = ? WHERE username = ?';

  conn.query(sql, [difficultyValue, username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else {
      res.send('Difficulty set successfully');
    }
  });
});

app.post('/generateLeaderboard', (req, res) => {

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
