/**
 * @author mrdoob / http://mrdoob.com/
 */

Menubar.Help = function ( editor ) {

	var container = new UI.Panel();
	container.setClass( 'menu' );

	var title = new UI.Panel();
	title.setClass( 'title' );
	title.setTextContent( 'Help' );
	container.add( title );

	var options = new UI.Panel();
	options.setClass( 'options' );
	container.add( options );

	// Source code

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'Source code' );
	option.onClick( function () {

		window.open( 'https://github.com/mrdoob/three.js/tree/master/editor', '_blank' );

	} );
	//options.add( option );

	// How To

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'How To Use' );
	option.onClick( function () {

        document.getElementById('readme').style.display = "block";
        var but = document.getElementById('input');
        but.onclick = function () {
            document.getElementById('readme').style.display = "none";
        }

	} );
	options.add( option );

    // Downloads

    var option = new UI.Row();
    option.setClass( 'option' );
    option.setTextContent( 'Download Models' );
    option.onClick( function () {

        window.open( 'https://github.com/TheVindicators/Vis/tree/master/misc/models' );

    } );
    options.add( option );
    options.add( new UI.HorizontalRule() );


    // Report Issues

    var option = new UI.Row();
    option.setClass( 'option' );
    option.setTextContent( 'Report Issues' );
    option.onClick( function () {

        window.open( 'https://github.com/TheVindicators/Vis/issues' );

    } );
    options.add( option );

    // Feedback

    var option = new UI.Row();
    option.setClass( 'option' );
    option.setTextContent( 'Leave Feedback' );
    option.onClick( function () {

        window.open( 'https://docs.google.com/forms/d/e/1FAIpQLSd-ruWSfoWmraXibXSOOzVwI7VNOERSUqEyeJ8dPQ_XdbOv8g/viewform?usp=sf_link' );

    } );
    options.add( option );

	return container;

};
