/**
 * @author mrdoob / http://mrdoob.com/
 */

var Editor = function () {

	this.DEFAULT_CAMERA = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
	this.DEFAULT_CAMERA.name = 'Camera';
	this.DEFAULT_CAMERA.position.set( 20, 10, 20 );
	this.DEFAULT_CAMERA.lookAt( new THREE.Vector3() );
	this.project_uuid = "";

    var Signal = signals.Signal;

	this.signals = {

		// script

		editScript: new Signal(),

		// player

		startPlayer: new Signal(),
		stopPlayer: new Signal(),

		// actions

		showModal: new Signal(),

		// notifications

		editorCleared: new Signal(),

		savingStarted: new Signal(),
		savingFinished: new Signal(),

		themeChanged: new Signal(),

		transformModeChanged: new Signal(),
		snapChanged: new Signal(),
		spaceChanged: new Signal(),
		rendererChanged: new Signal(),

		sceneBackgroundChanged: new Signal(),
		sceneFogChanged: new Signal(),
		sceneGraphChanged: new Signal(),

		cameraChanged: new Signal(),

		geometryChanged: new Signal(),

		objectSelected: new Signal(),
		objectFocused: new Signal(),

		objectAdded: new Signal(),
		objectChanged: new Signal(),
		objectRemoved: new Signal(),

		helperAdded: new Signal(),
		helperRemoved: new Signal(),

		materialChanged: new Signal(),

		scriptAdded: new Signal(),
		scriptChanged: new Signal(),
		scriptRemoved: new Signal(),

		windowResize: new Signal(),

		showGridChanged: new Signal(),
		refreshSidebarObject3D: new Signal(),
		historyChanged: new Signal()

	};

	this.config = new Config( 'threejs-editor' );
	this.history = new History( this );
	this.storage = new Storage();
	this.loader = new Loader( this );

	this.camera = this.DEFAULT_CAMERA.clone();

	this.scene = new THREE.Scene();
	this.scene.name = 'Scene';
	this.scene.background = new THREE.Color( 0xaaaaaa );

	this.sceneHelpers = new THREE.Scene();

	this.object = {};
	this.geometries = {};
	this.materials = {};
	this.textures = {};
	this.scripts = {};

	this.selected = null;
	this.helpers = {};

};

var length = 20;
var wingspan = 15;
var height = 5;
var x_max = 0;
var x_min = 0;
var y_max = 0;
var y_min = 0;
var z_max = 0;
var z_min = 0;
var z_short = 0;
var y_short = 0;

Editor.prototype = {

	setTheme: function ( value ) {

		document.getElementById( 'theme' ).href = value;

		this.signals.themeChanged.dispatch( value );

	},

	//

	setScene: function ( scene ) {

		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;

		if ( scene.background !== null ) this.scene.background = scene.background.clone();
		if ( scene.fog !== null ) this.scene.fog = scene.fog.clone();

		this.scene.userData = JSON.parse( JSON.stringify( scene.userData ) );

		// avoid render per object

		this.signals.sceneGraphChanged.active = false;

		while ( scene.children.length > 0 ) {

			this.addObject( scene.children[ 0 ] );

		}

		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();

	},

	//

	addObject: function ( object ) {

		var scope = this;

		object.traverse( function ( child ) {

			if ( child.geometry !== undefined ) scope.addGeometry( child.geometry );
			if ( child.material !== undefined ) scope.addMaterial( child.material );

			scope.addHelper( child );

		} );

		this.scene.add( object );

		this.signals.objectAdded.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	moveObject: function ( object, parent, before ) {

		if ( parent === undefined ) {

			parent = this.scene;

		}

		parent.add( object );

		// sort children array

		if ( before !== undefined ) {

			var index = parent.children.indexOf( before );
			parent.children.splice( index, 0, object );
			parent.children.pop();

		}

		this.signals.sceneGraphChanged.dispatch();

	},

	nameObject: function ( object, name ) {

		object.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	removeObject: function ( object ) {

		if ( object.parent === null ) return; // avoid deleting the camera or scene

		var scope = this;

		object.traverse( function ( child ) {

			scope.removeHelper( child );

		} );

		object.parent.remove( object );

		this.signals.objectRemoved.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	addGeometry: function ( geometry ) {

		this.geometries[ geometry.uuid ] = geometry;

	},

	setGeometryName: function ( geometry, name ) {

		geometry.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addMaterial: function ( material ) {

		this.materials[ material.uuid ] = material;

	},

	setMaterialName: function ( material, name ) {

		material.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addTexture: function ( texture ) {

		this.textures[ texture.uuid ] = texture;

	},

	//

	addHelper: function () {

		var geometry = new THREE.SphereBufferGeometry( 2, 4, 2 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000, visible: false } );

		return function ( object ) {

			var helper;

			if ( object instanceof THREE.Camera ) {

				helper = new THREE.CameraHelper( object, 1 );

			} else if ( object instanceof THREE.PointLight ) {

				helper = new THREE.PointLightHelper( object, 1 );

			} else if ( object instanceof THREE.DirectionalLight ) {

				helper = new THREE.DirectionalLightHelper( object, 1 );

			} else if ( object instanceof THREE.SpotLight ) {

				helper = new THREE.SpotLightHelper( object, 1 );

			} else if ( object instanceof THREE.HemisphereLight ) {

				helper = new THREE.HemisphereLightHelper( object, 1 );

			} else if ( object instanceof THREE.SkinnedMesh ) {

				helper = new THREE.SkeletonHelper( object );

			} else {

				// no helper for this object type
				return;

			}

			var picker = new THREE.Mesh( geometry, material );
			picker.name = 'picker';
			picker.userData.object = object;
			helper.add( picker );

			this.sceneHelpers.add( helper );
			this.helpers[ object.id ] = helper;

			this.signals.helperAdded.dispatch( helper );

		};

	}(),

	removeHelper: function ( object ) {

		if ( this.helpers[ object.id ] !== undefined ) {

			var helper = this.helpers[ object.id ];
			helper.parent.remove( helper );

			delete this.helpers[ object.id ];

			this.signals.helperRemoved.dispatch( helper );

		}

	},

	//

	addScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) {

			this.scripts[ object.uuid ] = [];

		}

		this.scripts[ object.uuid ].push( script );

		this.signals.scriptAdded.dispatch( script );

	},

	removeScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) return;

		var index = this.scripts[ object.uuid ].indexOf( script );

		if ( index !== - 1 ) {

			this.scripts[ object.uuid ].splice( index, 1 );

		}

		this.signals.scriptRemoved.dispatch( script );

	},

	getObjectMaterial: function ( object, slot ) {

		var material = object.material;

		if ( Array.isArray( material ) ) {

			material = material[ slot ];

		}

		return material;

	},

	setObjectMaterial: function ( object, slot, newMaterial ) {

		if ( Array.isArray( object.material ) ) {

			object.material[ slot ] = newMaterial;

		} else {

			object.material = newMaterial;

		}

	},

	//

	select: function ( object ) {
		if ( this.selected === object ) return;
		
		if(this.scene == object || this.scene === object.parent){
			var uuid = null;

			if ( object !== null ) {
	
				uuid = object.uuid;
	
			}

			this.selected = object;

			this.config.setKey( 'selected', uuid );
			this.signals.objectSelected.dispatch( object );
			
		} else {
			var uuid = null;

			if ( object.parent !== null ) {
	
				uuid = object.parent.uuid;
	
			}

			this.selected = object.parent;

			this.config.setKey( 'selected', uuid );
			this.signals.objectSelected.dispatch( object.parent );
		}
	},

	selectById: function ( id ) {

		if ( id === this.camera.id ) {

			this.select( this.camera );
			return;

		}

		this.select( this.scene.getObjectById( id, true ) );

	},

	selectByUuid: function ( uuid ) {

		var scope = this;

		this.scene.traverse( function ( child ) {

			if ( child.uuid === uuid ) {

				scope.select( child );

			}

		} );

	},

	deselect: function () {

		this.select( null );

	},

	focus: function ( object ) {

		this.signals.objectFocused.dispatch( object );

	},

	focusById: function ( id ) {

		this.focus( this.scene.getObjectById( id, true ) );

	},

	clear: function () {

		this.history.clear();
		this.storage.clear();

		this.camera.copy( this.DEFAULT_CAMERA );
		this.scene.background.setHex( 0xaaaaaa );
		this.scene.fog = null;

		var objects = this.scene.children;

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		this.deselect();

		this.signals.editorCleared.dispatch();
        length = 20;
        wingspan = 15;
        height = 5;
        x_max = 0;
        x_min = 0;
        y_max = 0;
        y_min = 0;
        z_max = 0;
        z_min = 0;

	},

	//

	fromJSON: function ( json ) {

		var loader = new THREE.ObjectLoader();

		// backwards

		if ( json.scene === undefined ) {

			this.setScene( loader.parse( json ) );
			return;

		}

		var camera = loader.parse( json.camera );
		this.project_uuid = json.project.uuid;
		this.camera.copy( camera );
		this.camera.aspect = this.DEFAULT_CAMERA.aspect;
		this.camera.updateProjectionMatrix();

		this.history.fromJSON( json.history );
		this.scripts = json.scripts;

		this.setScene( loader.parse( json.scene ) );

	},

	toJSON: function () {

		// scripts clean up

		var scene = this.scene;
		var scripts = this.scripts;

		for ( var key in scripts ) {

			var script = scripts[ key ];

			if ( script.length === 0 || scene.getObjectByProperty( 'uuid', key ) === undefined ) {

				delete scripts[ key ];

			}

		}

		//

		return {

			metadata: {},
			project: {
				uuid: this.project_uuid,
				gammaInput: this.config.getKey( 'project/renderer/gammaInput' ),
				gammaOutput: this.config.getKey( 'project/renderer/gammaOutput' ),
				shadows: this.config.getKey( 'project/renderer/shadows' ),
				vr: this.config.getKey( 'project/vr' )
			},
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			scripts: this.scripts,
			history: this.history.toJSON()

		};

	},

	objectByUuid: function ( uuid ) {

		return this.scene.getObjectByProperty( 'uuid', uuid, true );

	},

	execute: function ( cmd, optionalName ) {

		this.history.execute( cmd, optionalName );

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	},

	getModelLength: function() {                           // return model length

        return length;

    },

    getModelWingspan: function() {                         // return model wingspan

        return wingspan;

    },

    getModelHeight: function() {                           // return model height (nose up)

        return height;

    },

    setModelDimensions: function( len, wing, heigh ) {     // set input model dimensions

		length = len;
		wingspan = wing;
		height = heigh;

    },

    setModel: function ( geo ){

        for ( var i = 0; i < geo.children.length; i++ ){          // loop through each vertex of the model
            var type = geo.children[i].geometry;
            if ( type.type === "BufferGeometry" ) {               // check if object makeup is of type "BufferGeometry"
                var next = type.attributes.position.array;
                for (var j = 0; j < next.length; j = j + 3) {
                    if ( next[j] > x_max ) {                      // store the max and min value on each axis
                        x_max = next[j];
                    }
                    if ( next[j] < x_min ) {
                        x_min = next[j];
                    }
                    if ( next[j + 1] > y_max ) {
                        y_max = next[j + 1];
                    }
                    if ( next[j + 1] < y_min ) {
                    	y_min = next[j + 1];
					}
                    if ( next[j + 2] > z_max ) {
                        z_max = next[j + 2];
                        y_short = next[j + 1];                    // for a converted zero base for z, store the associated minimum at the nose of the model
                }
                    if ( next[j + 2] < z_min ) {
                    	z_min = next[j + 2];
                        z_short = next[j + 1];
					}
                }
            }
            else if ( type.type === "Geometry" ){                 // check if makeup is of type "Geometry"
                var next = type.vertices;                         // perform same steps as "BufferGeometry"
                for ( var j = 0; j < next.length; j++ ) {
                    if ( next[j].x > x_max ) {
                        x_max = next[j].x;
                    }
                    if ( next[j].x < x_min ) {
                        x_min = next[j].x;
                    }
                    if ( next[j].y > y_max ) {
                        y_max = next[j].y;
                    }
                    if ( next[j].y < y_min ) {
                        y_min = next[j].y;
                    }
                    if ( next[j].z > z_max ) {
                        z_max = next[j].z;
                        y_short = next[j].y;
                    }
                    if ( next[j].z < z_min ) {
                    	z_min = next[j].z;
                        z_short = next[j].y;
					}
                }
            }
        }

        if ( geo.name === "A-10 Thunderbolt II" ){                // since A-10 model generates backwards, flip z axis results

        	var temp = z_max;
        	z_max = ( z_min * -1 ) - .2;
        	z_min = temp * -1;
        	y_min = z_short + .4;                                 // set y minimum

        	var newRotation = new THREE.Euler( 0, 180 * THREE.Math.DEG2RAD, 0 );          // rotate model accordingly
            this.execute( new SetRotationCommand( geo, newRotation ) );

		}
		else {
        	y_min = y_short;               // for all other models set y minimum
		}

        x_max = geo.scale.x * x_max;       // scale each value according to the model's preset scale
        x_min = geo.scale.x * x_min;
        y_max = geo.scale.y * y_max;
        y_min = geo.scale.y * y_min;
        z_max = geo.scale.z * z_max;
        z_min = geo.scale.z * z_min;



    },

    getModel: function (){                 // return all axis extreme values

        var array = new Object();
        array[0] = x_max;
        array[1] = x_min;
        array[2] = y_max;
        array[3] = y_min;
        array[4] = z_max;
        array[5] = z_min;
        return array;

    }


};
