!function(){"use strict";function a(){try{throw new Error}catch(a){var b=a.stack.split("\n"),c=0;for(var d in b)if(b[d].match(/(?:resource|file|https?):\/\//)){c=Number(d)+2;break}var e=b[c].match(/((?:resource|file|https?):\/\/(?:[\da-z\.:-])+)\/?.*\.js/);return e[1]}}var b="0.1.6";angular.module("webviewer",["ngResource","ngSanitize","mgcrea.ngStrap","ngRangeFilter"]).provider("wvConfig",function(){var c=a(),d={version:b,orthancApiURL:c,webviewerApiURL:c+"/web-viewer",defaultCompression:"jpeg95"};this.setApiURL=function(a){"/"===a.substr(-1)&&(a=a.substr(0,a.length-1)),d.orthancApiURL=a,d.webviewerApiURL=a+"/web-viewer"},this.$get=function(){return d}})}(),angular.module("webviewer").factory("orthancApiService",["$resource","$cacheFactory","wvConfig",function(a,b,c){var d=b("osimis-webviewer");return{serie:a(c.orthancApiURL+"/series/:id",{id:"@id"},{get:{method:"GET",cache:d},listInstances:{method:"GET",url:c.orthancApiURL+"/series/:id/ordered-slices",cache:d}}),instance:a(c.webviewerApiURL+"/instances/:compression-:id",{compression:c.defaultCompression,id:"@id"},{getTags:{method:"GET",url:c.orthancApiURL+"/instances/:id/simplified-tags",cache:d},getImage:{method:"GET",url:c.webviewerApiURL+"/instances/:compression-:id"}}),study:a(c.orthancApiURL+"/studies/:id",{id:"@id"})}}]),angular.module("webviewer").run(["orthancApiService",function(a){function b(a,b,c,d,e){for(var f=(e-c)/(d-b),g=c-f*b,h=0,i=a.length;i>h;h++)a[h]=f*a[h]+g}function c(a){for(var b=new ArrayBuffer(a.length),c=new Uint8Array(b),d=0,e=a.length;e>d;d++)c[d]=a.charCodeAt(d);return c}function d(){switch(this.Orthanc.Compression){case"Deflate":return e(this);case"Jpeg":return f(this);default:throw new Error("unknown compression")}}function e(a){var b=pako.inflate(window.atob(a.Orthanc.PixelData)),c=null;if(a.color){var d=new ArrayBuffer(b.length/3*4);c=new Uint8Array(d);for(var e=0,f=0,g=b.length;g>f;f+=3)c[e++]=b[f],c[e++]=b[f+1],c[e++]=b[f+2],c[e++]=255}else{var d=new ArrayBuffer(2*b.length);c=new Int16Array(d);for(var e=0,f=0,g=b.length;g>f;f+=2){var h=b[f],i=b[f+1];c[e]=h+256*i,e++}}return c}function f(a){var d=new JpegImage,e=c(window.atob(a.Orthanc.PixelData));d.parse(e);var f=d.getData(a.width,a.height),g=null;if(a.color){var h=new ArrayBuffer(f.length/3*4);g=new Uint8Array(h);for(var i=0,j=0,k=f.length;k>j;j+=3)g[i++]=f[j],g[i++]=f[j+1],g[i++]=f[j+2],g[i++]=255}else{var h=new ArrayBuffer(2*f.length);g=new Int16Array(h);for(var i=0,j=0,k=f.length;k>j;j++)g[i]=f[j],i++;a.Orthanc.Stretched&&b(g,0,a.Orthanc.StretchLow,255,a.Orthanc.StretchHigh)}return g}cornerstone.registerImageLoader("",function(b){return a.instance.getImage({id:b}).$promise.then(function(a){return a.imageId=b,a.color?a.render=cornerstone.renderColorImage:a.render=cornerstone.renderGrayscaleImage,a.getPixelData=_.memoize(d),a})})}]),angular.module("webviewer").directive("wvViewport",["$q","orthancApiService",function(a,b){return{scope:{wvInstance:"=?",wvWidth:"=?",wvHeight:"=?",wvEnableOverlay:"=?"},transclude:!0,templateUrl:"scripts/viewport/wv-viewport.tpl.html",restrict:"E",replace:!1,link:function(c,d,e){function f(a,b){n&&($(window).off("resize",n),n=null);var e,f,h=a[0],i=a[1];if((null===h||void 0==h)&&(h="auto"),(null===i||void 0==i)&&(i="auto"),"auto"===h&&"auto"===i){if(!k)return;e=k.width,f=k.height}else if("auto"!==h&&"auto"===i){if(!k)return;var j=h,l=k.width/k.height;e=k.width<j?k.width:j,f=Math.round(e*(1/l))}else if("auto"===h&&"auto"!==i){if(!k)return;var m=i,l=k.width/k.height;f=k.height<m?k.height:m,e=Math.round(f*l)}else if("tag"===h&&"tag"===i){var o=d.closest("[wv-size-tag]");if(!o.length)return;e=o.width(),f=o.height(),n=_.debounce(function(){e=o.width(),f=o.height();g(e,f)},10),$(window).on("resize",n),c.$on("$destroy",function(){n&&($(window).off("resize",n),n=null)})}else e=h,f=i;g(e,f)}function g(a,b){var c;if(h.width(a),h.height(b),k){var d=k.width>a||k.height>b;return d?(cornerstone.resize(i,!0),c=cornerstone.getViewport(i)):(cornerstone.resize(i,!1),c=cornerstone.getViewport(i),c.scale=1,cornerstone.setViewport(i,c)),c}}var h=d.children(".wv-cornerstone-enabled-image"),i=h[0];cornerstone.enable(i);var j=0;h.on("CornerstoneImageRendered",function(a,b){j++,c.$evalAsync(function(){})}),c.$watch(function(){return j},function(a){if(a){var b=cornerstone.getViewport(i);c.$broadcast("viewport:ViewportChanged",b)}});var k=null,l=!1,m=!1;"undefined"==typeof c.wvEnableOverlay&&(c.wvEnableOverlay=!0),c.wvInstance=c.wvInstance||{},c.$watch("wvInstance",function(a){"object"!=typeof a&&(c.wvInstance={id:a})}),c.$on("viewport:GetInstanceData",function(a,b){b(c.wvInstance.tags)}),c.$on("viewport:SetInstance",function(a,b){l=b.adaptWindowing||!1,m=b.adaptSize||!1,c.wvInstance.id=b.id}),c.$on("viewport:GetViewportData",function(a,b){var c=cornerstone.getViewport(i);b(c)}),c.$on("viewport:SetViewport",function(a,b){var d=cornerstone.getViewport(i);d&&(d=b.execute(d),cornerstone.setViewport(i,d),c.$broadcast("viewport:ViewportChanged",d))}),c.$on("viewport:ActivateTool",function(a,b){if(k){var c=b.tool,b=b.arguments,d=cornerstoneTools[c];cornerstoneTools.mouseInput.enable(i),d.activate.apply(d,[i].concat(b))}}),c.$on("viewport:DeactivateTool",function(a,b){if(k){var c=b.tool,d=cornerstoneTools[c];d.deactivate(i),cornerstoneTools.mouseInput.disable(i)}}),c.$watch("wvInstance.id",function(d){if("undefined"!=typeof d&&null!==d){a.all({image:cornerstone.loadAndCacheImage(d),tags:b.instance.getTags({id:d}).$promise}).then(function(a){var b=a.image,d=a.tags,e=k?!1:!0;k=b,c.wvInstance.tags=d;var g=cornerstone.getViewport(i);cornerstone.displayImage(i,k,g),g=cornerstone.getViewport(i),l&&(g.voi.windowCenter=d.WindowCenter,g.voi.windowWidth=d.WindowWidth,cornerstone.setViewport(i,g),l=!1),m&&(f([c.wvWidth,c.wvHeight]),m=!1),e&&(m||f([c.wvWidth,c.wvHeight]),c.$emit("viewport:ViewportLoaded")),c.$broadcast("viewport:InstanceChanged",d)})}}),c.$watchGroup(["wvWidth","wvHeight"],f),f([c.wvWidth,c.wvHeight],[void 0,void 0]);var n=null}}}]),angular.module("webviewer").directive("wvViewportSerie",["$timeout","$parse","$q","orthancApiService",function(a,b,c,d){return{scope:!1,restrict:"A",require:"wvViewportSerie",controller:function(){this.id=void 0,this.instanceCount=0},link:function(b,e,f,g){function h(a){a!==!0&&(a=!1),l++,l>=k.length&&(l=a?0:k.length-1),j.$broadcast("viewport:SetInstance",{id:k[l],adaptWindowing:!1,adaptSize:!1})}function i(){l--,0>l&&(l=0),j.$broadcast("viewport:SetInstance",{id:k[l],adaptWindowing:!1,adaptSize:!1})}var j=angular.element(e).isolateScope(),k=[],l=0,m=null;if(g.setSerie=function(a){var b=a.id;g.id=b},g.showNextInstance=h,g.showPreviousInstance=i,f.wvViewportSerie){var n=b[f.wvViewportSerie];"object"!=typeof n?g.id=n:g.id=n.id,b[f.wvViewportSerie]=g}b.$on("serie:GetSerieData",function(a,b){b(m,g.instanceCount)}),b.$on("serie:GetSerieId",function(a,b){b(g.id)}),b.$on("serie:SetSerie",function(a,b){g.setSerie(b)}),b.$on("serie:ShowNextInstance",function(a,b){var c=b.restartWhenSerieEnd;h(c)}),b.$on("serie:ShowPreviousInstance",function(a,b){i()}),b.$on("serie:GoToSerieIndex",function(a,b){var c=b.index;if(0>c)c=0;else if(c+1>g.instanceCount)return;l=c,j.$broadcast("viewport:SetInstance",{id:k[l],adaptWindowing:!1,adaptSize:!1})});var o=null,p=!1;b.$on("serie:Play",function(c,d){function e(){o=a(function(){h(!0),p&&b.$evalAsync(e)},g)}function f(){j.$broadcast("viewport:GetInstanceData",function(c){if(c){var d=+c.SliceThickness+(+c.SpacingBetweenSlices||0),e=i/d;g=Math.round(1e3/e),o=a(function(){h(!0),p&&b.$evalAsync(f)},g)}})}if(!p){p=!0;var g=d&&d.speed;if(g)e();else{var i=25;f()}}}),b.$on("serie:Pause",function(b,c){o&&(a.cancel(o),o=null),p=!1}),b.$watch(function(){return g.id},function(e,f){if(e){var h=d.serie.listInstances({id:e}).$promise,i=d.serie.get({id:e}).$promise;c.all({instances:h,volume:i}).then(function(c){var e=c.volume,f=c.instances;if(f&&f.SlicesShort&&0!=f.SlicesShort.length){var h=!k||0===k.length;l=0,k=f.SlicesShort.reverse().map(function(a){return a[0]}),m=e.MainDicomTags,g.instanceCount=k.length,j.$broadcast("viewport:SetInstance",{id:k[l],adaptWindowing:!0,adaptSize:!0}),h&&b.$emit("serie:SerieLoaded"),j.$broadcast("serie:SerieChanged",m,g.instanceCount),a(function(){!function a(b){if(!(b+1>g.instanceCount)){var c=k[b];cornerstone.loadAndCacheImage(c).then(function(){d.instance.getTags({id:c}),a(b+1)})}}(0)},1e3)}})}})}}}]),angular.module("webviewer").directive("wvViewportMouseEvents",function(){return{scope:!1,restrict:"A",link:function(a,b,c,d){var e=b,f=angular.element(b).isolateScope();e.mousedown(function(a){var b=a.pageX,c=a.pageY,d=a.which;$(document).mousemove(function(a){f.$apply(function(){var e=a.pageX-b,g=a.pageY-c;if(b=a.pageX,c=a.pageY,1==d){var h={execute:function(a){var b=a.scale;return a.voi.windowWidth=+a.voi.windowWidth+this.deltaX/b,a.voi.windowCenter=+a.voi.windowCenter+this.deltaY/b,a},deltaX:e,deltaY:g};f.$broadcast("viewport:SetViewport",h)}else if(2==d){var h={execute:function(a){var b=a.scale;return a.translation.x=+a.translation.x+this.deltaX/b,a.translation.y=+a.translation.y+this.deltaY/b,a},deltaX:e,deltaY:g};f.$broadcast("viewport:SetViewport",h)}else if(3==d){var h={execute:function(a){return a.scale=+a.scale+this.deltaY/100,a},deltaY:g};f.$broadcast("viewport:SetViewport",h)}}),$(document).mouseup(function(a){$(document).unbind("mousemove"),$(document).unbind("mouseup")})})})}}}),angular.module("webviewer").directive("wvViewportDraggable",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){var e=b;if(d.wvViewportSerie)var f=a(d.wvViewportSerie);else var f=function(){var a;return b.$broadcast("serie:GetSerieId",function(b){a=b}),a};var g=$('<div class="wv-draggable-clone"></div>');c.draggable({helper:function(){return g},start:function(a,b){var d=b.helper;d.data("serie-id",f(e)),d.width(c.width()),d.height(c.height())},zIndex:100})}}}]),angular.module("webviewer").directive("wvViewportDroppable",function(){return{scope:!1,restrict:"A",require:"wvViewportSerie",link:function(a,b,c,d){b.droppable({accept:"[wv-viewport-draggable]",drop:function(b,c){var e=$(c.helper),f=e.data("serie-id");a.$apply(function(){d.setSerie({id:f})})}})}}}),angular.module("webviewer").directive("wvScrollOnWheel",["$parse",function(a){return{scope:!1,restrict:"A",require:"wvViewportSerie",link:function(b,c,d,e){function f(a,d){"undefined"!=typeof a&&a!==d&&(a?Hamster(c[0]).wheel(function(a,c,d,f){0>d&&f>d?(b.$apply(function(){e.showPreviousInstance()}),a.preventDefault()):d>0&&d>f&&(b.$apply(function(){e.showNextInstance(!1)}),a.preventDefault())}):Hamster(c[0]).unwheel())}var g=a(d.wvScrollOnWheel);b.$on("serie:SerieLoaded",function(){f(g(b))}),b.$watch(g,f)}}}]),angular.module("webviewer").directive("wvScrollOnOver",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?c.on("mouseover",function(){f.$broadcast("serie:Play",{speed:40})}).on("mouseout",function(){f.$broadcast("serie:Pause")}):(f.$broadcast("serie:Pause"),c.off("mouseover",mouseoverEvt),c.off("mouseout",mouseoutEvt)))}var f=b,g=a(d.wvScrollOnOver);b.$on("serie:SerieLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvOverlay",[function(){return{scope:{},transclude:"true",templateUrl:"scripts/overlay/wv-overlay.tpl.html",restrict:"E",link:function(a,b,c,d,e){function f(b,c){a.$serie=b,a.$instanceCount=c}function g(b){a.$instance=b,a.$instance?(a.showTopRightArea="undefined"!=typeof a.$instance.SeriesNumber&&"undefined"!=typeof a.$instance.SeriesDescription,a.showTopLeftArea=!0):(a.showTopRightArea=!1,a.showTopLeftArea=!1)}function h(b){a.$viewport=b,b?(a.$viewport.scale=parseFloat(b.scale).toFixed(2),a.$viewport.voi.windowWidth=parseFloat(b.voi.windowWidth).toFixed(2),a.$viewport.voi.windowCenter=parseFloat(b.voi.windowCenter).toFixed(2),a.showBottomRightArea=!0):a.showBottomRightArea=!1}a.showTopLeftArea=!1,a.showTopRightArea=!1,a.showBottomRightArea=!1;var i=b.children(".wv-overlay");e(a,function(a){a.length>0&&i.replaceWith(a)}),a.$emit("serie:GetSerieData",function(a,b){a&&"undefined"!=typeof b&&f(a,b)}),a.$emit("viewport:GetInstanceData",function(a){a&&g(a)}),a.$emit("viewport:GetViewportData",function(a){a&&h(a)}),a.$on("serie:SerieChanged",function(b,c,d){f(c,d),a.$instance={}}),a.$on("viewport:InstanceChanged",function(a,b){g(b)}),a.$on("viewport:ViewportChanged",function(a,b){h(b)})}}}]),angular.module("webviewer").directive("wvOverlayScrollbar",function(){return{scope:!0,templateUrl:"scripts/overlay/wv-overlay-scrollbar.tpl.html",restrict:"E",link:function(a,b,c){function d(){requestAnimationFrame(function(){if(a.$instance&&"undefined"!=typeof a.$instanceCount){var b=Math.ceil(100*a.$instance.InstanceNumber/a.$instanceCount);a.scrollbarDistanceFromRight=100-b+"%",a.$digest()}})}a.scrollbarDistanceFromRight="0%",a.$watchGroup(["$instance.InstanceNumber","$instanceCount"],d),a.$evalAsync(function(){d()})}}}),angular.module("webviewer").directive("wvSerielist",["orthancApiService",function(a){return{scope:{wvStudy:"=",wvClassTmp:"=?wvClass"},templateUrl:"scripts/serielist/wv-serielist.tpl.html",restrict:"E",transclude:!0,link:function(b,c,d){function e(c,d){void 0!=c&&a.study.get({id:b.wvStudy}).$promise.then(function(a){b.serieIds=a.Series})}function f(){b.wvClass=b.wvClassTmp||{};var a={ul:b.wvClass.ul||"wv-serielist",li:b.wvClass.li||"wv-serielist-item",overlay:b.wvClass.ul||"wv-serielist-overlay"};b.wvClass=a}f(),b.$watch("wvStudy",e),b.serieIds=[]}}}]),angular.module("webviewer").directive("wvStateInvert",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&f.$broadcast("viewport:SetViewport",{execute:function(a){return a.invert=this.invert,a},invert:a})}var f=angular.element(c).isolateScope()||b,g=a(d.wvStateInvert);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvStatePlay",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("serie:Play"):f.$broadcast("serie:Pause"))}var f=b,g=a(d.wvStatePlay);b.$on("serie:SerieLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolLengthmeasure",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"length",arguments:[!0]}):f.$broadcast("viewport:DeactivateTool",{tool:"length"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolLengthmeasure);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolAnglemeasure",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"angle",arguments:[!0]}):f.$broadcast("viewport:DeactivateTool",{tool:"angle"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolAnglemeasure);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolPixelprobe",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"probe",arguments:[!0]}):f.$broadcast("viewport:DeactivateTool",{tool:"probe"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolPixelprobe);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolEllipticalroi",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"ellipticalRoi",arguments:[!0]}):f.$broadcast("viewport:DeactivateTool",{tool:"ellipticalRoi"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolEllipticalroi);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolRectangleroi",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"rectangleRoi",arguments:[!0]}):f.$broadcast("viewport:DeactivateTool",{tool:"rectangleRoi"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolRectangleroi);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolZoom",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"zoom",arguments:[0]}):f.$broadcast("viewport:DeactivateTool",{tool:"zoom"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolZoom);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolPan",["$parse",function(a){return{scope:!1,restrict:"A",link:function(b,c,d){function e(a){"undefined"!=typeof a&&(a?f.$broadcast("viewport:ActivateTool",{tool:"pan",arguments:[0]}):f.$broadcast("viewport:DeactivateTool",{tool:"pan"}))}var f=angular.element(c).isolateScope()||b,g=a(d.wvToolPan);b.$on("viewport:ViewportLoaded",function(){e(g(b))}),b.$watch(g,e)}}}]),angular.module("webviewer").directive("wvToolStackscroll",["$parse",function(a){return{scope:!1,restrict:"A",link:function(a,b,c){var d=angular.element(b).isolateScope(),e=function(a){var b=a.pageX,c=a.pageY,e=a.which,f=_.debounce(function(a){var f=a.pageX-b;a.pageY-c;b=a.pageX,c=a.pageY,d.$apply(function(){1==e&&f>0?d.wvInstanceIndex++:1==e&&0>f&&d.wvInstanceIndex--})},17);$(document).mousemove(function(a){f(a),$(document).mouseup(function(a){$(document).unbind("mousemove"),$(document).unbind("mouseup"),a.stopImmediatePropagation(),a.preventDefault()}),a.stopImmediatePropagation(),a.preventDefault()})};a.$watch(c.wvToolStackscroll,function(a){a?b.on("mousedown",e):b.off("mousedown",e)})}}}]),angular.module("webviewer").directive("wvSplitpane",function(){return{scope:{wvLayout:"=?",wvSettings:"=?"},templateUrl:"scripts/splitpane/wv-splitpane.tpl.html",restrict:"E",transclude:!0,link:function(a,b,c){function d(b,c){b&&(a.x=[b.x],a.y=[b.y],a.rowHeight=100/b.y+"%",a.rowWidth=100/b.x+"%",$(window).resize())}void 0==a.wvLayout&&(a.wvLayout=a.wvSettings&&a.wvSettings.layout||{x:1,y:1}),d(a.wvLayout),a.$watch("wvSettings.layout",d,!0),a.$watch("wvLayout",d,!0)}}}),angular.module("webviewer").directive("wvToolbar",function(){return{scope:{wvItems:"="},templateUrl:"scripts/toolbar/wv-toolbar.tpl.html",transclude:!0,restrict:"E",link:function(a,b,c){},controller:["$timeout","$scope",function(a,b){b.activeButton=null,void 0!=b.wvItems&&_.size(b.wvItems)||(b.wvItems={zoom:!1,pan:!1,invert:!1,lengthmeasure:!1,anglemeasure:!1,pixelprobe:!1,ellipticalroi:!1,rectangleroi:!1,layout:{x:1,y:1},play:!1,overlay:!0}),this.set=function(c){var d=b.activeButton,e=c;d!=e&&(null!==d&&b.$broadcast("toolbar.deactivated",d),b.activeButton=e,null!==e&&a(function(){b.$broadcast("toolbar.activated",e)}))},this.get=function(){return b.activeButton}}]}}),angular.module("webviewer").directive("wvToolbarButton",function(){return{require:["wvToolbarButton","^wvToolbar"],scope:{wvName:"@",wvModel:"=",wvIcon:"@"},template:'<button type="button" ng-class="{btn: true, \'btn-sm\': true, \'btn-default\': true, \'wv-button\': true, active: wvModel}" ng-click="click()"><span ng-class="wvIcon"></span></button>',restrict:"E",link:function(a,b,c,d){var e=(d[0],d[1]);"undefined"==typeof a.wvModel?a.wvModel=!1:a.wvModel&&e.set(a.wvName),a.$on("toolbar.deactivated",function(b,c){c==a.wvName&&(a.wvModel=!1)}),a.$on("toolbar.activated",function(b,c){c==a.wvName&&(a.wvModel=!0)}),a.click=function(){var b=a.wvModel;0==b?e.set(a.wvName):e.get()==a.wvName&&e.set(null)}},controller:function(){}}}),angular.module("webviewer").directive("wvToolbarMultiViewportLayout",function(){return{scope:{wvLayout:"="},template:'        <button type="button" class="btn btn-sm btn-default wv-button" bs-select bs-options="item.value as item.label for item in items" ng-model="wvLayout" html="1" placeholder="<span class=&quot;fa fa-th-large&quot;></span>" icon-checkmark="fa fa-th-large">        </button>',restrict:"E",link:function(a,b,c){a.items=[{value:{x:1,y:1},label:"1x1"},{value:{x:2,y:1},label:"2x1"},{value:{x:1,y:2},label:"1x2"},{value:{x:2,y:2},label:"2x2"}]}}}),angular.module("webviewer").directive("wvToolbarPlay",function(){return{scope:{wvEnable:"="},template:'<button type="button" class="btn btn-sm btn-default wv-button" ng-model="wvEnable" bs-checkbox><span class="fa"></span></button>',restrict:"E",link:function(a,b,c){var d=b.children().children();a.wvEnable=!!a.wvEnable,a.wvEnable?d.addClass("fa-pause"):d.addClass("fa-play"),a.$watch("wvEnable",function(a,b){a!=b&&(a?(d.removeClass("fa-play"),d.addClass("fa-pause")):(d.removeClass("fa-pause"),d.addClass("fa-play")))})}}}),angular.module("webviewer").directive("wvStudylist",["orthancApiService",function(a){return{scope:{wvSelectedStudy:"="},template:'<button type="button" class="btn btn-default wv-button wv-studylist" ng-model="wvSelectedStudy" placeholder="Study.." bs-options="study.value as study.label for study in studies" bs-select></button>',restrict:"E",link:function(b,c,d){b.studies=[],a.study.query().$promise.then(function(c){b.studies=c.map(function(a){return{label:"?",value:a}}),b.studies.forEach(function(b){a.study.get({id:b.value}).$promise.then(function(a){b.label=a.MainDicomTags.StudyDescription})})})}}}]),angular.module("webviewer").run(["$templateCache",function(a){"use strict";a.put("scripts/overlay/wv-overlay-scrollbar.tpl.html",'<div ng-if="$serie"> <div class="wv-overlay-scrollbar-text"> {{$instance.InstanceNumber}}/{{$instanceCount}}<br> </div> <div class="wv-overlay-scrollbar" ng-style="{\n	    right: scrollbarDistanceFromRight\n	}"> </div> </div>'),a.put("scripts/overlay/wv-overlay.tpl.html",'<div class="wv-overlay"> <div class="wv-overlay-topleft" ng-if="showTopLeftArea"> {{$instance.PatientName}}<br> {{$instance.PatientID}} </div> <div class="wv-overlay-topright" ng-if="showTopRightArea"> {{$instance.StudyDescription}}<br> {{$instance.StudyDate}}<br> #{{$instance.SeriesNumber}} - {{$instance.SeriesDescription}}<br> </div> <div class="wv-overlay-bottomright" ng-if="showBottomRightArea"> zoom: {{$viewport.scale}}<br> ww/wc: {{$viewport.voi.windowWidth}}/{{$viewport.voi.windowCenter}} </div> <wv-overlay-scrollbar></wv-overlay-scrollbar> </div>'),a.put("scripts/serielist/wv-serielist.tpl.html",'<ul class="{{wvClass.ul}}"> <li ng-repeat="id in serieIds" class="{{wvClass.li}}" ng-transclude wv-size-tag> <wv-viewport wv-viewport-serie="id" wv-width="\'tag\'" wv-height="\'tag\'" wv-viewport-draggable wv-scroll-on-over="true"> <wv-overlay> <div class="{{$parent.wvClass.overlay}}"> {{$instance.SeriesDescription}} </div> </wv-overlay> </wv-viewport> </li> </ul>'),a.put("scripts/splitpane/wv-splitpane.tpl.html",'<div class="wv-splitpane"> <div ng-repeat="$y in y | range track by $index" class="wv-splitpane-row" ng-style="{height: rowHeight}"> <div ng-repeat="$x in x | range track by $index" class="wv-splitpane-cell" ng-style="{width: rowWidth}" wv-size-tag ng-transclude> <wv-viewport wv-viewport-serie="randomSerieId" wv-width="\'tag\'" wv-height="\'tag\'" wv-viewport-droppable wv-viewport-mouse-events wv-scroll-on-wheel="true" wv-enable-overlay="!wvSettings || wvSettings.hasOwnProperty(\'overlay\') == false || wvSettings.overlay" wv-tool-zoom="wvSettings.zoom" wv-tool-pan="wvSettings.pan" wv-tool-lengthmeasure="wvSettings.lengthmeasure" wv-tool-anglemeasure="wvSettings.anglemeasure" wv-tool-pixelprobe="wvSettings.pixelprobe" wv-tool-ellipticalroi="wvSettings.ellipticalroi" wv-tool-rectangleroi="wvSettings.rectangleroi" wv-state-invert="wvSettings.invert" wv-state-play="wvSettings.play"></wv-viewport> </div> </div> </div>'),a.put("scripts/toolbar/wv-toolbar.tpl.html",'<div class="wv-toolbar btn-toolbar" role="toolbar" style="margin-left: 0"> <div class="btn-group" role="group" ng-transclude ng-init="wvItems = wvItems || $parent.wvItems"> <wv-toolbar-button wv-name="zoom" wv-model="wvItems.zoom" wv-icon="fa fa-search" ng-if="wvItems.hasOwnProperty(\'zoom\')"></wv-toolbar-button> <wv-toolbar-button wv-name="pan" wv-model="wvItems.pan" wv-icon="fa fa-arrows" ng-if="wvItems.hasOwnProperty(\'pan\')"></wv-toolbar-button> <!-- <wv-toolbar-button wv-name="stackscroll" wv-model="wvItems.stackscroll" wv-icon="fa fa-bars" ng-if="wvItems.hasOwnProperty(\'stackscroll\')"></wv-toolbar-button> --> <wv-toolbar-button wv-name="invert" wv-model="wvItems.invert" wv-icon="fa fa-adjust" ng-if="wvItems.hasOwnProperty(\'invert\')"></wv-toolbar-button> <wv-toolbar-button wv-name="lengthmeasure" wv-model="wvItems.lengthmeasure" wv-icon="fa fa-arrows-v" ng-if="wvItems.hasOwnProperty(\'lengthmeasure\')"></wv-toolbar-button> <wv-toolbar-button wv-name="anglemeasure" wv-model="wvItems.anglemeasure" wv-icon="fa fa-angle-left" ng-if="wvItems.hasOwnProperty(\'anglemeasure\')"></wv-toolbar-button> <wv-toolbar-button wv-name="pixelprobe" wv-model="wvItems.pixelprobe" wv-icon="fa fa-dot-circle-o" ng-if="wvItems.hasOwnProperty(\'pixelprobe\')"></wv-toolbar-button> <wv-toolbar-button wv-name="ellipticalroi" wv-model="wvItems.ellipticalroi" wv-icon="fa fa-circle-o" ng-if="wvItems.hasOwnProperty(\'ellipticalroi\')"></wv-toolbar-button> <wv-toolbar-button wv-name="rectangleroi" wv-model="wvItems.rectangleroi" wv-icon="fa fa-square-o" ng-if="wvItems.hasOwnProperty(\'rectangleroi\')"></wv-toolbar-button> <wv-toolbar-multi-viewport-layout wv-layout="wvItems.layout" ng-if="wvItems.hasOwnProperty(\'layout\')"></wv-toolbar-multi-viewport-layout> <wv-toolbar-play wv-enable="wvItems.play" ng-if="wvItems.hasOwnProperty(\'play\')"></wv-toolbar-play> </div> </div>'),a.put("scripts/viewport/wv-viewport.tpl.html",'<div class="cornerstone-enabled-image wv-cornerstone-enabled-image" oncontextmenu="return false" unselectable="on" onselectstart="return false" onmousedown="return false" style="position: relative"> <ng-transclude> <wv-overlay ng-if="wvEnableOverlay"></wv-overlay> </ng-transclude> </div>')}]);