(function(module) {

	function KLVReader(binary) {
	    this._binary = binary;
		this._dataview = new DataView(this._binary);

		this._keys = {}
		this._parseFile();
	}

	KLVReader.prototype.get = function(key) {
		return this._keys[key];
	};

	KLVReader.prototype.getJSON = function(key) {
	    var binary = this._keys[key];
	    var str = String.fromCharCode.apply(String, binary);
	    var json = JSON.parse(str);
		return json;
	};

	KLVReader.prototype._parseFile = function() {
		this._keys = {}

		// parse the file
		for (var offset = 0; offset < this._dataview.byteLength - 1;) {
			var key = this._dataview.getUint32(offset, false);
			offset += 4;

			var length = this._dataview.getUint32(offset, false);
			offset += 4;

			var value = new Uint8ClampedArray(this._binary.slice(offset, offset + length));
			offset += length;

			this._keys[key] = value;
		}
	}

	module.KLVReader = KLVReader;

})(window);