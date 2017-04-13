///////////////////////////////////////////////////////////////////////////////
// Polygon Importer for Tango Geometry Data
// By 44Forge on German Autodesk Hackatron 2017
// derrived from:
// Mesh Importer viewer Extension
// by Philippe Leefsma, October 2014
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.PolygonImporter = function (viewer, options) {

    // base constructor
    Autodesk.Viewing.Extension.call(this, viewer, options);

    ///////////////////////////////////////////////////////////////////////////
    // Private members
    //
    ///////////////////////////////////////////////////////////////////////////

    var _importedModel = null;

    var _controlId = null;

    var _running = false;

    var _self = this;

    var _geometryModels = [];

    var _viewerObject = [];

    var _playerColours = {};


    ///////////////////////////////////////////////////////////////////////////
    // load callback
    //
    ///////////////////////////////////////////////////////////////////////////
    _self.load = function () {
		
        console.log("Autodesk.ADN.Viewing.Extension.PolygonImporter loaded");

        return true;
    };

    ///////////////////////////////////////////////////////////////////////////
    // unload callback
    //
    ///////////////////////////////////////////////////////////////////////////
    _self.unload = function () {

        console.log("Autodesk.ADN.Viewing.Extension.PolygonImporter unloaded");

        return true;
    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    function createWallModel(polyline, colour){
     //console.log("createWallModel");

            var geometry = new THREE.Geometry();

            //uncompress vertices array
            for (var i = 0; i < (polyline.length/3); i += 1) {

                var idx = 3 * i;
				
                geometry.vertices.push(new THREE.Vector3(
                    polyline[idx],
                    polyline[idx + 1],
                    polyline[idx + 2]));
				
				geometry.vertices.push(new THREE.Vector3(
					polyline[idx],
					( polyline[idx + 1] + 0.0 ),
					( polyline[idx + 2] + 1.0 ) ));

                geometry.faces.push( new THREE.Face3( i, i+1, i+2 ));
				geometry.faces.push( new THREE.Face3( i+1, i+3, i+2 ));					
            }

            //geometry.vertices.push(new THREE.Vector3( polyline[0], polyline[1], polyline[2]));
			
			
			console.log("createWallModel length " + geometry.vertices.length);
//			var modlen = geometry.vertices.length%3;
//			if ( modeln != 0 )
//			{
//				console.log("");
//			}
            

            //var mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial( colour ));
			var mat = new THREE.MeshBasicMaterial( colour );			
			mat.side = THREE.DoubleSide;
			
            var mesh = new THREE.Mesh(geometry, mat);
			mesh.drawMode = THREE.TriangleStripDrawMode;
						
			//mesh.drawMode = TrianglesDrawMode;

            mesh.geometry.dynamic = true;

        return mesh;
    };

    function createSpaceModel(polyvals, colour){
        //console.log("createSpaceModel");

        var shape = new THREE.Shape();
        //console.log("createMyModel0");
        for (var i = 0; i < (polyvals.length/3); i += 1) {
            var idx = 3 * i;   
            if (i == 0) {
                shape.moveTo(polyvals[idx], polyvals[idx+1]);
                //console.log("x " + polyline[idx] + " y: " + polyline[idx+1]);
            } else {
                shape.lineTo(polyvals[idx], polyvals[idx+1]);
                //console.log("x " + polyline[idx] + " y: " + polyline[idx+1]);    
            }
        }

        var geometry = shape.makeGeometry();
        //console.log("createMyModel1");
        var material = new THREE.MeshBasicMaterial( colour );
        //console.log("createMyModel2");
        var mesh = new THREE.Mesh(geometry, material);


            mesh.geometry.dynamic = true;

        return mesh;
    };

    function createFurnitureModel(polyvals, colour){
        //console.log("createFurnitureModel");

        var shape = new THREE.Shape();
        //console.log("createMyModel0");
        for (var i = 0; i < (polyvals.length/3); i += 1) {
            var idx = 3 * i;   
            if (i == 0) {
                shape.moveTo(polyvals[idx], polyvals[idx+1]);
                //console.log("x " + polyline[idx] + " y: " + polyline[idx+1]);
            } else {
                shape.lineTo(polyvals[idx], polyvals[idx+1]);
                //console.log("x " + polyline[idx] + " y: " + polyline[idx+1]);    
            }
        }

        //var geometry = shape.makeGeometry();

       var extrudeSettings = { amount: 0.5, bevelEnabled: false};
       var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

        //console.log("createMyModel1");
        var material = new THREE.MeshBasicMaterial( colour );
        //console.log("createMyModel2");
        var mesh = new THREE.Mesh(geometry, material);


        mesh.geometry.dynamic = true;

        return mesh;
    };

    _self.updateGeometry = function (geodata) {

       console.log("update updateGeometry");
        //console.log("device_translation: " + geodata.device_translation);  
        //console.log("device_rotation: " + geodata.device_rotation);  

       // console.log("update geo" + JSON.stringify(geodata));
        var spacearr = geodata.space;
        var wallarr = geodata.wall;
        var furniture = geodata.furniture;

        var spacecol = {}; 
        var wallcol = {}; 
        var furniturecol = {};
        var usercol = {}; 
        
        var pos = geodata['device_translation'];
        var ori = geodata['device_rotation'];

        var devid = geodata['device_id'];

        //console.log("device_translation: " + pos);  
        //console.log("device_rotation: " + ori);  


         if ( _viewerObject[devid]  === undefined ) {
			  console.log("add viewer Object");
              var geometry;
              var mesh;
              var ol =  Object.keys(_viewerObject).length;

              console.log("mod " + ol%3)

             if ( (ol%3) == 0 ) {  
              console.log("add player 0 " + devid);
               geometry = new THREE.SphereGeometry(1, 10, 10);
               usercol.color = 0xEC6500;
               mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(usercol));
               spacecol.color = 0x5D85C3; 

               _playerColours[devid] = 0x5D85C3;
               
             } else if ( (ol%3) == 1 ) {
               console.log("add player 1 " + devid);
               usercol.color = 0x951169;
               geometry = new THREE.SphereGeometry(1, 10, 10);  
               mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(usercol));
               spacecol.color = 0xAFCC50; 
               _playerColours[devid] = 0xAFCC50;               
             } else {
               console.log("add player 3 " + devid);
               usercol.color = 0x243572;
               geometry = new THREE.SphereGeometry(1, 10, 10);  
               mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(usercol));
               spacecol.color = 0xFFE05C; 
               _playerColours[devid] = 0xFFE05C;               
             }

             _viewerObject[devid] = new THREE.Object3D();
             _viewerObject[devid].add(mesh);
             _viewerObject[devid].position.x = pos[0];
             _viewerObject[devid].position.y = -pos[2];
             _viewerObject[devid].position.z = pos[1];
             viewer.impl.scene.add(_viewerObject[devid]);
         } else {

             //console.log("update cube "+ devid);  
             _viewerObject[devid].position.x = pos[0];
             _viewerObject[devid].position.y = -pos[2];
             _viewerObject[devid].position.z = pos[1];

             if ( _playerColours[devid] != undefined ) {
                 spacecol.color = _playerColours[devid];
             } else {
                spacecol.color = 0x00ff00; 
             }

         }

       if ( !(_geometryModels[devid] === undefined) ) {
         viewer.impl.scene.remove(_geometryModels[devid]);
       }
        
        _geometryModels[devid] =  new THREE.Object3D();


        //spacecol.color = 0x00ff00; 
        //wallcol.color =  0xEC6500; //orange
        wallcol.color =  0xB90F22; //red
        furniturecol.color = 0x009D81;

        spacearr.forEach( function (polyvals) {
             //console.log("fe update spaces");
          var mdldata = createSpaceModel(polyvals, spacecol);
          _geometryModels[devid].add(mdldata);
        });

        wallarr.forEach( function (polyvals) {
            // console.log("fe update walls");
          var mdldata = createWallModel(polyvals, wallcol);
          _geometryModels[devid].add(mdldata);
        });

        furniture.forEach( function (polyvals) {
            // console.log("fe update furniture");
          var mdldata = createFurnitureModel(polyvals, furniturecol);
          _geometryModels[devid].add(mdldata);
        });


        viewer.impl.scene.add(_geometryModels[devid]);
		

        viewer.impl.invalidate(true);
    }
    
	
    ///////////////////////////////////////////////////////
    // Checks if css is loaded
    //
    ///////////////////////////////////////////////////////
    function isCssLoaded(name) {

        for(var i=0; i < document.styleSheets.length; ++i){

            var styleSheet = document.styleSheets[i];

            if(styleSheet.href && styleSheet.href.indexOf(name) > -1)
                return true;
        };

        return false;
    }

    // loads bootstrap css if needed
    if(!isCssLoaded("bootstrap.css") && !isCssLoaded("bootstrap.min.css")) {

        $('<link rel="stylesheet" type="text/css" href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.css"/>').appendTo('head');
    }
};

Autodesk.ADN.Viewing.Extension.PolygonImporter.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.PolygonImporter.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.PolygonImporter;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'Autodesk.ADN.Viewing.Extension.PolygonImporter',
    Autodesk.ADN.Viewing.Extension.PolygonImporter);
