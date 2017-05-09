/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.Study
 *
 * @description
 * The `Study` model represent a DICOM study.
 */
(function(osimis) {
    'use strict';

    // Replace dicom date format into standard one.
    function _convertDate(date) {
        return date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, '$1/$2/$3');
    }

    function Study(Promise, studyManager, id, tags) {
        // Injections.
        this._Promise = Promise;
        this._studyManager = studyManager;

        // Default values.
        this.id = id;
        this.tags = tags;
        this.hasBeenViewed = false;

        /**
         * @type {string}
         *
         * * gray
         * * blue
         * * red
         * * green
         * * yellow
         * * violet
         */
        this.color = 'gray';

        // Format dates in dicom tags.
        // @todo let that stuff to the view or move in external method.
        this.tags.StudyDate = this.tags.StudyDate && _convertDate(this.tags.StudyDate);
        this.tags.PatientBirthDate = this.tags.PatientBirthDate && _convertDate(this.tags.PatientBirthDate);
    }

    /**
     * @return {Promise<Array<osimis.Study>>}
     *
     * @description
     */
    Study.prototype.getRelatedStudies = function() {
        var Promise = this._Promise; 
        var studyManager = this._studyManager;

        return studyManager
            // Get related study ids.
            .getRelatedStudyIds(this.id)
            // Convert related study ids to study models.
            .then(function (studyIds) {
                var studyPromises = studyIds
                    .map(function (studyId) {
                        return studyManager.get(studyId);
                    });

                return Promise.all(studyPromises);
            });
    };

    /**
     * @ngdoc method
     * @methodOf osimis.Study
     * 
     * @name osimis.Study#setHasBeenViewed
     *
     * @param {boolean} hasBeenViewed
     * The value to set.
     * 
     * @description
     * Define wether the study has already been viewed by the end-user or not.
     * The attribute is intended to be used to toggle a 
     */
    Study.prototype.setHasBeenViewed = function(hasBeenViewed) {
        this.hasBeenViewed = hasBeenViewed;
    };


    /**
     * @ngdoc method
     * @methodOf osimis.Study
     * 
     * @name osimis.Study#setColor
     *
     * @param {string} [color='gray']
     * The color to set. Can be one of these values:
     * 
     * * gray
     * * blue
     * * red
     * * green
     * * yellow
     * * violet
     * 
     * @description
     * Define the study color. This method is mostly used to differentiate
     * studies from each others.
     */
    Study.prototype.setColor = function(color) {
        this.color = color || 'gray';
    };

    /**
     * @ngdoc method
     * @methodOf osimis.Study
     * 
     * @name osimis.Study#hasColor
     *
     * @return {boolean}
     * Return true when the color is not the default one (gray).
     * 
     * @description
     * Method used to know if a study already has a default color.
     */
    Study.prototype.hasColor = function() {
        return this.color !== 'gray';
    };

    osimis.Study = Study;

})(this.osimis || (this.osimis = {}));