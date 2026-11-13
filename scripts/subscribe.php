<?php
/**
 * Newsletter sign-up for the Baitaan sites (the form in the footer).
 *
 * Source file: scripts/subscribe.php. The build copies it to each site as /api/subscribe.php
 * (scripts/copy-php.mjs), so all four sites run the same code.
 *
 * Sign-ups are saved to <cPanel>/baitaan/_subscribers/subscribers.csv, a folder next to the
 * four site folders and outside every website, so nobody can open it from a browser.
 * Download it from cPanel → File Manager. Columns: date (UTC), email, site, language.
 *
 * Checks: POST only, same-site requests only, a valid email of at most 254 characters,
 * a hidden "website" field that people never fill (bots do: they get a fake success),
 * at most 5 sign-ups per visitor per hour, and no duplicates.
 * Replies with JSON when the page asks for it, otherwise sends the visitor back.
 */
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
// Host name without a port, for comparing with Origin and Referer.
$host = strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));

function reply(int $code, string $status): never
{
    global $wantsJson, $host;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['status' => $status]);
        exit;
    }
    // Without JavaScript: back to the page the form was on (same site only).
    $back = $_SERVER['HTTP_REFERER'] ?? '/';
    $backHost = strtolower((string) parse_url($back, PHP_URL_HOST));
    if ($backHost !== '' && $backHost !== $host) {
        $back = '/';
    }
    $back = preg_replace('/[?#].*$/', '', $back) . '?newsletter=' . rawurlencode($status) . '#newsletter';
    header('Location: ' . $back, true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, 'error');
}

// Same site only: a form on another website can't post here.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
    reply(403, 'error');
}

// Bots fill every field; people never see this one.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    reply(200, 'ok');
}

$email = trim((string) ($_POST['email'] ?? ''));
if ($email === '' || strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    reply(422, 'invalid');
}
$email = strtolower($email);
$lang = substr(preg_replace('/[^a-z-]/', '', strtolower((string) ($_POST['lang'] ?? ''))), 0, 8);
$site = preg_replace('/[^a-z0-9.-]/', '', $host);

// The data folder sits next to the site folders, outside every website.
$dir = dirname(__DIR__, 2) . '/_subscribers';
if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
    reply(500, 'error');
}
if (!is_file($dir . '/.htaccess')) {
    @file_put_contents($dir . '/.htaccess', "Require all denied\n");
}

// At most 5 sign-ups per visitor per hour (the IP address is stored only as a hash).
$rateFile = $dir . '/rate.json';
$rh = @fopen($rateFile, 'c+');
if ($rh === false || !flock($rh, LOCK_EX)) {
    reply(500, 'error');
}
$hour = gmdate('YmdH');
$rates = json_decode((string) stream_get_contents($rh), true);
$rates = is_array($rates) && ($rates['hour'] ?? '') === $hour ? $rates : ['hour' => $hour, 'n' => []];
$who = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $hour), 0, 16);
$rates['n'][$who] = ($rates['n'][$who] ?? 0) + 1;
ftruncate($rh, 0);
rewind($rh);
fwrite($rh, json_encode($rates));
fflush($rh);
flock($rh, LOCK_UN);
fclose($rh);
if ($rates['n'][$who] > 5) {
    reply(429, 'error');
}

// Save once per address.
$file = $dir . '/subscribers.csv';
$fh = @fopen($file, 'c+');
if ($fh === false || !flock($fh, LOCK_EX)) {
    reply(500, 'error');
}
$known = false;
$empty = true;
while (($row = fgetcsv($fh, 0, ',', '"', '')) !== false) {
    $empty = false;
    if (isset($row[1]) && $row[1] === $email) {
        $known = true;
        break;
    }
}
if (!$known) {
    fseek($fh, 0, SEEK_END);
    if ($empty) {
        fputcsv($fh, ['date_utc', 'email', 'site', 'lang'], ',', '"', '');
    }
    // A leading = + - @ would be read as a formula by spreadsheet apps.
    $safe = static fn (string $v): string => preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v;
    fputcsv($fh, [gmdate('Y-m-d H:i:s'), $safe($email), $site, $lang], ',', '"', '');
    fflush($fh);
}
flock($fh, LOCK_UN);
fclose($fh);

reply(200, $known ? 'already' : 'ok');
