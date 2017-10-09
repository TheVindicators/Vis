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

	// Antenna       ||WORK IN PROGRESS.....||
    /*
    var option = new UI.Row();
    option.setClass( 'option' );
    option.setTextContent( 'Import Model' );
    option.onClick( function () {

        var loader = new THREE.ObjectLoader();
        loader.load('Antenna.json',
            function ( object ) {
               scene.add( object );
            }
        );
    } );
    options.add( option );
    */

    // Antenna (Rod)

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Antenna (Rod)' );
    option.onClick( function () {

        var radiusTop = 7;
		var radiusBottom = 7;
		var height = 170;
		var radiusSegments = 32;
		var heightSegments = 1;
		var openEnded = false;

		var geometry = new THREE.CylinderBufferGeometry( radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded );
		var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.name = 'Antenna (Rod) ' + ( ++ meshCount );

		editor.execute( new AddObjectCommand( mesh ) );

	} );
	options.add( option );
	
	// Antenna (Point)
	
	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Antenna (Point)' );
	option.onClick( function () {

		var radius = 15;
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

		editor.execute( new AddObjectCommand( mesh ) );

	} );
	options.add( option );
	
	return container;

};
