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
                      zoom: {{$viewport.scale|number:2}}<br/>\
                      ww/wc: {{$viewport.voi.windowWidth|number:0}}/{{$viewport.voi.windowCenter|number:0}}\
                  </div>\
                  <div class="wv-overlay-bottomleft">\
                      {{$instance.InstanceNumber}}<span ng-show="$serie">/{{$serie.InstanceCount}}</span><br/>\
                  </div>\
              </div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.$on('instance-data', function(evt, tags) {
        scope.$instance = tags;
      });
      scope.$on('serie-data', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
      });
      scope.$on('viewport-data', function(evt, viewport) {
        scope.$viewport = viewport;
      });
    }
  };
}]);
