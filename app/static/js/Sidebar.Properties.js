/**
 * @author mrdoob / http://mrdoob.com/
 */

Sidebar.Properties = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Span();

	var objectTab = new UI.Text( 'OBJECT' ).onClick( onClick );

	var tabs = new UI.Div();
	tabs.setId( 'tabs' );
	tabs.add( objectTab );
	container.add( tabs );

	function onClick( event ) {

		select( event.target.textContent );

	}

	//

	var object = new UI.Span().add(
		new Sidebar.Object( editor )
	);
	container.add( object );

	//

	return container;

};
