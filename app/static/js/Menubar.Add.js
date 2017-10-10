/**
 * @author mrdoob / http://mrdoob.com/
 */

Menubar.Add = function ( editor ) {

	var container = new UI.Panel();
	container.setClass( 'menu' );

	var title = new UI.Panel();
	title.setClass( 'title' );
	title.setTextContent( 'Add' );
	container.add( title );

	var options = new UI.Panel();
	options.setClass( 'options' );
	container.add( options );

	//

	var meshCount = 0;
	var lightCount = 0;
	var cameraCount = 0;

	editor.signals.editorCleared.add( function () {

		meshCount = 0;
		lightCount = 0;
		cameraCount = 0;

	} );

    // Input Variables

    var check = false;                          // set a flag to check if button already pressed

    var x, y, z;                                // initialize x, y, and z variables for inputs
    var input_pane = new UI.Panel();            // create interface elements to display input option
    var input_row = new UI.Row();
    var filler = new UI.HorizontalRule();
    var input;                                  // initialize general input button

    var text = new UI.Text("Input Coordinates");  // instruction text and spacing
    text.setMarginLeft('18px');
    text.setMarginRight('18px');
    text.setPaddingBottom('12px');

    var text_x = new UI.Text("X:").setMarginRight('2px').setMarginLeft('4px');   // input text, area, and spacing
    var text_y = new UI.Text("Y:").setMarginRight('2px');
    var text_z = new UI.Text("Z:").setMarginRight('2px');
    var input_x = new UI.Number().setWidth( '28px' );
    var input_y = new UI.Number().setWidth( '28px' );
    var input_z = new UI.Number().setWidth( '28px' );

    input_pane.add(text);                       // ready all contents to be displayed once added to the main panel
    input_row.add(text_x);
    input_row.add(input_x);
    input_row.add(text_y);
    input_row.add(input_y);
    input_row.add(text_z);
    input_row.add(input_z);
    input_pane.add(input_row);
    input_pane.add(new UI.Break());

    // Antenna (Rod)

	var option = new UI.Row();                   // standard antenna rod
	option.setClass( 'option' );
	option.setTextContent( 'Antenna (Rod)' );
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

            x = input_x.getValue();              // store entered values
        	y = input_y.getValue();
        	z = input_z.getValue();
            var radiusTop = 7;                   // initialize cylinder object
            var radiusBottom = 7;
            var height = 170;
            var radiusSegments = 32;
            var heightSegments = 1;
            var openEnded = false;

            var geometry = new THREE.CylinderBufferGeometry( radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded );
            var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
            var mesh = new THREE.Mesh( geometry, material );
            mesh.name = 'Antenna (Rod) ' + ( ++ meshCount );

            editor.execute( new AddObjectCommand( mesh ) );     // add object to scene

            editor.execute( new SetPositionCommand( mesh, new THREE.Vector3( x, y, z ) ) );    // move object to specified coordinates

            input_pane.remove(input);     // remove additional display for input
            options.newInput();
            check = false;                // set flag to false

		});

        input_pane.add(input);            // add display to menubar panel
        options.add(filler);
    	options.add(input_pane);

	} );
	options.add( option );
	
	// Antenna (Point)
	
	var option = new UI.Row();                    // basic point for antenna representation
	option.setClass( 'option' );
	option.setTextContent( 'Antenna (Point)' );
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

            x = input_x.getValue();              // store entered values
            y = input_y.getValue();
            z = input_z.getValue();
            var radius = 15;                     // create sphere object
            var widthSegments = 32;
            var heightSegments = 16;
            var phiStart = 0;
            var phiLength = Math.PI * 2;
            var thetaStart = 0;
            var thetaLength = Math.PI;

            var geometry = new THREE.SphereBufferGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength );
            var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
            var mesh = new THREE.Mesh( geometry, material );
            mesh.name = 'Antenna (Point) ' + ( ++ meshCount );

            editor.execute( new AddObjectCommand( mesh ) );        // add object to scene

            editor.execute( new SetPositionCommand( mesh, new THREE.Vector3( x, y, z ) ) );     // move object to desired coordinates

            input_pane.remove(input);    // remove additional input display
            options.newInput();
            check = false;

        });

        input_pane.add(input);           // add display to menubar panel
        options.add(filler);
        options.add(input_pane);

	} );
	options.add( option );

	options.newInput = function(){       // reset all input values and displays
	    input_x.setValue(0);
        input_y.setValue(0);
        input_z.setValue(0);
        options.remove(input_pane);
        options.remove(filler);
    };

	return container;

};
