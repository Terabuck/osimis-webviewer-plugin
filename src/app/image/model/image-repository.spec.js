describe('image', function() {

	describe('repository', function() {

	    beforeEach(function() {
	        bard.appModule('webviewer');

	        bard.inject(this, '$httpBackend', 'wvImageRepository', 'wvImageModel');

	        _.forEach(orthanc.raw, function(data, path) {
	          $httpBackend
	            .when('GET', '/' + path)
	            .respond(data);
        	});
        });

		it('should load an image model from orthanc [singleframe]', function(done) {
			// given
			var instance = orthanc.instances.withSingleFrame;
			var imageId = instance.ID + ':0';

			// when
			var images = wvImageRepository
                .get(imageId)
                .then(function(image) {

                    // then
                    expect(image).to.be.an.instanceof(wvImageModel.class);
                    expect(image.id).to.equal(imageId);

                    done();
                });

            $httpBackend.flush();
		});

		it('should get an image model from its id [multiframe]', function(done) {
			// load the 16th frame of an orthanc instance in an image model
			var instance = orthanc.instances.with30Frames;
			var instanceId = instance.ID;
			var imageId = instanceId + ':16';

			var image = wvImageRepository
			    .get(imageId)
			    .then(function(image) {
                    
                    // then
                    expect(image).to.be.an.instanceof(wvImageModel.class);
                    expect(image.id).to.equal(imageId);

                    done();
			    });
            
            $httpBackend.flush();
		});

	});

});
