(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .controller('ArticleController', ArticleController);
    
    
    ArticleController.$inject = ['path', 'content'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function ArticleController(path, content) {
        var vm = this;
        
        vm.path = path;
        vm.content = content;
    }
    
    
})();