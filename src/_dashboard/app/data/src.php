<?php

$app_path = $_SERVER['DOCUMENT_ROOT'] . 'public/less';
$list = buildList($app_path);
$list_mapped = array_map('applyPermalinks', $list);

echo json_encode($list_mapped);


// ----------------------------------------------------------------------------------------------------


// Map each item in an array to have its 'title' attribute converted into a 'permalink'
function applyPermalinks($item) {
    // Set permalink (same as title)
    if (isset($item['title'])) {
        $item['permalink'] = strtolower($item['title']);
    }
        
    // Recursively operate on nested items
    if (isset($item['children'])) {
        $item['children'] = array_map('applyPermalinks', $item['children']);
    }
    
    return $item;
}


// Build list to output
function buildList($path, $path_name = 'root') {
    global $app_path;
    
    $scanned = scandir($path);
    $list = array();
    
    // If $scanned is an actual directory...
    if ($scanned) {
        // Create new item to insert into the list
        $new_item = mapToItem($path_name);
        
        // Collect .less files, if any, and add them to the new item as 'children'
        $less_files = array_filter($scanned, 'filterLessFiles');
        $new_item['children'] = array_map('mapToItem', array_values($less_files));
        
        // For nested items, we include an additional 'path' attribute
        if ($app_path !== $path) {
            $len = count($new_item['children']);
            
            for ($i = 0; $i < $len; $i++) {
                $new_item['children'][$i]['path'] = str_replace($app_path . '/', '', $path);
            }
        }
        
        // Recursively create nested lists for nested directories
        $directories = array_filter($scanned, 'filterDirectories');
        
        foreach ($directories as $dir) {
            // Recursive calls need to remove the outer array by using [0]
            $new_dir = buildList($path . '/' . $dir, $dir)[0];
            
            if ($path_name === 'root') {
                array_push($list, $new_dir);
            } else {
                array_push($new_item['children'], $new_dir);
            }
        }
        
        // Push finalized new item into list
        array_push($list, $new_item);
    }
    
    return $list;
}


// Return array of directories (filenames with no extension)
function filterDirectories($item) {
    $fileparts = pathinfo($item);
    
    // Specifically discard the 'fonts' directory
    if ($item === 'fonts') {
        return false;
    }
    
    if (isProtected($item)) {
        return false;
    }
    
    // No extension suggests this is a directory
    return !array_key_exists('extension', $fileparts);
}


// Return array of filenames ending with .less extension
function filterLessFiles($item) {
    $fileparts = pathinfo($item);
    
    if (isProtected($item) || !array_key_exists('extension', $fileparts)) {
        return false;
    }
    
    return $fileparts['extension'] === 'less';
}


// Return true if the filename follows a naming convention suggesting "hidden" or "private" files
function isProtected($filename) {
    return (strpos($filename, '.') === 0) || (strpos($filename, '_') === 0);
}


// Return associate array with default title attribute (used as default array item)
function mapToItem($item) {
    return array('title' => $item);
}

?>