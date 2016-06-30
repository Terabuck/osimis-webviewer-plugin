describe('plugin', function() {

    this.timeout(30000); // Set a long timeout because image compression can takes longer than the default 2s timeout

    beforeEach(function() {
        bard.asyncModule('webviewer');
        bard.inject('wvImageBinaryManager', 'WvImageQualities');

        imageId = '04389b99-731fd35c-a8ba10a0-a1d9cb32-d7dbd903:0';
    });

    var imageId;
    var imageSize = {
        highQuality: 8389800,
        mediumQuality: 746000,
        lowQuality: 16800
    };
    var imageResolution = {
        // width, height
        highQuality: [1770, 2370],
        mediumQuality: [746, 1000],
        lowQuality: [112, 150]
    };

    describe('route /images/<instance>/high-quality', function() {

        it('should load an high quality version of the image', function(done) {
            // Retrieve image with LOSSLESS quality
            wvImageBinaryManager
                .get(imageId, WvImageQualities.LOSSLESS)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);

                    // Check the image has high quality
                    assert.equal(pixelObject.sizeInBytes, imageSize.highQuality);
                    assert.equal(pixelObject.width, imageResolution.highQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.highQuality[1]);
                    
                    done();
                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                    done();
                });
        });

        it('should fail on inexistant image', function(done) {
            // Retrieve inexistant image
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOSSLESS)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                    done();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    assert.ok(true);
                    done();
                });
        });

    });

    describe('route /images/<instance>/medium-quality', function() {

        it('should load an medium quality version of the image', function(done) {
            // Retrieve image with MEDIUM quality
            wvImageBinaryManager
                .get(imageId, WvImageQualities.MEDIUM)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);

                    // Check the image has medium quality
                    assert.equal(pixelObject.sizeInBytes, imageSize.mediumQuality);
                    assert.equal(pixelObject.width, imageResolution.mediumQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.mediumQuality[1]);

                    done();
                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                    done();
                });
        });

        it('should fail on inexistant image', function(done) {
            // Retrieve inexistant image
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.MEDIUM)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                    done();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    assert.ok(true);
                    done();
                });
        });

    });

    describe('route /images/<instance>/low-quality', function() {

        it('should load an low quality version of the image', function(done) {
            // Retrieve image with LOW quality
            wvImageBinaryManager
                .get(imageId, WvImageQualities.LOW)
                .then(function(pixelObject) {
                    // Succeed if image has been retrieved
                    assert.ok(true);
                    
                    // Check the image has low quality
                    assert.equal(pixelObject.sizeInBytes, imageSize.lowQuality);
                    assert.equal(pixelObject.width, imageResolution.lowQuality[0]);
                    assert.equal(pixelObject.height, imageResolution.lowQuality[1]);

                    done();
                }, function(error) {
                    // Fail on error - if image should have been retrieved
                    assert.fail();
                    done();
                });
        });

        it('should fail on inexistant image', function(done) {
            // Retrieve inexistant image
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOW)
                .then(function() {
                    // Fail if inexistant image request returns successful result
                    assert.fail();
                    done();
                }, function(error) {
                    // Succeed on error - if image has not been retrieved
                    assert.ok(true);
                    done();
                });
        });

    });

});
