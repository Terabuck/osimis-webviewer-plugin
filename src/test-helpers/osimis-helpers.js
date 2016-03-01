(function(root) {
    "use strict";

    _.assign(root, {
        inject: inject,
        beforeEach: beforeEach,
        afterEach: afterEach,
        sync: sync,
        flush: flush,
        digest: digest,
        directive: directive,
        controller: controller
    });

    function inject() {
        bard.inject('$compile', '$q', '$timeout', '$httpBackend', '$rootScope', '$timeout', 'cornerstone');
    }

    function afterEach() {
        window.afterEach(function() {
            $rootScope.$destroy();
            $('body').children().remove();

            cornerstone.imageCache.purgeCache();
            flush();
        });
    }

    function beforeEach() {
        window.beforeEach(function() {
            bard.appModule('webviewer', 
                function(wvConfigProvider) {
                    wvConfigProvider.setApiURL('');
                },
                function($exceptionHandlerProvider) {
                    $exceptionHandlerProvider.mode('rethrow');
                }
            );

            inject();

            _.forEach(orthanc.raw, function(data, path) {
                $httpBackend
                    .when('GET', '/' + path)
                    .respond(data);
            });

            // for console live debugging purpose
            window.test = this.currentTest;

            window.$scope = window.$rootScope;

            window.requestAnimationFrame = function(cb) { 
                $timeout(cb, 0, false);
            };
            window.cancelAnimationFrame = angular.noop;
        });
    }

    function sync(promise) {
        var result = null;
        promise.then(function(result_) {
            result = result_;
        });
        flush();
        return result;
    }

    function flush() {
        try {
            $timeout.flush(); // flush pending promises (& apply)
        }
        catch(e) {
            if (e.message === 'No deferred tasks to be flushed') {
                // ignore
            }
            else {
                // rethrows error occuring during $digest
                throw e;
            }
        }
        try {
            $httpBackend.flush(); // flush pending requests
        }
        catch(e) {
            if (e.message === 'No pending request to flush !') {
                // ignore "no pending requests exceptions"
                ;
            }
            else {
                // rethrows error occuring during $digest
                throw e;
            }
        }
    }

    function digest() {
        $rootScope.$digest();
        flush();
    }

    function directive(html) {
        var element = $compile(html)($rootScope);

        // @note element must appended to body to retrieve its size
        $('body').append(element);

        digest();

        return element;
    }

    function controller(element, name) {
        var child = element.find('[' + name + ']');
        var selector = !child.length ? element : child;

        var ctrl = name
            .split('-')
            .map(function(token, index) {
                if (index === 0) {
                    return token
                }
                else {
                    return token.charAt(0).toUpperCase() + token.slice(1);
                }
            })
            .join('');

        return selector.controller(ctrl);
    }

})(window.osi || (window.osi = {}));