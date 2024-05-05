# Endless Challenge Online System

![banner (1)](https://github.com/HeXpp/online-challenge/assets/97027903/573f55a0-b1b3-4317-8f89-9e2eea52bd76)

Cheap to host, easy to implement online system used in SMM:WE
⚠️ DEPRECATED! Also, this system doesn't have any security measures, so you WILL have to make your own token and auth code system.
⚠️ THIS SYSTEM IS NOT PLUG AND PLAY! You will have to add protection, so you WILL need knowledge in node.js

## Features
- Works with Node.js (before it worked with PHP, but because of security issues, is now **deprecated**.)
- Progress and lives storage with MySQL
- Player leaderboards (highest records on each difficulty)
- Independent from the main online system developed by DangerousZone

## Setup
### First, create a MySQL db with this command. Replace "dsm" with the DB name you desire and "user_info" with the name of the table you desire.
```
CREATE DATABASE IF NOT EXISTS dsm;

USE dsm;

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(255),
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
node index.js
```
## How this works?
It allows you to use HTTP requests to do certain operations within a database. The most important ones are:

### POST http://ip:port/createuser/
It allows you to create a user for storing records. Example:
```
{
     "mango": "yourtoken",
     "username": "UserName"
}
```

### POST http://ip:puerto/setrecord/
It allows you to receive data and sort it in a column exclusive to the record logic. The highest published value remains within the column.

```
{
     "mango": "yourtoken",
     "username": "UserName",
     "mode": "easy", // You can choose between "easy", "normal", "hard" and "expert".
     "record": 12
}
```

### POST http://ip:puerto/generateleaderboard/
Allows you to display the leaderboards table, divided by difficulties. The limit is adjustable within the sql const.

```
{
     "mango": "yourtoken",
     "difficulty": "easy" // You can choose between "easy", "normal", "hard" and "expert".
}
```

Among other things that are found within the code.
