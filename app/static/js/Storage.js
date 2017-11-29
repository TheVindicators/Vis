/**
 * @author mrdoob / http://mrdoob.com/
 */

var Storage = function () {

  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  if ( indexedDB === undefined  ) {

    console.warn( 'Storage: IndexedDB not available.' );
    return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };

  }

  var name = 'threejs-editor';
  var version = 1;

  var database;

  return {

    init: function ( callback ) {

      var request = indexedDB.open( name, version );
      request.onupgradeneeded = function ( event ) {

        var db = event.target.result;

        if ( db.objectStoreNames.contains( 'states' ) === false ) {

          db.createObjectStore( 'states' );

        }

      };
      request.onsuccess = function ( event ) {

        database = event.target.result;

        callback();

      };
      request.onerror = function ( event ) {

        console.error( 'IndexedDB', event );

      };


    },

    get: function ( uuid, callback ) {

      if (uuid != "None") {
        $.ajax({
           url: '/rest/resume_state/' + uuid,
           data: {
              format: 'json'
           },
           dataType: 'json',
           success: function (data) {
             callback(data);
           },
           type: 'GET'
        });
      } else {
        var transaction = database.transaction( [ 'states' ], 'readwrite' );
        var objectStore = transaction.objectStore( 'states' );

        var request = objectStore.get( 0 );
        request.onsuccess = function ( event ) {
          callback( event.target.result );
        };
      }




    },

    set: function ( data, callback ) {

      var start = performance.now();
      $.ajax({
        url: '/rest/save_state',
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        success: function(data) {
          if ( data.results == "SUCCESS" ) {
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to server as UUID', data.uuid, ( performance.now() - start ).toFixed( 2 ) + 'ms');
            if ( editor.project_uuid == "" ) {
              editor.project_uuid = data.uuid; //Set the initial UUID if this the first save-state for this session.
            }
          } else {
              if (data.reason == "IOERROR") {
                // The server had a disk or permissions error. Let the user know
                if (data.error == 13) { // No permission
                  console.error('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Failed to save state to server. The server doesn\'t have permission to write to disk.');
                } else if (data.error == 28) { // Disk full
                  console.error('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Failed to save state to server. The server doesn\'t have enough space to save to disk.');
                } else { //Other IO error
                  console.error('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Failed to save state to server. There was an I/O Error.', data.errorstring);
                }
              } else { // Other error
                console.error('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Failed to save state to server.', data.reason, data.error);
              }
            }
        },
        error: function() {
          console.error('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Failed to save state to server. ');
        },
        type: 'POST'
      });

      var transaction = database.transaction( [ 'states' ], 'readwrite' );
      var objectStore = transaction.objectStore( 'states' );
      var request = objectStore.put( data, 0 );


      request.onsuccess = function ( event ) {

        console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );

      };

    },

    clear: function () {

      if ( database === undefined ) return;

      var transaction = database.transaction( [ 'states' ], 'readwrite' );
      var objectStore = transaction.objectStore( 'states' );
      var request = objectStore.clear();
      request.onsuccess = function ( event ) {

        console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Cleared IndexedDB.' );

      };

    }

  };

};
