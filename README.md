# Endless Challenge Online System

![banner (1)](https://github.com/HeXpp/online-challenge/assets/97027903/573f55a0-b1b3-4317-8f89-9e2eea52bd76)

Cheap to host, easy to implement online system used in SMM:WE 3.4.0
## Features
- Works with Node.js (before it worked with PHP, but because of security issues, is now **deprecated**. If you take the risk you can find it in the PHP folder.)
- Progress and lives storage with MySQL
- Player leaderboards (highest records on each difficulty)
- Independent from the main online system developed by DangerousZone

## Setup
### First, create a MySQL db with this command. Replace "dsm" with the DB name you desire and "user_info" with the name of the table you desire.
```
CREATE DATABASE IF NOT EXISTS dsm;

USE dsm;

CREATE TABLE IF NOT EXISTS user_info (
    username VARCHAR(255),
    lives INT(11),
    difficulty INT(11),
    level_group INT(11),
    dsm_2 INT(11),
    easy_record INT(11),
    normal_record INT(11),
    hard_record INT(11),
    expert_record INT(11)
);
```
### Then, clone the repository and edit the configuration settings with your DB credentials, the ratelimiting you desire, the mango you desire and the port you desire the server to run on.
```
const dbConfig = {
  host: 'localhost',
  user: 'user',
  password: 'pw',
  database: 'db'
};
```
```
// ratelimiting
const limiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: 'Sending requests too fast, please slow down',
});
```
```
// mango verify
app.use((req, res, next) => {
  const mangoToVerify = 'mango';
  const { mango } = req.body;

  if (!mango || mango !== mangoToVerify) {
    return res.status(401).send('Mango's missing or is incorrect');
  }

  next();
});
```

### Lastly, install the dependencies
They're already declared on package.json so you can just do:
```
npm install
```
## Starting the server
If you're in Windows, run the batch file called "run.bat" or:
```
node index.mjs
```
## How this works?
I didn't write this part of the guide yet since the code isn't out. Probably tomorrow?


