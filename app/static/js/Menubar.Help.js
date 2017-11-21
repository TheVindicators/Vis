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

		window.open( 'https://github.com/mrdoob/three.js/tree/master/editor', '_blank' )

	} );
	//options.add( option );

	// About

	var option = new UI.Row();
	option.setClass( 'option' );
	option.setTextContent( 'How To' );
	option.onClick( function () {

        document.getElementById('readme').style.display = "block";
        var but = document.getElementById('input');
        but.onclick = function () {
            document.getElementById('readme').style.display = "none";
        }

	} );
	options.add( option );

    editor.setMenubar(options);          // store menubar configuration

	return container;

};
