<?php

    class Database {

        const HOST = 'localhost';
        const USER = 'yukon';
        const PASSWORD = 'clubpenguinlive2026';
        const DATABASE = 'clubpenguinlive';

        function __construct() {
            $this->db = new mysqli(self::HOST, self::USER, self::PASSWORD, self::DATABASE);

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
