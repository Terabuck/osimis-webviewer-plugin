/* jshint -W117, -W030 */
describe('serie', function () {
    var _apiUrl = 'http://localhost:8042';
    var _study;

    beforeEach(function() {
        bard.appModule('webviewer');
        
        bard.inject(this, '$controller', '$q', '$rootScope', '$timeout', '$httpBackend',
            'wvConfig', 'wvSerieManager');
    });

    bard.verifyNoOutstandingHttpRequests();

    describe('model', function() {
        xit('should list the wv images ids', function() {

        });
        xit('should change the selected instance', function() {

        });
        xit('should play the serie', function() {

        });
        xit('should pause the serie', function() {

        });
    });
});
