const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// sql config
const dbConfig = {
    host: 'localhost',
    user: 'tu_usuario',
    password: 'tu_contraseña',
    database: 'tu_base_de_datos',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('error while connecting to db: ' + err.message);
        process.exit(1);
    }
    console.log('connected succesfully to db');
});

// mango verify
function verifyMango(req, res, next) {
    const mangoToVerify = '8871336752826128';

    if (!req.body.mango || req.body.mango !== mangoToVerify) {
        return res.status(401).json({ message: 'unauthorized access' });
    }
    next();
}

// edit function
function editUser(username, column, mode, quantity, res) {
    let sql;
    let values = [];

    if (mode === 'record') {
        sql = `UPDATE users SET ${column} = ? WHERE username = ?`;
        values = [quantity, username];
    } else if (mode === 'add') {
        sql = `UPDATE users SET ${column} = ${column} + ? WHERE username = ?`;
        values = [quantity, username];
    } else if (mode === 'remove') {
        sql = `UPDATE users SET ${column} = ${column} - ? WHERE username = ?`;
        values = [quantity, username];
    } else {
        return res.status(400).json({ error: 'unknown editing mode' });
    }

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error(`error while editing ${column} of user ${username}: ` + err.message);
            return res.status(500).json({ error: `error while editing ${column}` });
        }

        // get updated value of field (deprecated)
        connection.query(`SELECT ${column} FROM users WHERE username = ?`, [username], (err, result) => {
            if (err) {
                console.error(`error while getting the updated value of ${column}: ` + err.message);
                return res.status(500).json({ error: `error while getting the updated value of ${column}` });
            }
            const currentValue = result[0][column];

            res.json({ message: 'ok', current: currentValue });
        });
    });
}

// delete function
function eraseUser(username, res) {
    connection.query('DELETE FROM users WHERE username = ?', [username], (err, result) => {
        if (err) {
            console.error('error while editing user ' + username + ': ' + err.message);
            return res.status(500).json({ error: 'error while editing user' });
        }
        res.json({ message: 'ok' });
    });
}

// new user funtion
function createUser(username, res) {
    connection.query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username], (err, result) => {
        if (err) {
            console.error('error while verifying if user exists: ' + err.message);
            return res.status(500).json({ error: 'error while verifying if user exists' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'user already existed in db' });
        }

        connection.query('INSERT INTO users (username, progress, lives, difficulty, level_group, dsm_2, easy_record, normal_record, hard_record, expert_record) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0)', [username], (err, result) => {
            if (err) {
                console.error('error while creating user: ' + err.message);
                return res.status(500).json({ error: 'error while creating user' });
            }
            res.json({ message: 'ok' });
        });
    });
}

// showdata function
function showData(username, res) {
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) {
            console.error('error while getting data from user: ' + err.message);
            return res.status(500).json({ error: 'error while getting data from user' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'user not found on db, maybe got deleted?' });
        }

        res.json(result[0]);
    });
}

// establish difficulty function
function setDifficulty(username, mode, res) {
    if (mode === 'easy' || mode === 'normal' || mode === 'hard' || mode === 'expert') {
        connection.query('UPDATE users SET difficulty = ? WHERE username = ?', [mode, username], (err, result) => {
            if (err) {
                console.error('error while setting the difficulty to user: ' + err.message);
                return res.status(500).json({ error: 'error ocurred while setting difficulty' });
            }
            res.json({ message: 'ok' });
        });
    } else {
        res.status(400).json({ error: 'unknown difficulty' });
    }
}

// leaderboard gen function
function generateLeaderboard(difficulty, res) {
    connection.query(`SELECT username AS alias, ${difficulty}_record AS cantidad FROM users ORDER BY ${difficulty}_record DESC LIMIT 100`, (err, result) => {
        if (err) {
            console.error('error while generating lb: ' + err.message);
            return res.status(500).json({ error: 'error while gen lb' });
        }
        const leaderboard = result.map((row) => ({ alias: row.alias, cantidad: row.cantidad }));
        res.json({ result: leaderboard });
    });
}

// Ruta para editar un usuario
app.post('/user/edit', verifyMango, (req, res) => {
    const { username, column, mode, quantity } = req.body;
    editUser(username, column, mode, quantity, res);
});

// Ruta para eliminar un usuario
app.post('/user/delete', verifyMango, (req, res) => {
    const { username } = req.body;
    eraseUser(username, res);
});

// Ruta para crear un usuario
app.post('/user/create', verifyMango, (req, res) => {
    const { username } = req.body;
    createUser(username, res);
});

// Ruta para mostrar datos de un usuario
app.post('/user/showdata', verifyMango, (req, res) => {
    const { username } = req.body;
    showData(username, res);
});

// Ruta para establecer la dificultad de un usuario
app.post('/user/setdifficulty', verifyMango, (req, res) => {
    const { username, mode } = req.body;
    setDifficulty(username, mode, res);
});

// Ruta para generar el leaderboard
app.post('/user/leaderboard', verifyMango, (req, res) => {
    const { difficulty } = req.body;
    generateLeaderboard(difficulty, res);
});

// Cierre de la conexión a la base de datos al finalizar la aplicación
process.on('exit', () => {
    connection.end();
    console.log('db conn end. bye, hexp.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`server started on port ${port}`);
});
