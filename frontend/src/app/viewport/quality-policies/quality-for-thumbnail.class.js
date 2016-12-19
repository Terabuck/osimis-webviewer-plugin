/**
 * @ngdoc method
 * @methodOf osimis
 *
 * @name osimis.QualityForThumbnail
 * @return {Array<osimis.quality>} List of image qualities
 * 
 * @description
 * Display LOW qualities for thumbnail viewports.
 * 
 * See the `QualityPolicy` interface.
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
