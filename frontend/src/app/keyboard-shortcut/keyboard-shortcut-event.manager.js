(function(osimis){
    'use strict';
    
    angular
        .module('webviewer')
        .factory('wvKeyboardShortcutEventManager', wvKeyboardShortcutEventManager);

    /**
     * Service that handle keyboard shortcut event and convert them into different osimis Listener
     * 
     * @Require: https://github.com/RobertWHurst/KeyboardJS
     */

    /* @ngInject */
    function wvKeyboardShortcutEventManager(wvConfig){
        keyboardJS.setContext('viewerShortcut');

        var service = {};
        for (var keyboardCode in wvConfig.keyboardShortcuts) {
            service[wvConfig.keyboardShortcuts[keyboardCode]] = createEvent(keyboardCode);
        }
        return service

        ////////////

        function createEvent(keyboardCode){
            var listener = new osimis.Listener();

            keyboardJS.bind(keyboardCode, function(e){
                console.log('keyboard shortcut listener for ', keyboardCode, ' is being triggered');
                listener.trigger(e);
            });

            return listener;
        }
    }

})(this.osimis || (this.osimis = {}));