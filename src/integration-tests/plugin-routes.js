(function() {
'use strict';

/* Test the C++ plugin routes behavior
 *
 * Requires an orthanc server + plugin with data pack 2
 *
 */

angular
	.module('integration-tests')
	.run(function(wvImageBinaryManager, WvImageQualities) {
		var id;

		console.log('test: 256*256 image');

		// given a 256*256 image
		id = 'bdeab30e-986c0ee4-d1123df2-e020a054-df116e87:0'

		// when we gather the low quality version
		wvImageBinaryManager
		.get(id, WvImageQualities.LOW)

		// the server should refuse the request (because only HQ quality is available)
		.then(function() {
			// test failed
			$('body').append(0);
			console.log('failed');
		}, function() {
			// test succeed
			$('body').append(1);
			console.log('succeed');
		});

	});
})();