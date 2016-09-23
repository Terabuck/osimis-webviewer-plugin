describe('serieslist', function() {

    this.timeout(25000); // Set a long timeout because image compression
                         // can take longer than the default 2s timeout.
                         // Use 25 secs because CI server can sometimes be quite slow.

    osi.beforeEach();
    osi.afterEach();

    beforeEach(function() {
        bard.inject('wvSeriesManager');
    })

    describe('directive', function() {

        it('should display a list of DICOM multiframe instances as a list of series', function() {

            $scope.studyId = undefined;

            return osi
                .directive('<wv-serieslist wv-study-id="studyId" wv-on-study-loaded="checkShownSeries()"></wv-serieslist>')
                .then(function(directive) {
                    // Set the study id containing two DICOM multi frame instances
                    $scope.studyId = '595df1a1-74fe920a-4b9e3509-826f17a3-762a2dc3';

                    // Use a callback to wait till calls are made
                    // Then check the desired series are found
                    return $q(function(resolve, reject) {
                        // Surround with try catch to convert assertion exception into promise rejection (and therefore let
                        // mocha process the error instead of just logging it and timing out)
                        $scope.checkShownSeries = function() {
                            try {
                                // Two frontend series are displayed for two DICOM instance
                                // from one single DICOM series
                                assert.deepEqual(directive.$scope.seriesIds, [
                                    '5d0d012e-4e2766cb-dd38b9ab-605538eb-ea8ac2cf:0',
                                    '5d0d012e-4e2766cb-dd38b9ab-605538eb-ea8ac2cf:1'
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

        it('should display the list of series when unsupported series are present (eg. DICOM SR)', function() {

            $scope.studyId = undefined;

            return osi
                .directive('<wv-serieslist wv-study-id="studyId" wv-on-study-loaded="checkShownSeries()"></wv-serieslist>')
                .then(function(directive) {
                    // Use a callback to wait till calls are made
                    // Then check the desired series are found
                    return new Promise(function(resolve, reject) {
                        // Set the study id containing both a DICOM SR series and a normal one
                        $scope.studyId = '3ff62993-28b67f81-6dfb132b-9d53983a-3a61f711';

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
