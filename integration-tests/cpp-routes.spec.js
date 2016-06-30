describe('backend', function() {

    this.timeout(30000); // Set a long timeout because image compression can takes longer than the default 2s timeout

    beforeEach(function() {
        bard.asyncModule('webviewer');
        bard.inject('wvImageBinaryManager', 'WvImageQualities');

        imageId = '04389b99-731fd35c-a8ba10a0-a1d9cb32-d7dbd903:0';
    });

    var imageId;
    var imageResolution = {
        // width, height
        highQuality: [1770, 2370],
        mediumQuality: [746, 1000],
        lowQuality: [112, 150]
    };

    describe('route /images/<instance>/high-quality', function() {

        it('should load an high quality version of the image', function() {
            // Retrieve image with LOSSLESS quality
            return wvImageBinaryManager
                .get(imageId, WvImageQualities.LOSSLESS)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);

                    // Check the image has high quality
                    assert.equal(pixelObject.width, imageResolution.highQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.highQuality[1]);
                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                });
        });

        it('should fail on inexistant image', function() {
            // Retrieve inexistant image
            return wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOSSLESS)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    // Validate the returned code is 404
                    assert.equal(error.status, 404);
                });
        });

    });

    describe('route /images/<instance>/medium-quality', function() {

        it('should load an medium quality version of the image', function() {
            // Retrieve image with MEDIUM quality
            return wvImageBinaryManager
                .get(imageId, WvImageQualities.MEDIUM)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);

                    // Check the image has medium quality
                    assert.equal(pixelObject.width, imageResolution.mediumQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.mediumQuality[1]);

                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                });
        });

        it('should fail on inexistant image', function() {
            // Retrieve inexistant image
            return wvImageBinaryManager
                .get('robocop:34', WvImageQualities.MEDIUM)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    // Validate the returned code is 404
                    assert.equal(error.status, 404);
                });
        });

    });

    describe('route /images/<instance>/low-quality', function() {

        it('should load an low quality version of the image', function() {
            // Retrieve image with LOW quality
            return wvImageBinaryManager
                .get(imageId, WvImageQualities.LOW)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);
                    
                    // Check the image has low quality
                    assert.equal(pixelObject.width, imageResolution.lowQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.lowQuality[1]);
                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                });
        });

        it('should fail on inexistant image', function() {
            // Retrieve inexistant image
            return wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOW)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    // Validate the returned code is 404
                    assert.equal(error.status, 404);
                });
        });

    });

});
