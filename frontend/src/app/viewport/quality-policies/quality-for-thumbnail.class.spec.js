describe('progressive image loading', function() {
    describe('(U06) Quality Policy For Thumbnail Viewport', function() {
        it('(USR-0502, UT0601) shall set LOW quality for thumbanils', function() {
            var qualityForThumbnail = osimis.QualityForThumbnail();

            assert.deepEqual(qualityForThumbnail, [
                osimis.quality.LOW
            ], "Thumbnails should display LOW quality only");
        });
    });
});
