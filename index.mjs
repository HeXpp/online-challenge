import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

const app = express();
const port = 8080;

const dbConfig = {
  host: '127.0.0.1',
  user: 'hexp',
  password: 'hexpdelpino',
  database: 'dsm2'
};

const conn = mysql.createConnection(dbConfig);

// ratelimiting
const limiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: 'Sending requests too fast, please slow down',
});

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

app.post('/editUser', (req, res) => {

  const { username, column, mode, quantity } = req.body;

  const allowedFields = ['progress', 'lives', 'difficulty', 'level_group', 'dsm_2', 'easy_record', 'normal_record', 'hard_record', 'expert_record'];

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

function sendDiscordLog(username, column, previousValue, currentValue) {
  const discordWebhookURL = 'guebjuk';

  const difficulty = getDifficultyFromColumn(column);

  const message = `The value of the record ${difficulty} (\`${column}\`) of the user \`${username}\` has been updated to \`${currentValue}\`\nPrevious value: \`${previousValue}\`\nCurrent value: \`${currentValue}\``;

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  };

  fetch(discordWebhookURL, options)
    .then(() => {
      console.log('Discord log sent');
    })
    .catch(() => {
      console.error('Failed to send Discord log');
    });
}

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


  const { username } = req.body;
  const sql = 'DELETE FROM users WHERE username = ?';

  conn.query(sql, [username], (err, result) => {
    if (err) {
      res.status(500).send('An error occurred');
    } else {
      res.send('User erased');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
