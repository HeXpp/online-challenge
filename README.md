# Endless Challenge Online System (onlinechallenge)
# PHP VERSION IS NOW DEPRECATED BECAUSE OF SECURITY ISSUES, SEE THE REWRITE IN NODE.JS

![banner (1)](https://github.com/HeXpp/online-challenge/assets/97027903/573f55a0-b1b3-4317-8f89-9e2eea52bd76)

Cheap to host, easy to implement online system used in SMM:WE 3.4.0
## Features
- Works only with a PHP server and a MySQL server (deprecated)
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
Then, clone the repository and edit the configuration settings with your DB credentials.
```
<?php
$servername = "127.0.0.1";
$username_db = "hexp";
$password_db = "hexpdelpino";
$dbname = "dsm2";

$conn = new mysqli($servername, $username_db, $password_db, $dbname);

if ($conn->connect_error) {
    die("db connection error: " . $conn->connect_error);
}

$mangoToVerify = "9752752362299246";
```
And you're done! Just put that index.php to any server with php support (000webhost or infinityfree are fantastic options) and make sure that the MySQL server stays running! Both of these 2 services (000webhost/infinityfree) gives you a MySQL server apart from the PHP server, so you can host this system.

## How this works?
I didn't write this part of the guide yet since the code isn't out. Probably tomorrow?


