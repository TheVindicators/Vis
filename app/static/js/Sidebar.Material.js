/**
 * @author mrdoob / http://mrdoob.com/
 */

Sidebar.Material = function ( editor ) {

  var signals = editor.signals;

  var currentObject;

  var container = new UI.Panel();
  container.setBorderTop( '0' );
  container.setPaddingTop( '20px' );

  // wireframe

  var materialWireframeRow = new UI.Row();
  var materialWireframe = new UI.Checkbox( false ).onChange( update );

  materialWireframeRow.add( new UI.Text( 'Wireframe' ).setWidth( '90px' ) );
  materialWireframeRow.add( materialWireframe );

  container.add( materialWireframeRow );

  //
  
  

  function update() {
    
    var currentObject = editor.selected;
    
    if (currentObject) {
      
      //if ( (editor.getObjectMaterial((currentObject.children)[0])).wireframe !== undefined && (editor.getObjectMaterial((currentObject.children)[0])).wireframe !== materialWireframe.getValue() ) {

      //editor.execute( new SetMaterialValueCommand( (currentObject.children)[3], 'wireframe', materialWireframe.getValue()) );
      //editor.execute( new SetMaterialValueCommand( (currentObject.children)[7], 'wireframe', materialWireframe.getValue()) );
      
      var cmds = [];
      var objects = currentObject.children;
      var object

      for ( var i = 0, l = objects.length; i < l; i ++ ) {

        object = objects[ i ];
        
        //var material = editor.getObjectMaterial(object)
        
        //if ( material.wireframe !== undefined && material.wireframe !== materialWireframe.getValue() ) {
          
        cmds.push(new SetMaterialValueCommand( object, 'wireframe', materialWireframe.getValue()));

        //editor.execute( new SetMaterialValueCommand( object, 'wireframe', materialWireframe.getValue()) );

        //}

      }

      editor.execute( new MultiCmdsCommand(cmds), 'wireframe' );

      //}
      refreshUI();

    }

    if ( textureWarning ) {

      console.warn( "Can't set texture, model doesn't have texture coordinates" );

    }

  }


  function refreshUI( resetTextureSelectors ) {

    if ( ! currentObject ) return;

    var material = currentObject.material;

    material = editor.getObjectMaterial( currentObject );

    if ( material.wireframe !== undefined ) {

      materialWireframe.setValue( material.wireframe );

    }
  }

  // events

  signals.objectSelected.add( function ( object ) {

      var objectChanged = object;

      currentObject = object;
      refreshUI( objectChanged );
      container.setDisplay( '' );

  } );

  signals.materialChanged.add( function () {

    refreshUI();

  } );

  return container;

};
