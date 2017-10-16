(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .controller('RootController', RootController);
    
    
    RootController.$inject = ['$rootScope', '$timeout', 'compiler'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function RootController($rootScope, $timeout, compiler) {
        var vm = this;
        
        // flags
        vm.isLoading                = false;
        vm.isCompiling              = false;
        vm.isConfiguring            = false;
        
        vm.dialogActive             = false;
        vm.sidebarActive            = false;
        vm.receiptActive            = false;
        
        // properties
        vm.configParams             = angular.copy(compiler.settings());
        vm.selectedSite             = '';
        vm.selectedTemplate         = '';
        vm.compilerMeta             = null;
        vm.compilerOutput           = '';
        
        // functions
        vm.compile                  = compile;
        vm.dismissConfig            = dismissConfig;
        vm.openConfig               = openConfig;
        vm.saveAndDismissConfig     = saveAndDismissConfig;
        vm.toggleSidebar            = toggleSidebar;
        
        
        // Handle state change events
        $rootScope.$on('$stateChangeStart', _onStateChangeStart);
        $rootScope.$on('$stateChangeSuccess', _onStateChangeSuccess);
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        // Close the config dialog box without updating anything
        function dismissConfig() {
            angular.extend(vm.configParams, compiler.settings());
            
            vm.isConfiguring = false;
            vm.dialogActive = false;
        }
        
        
        // Open dialog box to edit compiler config
        function openConfig() {
            vm.isConfiguring = true;
            vm.dialogActive = true;
        }
        
        
        // Update compiler config and close the config dialog box
        function saveAndDismissConfig(event) {
            // This function may also be called when the user presses the 'enter' key while focused in a text field
            if (event && event.which !== 13) { // 13 is the key code for the 'enter' key
                return;
            }
            
            // Register site settings and dismiss 
            compiler.register(vm.configParams).then(
                function(response) {
                    dismissConfig();
                    
                    // Update properties that pertain to the "compiler receipt"
                    vm.compilerMeta = response;
                    vm.compilerOutput = '';
                    vm.receiptActive = true;
                    
                    // Update 'selectedSite' label based on available data (either the response or the 'sitename' from the config params)
                    vm.selectedSite = ((response && response.Project) || compiler.get('sitename'));
                    vm.selectedTemplate = compiler.get('template');
                },
                function(response) {
                    alert(response);
                }
            );
        }
        
        
        // Begin compiling operation
        function compile() {
            // Open the 'config' dialog box if we don't have a sitename yet.
            if (compiler.get('sitename') === '') {
                openConfig();
                
                return;
            }
            
            // Clear compiler output results and set the 'isCompiling' status
            vm.compilerOutput = '';
            vm.dialogActive = true;
            vm.isCompiling = true;
            
            // The compiling process can be memory intensive and may push the limits of your browser. As an attempt to prevent
            // the screen from freezing, we wait for a moment to allow the loading screen to get into place before we start.
            // However, this doesn't mean it won't still freeze the screen until its done (mainly happens in Chrome).
            $timeout(function() {
                // Start
                compiler.start()
                    .then(
                        function(response) {
                            vm.compilerOutput = '<div class="alert alert-success"><h4 class="alert-title">' + response.title + '</h4>' + response.message + '</div>';
                        },
                        function(response) {
                            vm.compilerOutput = '<div class="alert alert-danger"><h4 class="alert-title">' + response.title + '</h4>' + response.message + '</div>';
                        }
                    )
                    .finally(
                        function() {
                            vm.dialogActive = false;
                            vm.isCompiling = false;
                            vm.receiptActive = true;
                        }
                    );
            }, 350); // 350ms corresponds to the CSS animation-duration being used on the dialog box
        }
        
        
        // Toggle sidebar visibility
        function toggleSidebar() {
            vm.sidebarActive = !vm.sidebarActive;
        }
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        // Handle state change 'start' events
        function _onStateChangeStart() {
            vm.isLoading = true;
        }
        
        
        // Handle state change 'success' events
        function _onStateChangeSuccess(event, toState, toParams, fromState, fromParams) {
            vm.isLoading = false;
            
            // Do not dismiss the sidebar if we are only changing the top level route between 'doc' and 'src'
            if (toState.name !== 'doc' && toState.name !== 'src') {
                vm.sidebarActive = false;
            }
        }
    }
    
    
})();