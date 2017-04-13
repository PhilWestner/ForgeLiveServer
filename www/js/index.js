/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Jaime Rosales 2016 - Forge Developer Partner Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

///////////////////////////
// Modified version of viewer-nodejs-tutorial from 
// https://github.com/Autodesk-Forge/viewer-nodejs-tutorial.git
// for AEC Hackatron 2017 Munic
///////////////////////////

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(document).ready(function() {
    $('#loadscandata').change(function(evt) {
		var dateien = evt.target.files;
		console.log("files: " + JSON.stringify(dateien))
		
		for (var i = 0, f; f = dateien[i]; i++) {
		  console.log("name: " + f.name)
		  
          var reader = new FileReader();

          reader.onloadend = function(evt) {
			  if (evt.target.readyState == FileReader.DONE) {
				  loadScanData( evt.target.result );
			  };
          };
		  
		  reader.readAsText(f);
		}
    
    });
    
    var fullscreen = getParameterByName('fullscreen'); 
    
    if ( fullscreen != null )
    {
      $("nav").hide();
      $("footer").hide();
      $("#viewerDiv").css("height","100%");
    }
});

/////////////////////////////////////////////////////////////////////////////////
//
// Use this call to get back an object json of your token
//
/////////////////////////////////////////////////////////////////////////////////

var tokenurl = window.location.protocol + '//' + window.location.host + '/oauth/token';
function tokenAjax() {
  return $.ajax({
    url: tokenurl,
    dataType: 'json'
  });
}

/////////////////////////////////////////////////////////////////////////////////
//
// Initialize function to the Viewer inside of Async Promise
//
/////////////////////////////////////////////////////////////////////////////////
var bbox;
var viewer;
var options = {};
//var documentId = ''; is set by fileurn.js

var promise = tokenAjax();


promise.success(function (data) {
  options = {
    env: 'AutodeskProduction',
    accessToken: data.access_token
  };
  
  Autodesk.Viewing.Initializer(options, function onInitialized() {
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
  });
})

/**
* Autodesk.Viewing.Document.load() success callback.
* Proceeds with model initialization.
*/

function onDocumentLoadSuccess(doc) {

  //A document contains references to 3D and 2D viewables.
  var viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), { 'type': 'geometry' }, true);
  if (viewables.length === 0) {
    console.error('Document contains no viewables.');
    return;
  }

  //Choose any of the avialble viewables
  var initialViewable = viewables[0];
  var svfUrl = doc.getViewablePath(initialViewable);
  var tm = new THREE.Matrix4();
  tm.makeTranslation(0, 0, 18);

  
  var modelOptions = {
    sharedPropertyDbPath: doc.getPropertyDbPath(),
    placementTransform: tm
  };

  var viewerDiv = document.getElementById('viewerDiv');

  /////////////USE ONLY ONE OPTION AT A TIME/////////////////////////
  ///////////////////// Headless Viewer ///////////////////////////// 
  viewer = new Autodesk.Viewing.Viewer3D(viewerDiv);

  ////////////////Viewer with Autodesk Toolbar///////////////////////
  //viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv);

  ////////////////////////////////////////////////////////////////////
  viewer.start(svfUrl, modelOptions, onLoadModelSuccess, onLoadModelError);
}

/**
* Autodesk.Viewing.Document.load() failuire callback.
*/
function onDocumentLoadFailure(viewerErrorCode) {
  console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

/**
* viewer.loadModel() success callback.
* Invoked after the model's SVF has been initially loaded.
* It may trigger before any geometry has been downloaded and displayed on-screen.
*/
function onLoadModelSuccess(model) {
  console.log('onLoadModelSuccess()!');
  console.log('Validate model loaded: ' + (viewer.model === model));
  console.log(model);

  viewer.loadExtension('Autodesk.ADN.Viewing.Extension.PolygonImporter');

  bbox = model.getBoundingBox();

  console.log(JSON.stringify(bbox));

  //animatePlane();

  var planes = [];

  planes.push(new THREE.Vector4(0,0,1,-2));

  viewer.setCutPlanes(planes);
  
  openWS();
}

/**
* viewer.loadModel() failure callback.
* Invoked when there's an error fetching the SVF file.
*/
function onLoadModelError(viewerErrorCode) {
  console.error('onLoadModelError() - errorCode:' + viewerErrorCode);
}

var jqxhr;

function loadScanData(data) {
  console.error('load scan data! ' + JSON.stringify(data));
  
   $.post( "/geometry", data);
  
}
function saveScanData() {
  console.error('save scan data');
    
  $.get( "/geometry", function( data ) {
	  console.log( "complete " + JSON.stringify(data) );	  
	  //window.location.href = "data.json";
	  
      var file = new File( [JSON.stringify(data)], "scandata.json", {type: "application/json;charset=utf-8"});
      saveAs(file);
  });
  
  
}


var webSocket;

function openWS() {
  console.log("openws");

  if (!webSocket) {
    webSocket = $.simpleWebSocket({ url: 'ws://' + window.location.hostname + ':3000/ws/geometryupdate' });
  }

  // reconnected listening
  webSocket.listen(function (message) {

    viewer.loadedExtensions["Autodesk.ADN.Viewing.Extension.PolygonImporter"].updateGeometry(message);
  });

  webSocket.send({ 'status': 'ok' }).done(function () {
    // message send
  }).fail(function (e) {
    // error sending
  });
}

//currently not used
function animatePlane() {
  var planePos = -bbox.max.z;
  var max = bbox.min.z - 0.7;

  var planeAnimation = setInterval(function () {
    if (max < planePos) {
      clearInterval(planeAnimation);
    }
    else {
      planePos += 0.06;
      var planes = [];
      planes.push(new THREE.Vector4(0, 0, 1, planePos));
      viewer.setCutPlanes(planes);
    }
  }, 10);
}
