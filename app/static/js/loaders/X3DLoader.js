THREE.X3DLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.X3DLoader.prototype = {
    constructor: THREE.X3DLoader,

    load: function ( url, onLoad, onProgress, onError) {
  	console.log("X3D: Loading "+url);
  	var scope = this;
  	var loader = new THREE.XHRLoader(scope.manager);
  	//loader.setCrossOrigin(this.crossOrigin);
  	loader.load(url, function(text) {
  	    onLoad(scope.parse(text));
	});
    },

    parse: function ( text ) {
	var object = new THREE.Object3D();
  //console.log(text)

	console.log("X3D: Parsing");

	if (window.DOMParser) {
  //  console.log("X3D: Thanks");
	    parser = new DOMParser();
	    xml = parser.parseFromString(text,"text/xml");
	} else { // Internet Explorer
    console.log("X3D: Really? IE?");

	    xml = new ActiveXObject("Microsoft.XMLDOM");
	    xml.async = false;
	    xml.loadXML(text);
	}

	function printHierarchy(o, tab) {
	    tab = tab || 0;
	    var s = "";
	    for (var i=0; i<tab; i++) s += " ";
	    if (o.name)
		s += o.name;
	    else
		s += "Unnamed";
	    console.log(s);
	    for (var i=0; i<o.children.length; i++) {
		printHierarchy(o.children[i], tab+3);
	    }
	}

	function cvtStr2Vec3(s) {
	    s = s.split(/\s/);
	    var v = new THREE.Vector3(
		parseFloat(s[0]),
		parseFloat(s[1]),
		parseFloat(s[2])
	    );
	    return v;
	}

	function cvtStr2rgb(s) {
	    var v = cvtStr2Vec3(s);
	    return v.x*0xff0000 + v.y * 0x00ff00 + v.z * 0x0000ff;
	}

	var texture_library = {};

	function parseImageTexture(e) {
	    var use_att = e.attributes.getNamedItem("USE");
	    if (use_att !== null) {
		return texture_library[use_att.value];
	    }

	    var def_name = e.attributes.getNamedItem("DEF").value;
	    console.log("Defining texture name "+def_name);

	    var filename = e.attributes.getNamedItem("url").value;
	    filename = filename.split(/\"\s\"/);
	    filename = filename[1].slice(0,-1);

	    console.log(filename);
	    console.log("Texture is from "+filename);
	    return THREE.ImageUtils.loadTexture(filename);
	}

	var material_library = {};

	function parseMaterial(e) {
	    //return new THREE.MeshBasicMaterial({color: 0xffffff, side:THREE.DoubleSide});

	    // Get the Material tag
	    var mat_tag = e.getElementsByTagName("Material")[0];
	    if (mat_tag === undefined) {
		return new THREE.MeshPhongMaterial();
	    }

	    // Check to see if we're defining a material
	    var use_att = mat_tag.attributes.getNamedItem("USE");
	    if (use_att !== null) {
		return material_library[use_att.value];
	    }

	    // Check to see if it's shadeless
	    var shadeless = false;
	    if (mat_tag.attributes.getNamedItem("shadeless") !== null) {
		if (mat_tag.attributes.getNamedItem("shadeless").value === "1") {
		    shadeless = true;
		}
	    }
	    console.log("Shade: "+shadeless);

	    var def_name = mat_tag.attributes.getNamedItem("DEF").value;
	    console.log("Defining material name "+def_name);

	    // Pull out the standard colors
	    var ambient = cvtStr2rgb(mat_tag.attributes.getNamedItem("diffuseColor").value);
	    var diffuse = cvtStr2rgb(mat_tag.attributes.getNamedItem("diffuseColor").value);
	    var specular = cvtStr2rgb(mat_tag.attributes.getNamedItem("specularColor").value);
	    var shiny = parseFloat(mat_tag.attributes.getNamedItem("shininess").value);
	    console.log(diffuse);

	    // Check to see if there is a texture
	    var tex_e = e.getElementsByTagName("ImageTexture");
	    var color_map;
	    if (tex_e.length > 0) {
		color_map = parseImageTexture(tex_e[0]);
	    }

	    var mat_spec = {ambient: new THREE.Color(ambient), color: diffuse, diffuse: new THREE.Color(diffuse), specular: new THREE.Color(specular), shininess: shiny};
	    if (color_map) mat_spec.map = color_map;
	    var mat;
	    if (shadeless) {
		mat = new THREE.MeshBasicMaterial(mat_spec);
	    } else {
		mat = new THREE.MeshPhongMaterial(mat_spec);
	    }
	    material_library[def_name] = mat;
	    return mat;

	    //return new THREE.Material({color:0xffffff});
	    return new THREE.MeshBasicMaterial({color: 0xffffff});
	}

	function parseShape(e) {
	    // First, get the material
	    var material = parseMaterial(e.getElementsByTagName("Appearance")[0]);

	    // Then pull out the geometry
	    var geometry = new THREE.Geometry();
	    var ifs = e.getElementsByTagName("IndexedFaceSet")[0];
	    var vertex_indices_str = ifs.attributes.getNamedItem("coordIndex").value;
	    var vertices_str = ifs.getElementsByTagName("Coordinate")[0].attributes.getNamedItem("point").value;
	    var texcoord_index_str = ifs.attributes.getNamedItem("texCoordIndex");
	    var texcoords_str;
	    var has_texcoord = false;
	    if (texcoord_index_str) {
		has_texcoord = true;
		texcoord_index_str = texcoord_index_str.value;
		texcoords_str = ifs.getElementsByTagName("TextureCoordinate")[0].attributes.getNamedItem("point").value;
	    }

	    var verts = vertices_str.split(/\s/);
	    verts.pop(); // To remove the empty one at the end
	    for (var i=0; i<verts.length; i+=3) {
		var v = new THREE.Vector3();
		v.x = parseFloat(verts[i+0]);
		v.y = parseFloat(verts[i+1]);
		v.z = parseFloat(verts[i+2]);
		geometry.vertices.push(v);
	    }
	    //console.log(geometry.vertices);

	    if (has_texcoord) {
		var texcoords = texcoords_str.split(/\s/);
		texcoords.pop(); // To remove the empty one at the end
		var uvs = [];
		for (var i=0; i<texcoords.length; i+=2) {
		    var v = new THREE.Vector2();
		    v.x = parseFloat(texcoords[i+0]);
		    v.y = parseFloat(texcoords[i+1]);
		    uvs.push(v);
		}
	    }

	    // Now pull out the face indices
	    var indices = vertex_indices_str.split(/\s/);
	    if (has_texcoord) var tex_indices = texcoord_index_str.split(/\s/);
	    for (var i=0; i<indices.length; i++) {
		var face_indices = [];
		var uv_indices = [];
		while (parseFloat(indices[i]) >= 0) {
		    face_indices.push(parseFloat(indices[i]));
		    if (has_texcoord) {
			uv_indices.push(parseFloat(tex_indices[i]));
		    }
		    i++;
		}

		var faces = [];
		while (face_indices.length > 3) {
		    // Take the last three, make a triangle, and remove the
		    // middle one (works for convex & continuously wrapped)

		    if (has_texcoord) {
			// Add to the UV layer
			//console.log(uv_indices);
			//console.log(uvs);
			geometry.faceVertexUvs[0].push([
			    uvs[parseFloat(uv_indices[uv_indices.length-3])].clone(),
			    uvs[parseFloat(uv_indices[uv_indices.length-2])].clone(),
			    uvs[parseFloat(uv_indices[uv_indices.length-1])].clone()
			]);

			// Remove the second-to-last vertex
			var tmp = uv_indices[uv_indices.length-1];
			uv_indices.pop();
			uv_indices[uv_indices.length-1] = tmp;
		    }

		    // Make a face
		    geometry.faces.push(new THREE.Face3(
			face_indices[face_indices.length-3],
			face_indices[face_indices.length-2],
			face_indices[face_indices.length-1]
		    ));

		    // Remove the second-to-last vertex
		    var tmp = face_indices[face_indices.length-1];
		    face_indices.pop();
		    face_indices[face_indices.length-1] = tmp;
		}

		// Make a face with the final three
		if (face_indices.length == 3) {
		    if (has_texcoord) {
			geometry.faceVertexUvs[0].push([
			    uvs[parseFloat(uv_indices[uv_indices.length-3])].clone(),
			    uvs[parseFloat(uv_indices[uv_indices.length-2])].clone(),
			    uvs[parseFloat(uv_indices[uv_indices.length-1])].clone()
			]);
		    }

		    //console.log("Making a single face with:");
		    //console.log(face_indices);
		    geometry.faces.push(new THREE.Face3(
			face_indices[0], face_indices[1], face_indices[2]
		    ));
		}

		/*for (var j=0; j<faces.length; j++) {
		    //console.log(faces[j].a+" "+faces[j].b+" "+faces[j].c);
		    geometry.faces.push(faces[j]);
		}*/

		/*
		var i0 = parseFloat(indices[i+0]);
		var i1 = parseFloat(indices[i+1]);
		var i2 = parseFloat(indices[i+2]);
		geometry.faces.push(new THREE.Face3(i0,i1,i2));
		console.assert(i0<verts.length);
		console.assert(i1<verts.length);
		console.assert(i2<verts.length);*/
	    }
	    console.log("got "+verts.length/3+" vertices");
	    geometry.computeBoundingSphere();
	    geometry.computeFaceNormals();
	    console.log(geometry.boundingSphere);
	    if (geometry.faces.length > 0)
		return new THREE.Mesh(geometry, material);
	    return null;
	}

	function parseTransform(e) {
	    var object = new THREE.Object3D();

	    // Parse the orientation matrix. First, position
	    var pos = e.attributes.getNamedItem("translation").value;
	    pos = pos.split(/\s/);
	    var v = new THREE.Vector3(
		parseFloat(pos[0]),
		parseFloat(pos[1]),
		parseFloat(pos[2])
	    );
	    object.position = v;

	    // Then scale
	    pos = e.attributes.getNamedItem("scale").value;
	    pos = pos.split(/\s/);
	    v = new THREE.Vector3(
		parseFloat(pos[0]),
		parseFloat(pos[1]),
		parseFloat(pos[2])
	    );
	    object.scale = v;

	    // Finally, rotation
	    pos = e.attributes.getNamedItem("rotation").value;
	    pos = pos.split(/\s/);
	    var m = new THREE.Matrix4();
	    m.identity();
	    m.makeRotationAxis(
		new THREE.Vector3(parseFloat(pos[0]),
				  parseFloat(pos[1]),
				  parseFloat(pos[2])),
		parseFloat(pos[3]));
	    var v = new THREE.Euler();
	    v.setFromRotationMatrix(m);
	    object.rotation = v;

	    // Parse all of the child nodes
	    for (var i=0; i<e.childNodes.length; i++) {
		console.log("Parsing node inside transform: "+e.childNodes[i].tagName);
		console.log(e.childNodes);
		if (e.childNodes[i].tagName === "Transform") {
		    obj = parseTransform(e.childNodes[i]);
		    obj.name = e.childNodes[i].attributes.getNamedItem("DEF").value;
		    object.add(obj);
		} else if (e.childNodes[i].tagName === "Group") {
		    console.log("Parsing a group");
		    // Assume there's a shape in here, otherwise crash
		    // TODO: Can there be more than one?
		    var mesh = parseShape(e.childNodes[i].getElementsByTagName("Shape")[0]);

		    // Get the name
		    if (e.childNodes[i].getElementsByTagName("Shape")[0].attributes.getNamedItem("DEF")) {
			mesh.name = e.childNodes[i].getElementsByTagName("Shape")[0].attributes.getNamedItem("DEF").value;
		    }

		    if (mesh)
			object.add(mesh);
		}
	    }
	    return object;
	}


	var scene = xml.getElementsByTagName("Scene")[0];
	//console.log(xml);
	for (var i=0; i<scene.childNodes.length; i++) {
	    if (scene.childNodes[i].tagName === "Transform") {
		console.log("Adding transform");
		var t = parseTransform(scene.childNodes[i]);
		object.add(t);
	    }
	}
	printHierarchy(object);

	return object;
    }
};
