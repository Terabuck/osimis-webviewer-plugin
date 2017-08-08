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
    function wvKeyboardShortcutEventManager(){
        keyboardJS.setContext('viewerShortcut');
        var service = {
            down: createEvent('down'),
            up: createEvent('up'),
            left: createEvent('left'),
            right: createEvent('right'),
            majUp: createEvent('shift + up'),
            majDown: createEvent('shift + down'),
        };
        return service

        ////////////

        function createEvent(keyboardCode){
            var listener = new osimis.Listener();

            keyboardJS.bind(keyboardCode, function(e){
                console.log('keyCode', keyboardCode, 'isTrigerred');
                listener.trigger(e);
            });

            return listener;
        }
    }

})(this.osimis || (this.osimis = {}))