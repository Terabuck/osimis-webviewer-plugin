describe('serieslist', function() {

    this.timeout(10000); // Set a long timeout because image compression can take longer than the default 2s timeout

    osi.beforeEach();
    osi.afterEach();

    beforeEach(function() {
        bard.inject('wvSeriesManager');
    })

    describe('directive', function() {

        it('should display the list of series when unsupported series are present (eg. DICOM SR)', function() {

            $scope.studyId = undefined;

            return osi
                .directive('<wv-serieslist wv-study-id="studyId" wv-on-study-loaded="checkShownSeries()"></wv-serieslist>')
                .then(function(directive) {
                    // Set the study id containing both a DICOM SR series and a normal one
                    $scope.studyId = '3ff62993-28b67f81-6dfb132b-9d53983a-3a61f711';

                    // Use a callback to wait till calls are made
                    // Then check the desired series are found
                    return $q(function(resolve, reject) {
                        // Surround with try catch to convert assertion exception into promise rejection (and therefore let
                        // mocha process the error instead of just logging it and timing out)
                        $scope.checkShownSeries = function() {
                            try {
                                assert.deepEqual(directive.$scope.seriesIds, [
                                    '7410c2c9-784fdb9b-07b22740-612c386e-69ac4c8c:0'
                                ]);
                                resolve();
                            }
                            catch (e) {
                                reject(e);
                            }
                        };
                        $scope.$apply();
                    });
                })
                ;

        });

    });

});
