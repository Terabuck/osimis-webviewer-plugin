/* jshint -W117, -W030 */
describe('wvOrthancSerieAdapter', function () {
    beforeEach(function() {
        bard.appModule('webviewer');
        
        bard.inject(this, '$controller', '$q', '$rootScope', '$timeout', '$httpBackend',
            'wvOrthancSerieAdapter', 'wvSerie');
    });

    bard.verifyNoOutstandingHttpRequests();

    xit('should convert orthanc serie containing multiframe instances to multiple wv Series', function() {
      // given
      var ortSerie = orthanc.series.withTwoMultiFrameInstances;

      // when
      var wvSeries = wvOrthancSerieAdapter.process(ortSerie);

      // then
      expect(wvSeries.length).to.equal(2);
      expect(wvSeries[0]).to.equal(50);
      expect(wvSeries[1]).to.equal(30);
    });

    it('should convert an orthanc serie (with single frames) to a wv serie', function() {
        // given
        var ortSerie = orthanc.series.withManySingleFrameInstances;
        var ortSortedInstances = orthanc.sortedInstances.withManySingleFrameInstances

        // when
        var wvSeries = wvOrthancSerieAdapter.process(ortSerie, ortSortedInstances);

        // then
        expect(wvSeries.length).to.equal(1);
        expect(wvSeries[0]).to.be.an.instanceof(wvSerie.class);
        expect(wvSeries[0].id).to.equal(ortSerie.ID);
        expect(wvSeries[0].instanceIds[5]).to.equal(ortSortedInstances.SlicesShort[5][0]);
    });

});