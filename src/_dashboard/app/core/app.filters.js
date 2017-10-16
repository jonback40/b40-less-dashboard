(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .filter('trustAsHtml', trustAsHtmlFilter);
    
    
    trustAsHtmlFilter.$inject = ['$sce'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    // Return safe HTML
    function trustAsHtmlFilter($sce) {
        return function(input) {
            return $sce.trustAsHtml(input);
        };
    }
    
    
})();