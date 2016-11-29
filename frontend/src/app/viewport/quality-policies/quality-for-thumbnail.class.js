/**
 * @ngdoc class
 *
 * @name QualityForDiagnosis
 * 
 * @description
 * Don't display lowest qualities when better ones are already cached: for
 * instance if lossless is already available in cache, don't download thumbnail
 * again.
 * 
 * See `quality-policy.interface.js`.
 */
(function(osimis) {
    'use strict';

    function QualityForThumbnail() {
        // @warning The server always provides LOW as an available quality
        //          so there is no need to check, however this may change..
        // @todo check LOW quality is available for the current image
        return [
            osimis.quality.LOW
        ];
    }

    osimis.QualityForThumbnail = QualityForThumbnail;

})(this.osimis || (this.osimis = {}));
