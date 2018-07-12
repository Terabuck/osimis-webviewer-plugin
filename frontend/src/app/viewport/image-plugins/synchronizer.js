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
        this._enabled = enabled;
        if (this._enabled) {
            console.log("Synchronization is now enabled");
            this.computeOffsets();
        } else {
            console.log("Synchronization is now disabled");
        }
    }

    Synchronizer.prototype.toggle = function(enabled) {
        this.enable(!this._enabled);
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
    }

    Synchronizer.prototype.updateOffsetBetweenPanes = function(paneA, paneB) {

        if (paneA.series.isSameOrientationAs(paneB.series)) {

            if (!(paneA.seriesId in this._offsets)) {
                this._offsets[paneA.seriesId] = {};    
            }

            var this_ = this;
            paneB.series.getCurrentImagePromise().then(function(imageB) {
                paneA.series.getCurrentImagePromise().then(function(imageA) {

                    var offset = imageB.instanceInfos.TagsSubset.SliceLocation - imageA.instanceInfos.TagsSubset.SliceLocation;
                    if (Math.abs(offset) <= imageA.instanceInfos.TagsSubset.SliceThickness) {
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

    Synchronizer.prototype.getListOfSynchronizedPanes = function(series) {
        var toReturn = [];
        var panes = this._wvPaneManager.getAllPanes();

        if (this._enabled && panes.length > 1 && series.hasSlices()) {
            for (var i=0; i < panes.length; ++i) {
                if (panes[i].seriesId !== undefined && panes[i].seriesId != series.id && panes[i].series.hasSlices()) {

                    if (panes[i].series.isSameOrientationAs(series)) {
                        toReturn.push(panes[i]);
                    }
                }
            }
        }

        return toReturn;
    }

    Synchronizer.prototype.update = function(series) {
        var this_ = this;

        // console.log("updating synchro");
        if (this._enabled) {
            series.getCurrentImagePromise().then(function(currentImage) {
                var currentSliceLocation = parseFloat(currentImage.instanceInfos.TagsSubset.SliceLocation);
                var panes = this_.getListOfSynchronizedPanes(series);
                for (var i = 0; i < panes.length; i++) {
                    var pane = panes[i];
                    pane.series.getIndexOfClosestImageFrom(currentSliceLocation + this_.getOffsetBetweenPanes(series.id, pane.seriesId))
                        .then(function(closestIndexResponse) {
                            //console.log("Closest index is " + closestIndexResponse.closestIndex);
                            //console.log(closestIndexResponse.series);
                            closestIndexResponse.series.goToImage(closestIndexResponse.closestIndex);
                    });
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