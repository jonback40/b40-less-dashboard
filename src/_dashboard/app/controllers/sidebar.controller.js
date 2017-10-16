(function() {
    
    
    'use strict';
    
    
    angular
        .module('app')
        .controller('SidebarController', SidebarController);
    
    
    SidebarController.$inject = ['$state', 'sidebarList'];
    
    
    // ----------------------------------------------------------------------------------------------------
    
    
    function SidebarController($state, sidebarList) {
        var vm = this;
        
        vm.list = sidebarList;
    }
    
    
})();