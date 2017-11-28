(function(){
    var translation = angular
        .module('webviewer.translation');
    translation.config(translateConfig);

    /* @ngInject */
    function translateConfig($translateProvider) {
        var languages = {
            en: 'english',
            fr: 'français'
        };
        // languages Key array, automatically populated set with languages object
        var keysArray = [];
        for (var key in languages){
            if(languages.hasOwnProperty(key)){
                keysArray.push(key);
            }
        }

        // load json static files instead of writing them directly in the js
        // located on the server at /languages/en.json for exemple.
        $translateProvider.useStaticFilesLoader({
            prefix: 'languages/',
            suffix: '.json'
        });

        // storage json into local storage (optimization)
        // $translateProvider.useLocalStorage();

        // default language
        $translateProvider.preferredLanguage('en');

        // make correspond different local code to our language code fr_FR to fr for exemple.
        // http://angular-translate.github.io/docs/#/guide/09_language-negotiation
        // Looks like if we don't set an object, in second argument the correspondance is automatically made
        $translateProvider.registerAvailableLanguageKeys(keysArray, {"*": "en"});

        // Enable escaping of HTML
        // see http://angular-translate.github.io/docs/#/guide/19_security
        $translateProvider.useSanitizeValueStrategy('escapeParameters');

        // use a fallback language
        $translateProvider.fallbackLanguage('en');

        // console.log('language has been set', $translateProvider)
    }
})();
