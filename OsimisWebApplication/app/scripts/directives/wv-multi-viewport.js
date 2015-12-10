'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvMultiViewport
 * @description
 * # wvMultiViewport
 */
angular.module('osimiswebviewerApp')
  .directive('wvMultiViewport', function () {
    return {
      template: '\
	    <div class="container-fluid" style="height: 100%; padding: 0;">\
	        <div class="row" style="height: 50%; padding: 0; margin: 0;">\
	            <div class="col-sm-6" wv-viewport-size style="height: 100%; padding: 0;">\
	                <wv-serie-viewport wv-width="\'parent\'" wv-height="\'parent\'" wv-serie-id="\'5a45bfac-36d99323-bea29308-f7082c12-ee76150b\'" wv-instance-index="ctrl.instanceIndex">\
	                    <wv-overlay></wv-overlay>\
	                </wv-serie-viewport>\
	            </div>\
	            <div class="col-sm-6" wv-viewport-size style="height: 100%; padding: 0;">\
	                <wv-serie-viewport wv-width="\'parent\'" wv-height="\'parent\'" wv-serie-id="\'5a45bfac-36d99323-bea29308-f7082c12-ee76150b\'" wv-instance-index="ctrl.instanceIndex">\
	                    <wv-overlay></wv-overlay>\
	                </wv-serie-viewport>\
	            </div>\
	        </div>\
	        <div class="row" style="height: 50%; padding: 0; margin: 0;">\
	            <div class="col-sm-6" wv-viewport-size style="height: 100%; padding: 0;">\
	                <wv-serie-viewport wv-width="\'parent\'" wv-height="\'parent\'" wv-serie-id="\'5a45bfac-36d99323-bea29308-f7082c12-ee76150b\'" wv-instance-index="ctrl.instanceIndex">\
	                    <wv-overlay></wv-overlay>\
	                </wv-serie-viewport>\
	            </div>\
	            <div class="col-sm-6" wv-viewport-size style="height: 100%; padding: 0;">\
	                <wv-serie-viewport wv-width="\'parent\'" wv-height="\'parent\'" wv-serie-id="\'7d102e10-d12c3835-aba16eed-fe8375b0-a4c55f35\'" wv-instance-index="ctrl.instanceIndex">\
	                    <wv-overlay></wv-overlay>\
	                </wv-serie-viewport>\
	            </div>\
	        </div>\
	    </div>\
	  ',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      }
    };
  });
