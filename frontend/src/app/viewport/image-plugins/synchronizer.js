/**
 * @ngdoc object
 * @memberOf osimis
 * 
 * @name osimis.PaneManager
 *
 * @description
 * The `PaneManager` class is used to manager the content of the panes. It also
 * stores which series/report/video have been viewed.
 */
(function(osimis) {
    'use strict';

    function Synchronizer(Promise, wvPaneManager) {
        // Injections.
        this._Promise = Promise;
        this._wvPaneManager = wvPaneManager;
        this._enabled = true;
        this._offsets = {};
    }

    Synchronizer.prototype.enable = function(enabled) {
        console.log("Synchronizer.enable() ", enabled);
        this._enabled = enabled;
        if (this._enabled) {
            this.computeOffsets();
        }
    }

    Synchronizer.prototype.computeOffsets = function() {
        // store the current offsets between slices
        var panes = this._wvPaneManager.getAllPanes();
        var this_ = this;
        if (this._enabled && panes.length > 1) {
            for (var i=0; i < panes.length; ++i) {
                for (var j=0; j < panes.length; ++j) {
                    if (i != j && panes[i].seriesId !== undefined && panes[j].seriesId !== undefined
                        && panes[i].seriesId != panes[j].seriesId) {

                        this.updateOffsetBetweenPanes(panes[i], panes[j]);
                    }
                }
            }
        }
        console.log(this._offsets);
    }

    Synchronizer.prototype.updateOffsetBetweenPanes = function(paneA, paneB) {

        if (paneA.series.isSameOrientationAs(paneB.series)) {

            if (!(paneA.seriesId in this._offsets)) {
                this._offsets[paneA.seriesId] = {};    
            }

            var this_ = this;
            paneB.series.getCurrentImagePromise().then(function(imageB) {
                paneA.series.getCurrentImagePromise().then(function(imageA) {

                    var offset = imageB.tags.SliceLocation - imageA.tags.SliceLocation;
                    if (Math.abs(offset) <= imageA.tags.SliceThickness) {
                        offset = 0; // if the offset is smaller than a slice, there is no "intention" to have an offset
                    }

                    this_._offsets[paneA.seriesId][paneB.seriesId] = offset;

                });
            });
        } else {
            delete this._offsets[paneA.seriesId];
        }
    }

    Synchronizer.prototype.getOffsetBetweenPanes = function(seriesAId, seriesBId) {
        if (seriesAId in this._offsets && seriesBId in this._offsets[seriesAId]) {
            return this._offsets[seriesAId][seriesBId];
        } else {
            return 0;
        }

    }

    Synchronizer.prototype.isEnabled = function() {
        return this._enabled;
    }

    Synchronizer.prototype.update = function(series) {
        var panes = this._wvPaneManager.getAllPanes();
        var this_ = this;

        if (this._enabled && panes.length > 1) {
            series.getCurrentImagePromise().then(function(currentImage) {
                var currentSliceLocation = parseFloat(currentImage.tags.SliceLocation);
                for (var i=0; i < panes.length; ++i) {
                    if (panes[i].seriesId !== undefined && panes[i].seriesId != series.id && panes[i].series.isSameOrientationAs(series)) {
                        // console.log("Found a series with same orientation in pane " + i, panes[i].series);
                        panes[i].series.getIndexOfClosestImageFrom(currentSliceLocation + this_.getOffsetBetweenPanes(series.id, panes[i].seriesId))
                            .then(function(closestIndexResponse) {
                                //console.log("Closest index is " + closestIndexResponse.closestIndex);
                                //console.log(closestIndexResponse.series);
                                closestIndexResponse.series.goToImage(closestIndexResponse.closestIndex);
                        });
                    }
                }
            });
        }

    }


    angular
        .module('webviewer')
        .factory('wvSynchronizer', wvSynchronizer);

    /* @ngInject */
    function wvSynchronizer($q, wvPaneManager) {
        return new Synchronizer($q, wvPaneManager);
    }
})(osimis || (this.osimis = {}));