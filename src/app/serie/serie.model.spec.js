/* jshint -W117, -W030 */
describe('wvSerie', function () {
    var _apiUrl = 'http://localhost:8042';
    var _study;

    beforeEach(function() {
        bard.appModule('webviewer');
        
        bard.inject(this, '$controller', '$q', '$rootScope', '$timeout', '$httpBackend',
            'wvConfig', 'wvSerie');
    });

    bard.verifyNoOutstandingHttpRequests();

    describe('model', function() {
        it('should contain main dicoms tags', function() {

        });
        it('should contain its instance number', function() {

        });

        it('should change instances', function() {

        });
    });

    // it('should map state admin to url /admin ', function() {
    //     // expect($state.href('admin', {})).to.equal('/admin');
    // });

    // it('should map /admin route to admin View template', function () {
    //     // expect($state.get('admin').templateUrl).to.equal(view);
    // });

    // it('of admin should work with $state.go', function () {
    //     // $state.go('admin');
    //     // $rootScope.$apply();
    //     // expect($state.is('admin'));
    // });
});
