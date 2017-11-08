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

		fileInput.click();

	} );
	options.add( option );
	
	var xmlInput = document.createElement( 'input' );
	xmlInput.type = 'file';
	xmlInput.addEventListener( 'change', function ( event ) {
		
		var filename = (xmlInput.files[ 0 ].name);
		var extension = filename.split( '.' ).pop().toLowerCase();
		
		if(extension === 'xml'){
			var reader = new FileReader();
			reader.addEventListener( 'load', function ( event ) {
				var xmlString = event.target.result;
			
				xmlString = xmlString.replace(/\t/g, "");
				xmlString = xmlString.replace(/<|>/g, " ");
				xmlString = xmlString.split(/[\r\n]+/g);
				for(var i = 0; i < xmlString.length; i++){
					xmlString[i] = xmlString[i].substr(1);
					xmlString[i] = xmlString[i].split(" ");
				}
			
				var pos = 0;
				while(xmlString[pos][0] !== "Antennas"){
					pos++;
				}
			
				if(xmlString[pos][0] === "Antennas"){
					while(xmlString[pos][0] !== "/Antennas"){
						if(xmlString[pos][0] === "Antenna"){
							x = xmlString[pos+3][1];             // store entered values
							y = xmlString[pos+4][1];
							z = xmlString[pos+5][1];

							var x_nose = editor.getModel()[4];                // convert entered values to meters coordinate system
							var x_tail = editor.getModel()[5];
							var x_slope = ( x_nose - x_tail ) / editor.getModelLength();
	
							var z_nose = editor.getModel()[3];
							var z_tail = editor.getModel()[2];
							var z_slope = ( z_nose - z_tail ) / editor.getModelHeight();
	
							var right_wing = editor.getModel()[0];
							var left_wing = editor.getModel()[1];
							var y_slope = ( right_wing - left_wing ) / editor.getModelWingspan();
	
							var x_NG = y * y_slope;
							var y_NG = ( z * z_slope ) + z_nose;
							var z_NG = x_nose + ( x * x_slope );
	
							var radius = ( right_wing - left_wing ) / 180;      // create sphere object according to model size
							var widthSegments = 32;
							var heightSegments = 16;
							var phiStart = 0;
							var phiLength = Math.PI * 2;
							var thetaStart = 0;
							var thetaLength = Math.PI;
	
							var geometry = new THREE.SphereBufferGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength );
							var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
							var mesh = new THREE.Mesh( geometry, material );
							mesh.name = xmlString[pos+1][1];;
							mesh.type = 'Antenna';
	
							editor.execute( new SetPositionCommand( mesh, new THREE.Vector3( x_NG, y_NG, z_NG ) ) );     // move object to desired coordinates

							editor.execute( new AddObjectCommand( mesh ) );        // add object to scene
						
						}
						pos++;
					}
				}	
			
			}, false );
			reader.readAsText( xmlInput.files[ 0 ] );
		} else {
			alert('Unsupported file format (' + extension +  ').');
		}
		form.reset();

	} );
	form.appendChild( xmlInput );
	
	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Import Antennas' );
	option.onClick( function () {

		xmlInput.click();

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

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export Object' );
	option.onClick( function () {

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
	options.add( option );

	// Export

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export Scene' );
	option.onClick( function () {

		var output = editor.scene.toJSON();

		try {

			output = JSON.stringify( output, parseNumber, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'scene.json' );

	} );
	options.add( option );
	
	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Export Antennas' );
	option.onClick( function () {
		var output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
		var objects = editor.scene.children
		
        var right_wing = editor.getModel()[0];              // convert three.js coordinates back to meters for display
        var left_wing = editor.getModel()[1];
        var y_slope = ( right_wing - left_wing ) / editor.getModelWingspan();
		
		var z_nose = editor.getModel()[3];
        var z_tail = editor.getModel()[2];
        var z_slope = ( z_nose - z_tail ) / editor.getModelHeight();
		
		var x_nose = editor.getModel()[4];
        var x_tail = editor.getModel()[5];
        var x_slope = ( x_nose - x_tail ) / editor.getModelLength();
		
		output += "<Antennas>\n"
		for ( var i = 0, l = objects.length; i < l; i ++ ) {
			var object = objects[ i ];

			if(object.type === 'Antenna'){
				output += "\t<Antenna>\n";
				output += "\t\t<Name>" + object.name + "</Name>\n";
				
				output += "\t\t<Coordinates>\n"
				output += "\t\t\t<X>" + (Math.round((( object.position.z - x_nose ) / x_slope) * 100) / 100) + "</X>\n";
				output += "\t\t\t<Y>" + (Math.round((object.position.x / y_slope) * 100) / 100) + "</Y>\n";
				output += "\t\t\t<Z>" + (Math.round((( object.position.y - z_nose ) / z_slope) * 100) / 100) + "</Z>\n";
				output += "\t\t</Coordinates>\n"
				
				output += "\t</Antenna>\n";
			}
		}
		output += "</Antennas>";
		saveString(output, 'Antennas.xml');
	} );
	options.add( option );
		//var output = editor.scene.children

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

	return container;

};
