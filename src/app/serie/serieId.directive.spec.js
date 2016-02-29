describe('serie', function() {
    
    describe('serie-id directive', function() {

        osi.beforeEach();

        beforeEach(function() {
            // bard.inject();
        });

        osi.afterEach();

        it('should draw the first image when a serie is set', function() {
            $scope.serieId = orthanc.series.with2SingleFrameInstances.ID + ':0';
            $scope.imageId = null;
            
            // dispose a serie directive - set the wv-image-id to grab test datas
            var element = osi.directive('<wv-viewport wv-image-id="imageId" wv-serie-id="serieId"></wv-viewport>');
            var ctrl = osi.controller(element, 'wv-serie-id');
            var viewportCtrl = osi.controller(element, 'wv-viewport');
            
            // check if the first image of the serie is shown
            var firstImageId = orthanc.series.with2SingleFrameInstances.Instances[0] + ':0';
            expect($scope.imageId).to.equal(firstImageId);

            // change the serie - test databinding
            $scope.serieId = orthanc.series.with2MultiFrameInstances.ID + ':1'; // wv serie #1 = orthanc serie #0 instance #1
            osi.digest();
            
            // check if the first image of the new serie is shown
            var imageId = orthanc.series.with2MultiFrameInstances.Instances[1] + ':0';
            expect($scope.imageId).to.equal(imageId);
        });

        it('should share the serie model', function() {
            $scope.serieId = orthanc.series.with2SingleFrameInstances.ID + ':0';
            $scope.$serie = null;
            
            // dispose a serie directive
            var element = osi.directive('<wv-viewport wv-serie-id="serieId" wv-serie="$serie"></wv-viewport>');
            
            // check if the serie model is shared
            expect($scope.$serie.id).to.equal(orthanc.series.with2SingleFrameInstances.ID + ':0');

            // change the serie
            $scope.serieId = orthanc.series.with2MultiFrameInstances.ID + ':1'; // wv serie #1 = orthanc serie #0 instance #1
            osi.digest();

            // check if the serie model is shared
            expect($scope.$serie.id).to.equal(orthanc.series.with2MultiFrameInstances.ID + ':1');
        });

        it('should keep the viewport image in sync with the serie\'s current image', function() {
            $scope.serieId = orthanc.series.with2MultiFrameInstances.ID + ':0';
            $scope.$serie = null; // kept for tests
            $scope.imageId = null; // kept for tests

            // dispose a serie directive
            var element = osi.directive('<wv-viewport wv-image-id="imageId" wv-serie-id="serieId" wv-serie="$serie"></wv-viewport>');
            
            // check the actual image
            var firstImageId = orthanc.series.with2MultiFrameInstances.Instances[0] + ':0';
            expect($scope.imageId).to.equal(firstImageId)

            // go to next image
            $scope.$serie.goToNextImage();
            osi.digest();

            // check the image has changed
            var secondImageId = orthanc.series.with2MultiFrameInstances.Instances[0] + ':1';
            expect($scope.imageId).to.equal(secondImageId);
        });

        it('should reset the viewport settings when the serie change', function() {
            $scope.serieId = orthanc.series.with2MultiFrameInstances.ID + ':0';
            $scope.$viewport = null; // kept for tests

            // dispose a serie directive
            var element = osi.directive('<wv-viewport wv-serie-id="serieId" wv-image-id="grsg" wv-viewport="$viewport"></wv-viewport>');
            
            // check the actual image
            var firstImageId = orthanc.series.with2MultiFrameInstances.Instances[0] + ':0';
            expect($scope.$viewport.voi.windowCenter).to.equal(128);
            expect($scope.$viewport.voi.windowWidth).to.equal(256);

            // change serie
            $scope.serieId = orthanc.series.with2SingleFrameInstances.ID + ':0';
            osi.digest();

            // expect the viewport have changed
            expect($scope.$viewport.voi.windowCenter).to.not.equal(128);
            expect($scope.$viewport.voi.windowWidth).to.not.equal(256);
        });
	});

});