(function() {
    'use strict';

    angular
        .module('webviewer')
        .factory('WVColorMaskPostProcessor', WVColorMaskPostProcessor);

    /* @ngInject */
    function WVColorMaskPostProcessor() {
    	// needs data
        function ColorMask() {

        }

        ColorMask.prototype.execute = function(pixelObject) {
        	// @todo postprocess
        	return pixelObject;
        };

        return ColorMask;
    }
})();