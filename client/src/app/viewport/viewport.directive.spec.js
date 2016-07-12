describe('viewport', function() {
    
    //beforeEach(module('webviewer', 'ngMock'));

    //beforeEach(module(function($exceptionHandler) {
    //    $exceptionHandlerProvider.mode('log');
    //}));
    
    describe('directive', function() {
        osi.beforeEach();
        osi.afterEach();

        beforeEach(function() {
            bard.inject(this, 'wvCornerstoneImageAdapter', 'wvImageManager');

            sinon.spy(cornerstone, 'enable');
            sinon.spy(cornerstone, 'displayImage');
            sinon.spy(cornerstone, 'resize');
        });

        afterEach(function() {
            cornerstone.enable.restore();
            cornerstone.displayImage.restore();
            cornerstone.resize.restore();
        });

        function createDirective(html) {
            var element = osi.directive(html);

            return {
                element: element,
                enabledElement: element.find('.wv-cornerstone-enabled-image')[0]
            };
        }

        it('should draw the image', function() {
            $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0';
            
            var element = osi.directive('<wv-viewport wv-image-id="imageId"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0]; // dom element used by cornerstone
            
            // check the image has been displayed once
            expect(cornerstone.displayImage).calledOnce;
            var orthancPixelObject = osi.sync(wvImageManager.getPixelObject($scope.imageId));
            var expectedProcessedImage = wvCornerstoneImageAdapter.process($scope.imageId, orthancPixelObject);
            var lastDisplayedImage = cornerstone.displayImage.lastCall.args[1];
            expect(lastDisplayedImage.Orthanc.PixelData).to.equal(expectedProcessedImage.Orthanc.PixelData);

            // change the image - test the data binding
            $scope.imageId = '0d76c26b-1e36515d-0fec1815-7db3052a-1c5c5d6e:1';
            osi.digest();
            
            // check the new image has been displayed twice
            expect(cornerstone.displayImage).calledTwice;
            var orthancPixelObject = osi.sync(wvImageManager.getPixelObject($scope.imageId));
            expectedProcessedImage = wvCornerstoneImageAdapter.process($scope.imageId, orthancPixelObject);
            var lastDisplayedImage = cornerstone.displayImage.lastCall.args[1];
            expect(lastDisplayedImage.Orthanc.PixelData).to.equal(expectedProcessedImage.Orthanc.PixelData);

            // check the element has only been enabled once
            expect(cornerstone.enable).calledOnce;
            expect(cornerstone.enable).calledWith(enabledElement);
        });
        
        it('should clear the image when wv-image-id is undefined', function() {
            $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0';
            
            var element = osi.directive('<wv-viewport wv-image-id="imageId"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0]; // dom element used by cornerstone
            
            // check the image has been displayed once
            expect(cornerstone.displayImage).calledOnce;

            // clear the image - test the data binding
            $scope.imageId = null;
            osi.digest();
            
            // check the new image has been cleared
            expect($(enabledElement).css('visibility')).to.equal('hidden');
            
            // set back an image
            $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0';
            osi.digest();
            
            // expect the visibility to have been set back
            expect($(enabledElement).css('visibility')).to.not.equal('hidden');
        });

		it('should scale the image to fill the viewport', function() {
		    $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0'; // 168 x 168 px image
		    $scope.size = { 
		        width: '168px',
                height: '168px'
		    };
		    
            var element = osi.directive('<wv-viewport wv-image-id="imageId" wv-size="size"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0]; // dom element used by cornerstone
            
            expect(cornerstone.displayImage).calledOnce;
            // expect the viewport to scale the image to its fullest.
            var viewport = cornerstone.getViewport(enabledElement);
            expect(viewport.scale).to.equal(1);
		});

		it('should not scale the image bigger than the size of the viewport', function() {
		    $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0'; // 168 x 168 px image
		    $scope.size = { // double size
		        width: '336px',
                height: '336px'
		    };
            var element = osi.directive('<wv-viewport wv-image-id="imageId" wv-size="size"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0]; // dom element used by cornerstone
            
            // expect the viewport to scale the image to 100%.
            var viewport = cornerstone.getViewport(enabledElement);
            expect(viewport.scale).to.equal(1); // 168 x 168 px are shown, the image is not scaled up
		});

		it('should scale the image down to the size of the viewport', function() {
		    $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0'; // 168 x 168 px image
		    $scope.size = { // half size
		        width: '84px',
                height: '84px'
		    };
            var element = osi.directive('<wv-viewport wv-image-id="imageId" wv-size="size"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0]; // dom element used by cornerstone

            // expect the viewport to scale the image to 100%.
            var viewport = cornerstone.getViewport(enabledElement);
            expect(viewport.scale).to.equal(0.5); // scale down the image to the size of the viewport
		});

		it('should keep its configuration when image change', function() {
            $scope.imageId = '27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0';
            
            var element = osi.directive('<wv-viewport wv-image-id="imageId"></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0];
            
            // grab the viewport configuration
            var csViewport = cornerstone.getViewport(enabledElement);

            // update the configuration
            csViewport.scale = 0.143;
            cornerstone.setViewport(enabledElement, csViewport);
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.equal(0.143);

            // change the image
            $scope.imageId = '0d76c26b-1e36515d-0fec1815-7db3052a-1c5c5d6e:1';
            osi.digest();

            // expect the configuration to have not changed
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.equal(0.143);
		});

        xit('should provide public access to its model', function() {

        });
	});

	describe('directive\'s controller', function() { // used by series' directive for instance
	    
        osi.beforeEach();
        osi.afterEach();

        beforeEach(function() {
            bard.inject(this, 'wvCornerstoneImageAdapter');

            sinon.spy(cornerstone, 'enable');
            sinon.spy(cornerstone, 'displayImage');
            sinon.spy(cornerstone, 'resize');
        });

        afterEach(function() {
            cornerstone.enable.restore();
            cornerstone.displayImage.restore();
            cornerstone.resize.restore();
        });

        it('should change the shown image', function() {
            $scope.imageId = null;
            
            var element = osi.directive('<wv-viewport wv-image-id="imageId"></wv-viewport>');
            var ctrl = osi.controller(element, 'wv-viewport');
            
            expect($scope.imageId).to.equal(null);

            // change the image via controller
            var imageId = '0d76c26b-1e36515d-0fec1815-7db3052a-1c5c5d6e:1';
            ctrl.setImage(imageId);
            osi.digest();

            // expect the $scope to have been updated
            // goal: check databinding
            expect($scope.imageId).to.equal(imageId);
        });

		it('should keep its configuration when image change by default', function() {
            var element = osi.directive('<wv-viewport></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0];
            var ctrl = osi.controller(element, 'wv-viewport');
            
            // set the image id
            ctrl.setImage('27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0');
            osi.digest();

            // grab the viewport configuration
            var csViewport = cornerstone.getViewport(enabledElement);

            // update the configuration
            csViewport.scale = 0.143;
            cornerstone.setViewport(enabledElement, csViewport);
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.equal(0.143);

            // change the image
            ctrl.setImage('0d76c26b-1e36515d-0fec1815-7db3052a-1c5c5d6e:1');
            osi.digest();

            // expect the configuration to have not changed
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.equal(0.143);
        });

		it('should allow to reset its configuration when image change', function() {
            var element = osi.directive('<wv-viewport></wv-viewport>');
            var enabledElement = element.find('.wv-cornerstone-enabled-image')[0];
            var ctrl = osi.controller(element, 'wv-viewport');
            
            // set the initial image id
            ctrl.setImage('27b24a79-6ef843d4-1e014566-4cb06360-2b9eda28:0');
            osi.digest();

            // grab the viewport configuration
            var csViewport = cornerstone.getViewport(enabledElement);

            // update the configuration
            csViewport.scale = 0.143;
            cornerstone.setViewport(enabledElement, csViewport);
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.equal(0.143);

            // change the image and reset the config
            ctrl.setImage('0d76c26b-1e36515d-0fec1815-7db3052a-1c5c5d6e:1', true);
            osi.digest();

            // expect the configuration to have changed
            csViewport = cornerstone.getViewport(enabledElement);
            expect(csViewport.scale).to.not.equal(0.143);
		});
	});

});