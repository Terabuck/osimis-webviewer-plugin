describe('configuration', function() {

    // Do not use osi.beforeEach and osi.afterEach so we can manually set app settings.
    
    describe('service', function() {

        it('should allow to set general http headers', function() {

            // Launch app (do not launch with osimis-helpers so we can inject our own config)
            bard.asyncModule('webviewer', 
                function(wvConfigProvider) {
                    // Just make sure we don't get any warning in the console due to version compatibility check.
                    // No need to take time to mock orthanc for this..
                    wvConfigProvider.setApiURL(window.orthancUrl || '/');
                },
                function(wvConfigProvider) {
                    // ! Set configuration during app initialization
                    wvConfigProvider.setHttpRequestHeaders({
                        'first-attempt': 'attempt number one'
                    });
                }
            );

            // Inject config
            bard.inject('wvConfig');

            // for console live debugging purpose
            window.test = this.currentTest;

            // Check the configuration at app initialization time has worked.
            assert.deepEqual(wvConfig.httpRequestHeaders, {
                'first-attempt': 'attempt number one'
            });

            // Change the configuration at run time.
            wvConfig.setHttpRequestHeaders({
                'my-header-1': 'does exists',
                'my-second-header': 'does exists as well'
            });
            
            // Expect configuration to have changed
            assert.deepEqual(wvConfig.httpRequestHeaders, {
                'my-header-1': 'does exists',
                'my-second-header': 'does exists as well'
            });

        });
        
    });

});
