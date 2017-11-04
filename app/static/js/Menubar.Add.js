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

	// Antenna
	
	var option = new UI.Row();                    // basic point for antenna representation
	option.setClass( 'option' );
	option.setTextContent( 'Antenna' );
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


            var material = new THREE.MeshBasicMaterial( {color: 0xffffff, vertexColors: THREE.FaceColors} );
            var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength );
            for ( var i = 0; i < geometry.faces.length; i++ ){
                var face = geometry.faces[i];
                if ( i < 96 ) {
                    face.color.setRGB( 0, 0, 256 );
                }
                else {
                	face.color.setRGB( 256, 0, 0 );
	    		}
            }
            var mesh = new THREE.Mesh( geometry, material );
            mesh.name = 'Antenna' + ( ++meshCount );

            editor.execute( new SetPositionCommand( mesh, new THREE.Vector3( x_NG, y_NG, z_NG ) ) );     // move object to desired coordinates

            editor.execute( new AddObjectCommand( mesh ) );        // add object to scene

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
