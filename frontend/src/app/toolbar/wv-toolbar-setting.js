'use strict';

/**
 * @ngdoc directive
 * @name webviewer.directive:wvToolbarSetting
 * @description
 * # wvToolbarSetting
 */
angular.module('webviewer')
.directive('wvToolbarSetting', function (_) {
return {
  scope: true,
  templateUrl: 'app/toolbar/wv-toolbar-setting.tpl.html',
  restrict: 'E',
  link: function postLink(scope, element, attrs) {
    scope.wvName = attrs.wvName;
    scope.wvIcon = attrs.wvIcon;
    scope.wvChoices = _.map(scope.$eval(attrs.wvChoices), function(value, label) {
      return {
        value: value,
        label: label
      };
    });
  }
};
});
