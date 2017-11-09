/**
 * @author mrdoob / http://mrdoob.com/
 */

Menubar.File = function ( editor ) {

	var NUMBER_PRECISION = 6;

	function parseNumber( key, value ) {

		return typeof value === 'number' ? parseFloat( value.toFixed( NUMBER_PRECISION ) ) : value;

	}

	//

	var container = new UI.Panel();
	container.setClass( 'menu' );

	var title = new UI.Panel();
	title.setClass( 'title' );
	title.setTextContent( 'File' );
	container.add( title );

	var options = new UI.Panel();
	options.setClass( 'options' );
	container.add( options );

	// New

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'New' );
	option.onClick( function () {

		if ( confirm( 'Any unsaved data will be lost. Are you sure?' ) ) {

			editor.clear();
			editor.storage.clear();
			editor.project_uuid = "";
		}

	} );
	options.add( option );

// Load/Resume State
	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Load' );
	option.onClick( function () {

		if ( confirm( 'Any unsaved data will be lost. Are you sure?' ) ) {
			fetchStates();

			document.getElementById('myModal').style.display = "block";

		}

	} );
	options.add( option );


	//

	options.add( new UI.HorizontalRule() );


	// Aircraft Dimension Variables

    var check = false;                          // set a flag to check if button already pressed

    var l, w, h;                                // initialize length, wingspan, and height variables for inputs
    var input_pane = new UI.Panel();            // create interface elements to display input option
    var l_row = new UI.Row();
    var w_row = new UI.Row();
    var h_row = new UI.Row();
    var input;                                      // initialize general input button

    var text = new UI.Text("Aircraft Dimensions");  // instruction text and spacing
    var text2 = new UI.Text("(in meters)");
	text.setMarginLeft('11px');
    text.setMarginRight('11px');
    text2.setMarginLeft('39px');
    text2.setMarginRight('39px');
    text2.setPaddingBottom('12px');

    var text_l = new UI.Text("Length:").setMarginRight('62px').setMarginLeft('4px');              // input text, area, and spacing
    var text_w = new UI.Text("Wingspan:").setMarginRight('43px').setMarginLeft('4px');
    var text_h = new UI.Text("Height (nose up):").setMarginRight('2px').setMarginLeft('4px');;
    var input_l = new UI.Number().setWidth( '30px' );
    var input_w = new UI.Number().setWidth( '30px' );
    var input_h = new UI.Number().setWidth( '30px' );

    input_pane.add(text);                       // ready all contents to be displayed once added to the main panel
    input_pane.add(text2);
	l_row.add(text_l);
    l_row.add(input_l);
    w_row.add(text_w);
    w_row.add(input_w);
    h_row.add(text_h);
    h_row.add(input_h);
    h_row.setPaddingBottom('15px');
    input_pane.add(l_row);
    input_pane.add(w_row);
    input_pane.add(h_row);


    // Import

	var form = document.createElement( 'form' );
	form.style.display = 'none';
	document.body.appendChild( form );

	var fileInput = document.createElement( 'input' );
	fileInput.type = 'file';
	fileInput.addEventListener( 'change', function ( event ) {

		editor.loader.loadFile( fileInput.files[ 0 ] );
		form.reset();

		var color = 0xffffff;                 // create spotlight when new model imported
        var intensity = 1;
        var distance = 0;
        var angle = Math.PI * 0.1;
        var penumbra = 0;

        var light = new THREE.SpotLight( color, intensity, distance, angle, penumbra );
        light.name = 'SpotLight';
        light.target.name = 'SpotLight Target';

        light.position.set( 0, 5500, 5000 );

        editor.execute( new AddObjectCommand( light ) );

	} );
	form.appendChild( fileInput );

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Import' );
	option.onClick( function () {

        if (check === true){                     // check if prior button state already displayed
            options.newInput();                  // if so, remove the display
            input_pane.remove(input);
        }
        check = true;                            // set flag to true as new display will populate

        input = new UI.Button();                 // set input button spacing and function
        input.setMarginLeft('42px');
        input.setClass("input");
        input.setTextContent("Enter");
        input.onClick( function () {

            l = input_l.getValue();              // store entered values and set internal model dimensions
            w = input_w.getValue();
            h = input_h.getValue();
            editor.setModelDimensions(l, w, h);

            fileInput.click();                   // import the model

            input_pane.remove(input);    // remove additional input display
            options.newInput();
            check = false;
        } );

        input_pane.add(input);           // add input display to menubar panel
		options.remove(opt1);
		options.remove(opt2);
        options.add(input_pane);

	} );

	options.add( option );

	//

	options.add( new UI.HorizontalRule() );

	/*
	// Export Geometry

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export Geometry' );
	option.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( 'No object selected.' );
			return;

		}

		var geometry = object.geometry;

		if ( geometry === undefined ) {

			alert( 'The selected object doesn\'t have geometry.' );
			return;

		}

		var output = geometry.toJSON();

		try {

			output = JSON.stringify( output, parseNumber, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'geometry.json' );

	} );
	options.add( option );

	*/

	// Export Object

	var opt1 = new UI.Row();
	opt1.setClass( 'option' );
	opt1.setTextContent( 'Export Object' );
	opt1.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( 'No object selected' );
			return;

		}

		var output = object.toJSON();

		try {

			output = JSON.stringify( output, parseNumber, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'model.json' );

	} );
	options.add( opt1 );

	// Export

	var opt2 = new UI.Row();
	opt2.setClass( 'option' );
	opt2.setTextContent( 'Export Scene' );
	opt2.onClick( function () {

		var output = editor.scene.toJSON();

		try {

			output = JSON.stringify( output, parseNumber, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'scene.json' );

	} );
	options.add( opt2 );

	//

	/*
	options.add( new UI.HorizontalRule() );

	// Export GLTF

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export GLTF' );
	option.onClick( function () {

		var exporter = new THREE.GLTFExporter();

		exporter.parse( editor.scene, function ( result ) {

			saveString( JSON.stringify( result, null, 2 ), 'scene.gltf' );

		} );


	} );
	options.add( option );

	// Export OBJ

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export OBJ' );
	option.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( 'No object selected.' );
			return;

		}

		var exporter = new THREE.OBJExporter();

		saveString( exporter.parse( object ), 'model.obj' );

	} );
	options.add( option );

	// Export STL

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export STL' );
	option.onClick( function () {

		var exporter = new THREE.STLExporter();

		saveString( exporter.parse( editor.scene ), 'model.stl' );

	} );
	options.add( option );

	//

	options.add( new UI.HorizontalRule() );

	// Publish

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Publish' );
	option.onClick( function () {

		var zip = new JSZip();

		//

		var output = editor.toJSON();
		output.metadata.type = 'App';
		delete output.history;

		var vr = output.project.vr;

		output = JSON.stringify( output, parseNumber, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		zip.file( 'app.json', output );

		//

		var manager = new THREE.LoadingManager( function () {

			save( zip.generate( { type: 'blob' } ), 'download.zip' );

		} );

		var loader = new THREE.FileLoader( manager );
		loader.load( 'js/libs/app/index.html', function ( content ) {

			var includes = [];

			if ( vr ) {

				includes.push( '<script src="js/WebVR.js"></script>' );

			}

			content = content.replace( '<!-- includes -->', includes.join( '\n\t\t' ) );

			zip.file( 'index.html', content );

		} );
		loader.load( 'js/libs/app.js', function ( content ) {

			zip.file( 'js/app.js', content );

		} );
		loader.load( '../build/three.min.js', function ( content ) {

			zip.file( 'js/three.min.js', content );

		} );

		if ( vr ) {

			loader.load( '../examples/js/vr/WebVR.js', function ( content ) {

				zip.file( 'js/WebVR.js', content );

			} );

		}

	} );
	options.add( option );

	/*
	// Publish (Dropbox)

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Publish (Dropbox)' );
	option.onClick( function () {

		var parameters = {
			files: [
				{ 'url': 'data:text/plain;base64,' + window.btoa( "Hello, World" ), 'filename': 'app/test.txt' }
			]
		};

		Dropbox.save( parameters );

	} );
	options.add( option );
	*/


	//

	var link = document.createElement( 'a' );
	link.style.display = 'none';
	document.body.appendChild( link ); // Firefox workaround, see #6594

	function save( blob, filename ) {

		link.href = URL.createObjectURL( blob );
		link.download = filename || 'data.json';
		link.click();

		// URL.revokeObjectURL( url ); breaks Firefox...

	}

	function saveString( text, filename ) {

		save( new Blob( [ text ], { type: 'text/plain' } ), filename );

	}

    options.newInput = function(){       // reset all input values and displays
        input_l.setValue(0);
        input_w.setValue(0);
        input_h.setValue(0);
        options.remove(input_pane);
        options.add(opt1);
        options.add(opt2);
    };

	return container;

};
