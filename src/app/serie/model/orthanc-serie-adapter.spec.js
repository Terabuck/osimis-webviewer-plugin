/* jshint -W117, -W030 */
describe('serie', function() {

  describe('orthanc-serie-adapter', function () {
    beforeEach(function() {
        bard.appModule('webviewer');
        
        bard.inject(this, '$controller', '$q', '$rootScope', '$timeout', '$httpBackend',
            'wvOrthancSerieAdapter', 'wvSerie');
    });

    bard.verifyNoOutstandingHttpRequests();

    it('should convert an orthanc serie to a wv serie [singleframe]', function() {
        // load a serie with single frame instances
        var ortSerie = orthanc.series.with2SingleFrameInstances;
        var ortSortedInstances = orthanc.sortedInstances.with2SingleFrameInstances

        // convert it to our model
        var wvSeries = wvOrthancSerieAdapter.process(ortSerie, ortSortedInstances);

        expect(wvSeries.length).to.equal(1);
        expect(wvSeries[0]).to.be.an.instanceof(wvSerie.class);
        expect(wvSeries[0].id).to.equal(ortSerie.ID + ':0');

        // check there is 2 images in the serie
        expect(wvSeries[0].imageIds.length).to.equal(2);

        // check that the first instance of our serie model is the first instance of the orthanc serie
        expect(wvSeries[0].imageIds[0]).to.equal(ortSortedInstances.SlicesShort[0][0] + ':0');
    });

    it('should convert an orthanc serie to a wv serie [multiframe]', function() {
      // given
      var ortSerie = orthanc.series.with2MultiFrameInstances;
      var ortSortedInstances = orthanc.sortedInstances.with2MultiFrameInstances;

      // when
      var wvSeries = wvOrthancSerieAdapter.process(ortSerie, ortSortedInstances);

      // then
      expect(wvSeries.length).to.equal(2);
      
      // check that the first instance of the first serie is the first instance of the orthanc serie
      expect(wvSeries[0].imageIds[0]).to.equal(ortSortedInstances.SlicesShort[0][0] + ':0');
    });
  });

});
