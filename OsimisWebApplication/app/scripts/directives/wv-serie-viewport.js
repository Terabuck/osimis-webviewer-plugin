'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvSerieViewport
 * @description
 * # wvSerieViewport
 */
angular.module('osimiswebviewerApp')
.directive('wvSerieViewport', function() {
return {
    scope: {
      'wvSerieId': '=',
      'wvImageIndex': '=?'
    },
    template: '<div><wv-image-viewport wv-image-id="imageId"></wv-image-viewport></div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      if (scope.wvImageIndex === null  || typeof scope.wvImageIndex === 'undefined') {
        scope.wvImageIndex = 0;
      }

      scope.imageId = null;
      
      var instances = [];
      
      $.ajax({
        // @todo: use angular ajax + specific injected service
        type: 'GET',
        url: _orthancApiUri + '/series/' + scope.wvSerieId,
        dataType: 'json',
        cache: false,
        async: false,
        success: function(volume) {
          if (volume.Instances.length != 0) {
            instances = volume.Instances;

            if (scope.wvImageIndex >= instances.length) {
              scope.wvImageIndex = instances.length - 1;
            }
            scope.imageId = instances[scope.wvImageIndex];
          }
          
          scope.$watch('wvImageIndex', function(wvImageIndex) {
            // @todo refactor duplicate code but avoid recursive $watch call ! 
            if (wvImageIndex === null || typeof wvImageIndex === 'undefined') {
              wvImageIndex = 0;
            }
            else if (wvImageIndex >= instances.length) {
              wvImageIndex = instances.length - 1;
            }

            scope.imageId = instances[wvImageIndex];
          });
        }
      });
      
      // Hamster = cross browser mousewheel library
      Hamster(element[0]).wheel(function(event, delta, deltaX, deltaY) {
        // @todo put some velocity
        scope.$apply(function() {
          if (deltaX > 0) {
            scope.wvImageIndex++;
            if (scope.wvImageIndex >= instances.length) {
              scope.wvImageIndex = instances.length - 1;
            }
          }
          else if (deltaX < 0) {
            scope.wvImageIndex--;
            if (scope.wvImageIndex < 0) {
              scope.wvImageIndex = 0;
            }
          }
        });

        event.preventDefault();
      });

    }
};
});
