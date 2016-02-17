/* jshint -W117, -W030 */
describe('wvSerieRepository', function () {
    var _apiUrl = 'http://localhost:8042';

    beforeEach(function() {
        bard.appModule('webviewer');
        
        bard.inject(this, '$controller', '$q', '$rootScope', '$timeout', '$httpBackend',
            'wvConfig', 'wvSerieRepository', 'wvOrthancSerieAdapter', 'wvSerie');

        bard.mockService(wvConfig, {
            orthancApiURL: _apiUrl,
            webviewerApiURL: _apiUrl + '/web-viewer',
            // defaultCompression: 'jpeg95',
            _default: null
        });

        _.forEach(orthanc.raw, function(data, path) {
          $httpBackend
            .when('GET', '/' + path)
            .respond(data);
        });
    });

    bard.verifyNoOutstandingHttpRequests();

    it('should return promises', function() {
      // given
      var orthancSerie = orthanc.series.withManySingleFrameInstances;

      // when
      var serie = wvSerieRepository.get(orthancSerie.ID);

      // then
      expect(serie.then).to.not.equal(undefined);

      $httpBackend.flush();
    });

    xit('should list series with minimal informations', function() {
        wvSerieRepository.list({
            study: studyIt
        });
    });

    it('should return wv model created with orthanc API model', function(done) {
      // given
      var orthancSerie = orthanc.series.withManySingleFrameInstances;
      var orthancSortedInstances = orthanc.sortedInstances.withManySingleFrameInstances;

      // when
      wvSerieRepository
      .get(orthancSerie.ID)
      .then(function(wvSerie) {

        // then
        var expectedResult = wvOrthancSerieAdapter.process(orthancSerie, orthancSortedInstances);
        expect(wvSerie[0]).to.deep.equal(expectedResult[0]);
        done();

      });

      $httpBackend.flush();
    });

});