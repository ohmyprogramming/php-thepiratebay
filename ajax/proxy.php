<?php

/*
 * Copyright (C) 2022 ohmyprogramming <github.com/ohmyprogramming>
 *
 * This script acts as a proxy for AJAX requests through the app which then get
 * routed to The Pirate Bay as if they were coming from a legitimate user.
 *
 * The reason we need this file is because of Cross-Origin Resource Sharing (CORS) rules.
 *
 * Our website cannot send requests cross-domain as TPB blocks it, so we make
 * those requests in the backend. They see it as if a real user was visiting.
 */

/*
 * Requirements:
 *   - Working TPB Host/Mirror
 *   - PHP with cURL enabled
 */

/* Make sure cURL is enabled */
if (!function_exists("curl_init")) {
    $msg = "<!--proxyerror--><h1>Error</h1><p>Proxy server is not configured. cURL must be enabled for it to work.</p>";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n", FILE_APPEND);
    echo $msg;
    die;
}

/* Enabling this will print_r() the $curl_handle to show information. */
/* Only enable it if there are issues with proxy and you wanna debug. */
$debug = false;

const DS = DIRECTORY_SEPARATOR;
$error_log_dir = __DIR__ . DS . ".." . DS . "logs" . DS;

/* All queries will be made using GET request, and never POST (in this case) */
$search = (string) $_GET["search"] ?? null;
$page = (int) intval($_GET["page"] ?? 0);

/* Page can't be negative */
if (0 > $page)
    $page = -$page;

$search = trim($search);

if ($search == null) {
    $msg = "<!--proxyerror--><h1>Error</h1><p><b>search</b> parameter must not be empty.</p>";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n", FILE_APPEND);
    echo $msg;
    die;
}

$default_url = "https://thepiratebay.party/search/$search/$page/99/0";

$default_headers = array(
    "accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language: en",
    "cache-control: no-cache",
    "pragma: no-cache",
    "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
    "connection: close"
);

/* Prepare cURL */
$curl_handle = curl_init();

curl_setopt_array($curl_handle, array(
    CURLOPT_CUSTOMREQUEST    => "GET",
    CURLOPT_URL              => $default_url,
    CURLOPT_SSL_VERIFYHOST   => false,
    CURLOPT_SSL_VERIFYPEER   => false,
    CURLOPT_SSL_VERIFYSTATUS => false,
    CURLOPT_HEADER           => false,
    CURLOPT_RETURNTRANSFER   => true, /* true to return the transfer as a string of the return value of curl_exec() instead of outputting it directly. */
    CURLOPT_HTTPHEADER       => $default_headers
));

$curl_exec = curl_exec($curl_handle);
$curl_info = curl_getinfo($curl_handle);
$curl_errno = curl_errno($curl_handle);
curl_close($curl_handle);
$http_code = $curl_info["http_code"];
$response_size = $curl_info["size_download"];

/* Error checks */
if ($curl_errno) {
    $msg = "<!--proxyerror--><h1>Error</h1><p>Error occured in the cURL handle. Check server logs for more information.</p>";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n");
    echo $msg;
    die;
}

if ($http_code == 404) {
    $msg = "<!--proxyerror--><h1>Error</h1><p>Requested Host returned 404 Not Found. This may be due to exceeding the page number or an issue with the host.";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n");
    echo $msg;
    die;
}

if ($http_code != 200) {
    $msg = "<!--proxyerror--><h1>Error</h1><p>Requested Host returned HTTP Response code: $http_code</p>";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n");
    echo $msg;
    die;
}

if (empty($response_size) || $response_size == 0) {
    $msg = "<!--proxyerror--><h1>Error</h1><p>Requested Host returned empty response.</p>";
    file_put_contents(__DIR__ . "/../logs/messages.log", "[" . time() . "] " . $msg . "\n");
    echo $msg;
    die;
}

/* Print the information and bail */
if ($debug) {
    echo "<pre>";
    print_r( $curl_info );
    echo "</pre>";
} else {
    echo $curl_exec;
}

die;

?>