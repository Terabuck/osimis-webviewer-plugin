'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvOverlay
 * @description
 * # wvOverlay
 */
angular.module('osimiswebviewerApp')
.directive('wvOverlay', [function() {
  return {
    scope: false,
    priority: 98,
    template: '<div class="wv-overlay">\
                  <div class="wv-overlay-topleft">\
                      PatientName: {{$instance.PatientName}}<br/>\
                      PatientId: {{$instance.PatientID}}\
                  </div>\
                  <div class="wv-overlay-topright">\
                      StudyDescription: {{$instance.StudyDescription}}<br/>\
                      StudyDate: {{$instance.StudyDate}}\
                  </div>\
                  <div class="wv-overlay-bottomright">\
                      zoom: {{$render.zoom}}<br/>\
                      ww/wc: {{$render.ww}}/{{$render.wc}}\
                  </div>\
                  <div class="wv-overlay-bottomleft">\
                      {{$instance.InstanceNumber}}<span ng-show="$serie">/{{$serie.InstanceCount}}</span><br/>\
                  </div>\
              </div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.$on('instance-loaded', function(evt, tags) {
        scope.$instance = tags;
      });
      scope.$on('serie-loaded', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
      });
    }
  };
}]);
