(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .value('compilerSettings', defaults())
        .factory('compiler', compiler);
    
    
    compiler.$inject = ['$http', '$interpolate', '$q', '$window', 'appRootPath', 'sysRootPath', 'compilerSettings'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function compiler($http, $interpolate, $q, $window, appRootPath, sysRootPath, compilerSettings) {
        var lessPath = $interpolate('/sites/{{sitename}}/templates/{{template}}/css/less/'),
            inputPath = $interpolate('{{sitename}}/templates/{{template}}/css/less/{{inputFile}}'),
            outputPath = $interpolate('{{sitename}}/templates/{{template}}/css/{{outputFile}}'),
            destinationPath = $interpolate('/sites/{{sitename}}/templates/{{template}}/css/{{outputFile}}');
        
        var service = {
            get:        get,
            fetch:      fetch,
            metadata:   metadata,
            minify:     minify,
            register:   register,
            render:     render,
            reset:      reset,
            save:       save,
            settings:   settings,
            start:      start
        };
        
        return service;
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        // Return a single property value from 'compilerSettings'
        function get(key) {
            return compilerSettings.hasOwnProperty(key) ? compilerSettings[key] : 'undefined';
        }
        
        
        // Fetch the compiler file from the server
        function fetch() {
            var params = settings(),
                query = '?' + (new Date()).getTime(),
                url = sysRootPath + inputPath(params) + query;
            
            return $http.get(url);
        }
        
        
        // Parse 'data' for [@key: value] pairs and return as a "metadata" object
        function metadata(data) {
            var matches = data.match(/(?!\/\/\s*)@[\w-_]+:\s*.*/gm),
                params = {};
            
            // Map 'matches' array to 'params' object
            if (matches) {
                angular.forEach(matches, function(value) {
                    var declaration = value.split(':'),
                        
                        paramKey = declaration.shift(),
                        paramValue = declaration.join(''),
                        
                        sanitizedKey = _sanitizeHeaderKey(paramKey),
                        sanitizedValue = _sanitizeHeaderValue(paramValue);
                    
                    params[sanitizedKey] = sanitizedValue;
                });
                
                return params;
            } else {
                return null;
            }
        }
        
        
        // Use the YUI.Compressor library to minify our CSS
        function minify(css) {
            return YAHOO.compressor.cssmin(css);
        }
        
        
        // Validate that the given 'params' object contains valid files and file paths to work with, then
        // update 'compilerSettings' with the new 'params'
        function register(params) {
            var deferred = $q.defer();
            
            // Get urls to validate
            var query = '?' + (new Date()).getTime(),
                inputUrl = sysRootPath + inputPath(params) + query,
                outputUrl = sysRootPath + outputPath(params) + query;
            
            // 1 - Make sure the input file exists
            $http.get(inputUrl).then(
                function(response) {
                    // Parse the compiler file for project metadata
                    var meta = metadata(response.data);
                    
                    // 2 - Make sure the output file exists
                    $http.get(outputUrl).then(
                        function() {
                            // Update 'compilerSettings' with new property values
                            settings(params);
                            
                            deferred.resolve(meta);
                        },
                        function() {
                            deferred.reject('Output file not found.');
                        }
                    );
                },
                function() {
                    deferred.reject('Input file not found.');
                }
            );
            
            return deferred.promise;
        }
        
        
        // Use global 'less' object from less.js to render LESS into CSS
        function render(data, sitepathTokenReplacement) {
            // Aggressively bust the cache to prevent nested @imports from being cached
            $window.localStorage.clear();
            $window.sessionStorage.clear();
            
            // Interpolate @{SITE_PATH} tokens to properly import local LESS files for the site
            data = data.replace(/\@\{SITE_PATH\}/g, sitepathTokenReplacement);
            
            // Clear the console for a lengthy output of logged @imports (lolll...)
            console.clear();
            console.log('Compiling LESS... (cleared console)');
            
            // Use the global 'less' object from less.js to render everything into CSS
            return less.render(data, {
                env: 'development',
                useFileCache: false
            });
        }
        
        
        // Revert 'compilerSettings' back to its default values, then return 'compilerSettings'
        function reset() {
            return settings(defaults());
        }
        
        
        // Save compiled CSS to the server
        function save(data) {
            var query = '?' + (new Date()).getTime(),
                url = appRootPath + 'saveCompiledCss.php' + query,
                params = {
                    site:       get('sitename'),
                    template:   get('template'),
                    outputFile: get('outputFile'),
                    content:    (data.css || '')
                };
            
            return $http.post(url, params);
        }
        
        
        // Update properties of 'compilerSettings' by extending it with the given 'data' object, then return 'compilerSettings'
        function settings(data) {
            if (data) {
                angular.extend(compilerSettings, data);
            }
            
            return compilerSettings;
        }
        
        
        // Start the compiling operation
        function start() {
            var deferred = $q.defer();
            
            // 1 - Fetch the input file from the server
            fetch().then(
                function(response) {
                    var path = lessPath(settings());
                    
                    // 2 - Render LESS into CSS
                    render(response.data, path).then(
                        function(response) {
                            // Minify the CSS
                            if (get('minify') === true) {
                                response.css = minify(response.css);
                            }
                            
                            // 3 - Save the compiled CSS to the output file on the server
                            save(response).then(
                                function(response) {
                                    if (response.data.status === 'success') {
                                        deferred.resolve({
                                            title: 'Completed',
                                            message: 'CSS saved to:<pre>' + destinationPath(settings()) + '</pre>'
                                        });
                                    } else {
                                        console.log(response.data);
                                        
                                        // FAIL
                                        deferred.reject({
                                            title: 'Saving CSS to the server failed',
                                            message: 'You may need to set file permissions for your <strong>output file</strong> to <span class="label label-default">777</span>'
                                        });
                                    }
                                },
                                function(response) {
                                    // FAIL
                                    deferred.reject({
                                        title: 'Could not save to server',
                                        message: 'Connection time out:<pre>' + response.config.url + '</pre>'
                                    });
                                }
                            );
                        },
                        function(response) {
                            var filename = response.filename.split('/').splice(-1)[0].split('?')[0],
                                extract = response.extract.filter(Boolean);
                            
                            // FAIL
                            deferred.reject({
                                title: 'Less.js ' + response.type + ' Error',
                                message: response.message + ' in ' + filename + ' on <span class="label label-default">line ' + response.line + '</span><br><br><pre>' + extract.join('<br>') + '</pre>'
                            });
                        }
                    );
                },
                function(response) {
                    var sitename = get('sitename'),
                        urlParts = response.config.url.split(sitename),
                        url = urlParts[0] + sitename + urlParts[1];
                    
                    // FAIL
                    deferred.reject({
                        title: 'Failed to load compiler file',
                        message: 'File not found:<pre>' + url + '</pre>'
                    });
                }
            );
            
            return deferred.promise;
        }
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        // Return sanitized header key
        function _sanitizeHeaderKey(key) {
            key = key.replace(/@/, ''); // remove the @ symbol
            key = key.replace(/-/, ' '); // replace dashes with spaces
            key = key.charAt(0).toUpperCase() + key.slice(1); // capitalize the first letter
            
            return key;
        }
        
        
        // Return sanitized header value
        function _sanitizeHeaderValue(value) {
            value = value.replace(/^\s+|\s+$/g, ''); // trim leading and trailing spaces
            
            return value;
        }
    }
    
    
    // Return an object containing default compiler params
    function defaults() {
        return {
            sitename:       '',
            template:       'default',
            inputFile:      'compiler.less',
            outputFile:     'style.min.css',
            minify:         true,
        };
    }
    
    
})();
