describe('webviewer', function() {
    
    osi.beforeEach();
    osi.afterEach();

    describe('directive', function() {

        describe('webviewer#series-id attribute', function() {

            it('should be used to initialize viewports', function() {
                // Set seriesId
                $scope.seriesId = 'baba';

                // Instantiate & test directive with the series-id attribute
                return osi.directive(
                    '<wv-webviewer wv-series-id="seriesId"></wv-webviewer>'
                )
                .then(function(directive) {
                    // Test directive
                    var vm = directive.$scope.vm;

                    // Check one viewport configured
                    assert.equal(vm.viewports.length, 1);

                    // Check seriesId has been applied to every viewports
                    vm.viewports.forEach(function(viewport) {
                        assert.equal(viewport.seriesId, 'baba');
                    });
                });

            });

        });

        
    });

});