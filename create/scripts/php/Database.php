<?php

    class Database {

        function __construct() {
            // DB credentials live in db-config.php (gitignored, present only on the
            // deployed server) - see db-config.example.php. Never hardcode them here.
            $configPath = __DIR__ . '/db-config.php';
            if (!is_file($configPath)) {
                // Missing on this deploy target: fail with the normal JSON error
                // instead of a fatal require, so the page degrades gracefully.
                $this->dieWithMessage('username', 'The server is not configured yet. Please try again later.');
            }
            $cfg = require $configPath;
            $this->db = new mysqli($cfg['host'], $cfg['user'], $cfg['password'], $cfg['database']);

            if ($this->db->connect_error) {
                $this->dieWithMessage('username', 'Failed to connect.');
            }
        }

        function userExists($username) {
            $statement = $this->db->prepare('SELECT * FROM users WHERE username = ?');
            $statement->bind_param('s', $username);
            $statement->execute();

            $result = $statement->get_result();

            if ($result->num_rows) {
                return true;
            }
        }

        function insertUser($username, $email, $password, $color = 1) {
            if ($this->userExists($username)) {
                $this->dieWithMessage('username', 'That username is already taken.');
            }

            $password = $this->hashPassword($password);

            $statement = $this->db->prepare('INSERT INTO users (username, email, password, color) VALUES (?, ?, ?, ?)');
            $statement->bind_param('sssi', $username, $email, $password, $color);

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
