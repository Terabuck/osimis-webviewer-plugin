describe('plugin', function() {

    beforeEach(function() {
        this.timeout(30000); // Set a longer timeout for image compression

        bard.asyncModule('webviewer');
        bard.inject('wvImageBinaryManager', 'WvImageQualities');
    });

    describe('route /images/<instance>/high-quality', function() {

        it('should load an high quality version of the image', function(done) {
            wvImageBinaryManager
                .get('04389b99-731fd35c-a8ba10a0-a1d9cb32-d7dbd903:0', WvImageQualities.LOSSLESS)
                .then(function() {
                    assert.ok(true);
                    done();
                }, function(error) {
                    assert.fail();
                    done();
                });
        });

        it('should fail on unknown instance', function(done) {
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOSSLESS)
                .then(function() {
                    assert.fail();
                    done();
                }, function(error) {
                    assert.ok(true);
                    done();
                });
        });

    });

    describe('route /images/<instance>/medium-quality', function() {

        it('should load an medium quality version of the image', function(done) {
            wvImageBinaryManager
                .get('04389b99-731fd35c-a8ba10a0-a1d9cb32-d7dbd903:0', WvImageQualities.MEDIUM)
                .then(function() {
                    assert.ok(true);
                    done();
                }, function(error) {
                    assert.fail(null, null, error);
                    done();
                });
        });

        it('should fail on unknown instance', function(done) {
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.MEDIUM)
                .then(function() {
                    assert.fail();
                    done();
                }, function(error) {
                    assert.ok(true);
                    done();
                });
        });

    });

    describe('route /images/<instance>/low-quality', function() {

        it('should load an low quality version of the image', function(done) {
            wvImageBinaryManager
                .get('04389b99-731fd35c-a8ba10a0-a1d9cb32-d7dbd903:0', WvImageQualities.LOW)
                .then(function() {
                    assert.ok(true);
                    done();
                }, function(error) {
                    assert.fail(null, null, error);
                    done();
                });
        });

        it('should fail on unknown instance', function(done) {
            wvImageBinaryManager
                .get('robocop:34', WvImageQualities.LOW)
                .then(function() {
                    assert.fail();
                    done();
                }, function(error) {
                    assert.ok(true);
                    done();
                });
        });

    });

});
