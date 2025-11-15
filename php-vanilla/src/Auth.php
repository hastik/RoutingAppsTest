<?php

class Auth
{
    private const USERNAME = 'admin';
    private const PASSWORD = '1234';

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function check(): ?array
    {
        return $_SESSION['user'] ?? null;
    }

    public function login(string $username, string $password): bool
    {
        if ($username === self::USERNAME && $password === self::PASSWORD) {
            $_SESSION['user'] = ['username' => $username, 'loggedInAt' => date(DATE_ATOM)];
            return true;
        }
        return false;
    }

    public function logout(): void
    {
        unset($_SESSION['user']);
    }
}
