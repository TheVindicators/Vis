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

    editor.setMenubar(options);          // store menubar configuration

  return container;

};
