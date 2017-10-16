(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .directive('prism', prismDirective);
    
    
    prismDirective.$inject = ['$compile'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function prismDirective($compile) {
        var directive = {
            link: link,
            restrict: 'A',
            transclude: true,
            scope: {
                language: '@prism',
                source: '@prismData'
            },
            template: '<code></code>'
        };
        
        return directive;
        
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        
        function link(scope, element, attrs, controllers, transclude) {
            // Add the language class for prism to highlight with the correct language syntax
            element.addClass('language-' + scope.language);
            
            // Re-highlight when the 'source' data changes
            scope.$watch('source', function(value) {
                if (value) {
                    element.find('code').html(value);
                    
                    Prism.highlightElement(element.find('code')[0]);
                }
            });
            
            // Handle transcluded content
            transclude(function(clone) {
                if (clone.html() !== undefined) {
                    element.find('code').html(clone.html());
                    
                    Prism.highlightElement(element.find('code')[0]);
                    
                    $compile(element.contents())(scope.$parent);
                }
            });
        }
    }
    
    
})();