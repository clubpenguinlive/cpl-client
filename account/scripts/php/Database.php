<?php

    class Database {

        function __construct() {
            // DB credentials live in db-config.php (gitignored, present only on the
            // deployed server) - see db-config.example.php. Never hardcode them here.
            $cfg = require __DIR__ . '/db-config.php';
            $this->db = new mysqli($cfg['host'], $cfg['user'], $cfg['password'], $cfg['database']);

            if ($this->db->connect_error) {
                $this->dieWithMessage('username', 'Failed to connect.');
            }
        }

        function getUser($username) {
            $statement = $this->db->prepare('SELECT * FROM users WHERE username = ?');
            $statement->bind_param('s', $username);
            $statement->execute();

            return $statement->get_result()->fetch_assoc();
        }

        function updatePassword($username, $currentPassword, $newPassword) {
            $user = $this->getUser($username);

            if (!$user) {
                $this->dieWithMessage('username', 'No penguin with that name.');
            }

            // Stored hashes use the $2a$ identifier; normalise to $2y$ for password_verify.
            $hash = str_replace('$2a$', '$2y$', $user['password']);

            if (!password_verify($currentPassword, $hash)) {
                $this->dieWithMessage('current-password', 'Your current password is incorrect.');
            }

            $newHash = $this->hashPassword($newPassword);

            $statement = $this->db->prepare('UPDATE users SET password = ? WHERE username = ?');
            $statement->bind_param('ss', $newHash, $username);

            if (!$statement->execute()) {
                $this->dieWithMessage('username', 'There was an error.');
            }

            $this->dieWithMessage('success', true);
        }

        function hashPassword($password) {
            $password = password_hash($password, PASSWORD_BCRYPT);

            return str_replace('$2y$', '$2a$', $password);
        }

        function dieWithMessage($key, $message) {
            die(json_encode(array($key => $message)));
        }

    }

?>
