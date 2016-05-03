(function(module) {
	'use strict';

	/** class ImageBinaries
	 *
	 * Manage the different resolutions of binaries for one specific image
	 * usage:
	 * - repository set the loading policy
	 * - user can use getImage to retrieve specific format
	 * - user can user onImageLoaded to be aware when other resolutions have loaded
	 * - external systems can use loadImage to load specific resolutions (eg. for prefetching)
	 *
	 */
	function ImageBinaries(instanceId, frameIndex) {
		this._imageLoadingPolicy = noop;

		this.onImageLoaded = new osimis.Listener();
	}

	ImageBinaries.QualityLevels = {
		Raw: 0
	};

	/** used by repo **/

	/** ImageBinaries#setImageLoadingPolicy
	 *
	 * Configure how the loading is done.
	 * Should be set by the image manager.
	 *
	 * @param loadingPolicy function(qualityLevel): Promise<cornerstoneImageObject>
	 *
	 */
	ImageBinaries.prototype.setImageLoadingPolicy = function(loadingPolicy) {
		var _this = this;

		// set the image loading policy
		this._imageLoadingPolicy = loadingPolicy;
	};

	/** ImageBinaries#loadImage
	 *
	 * @param qualityLevel [Raw]
	 * @return Promise of the cornerstone image object
	 *
	 * This method is different from getImage
	 *
	 */
	ImageBinaries.prototype.loadImage = function(qualityLevel) {
		if (!qualityLevel) {
			qualityLevel = ImageBinaries.QualityLevels.Raw;
		}

		return this
			._imageLoadingPolicy(qualityLevel)
			.then(function(cornerstoneImageObject) {
				// call the onImageLoaded event
				_this.onImageLoaded.trigger(qualityLevel, cornerstoneImageObject);
				return cornerstoneImageObject;
			});;
	};

	/** ImageBinaries#getImage
	 *
	 * @param qualityLevel [Raw]
	 * @return Promise of the cornerstone image object
	 *
	 */
	ImageBinaries.prototype.getImage = function(qualityLevel) {
		if (!qualityLevel) {
			qualityLevel = ImageBinaries.QualityLevels.Raw;
		}

		return this._imageLoadingPolicy(qualityLevel);
	};

	/** ImageBinaries#onImageLoaded [Event]
	 *
	 * @param function (qualityLevel, cornerstoneImageObject)
	 *
	 */
	ImageBinaries.prototype.onImageLoaded = noop; // function(qualityLevel, cornerstoneImageObject)

	function noop() {};

	module.ImageBinaries = ImageBinaries;
})(window.osimis || (window.osimis = {}));