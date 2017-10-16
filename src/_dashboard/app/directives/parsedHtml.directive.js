(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .directive('parsedHtml', parsedHtmlDirective);
    
    
    parsedHtmlDirective.$inject = ['$compile'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function parsedHtmlDirective($compile) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        
        return directive;
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        function link(scope, element, attrs) {
            scope.$watch(attrs.parsedHtml, function(value) {
                element.html(value);
                
                $compile(element.contents())(scope);
            });
        }
    }
    
    
})();