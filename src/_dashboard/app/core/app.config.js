(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .value('appRootPath', '//' + window.location.hostname + '/public/less/_dashboard/')
        .value('sysRootPath', '../../../sites/')
        .config(configure)
        .run(run);
    
    
    configure.$inject = ['$httpProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider'];
    run.$inject = ['$rootScope', '$state', '$stateParams'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function configure($httpProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
        // Override the $http service's default content-type for POST requests
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        
        // Override the $http service's default 'transformRequest' method
        $httpProvider.defaults.transformRequest = [function(data) {
            return angular.isObject(data) && String(data) !== '[object File]' ? transformParam(data) : data;
        }];
        
        // Converts an object to x-www-form-urlencoded serialization
        function transformParam(obj) {
            var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
            
            for (name in obj) {
                if (obj.hasOwnProperty(name)) {
                    value = obj[name];
                    
                    if (value instanceof Array) {
                        for (i = 0; i < value.length; i++) {
                            subValue = value[i];
                            fullSubName = name + '[' + i + ']';
                            innerObj = {};
                            innerObj[fullSubName] = subValue;
                            query += transformParam(innerObj) + '&';
                        }
                    } else if (value instanceof Object) {
                        for (subName in value) {
                            if (value.hasOwnProperty(subName)) {
                                subValue = value[subName];
                                fullSubName = name + '[' + subName + ']';
                                innerObj = {};
                                innerObj[fullSubName] = subValue;
                                query += transformParam(innerObj) + '&';
                            }
                        }
                    } else if (value !== undefined && value !== null) {
                        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                    }
                }
            }
            
            return query.length ? query.substr(0, query.length - 1) : query;
        }
        
        
        // Create URL matching object that will match routes with a file path string as the end of the url
        // https://github.com/angular-ui/ui-router/issues/1119#issuecomment-64696060
        $urlMatcherFactoryProvider.type('filePathString', {
            encode: function(val) { return val != null ? val.toString() : val; },
            decode: function(val) { return val != null ? val.toString() : val; },
            is: function(val) { return this.pattern.test(val); },
            pattern: /[^\/]+.*/
        });
        
        // Redirect to the 'index' state by default
        $urlRouterProvider.otherwise('/doc');
        
        var routes = {
            root: {
                abstract: true,
                name: 'root',
                url: '',
                views: {
                    '': {
                        templateUrl: '_dashboard/app/views/root.html',
                        controller: 'RootController as vm'
                    }
                }
            },
            doc: {
                name: 'doc',
                parent: 'root',
                url: '/doc',
                resolve: {
                    sidebarList: ['$http', function($http) {
                        return $http
                            .get('_dashboard/app/data/doc.php')
                            .then(function(response) {
                                return response.data;
                            });
                    }]
                },
                views: {
                    'sidebar@root': {
                        templateUrl: '_dashboard/app/views/sidebar.html',
                        controller: 'SidebarController as vm'
                    }
                }
            },
            docArticle: {
                name: 'doc.article',
                parent: 'doc',
                url: '/{path:filePathString}',
                resolve: {
                    path: ['$stateParams', function($stateParams) {
                        return $stateParams.path;
                    }],
                    content: ['$http', 'path', function($http, path) {
                        return $http
                            .get('_doc/' + path)
                            .then(
                                function(response) {
                                    return response.data;
                                },
                                function() {
                                    return '<div class="alert alert-warning">Could not find <span class="label label-default">' + path + '</span></div>';
                                }
                            );
                    }]
                },
                views: {
                    'body@root': {
                        template: '<div class="app-body-inner" parsed-html="vm.content | trustAsHtml"></div>',
                        controller: 'ArticleController as vm'
                    }
                }
            },
            src: {
                name: 'src',
                parent: 'root',
                url: '/src',
                resolve: {
                    sidebarList: ['$http', function($http) {
                        return $http
                            .get('_dashboard/app/data/src.php')
                            .then(function(response) {
                                return response.data;
                            });
                    }]
                },
                views: {
                    'sidebar@root': {
                        templateUrl: '_dashboard/app/views/sidebar.html',
                        controller: 'SidebarController as vm'
                    }
                }
            },
            srcArticle: {
                name: 'src.article',
                parent: 'src',
                url: '/{path:filePathString}',
                resolve: {
                    path: ['$stateParams', function($stateParams) {
                        return $stateParams.path;
                    }],
                    content: ['$http', 'path', function($http, path) {
                        return $http
                            .get(path)
                            .then(
                                function(response) {
                                    return response.data;
                                },
                                function() {
                                    return '<div class="alert alert-warning">Could not find <span class="label label-default">' + path + '</span></div>';
                                }
                            );
                    }]
                },
                views: {
                    'body@root': {
                        template: '<pre class="app-body-inner" prism="less" prism-data="{{vm.content}}"></pre>',
                        controller: 'ArticleController as vm'
                    }
                }
            }
        };
        
        
        // Setup application states
        $stateProvider
            .state(routes.root)
            .state(routes.doc)
            .state(routes.docArticle)
            .state(routes.src)
            .state(routes.srcArticle);
    }
    
    
    // Make these services globally available on $rootScope
    function run($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    }
    
    
})();