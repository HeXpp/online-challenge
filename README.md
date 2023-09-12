# Endless Challenge Online System (onlinechallenge)

![banner (1)](https://github.com/HeXpp/online-challenge/assets/97027903/573f55a0-b1b3-4317-8f89-9e2eea52bd76)

Cheap to host, easy to implement online system used in SMM:WE 3.4.0
## Features
- Works only with a PHP server and a MySQL server
- Progress and lives storage
- Player leaderboards (highest records on each difficulty)
- Independent from the main online system developed by DangerousZone

## Setup
First, create a MySQL db with this command. Replace "dsm" and "user_info" with whatever you want.
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


