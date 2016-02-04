'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolPan
 * @description
 * # wvToolPan
 */
angular.module('webviewer')
  .directive('wvToolPan', function($parse) {
    return {
      scope: false,
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var elementScope = angular.element(element).isolateScope() || scope;
        var IsActivated = $parse(attrs.wvToolPan); // method taking a scope as the param
        
        // @note cornerstoneTools.move is buggy

        scope.$on('viewport:ViewportLoaded', function() {
          _trigger(IsActivated(scope));
        });

        scope.$watch(IsActivated, _trigger);

        function _evtFn(e) {
          var lastX = e.pageX;
          var lastY = e.pageY;
          var mouseButton = e.which;

          var ctrl = this.ctrl;
          e.stopImmediatePropagation()

          $(document).mousemove(function(e) {
            scope.$apply(function() {  // @todo necessary ?
              var deltaX = e.pageX - lastX; 
              var deltaY = e.pageY - lastY;
              lastX = e.pageX;
              lastY = e.pageY;

              if (mouseButton == 1) { // left-click + move -> windowing
                var strategy = {
                  execute: function (viewport) {
                    var scale = viewport.scale;
                    viewport.translation.x = +viewport.translation.x + (this.deltaX / scale);
                    viewport.translation.y = +viewport.translation.y + (this.deltaY / scale);
                    return viewport;
                  },
                  deltaX: deltaX,
                  deltaY: deltaY
                };

                ctrl.setViewport(strategy);
              }
            });
          });
          $(document).mouseup(function(e) {
            // @todo make safer
            $(document).unbind('mousemove');
            $(document).unbind('mouseup');
          });
        }

        function _trigger(activate) {
          if (typeof activate === 'undefined') return;
          
          if (activate) {
            elementScope.$broadcast('viewport:ListenDomEvent', {
              evt: 'mousedown',
              fn: _evtFn
            });
          }
          else {
            elementScope.$broadcast('viewport:UnlistenDomEvent', {
              evt: 'mousedown',
              fn: _evtFn
            });
          }
        }
      }
    };
  });
