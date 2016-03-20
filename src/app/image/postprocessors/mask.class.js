(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVMask', WVMask);

    /* @ngInject */
    function WVMask() {
    	
    	function Mask() {

    	}

    	return Mask;
    }
})();