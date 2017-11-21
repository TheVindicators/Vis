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

    this.scene.length = 0;
    this.scene.wingspan = 0;
    this.scene.height = 0;
    this.scene.x_max = 0;
    this.scene.x_min = 0;
    this.scene.y_max = 0;
    this.scene.y_min = 0;
    this.scene.z_max = 0;
    this.scene.z_min = 0;
    this.scene.z_short = 0;
    this.scene.y_short = 0;
    this.scene.antennaSnapping = false;
    this.scene.x_short = [0, 0, 0, 0];
    this.scene.y_short = [0, 0, 0, 0];
    this.scene.z_short = [0, 0, 0, 0];
    this.scene.menu = [null, null, null, null];
    this.scene.posi = [0, 0, 0, 0];
    this.scene.rota = [0, 0, 0 ,0];
    this.scene.scal = [0, 0, 0, 0];

	this.sceneHelpers = new THREE.Scene();

	this.object = {};
	this.geometries = {};
	this.materials = {};
	this.textures = {};
	this.scripts = {};

	this.selected = null;
	this.helpers = {};

};


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

	setAntennaSnapping: function (checkboxValue) {
		this.scene.antennaSnapping = checkboxValue;
	},

	//

	getAntennaSnapping: function () {
		return this.scene.antennaSnapping;
	},

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

		if(object === null || this.scene == object || this.scene === object.parent){
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

    this.scene.length = 0;
    this.scene.wingspan = 0;
    this.scene.height = 0;
    this.scene.x_max = 0;
    this.scene.x_min = 0;
    this.scene.y_max = 0;
    this.scene.y_min = 0;
    this.scene.z_max = 0;
    this.scene.z_min = 0;
    this.scene.z_short = 0;
    this.scene.y_short = 0;
    this.scene.antennaSnapping = false;
    this.scene.x_short = [0, 0, 0, 0];
    this.scene.y_short = [0, 0, 0, 0];
    this.scene.z_short = [0, 0, 0, 0];
    this.scene.menu = [null, null, null, null];
    this.scene.posi = [0, 0, 0, 0];
    this.scene.rota = [0, 0, 0 ,0];
    this.scene.scal = [0, 0, 0, 0];

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		this.deselect();

		this.signals.editorCleared.dispatch();


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

    this.setRelativeDimensions(json.project.relative_dimensions);

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
        relative_dimensions: this.getRelativeDimensions(),
				gammaInput: this.config.getKey( 'project/renderer/gammaInput' ),
				gammaOutput: this.config.getKey( 'project/renderer/gammaOutput' ),
				shadows: this.config.getKey( 'project/renderer/shadows' ),
				vr: this.config.getKey( 'project/vr' ),
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


  getRelativeDimensions: function() {
    output = {
        length: this.scene.length,
        wingspan: this.scene.wingspan,
        height: this.scene.height,
        x_max: this.scene.x_max,
        x_min: this.scene.x_min,
        y_max: this.scene.y_max,
        y_min: this.scene.y_min,
        z_max: this.scene.z_max,
        z_min: this.scene.z_min,
        z_short: this.scene.z_short,
        y_short: this.scene.y_short,
        x_short: this.scene.x_short,
        y_short: this.scene.y_short,
        z_short: this.scene.z_short
    };
    return output;
  },

  setRelativeDimensions: function(dimensions) {
    this.scene.length = dimensions.length;
    this.scene.wingspan = dimensions.wingspan;
    this.scene.height = dimensions.height;
    this.scene.x_max = dimensions.x_max;
    this.scene.x_min = dimensions.x_min;
    this.scene.y_max = dimensions.y_max;
    this.scene.y_min = dimensions.y_min;
    this.scene.z_max = dimensions.z_max;
    this.scene.z_min = dimensions.z_min;
    this.scene.z_short = dimensions.z_short;
    this.scene.y_short = dimensions.y_short;
    this.scene.x_short = dimensions.x_short;
    this.scene.y_short = dimensions.y_short;
    this.scene.z_short = dimensions.z_short;
  },

	getModelLength: function() {                           // return model length

        return this.scene.length;

    },

    getModelWingspan: function() {                         // return model wingspan

        return this.scene.wingspan;

    },

    getModelHeight: function() {                           // return model height (nose up)

        return this.scene.height;

    },

    setModelDimensions: function( len, wing, heigh ) {     // set input model dimensions

        this.scene.length = parseFloat(len);
        this.scene.wingspan = parseFloat(wing);
        this.scene.height = parseFloat(heigh);

    },

    setModel: function ( geo ){

        for ( var i = 0; i < geo.children.length; i++ ){             // check each face of the model to determine extreme points
            var type = geo.children[i].geometry;
            if ( type.type === "BufferGeometry" ) {                  // for type BufferGeometry
                var next = type.attributes.position.array;
                for (var j = 0; j < next.length; j = j + 3) {        // iterate through every third facet
                    if ( next[j] > this.scene.x_max ) {                         // if value is more or less than the highest or lowest x, y, or z: replace
                        this.scene.x_max = next[j];
                        this.scene.y_short[0] = next[j + 1];                    // store the two associated coordinates for the max/min
                        this.scene.z_short[0] = next[j + 2];
                    }
                    if ( next[j] < this.scene.x_min ) {
                        this.scene.x_min = next[j];
                        this.scene.y_short[1] = next[j + 1];
                        this.scene.z_short[1] = next[j + 2];
                    }
                    if ( next[j + 1] > this.scene.y_max ) {
                        this.scene.y_max = next[j + 1];
                        this.scene.x_short[0] = next[j];
                        this.scene.z_short[2] = next[j + 2];
                    }
                    if ( next[j + 1] < this.scene.y_min ) {
                        this.scene.y_min = next[j + 1];
                        this.scene.x_short[1] = next[j];
                        this.scene.z_short[3] = next[j + 2];
                    }
                    if ( next[j + 2] > this.scene.z_max ) {
                        this.scene.z_max = next[j + 2];
                        this.scene.x_short[2] = next[j];
                        this.scene.y_short[2] = next[j + 1];
                    }
                    if ( next[j + 2] < this.scene.z_min ) {
                        this.scene.z_min = next[j + 2];
                        this.scene.x_short[3] = next[j];
                        this.scene.y_short[3] = next[j + 1];
                    }
                }
            }
            else if ( type.type === "Geometry" ){                    // for type Geometry
                var next = type.vertices;
                for ( var j = 0; j < next.length; j++ ) {            // iterate through each coordinate set
                    if ( next[j].x > this.scene.x_max ) {
                        this.scene.x_max = next[j].x;
                        this.scene.y_short[0] = next[j].y;
                        this.scene.z_short[0] = next[j].z;
                    }
                    if ( next[j].x < this.scene.x_min ) {
                        this.scene.x_min = next[j].x;
                        this.scene.y_short[1] = next[j].y;
                        this.scene.z_short[1] = next[j].z;
                    }
                    if ( next[j].y > this.scene.y_max ) {
                        this.scene.y_max = next[j].y;
                        this.scene.x_short[0] = next[j].x;
                        this.scene.z_short[2] = next[j].z;
                    }
                    if ( next[j].y < this.scene.y_min ) {
                        this.scene.y_min = next[j].y;
                        this.scene.x_short[1] = next[j].x;
                        this.scene.z_short[3] = next[j].z;
                    }
                    if ( next[j].z > this.scene.z_max ) {
                        this.scene.z_max = next[j].z;
                        this.scene.x_short[2] = next[j].x;
                        this.scene.y_short[2] = next[j].y;
                    }
                    if ( next[j].z < this.scene.z_min ) {
                        this.scene.z_min = next[j].z;
                        this.scene.x_short[3] = next[j].x;
                        this.scene.y_short[3] = next[j].y;
                    }
                }
            }
        }

        var delta_x = Math.abs( this.scene.x_max - this.scene.x_min );      // check which axis provides the largest/smallest difference in points
        var delta_y = Math.abs( this.scene.y_max - this.scene.y_min );
        var delta_z = Math.abs( this.scene.z_max - this.scene.z_min );
		var wings = true;                             // set flag if this.scene.wingspan > this.scene.length
		if ( this.scene.length > this.scene.wingspan ){
			wings = false;
		}

        /**
         * For each of the scenarios below, the extreme values of each axis
         * are used to determine the exact direction and orientation the model
         * is facing to rotate and scale accordingly to match the THREE.js
         * default viewpoint of positive z, x, and y.
         *
         *  Assumptions made:
         *  - Wing tips are closer to the tail of the plane than to the nose
         *  - Nose is closer to the bottom  the plane than the top
         *
         *  Using the information acquired from the model facets, the direction
         * the model is facing (axis-wise) can be determined. From there, the
         * assumptions made are taken into account to determine the exact
         * orientation of the model whether it be facing positive or negative
         * along each associated axis. With all information compiled,
         * coordinates are swapped to reflect the standard model orientation
         * and facing direction and the model is likewise rotated to visibly
         * show such changes.
         */

        // if the this.scene.wingspan is greater than this.scene.length
        if ( wings ) {
            if (delta_z > delta_y && delta_z > delta_x) {
                if (delta_x > delta_y) {
                    if ( Math.abs(this.scene.x_short[2] - this.scene.x_max) > Math.abs(this.scene.x_short[2] - this.scene.x_min) ){
                        if ( Math.abs(this.scene.y_short[0] - this.scene.y_max) > Math.abs(this.scene.y_short[0] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_max * -1;
                            geo.rotateX(180 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.y_short[1] - this.scene.y_max) > Math.abs(this.scene.y_short[1] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_max * -1;
                            geo.rotateX(180 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.y_short[2] - this.scene.y_max) > Math.abs(this.scene.y_short[2] - this.scene.y_min) ){
                        if ( Math.abs(this.scene.x_short[0] - this.scene.x_max) > Math.abs(this.scene.x_short[0] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[0];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[0];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.x_short[1] - this.scene.x_max) > Math.abs(this.scene.x_short[1] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[1];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[1];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }

                }
            }
            else if (delta_y > delta_x && delta_y > delta_z) {
                if (delta_z > delta_x) {
                    if ( Math.abs(this.scene.z_short[2] - this.scene.z_max) > Math.abs(this.scene.z_short[2] - this.scene.z_min) ){
                        if ( Math.abs(this.scene.x_short[2] - this.scene.x_max) > Math.abs(this.scene.x_short[2] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.x_short[3] - this.scene.x_max) > Math.abs(this.scene.x_short[3] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.x_short[0] - this.scene.x_max) > Math.abs(this.scene.x_short[0] - this.scene.x_min) ){
                        if ( Math.abs(this.scene.z_short[0] - this.scene.z_max) > Math.abs(this.scene.z_short[0] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_min = this.scene.z_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.z_short[1] - this.scene.z_max) > Math.abs(this.scene.z_short[1] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_min = this.scene.z_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
            }
            else {
                if (delta_z > delta_y) {
                    if ( Math.abs(this.scene.z_short[0] - this.scene.z_max) > Math.abs(this.scene.z_short[0] - this.scene.z_min) ){
                        if ( Math.abs(this.scene.y_short[2] - this.scene.y_max) > Math.abs(this.scene.y_short[2] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[2];
                        }
                        else {
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_short[2] * -1;
                            geo.rotateZ(180 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.y_short[3] - this.scene.y_max) > Math.abs(this.scene.y_short[3] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[3];
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_max * -1;
                            this.scene.y_min = this.scene.y_short[3] * -1;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateZ(180 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.y_short[0] - this.scene.y_max) > Math.abs(this.scene.y_short[0] - this.scene.y_min) || geo.name === "C-130 Hercules.obj" ){
                        if ( Math.abs(this.scene.z_short[2] - this.scene.z_max) > Math.abs(this.scene.z_short[2] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_max = this.scene.z_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.z_short[3] - this.scene.z_max) > Math.abs(this.scene.z_short[3] - this.scene.z_min) || geo.name === "MQ-9 Reaper.obj" ) {
                            this.scene.z_min = this.scene.z_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_max = this.scene.z_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
            }
        }

        // if this.scene.length is greater than this.scene.wingspan
        else {
            if ( delta_x > delta_y && delta_x > delta_z ){
                if ( delta_z > delta_y ){
                    if ( Math.abs(this.scene.x_short[2] - this.scene.x_max) > Math.abs(this.scene.x_short[2] - this.scene.x_min) ){
                        if ( Math.abs(this.scene.y_short[0] - this.scene.y_max) > Math.abs(this.scene.y_short[0] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_max * -1;
                            geo.rotateX(180 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.y_short[1] - this.scene.y_max) > Math.abs(this.scene.y_short[1] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_max * -1;
                            geo.rotateX(180 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.x_short[0] - this.scene.x_max) > Math.abs(this.scene.x_short[0] - this.scene.x_min) ){
                        if ( Math.abs(this.scene.z_short[0] - this.scene.z_max) > Math.abs(this.scene.z_short[0] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_min = this.scene.z_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.z_short[1] - this.scene.z_max) > Math.abs(this.scene.z_short[1] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[0];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_min = this.scene.z_short[1];
                            var temp = this.scene.x_max;
                            var temp2 = this.scene.x_min;
                            this.scene.x_max = this.scene.y_max;
                            this.scene.x_min = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
            }
            else if ( delta_y > delta_x && delta_y > delta_z ){
                if ( delta_z > delta_x ){
                    if ( Math.abs(this.scene.y_short[2] - this.scene.y_max) > Math.abs(this.scene.y_short[2] - this.scene.y_min) ){
                        if ( Math.abs(this.scene.x_short[0] - this.scene.x_max) > Math.abs(this.scene.x_short[0] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[0];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[0];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.x_short[1] - this.scene.x_max) > Math.abs(this.scene.x_short[1] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[1];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(-90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[1];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = this.scene.z_max;
                            this.scene.x_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(90 * THREE.Math.DEG2RAD);
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.y_short[0] - this.scene.y_max) > Math.abs(this.scene.y_short[0] - this.scene.y_min) ){
                        if ( Math.abs(this.scene.z_short[2] - this.scene.z_max) > Math.abs(this.scene.z_short[2] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_max = this.scene.z_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp;
                            this.scene.z_min = temp2;
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.z_short[3] - this.scene.z_max) > Math.abs(this.scene.z_short[3] - this.scene.z_min) ){
                            this.scene.z_min = this.scene.z_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_max;
                            this.scene.y_min = this.scene.z_min;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateX(-90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.z_max = this.scene.z_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.z_min * -1;
                            this.scene.y_min = this.scene.z_max * -1;
                            this.scene.z_max = temp2 * -1;
                            this.scene.z_min = temp * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateX(90 * THREE.Math.DEG2RAD);
                        }
                    }
                }
            }
            else {
                if ( delta_x > delta_y ){
                    if ( Math.abs(this.scene.z_short[0] - this.scene.z_max) > Math.abs(this.scene.z_short[0] - this.scene.z_min) ){
                        if ( Math.abs(this.scene.y_short[2] - this.scene.y_max) > Math.abs(this.scene.y_short[2] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[2];
                        }
                        else {
                            this.scene.y_max = this.scene.y_min * -1;
                            this.scene.y_min = this.scene.y_short[2] * -1;
                            geo.rotateZ(180 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.y_short[3] - this.scene.y_max) > Math.abs(this.scene.y_short[3] - this.scene.y_min) ){
                            this.scene.y_min = this.scene.y_short[3];
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.y_max = this.scene.y_max * -1;
                            this.scene.y_min = this.scene.y_short[3] * -1;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                            geo.rotateZ(180 * THREE.Math.DEG2RAD);
                        }
                    }
                }
                else {
                    if ( Math.abs(this.scene.z_short[2] - this.scene.z_max) > Math.abs(this.scene.z_short[2] - this.scene.z_min) ){
                        if ( Math.abs(this.scene.x_short[2] - this.scene.x_max) > Math.abs(this.scene.x_short[2] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[2];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                        }
                    }
                    else {
                        if ( Math.abs(this.scene.x_short[3] - this.scene.x_max) > Math.abs(this.scene.x_short[3] - this.scene.x_min) ){
                            this.scene.x_min = this.scene.x_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_max;
                            this.scene.y_min = this.scene.x_min;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateZ(90 * THREE.Math.DEG2RAD);
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                        else {
                            this.scene.x_max = this.scene.x_short[3];
                            var temp = this.scene.y_max;
                            var temp2 = this.scene.y_min;
                            this.scene.y_max = this.scene.x_min * -1;
                            this.scene.y_min = this.scene.x_max * -1;
                            this.scene.x_max = temp;
                            this.scene.x_min = temp2;
                            this.scene.z_max = this.scene.z_min * -1;
                            this.scene.z_min = this.scene.z_max * -1;
                            geo.rotateZ(-90 * THREE.Math.DEG2RAD);
                            geo.rotateY(180 * THREE.Math.DEG2RAD);
                        }
                    }
                }
            }
        }

        this.scene.x_max = geo.scale.x * this.scene.x_max;    // model points adjusted based on model scale
        this.scene.x_min = geo.scale.x * this.scene.x_min;
        this.scene.y_max = geo.scale.y * this.scene.y_max;
        this.scene.y_min = geo.scale.y * this.scene.y_min;
        this.scene.z_max = geo.scale.z * this.scene.z_max;
        this.scene.z_min = geo.scale.z * this.scene.z_min;

        this.scene.posi[0] = geo.position.x;
        this.scene.posi[1] = geo.position.y;
        this.scene.posi[2] = geo.position.z;
        this.scene.rota[0] = geo.rotation.x;
        this.scene.rota[1] = geo.rotation.y;
        this.scene.rota[2] = geo.rotation.z;
        this.scene.scal[0] = geo.scale.x;
        this.scene.scal[1] = geo.scale.y;
        this.scene.scal[2] = geo.scale.z;

        var scale = Math.abs(this.scene.z_max) + Math.abs(this.scene.z_min);      // camera scale adjusted and camera view changed in relation to new model
        var newPos = new THREE.Vector3( scale , scale/2, scale );
        this.execute( new SetPositionCommand( this.camera, newPos ) );
    },

    getModel: function (){                 // return all axis extreme values

        var array = new Object();
        array[0] = this.scene.x_max;
        array[1] = this.scene.x_min;
        array[2] = this.scene.y_max;
        array[3] = this.scene.y_min;
        array[4] = this.scene.z_max;
        array[5] = this.scene.z_min;
        return array;

    },

    getModelPosition: function (){        // return the initial model position

        return this.scene.posi;

    },

    getModelRotation: function (){        // return the initial model rotation

        return this.scene.rota;

    },

    getModelScale: function (){           // return the initial model scale

        return this.scene.scal;

    },

    setMenubar: function ( file ){       // set reference to the menubar

        var i = 0;
        while (this.scene.menu[i] !== null){
            i++;
        }
        this.scene.menu[i] = file;

    },

    getMenubar: function (){             // return reference to the menubar

        return this.scene.menu;

    }


};
