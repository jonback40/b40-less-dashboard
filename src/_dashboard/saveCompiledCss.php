<?php

if ($_SERVER['HTTP_X_FORWARDED_FOR'] !== '24.249.97.216') {
    die('Invalid Network Access for: ' . $_SERVER['REMOTE_ADDR']);
}

// Required POST params
$params = array('site', 'template', 'outputFile', 'content');

// Make sure our params are available and not empty before we do anything
foreach ($params as $param) {
    if (empty($_POST[$param])) {
        output('error', 'Invalid POST params.');
        exit;
    }
}


// Build path to write to our output file
$path = $_SERVER['DOCUMENT_ROOT'] . 'sites/' . $_POST['site'] . '/templates/' . $_POST['template'] . '/css/' . $_POST['outputFile'];

// Open and write new CSS to our output file
if ($file = fopen($path, 'w')) {
    fwrite($file, $_POST['content']);
    fclose($file);
    
    output('success');
} else {
    output('error', 'Saving CSS to the server failed.');
}


// ----------------------------------------------------------------------------------------------------


// Return JSON encoded string
function output($status, $message = '') {
    echo json_encode(array(
        'status' => $status,
        'message' => $message
    ));
}

?>
