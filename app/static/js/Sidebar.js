/**
 * @author mrdoob / http://mrdoob.com/
 */

var Sidebar = function ( editor ) {

	var container = new UI.Panel();
	container.setId( 'sidebar' );

	//

	var sceneTab = new UI.Text( 'SCENE' ).onClick( onClick );
	var settingsTab = new UI.Text( 'SETTINGS' ).onClick( onClick );

	var tabs = new UI.Div();
	tabs.setId( 'tabs' );
	tabs.add( sceneTab, settingsTab );
	container.add( tabs );

	function onClick( event ) {

		select( event.target.textContent );

	}

	//

	var scene = new UI.Span().add(
		new Sidebar.Scene( editor ),
		new Sidebar.Properties( editor ),
		new Sidebar.Animation( editor )
	);
	container.add( scene );

	var project = new UI.Span().add(
		new Sidebar.Project( editor )
	);

	var settings = new UI.Span().add(
		new Sidebar.Settings( editor ),
		new Sidebar.History( editor )
	);
	container.add( settings );

	//

	function select( section ) {

		sceneTab.setClass( '' );
		settingsTab.setClass( '' );

		scene.setDisplay( 'none' );
		settings.setDisplay( 'none' );

		switch ( section ) {
			case 'SCENE':
				sceneTab.setClass( 'selected' );
				scene.setDisplay( '' );
				break;
			case 'SETTINGS':
				settingsTab.setClass( 'selected' );
				settings.setDisplay( '' );
				break;
		}

	}

	select( 'SCENE' );

	return container;

};
