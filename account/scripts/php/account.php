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

    $currentPassword = $v->name('current-password', 'Current Password')
        ->required()
        ->trim()
        ->length(8, 60)
        ->getField();

    $newPassword = $v->name('password', 'New Password')
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
        ->equals('password', 'New Password');

    $v->name('cf-turnstile-response', 'Captcha')
        ->hcaptcha(TURNSTILE_SECRET);

    if ($v->isFailure()) {
        die($v->getErrors());
    }

    $db = new Database();
    $db->updatePassword($username, $currentPassword, $newPassword);

?>
