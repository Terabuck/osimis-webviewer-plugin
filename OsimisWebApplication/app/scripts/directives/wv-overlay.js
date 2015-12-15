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
    transclude: 'true',
    template: '<div class="wv-overlay"><ng-transclude>\
                <div class="wv-overlay-topleft">\
                    {{$instance.PatientName}}<br/>\
                    {{$instance.PatientID}}\
                </div>\
                <div class="wv-overlay-topright">\
                    {{$instance.StudyDescription}}<br/>\
                    {{$instance.StudyDate}}<br/>\
                    #{{$instance.SeriesNumber}} - {{$instance.SeriesDescription}}<br/>\
                </div>\
                <!--\
                <div class="wv-overlay-bottomright">\
                    zoom: {{$viewport.scale|number:2}}<br/>\
                    ww/wc: {{$viewport.voi.windowWidth|number:0}}/{{$viewport.voi.windowCenter|number:0}}\
                </div>\
                <div class="wv-overlay-bottomleft">\
                    {{$instance.InstanceNumber}}<span ng-show="$serie">/{{$serie.InstanceCount}}</span><br/>\
                </div>\
                -->\
                <div style="position: absolute; bottom:0; left:0; height: 2px; background-color: red;" ng-style="{\
                  width: nbWidth\
                }">\
                  <div style="position: absolute; left: 0px; top:calc(-1em - 5px); height: 1em; color: red; font-size: 0.8em;">\
                    {{$instance.InstanceNumber}}<span ng-show="$serie">/{{$serie.InstanceCount}}</span><br/>\
                  </div>\
                </div>\
              </ng-transclude></div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      scope.$on('instance-data', function(evt, tags) {
        scope.$instance = tags;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('serie-data', function(evt, tags, instanceCount) {
        scope.$serie = tags;
        scope.$serie.InstanceCount = instanceCount;
        if (scope.$serie && scope.$serie.InstanceCount && scope.$instance && scope.$instance.InstanceNumber)
          scope.nbWidth = 100/scope.$serie.InstanceCount * scope.$instance.InstanceNumber + '%';
      });
      scope.$on('viewport-data', function(evt, viewport) {
        scope.$viewport = viewport;
      });
    }
  };
}]);
