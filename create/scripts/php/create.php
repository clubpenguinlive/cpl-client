<?php

    include 'Database.php';
    include 'Validator.php';

    define('TURNSTILE_SECRET', getenv('TURNSTILE_SECRET') ?: '');

    error_reporting(0);

    $v = new Validator();

    $username = $v->name('username', 'Username')
        ->required()
        ->trim()
        ->pattern('/[^A-Za-z0-9 ]/')
        ->string()
        ->length(4, 12)
        ->getField();

    $email = $v->name('email', 'Email Address')
        ->required()
        ->trim()
        ->email()
        ->length(3, 254)
        ->getField();

    $password = $v->name('password', 'Password')
        ->required()
        ->trim()
        ->pattern($v::PASSWORD_PATTERN)
        ->length(8, 60)
        ->getField();

    $v->name('password-repeat', 'Repeat Password')
        ->required()
        ->trim()
        ->pattern($v::PASSWORD_PATTERN)
        ->length(8, 60)
        ->equals('password', 'Password');

    $v->name('cf-turnstile-response', 'Captcha')
        ->hcaptcha(TURNSTILE_SECRET);

    if ($v->isFailure()) {
        die($v->getErrors());
    }

    $color = isset($_POST['color']) ? intval($_POST['color']) : 1;
    if ($color < 1 || $color > 16) {
        $color = 1;
    }

    $db = new Database();
    $db->insertUser($username, $email, $password, $color);

?>
