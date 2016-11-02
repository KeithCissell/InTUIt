/*****************************************************************************************************************
Programmed by: Christopher Franklyn
Description: This file contains important functions and resources for the entire UI, including cloud storage info,
             functions for interacting with the cloud service, and code dealing with IPMS settings (interval, etc.
Last Modified: 9/19/2016
******************************************************************************************************************/

//this command loads jquery properly
window.$ = window.jQuery = require('./js/jquery.min.js');
//for file system reading/writing
var fs = require('fs');
//for query string parsing
var qs = require('querystring');

var username = 'generic'; //Variable for logged in user. Default is 'generic'
var networkName = 'network'; //Variable for current network. Default is 'network'
var ndfFilename = username + networkName + '.ndf';

var areaList = new Array(); //Array of all areas in the Network
var deviceList = new Array(); //Array of all ACUs in the Network

var deviceTable;
var changesTable;


//Network Class----------------------------------------------------------------
var Network = function (networkName) {
    this.networkName = networkName;
    this.areaList = new Array(); //Array of all areas in the Network

    this.addArea = function addArea(Area) {
        this.areaList.push(Area);
    }

    this.printNetwork = function printNetwork() {
        var areaString = "{"
        for (var i; i < currentNetwork.areaList.length; i++) {
            areaString += this.areaList[i].printArea();
        }
        areaString += "}";
    }

    this.printNetworkPolicies = function printNetworkPolicies() {
        var areaString = "{"
        for (var i; i < currentNetwork.areaList.length; i++) {
            areaString += this.areaList[i].printAreaPolicies();
        }
        areaString += "}";
    }
}
//-----------------------------------------------------------------------------


//Area Class-------------------------------------------------------------------
var Area = function(areaName) {
    this.areaName = areaName;
    this.acuList = new Array(); //Array of all ACUs in the Area

    this.addACU = function addACU(acu) {
        this.acuList.push(acu);
    }

    this.printArea = function printArea() {
        var areaString = "\"" + this.areaName + "\": {";
        for(var i = 0; i < this.acuList.length; i++){
            areaString += this.acuList[i].printACU();
        }
        areaString += "},"
        return areaString;
    }

    this.printAreaPolicies = function printAreaPolicies() {
        var areaString = "\"" + this.areaName + "\": {";
        for(var i = 0; i < this.acuList.length; i++){
            areaString += this.acuList[i].printACUPolicies();
        }
        areaString += "}"
        return areaString;
    }
}
//-----------------------------------------------------------------------------


//ACU Class--------------------------------------------------------------------
var ACU = function (acuName, states, dependencies, actions, area) {
    this.acuName = acuName;
    this.states = states;
    this.dependencies = dependencies;
    this.actions = actions;
    this.area = area;
    this.policyList = new Array(); //Array of all Policies associated to ACU

    this.addPolicy = function addPolicy(Policy) {
        this.policyList.push(Policy);
    }

    this.printACU = function printACU(){
        return "\"" + this.acuName + "\": {\"Dependencies\": [" + this.dependencies + "], \"States\": [" + this.states + "], \"Actions\": [" + this.actions +
		"]},";
    }

    this.printACUPolicies = function printACUPolicies() {
        var ACUString = "\"" + this.acuName + "\" :[";
        for(var i = 0; i < this.policyList.length; i++){
            ACUString += this.policyList[i].printPolicy();   //*****Coma Syntax Error for NDF*****
        }
        ACUString += "]"
        return ACUString;
    }
}
//-----------------------------------------------------------------------------


//Policy Class-----------------------------------------------------------------
var Policy = function (area, device, givenStates, command) {
    this.area = area;
    this.device = device;
    this.givenStates, givenStates;
    this.command = command;

    this.printPolicy = function printPolicy() {
        return "\"Given {" + givenStates + "} associate " + command + "\"";
    }

    //Display function for possible 'Pending Commands' implimentation
    this.displayPolicy = function displayPolicy(){
        return "\"" + area + "\" :{\"" + device + "\": [\"Given {" + givenStates +
            "} associate " + command + "\"]}";
    }
}
//-----------------------------------------------------------------------------


//script that executes once homepage is fully loaded
$(document).ready(function() {
  var queryString = window.location.search
  username = getQueryVariable('userName', queryString);
  networkName = getQueryVariable('networkName', queryString);
  ndfFilename = username + '-' + networkName + '.ndf'; //file name to write NDF to

  //Populate the Username and Network Fields bassed on Login
  $('#user-name').html('User: ' + username);
  $('#network-name').html('Network: ' + networkName);

  //Creates the changes datatable
  changesTable = $('#changesTable').DataTable({
    "paging": true,
    "iDisplayLength": 10,
    "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
    "responsive": true,
    "autoWidth": false,
    "language": {"emptyTable": "No changes have been made"},
    "order": [[0, 'desc']],
    "columns": [
        { "width": "33%" },
        { "width": "33%" },
        { "width": "33%" }
    ],
    "ajax": {
      "url": './json/changes.json',
      "dataSrc": 'changeData'
    }
  });

  //event fires upon adding a device
  $('#addDeviceForm').submit(function(e){
    e.preventDefault(); //prevent form from redirect
    setTimeout(function(){ //allow addDevice to execute before refresh
      deviceTable.ajax.reload();
      $('#addDeviceForm')[0].reset(); //reset form fields
    }, 100);
    addDevice();
	$('#deviceName').focus();
  });

  //event fires upon adding an area
  $('#addAreaForm').submit(function(e){
    e.preventDefault(); //prevent form from redirect
	addArea();
    this.reset(); //resets the fields within the form
	$('#areaName').focus();
  });

  //event fires upon adding a policy
  $('#createPolicyForm').submit(function(e){
	e.preventDefault();
	addPolicy();
	this.reset();
	$('#policyArea').focus();
  });
});


//Adding an area into the network
function addArea() {
  areaList.push(new Area($('#areaName').val()));
  $('#areaSelect').empty();
  for (var i = 0; i < areaList.length; i++) {
	  var area = areaList[i];
	  $('#areaSelect').append('<option value="' + area.areaName + '">' + area.areaName +'</option>');
  }
}

//Adding a device into the network
function addDevice() {
  var tempDevice = new ACU($('#deviceName').val(), $('#deviceStates').val(), $('#deviceDependencies').val(), $('#deviceActions').val(), $('#areaSelect').val());
  var deviceArea = findArea($('#areaSelect').val());
  deviceArea.addACU(tempDevice);

  var date = new Date();

  //function call to add the device to the stored json of devices
  $.getJSON("./json/devices.json", function(json) {
    var deviceJSON = [date.toLocaleString(), $('#deviceName').val(), $('#deviceStates').val(), $('#deviceActions').val(), $('#deviceDependencies').val()];
    json.tableData.push(deviceJSON);
    var stream = fs.createWriteStream('./resources/app/json/devices.json');
    stream.write(JSON.stringify(json));
    stream.end();
  });
}

//Adding a policy to an existing ACU
function addPolicy() {
  var tempPolicy = new Policy($('#policyArea').val(), $('#policyDevice').val(), $('#givenStates').val(), $('#associatedCommand').val());
  var policyArea = findArea($('#policyArea').val());
  var policyACU = findACU($('#policyDevice').val(), policyArea);
  policyACU.addPolicy(tempPolicy);
}

//Function to construct the NDF file for a user network
$('#submitNDF').click(function buildNDF() {
  var stream = fs.createWriteStream('./resources/app/' + ndfFilename);
  stream.write(username + ',' + networkName + '\n{');
  for (var i = 0; i < areaList.length; i++) {
    stream.write(areaList[i].printArea());
  }
  stream.write('}\n{');
  for (var i = 0; i < areaList.length; i++) {
	  stream.write(areaList[i].printAreaPolicies());
  }
  stream.write('}')
  stream.end();
});

//Create Device Datatable when button to summon modal is clicked
$('#add-device-button').click(function() {
  if (areaList.length == 0) {
    //e.preventDefault();
    alert("No areas have been created. Please create one");
  }
  else {
    $('#add-device-modal').modal({
      focus: true
    });
  }

  if (!($.fn.dataTable.isDataTable('#deviceTable'))){ //if the datatable isn't created, make it
    deviceTable = $('#deviceTable').DataTable({
  	  "paging": true,
  	  "iDisplayLength": 5,
      "lengthMenu": [[5, 10, 25, 50, 100, -1], [5, 10, 25, 50, 100, "All"]],
      "responsive": true,
      "autoWidth": false,
      "language": {"emptyTable": "No ACUs have been created"},
      "order": [[0, 'desc']],
      "columns": [
          { "width": "12%" },
          { "width": "15%" },
          { "width": "20%" },
          { "width": "28%" },
          { "width": "25%" }
      ],
  	  "ajax": {
  	    "url": './json/devices.json',
  		  "dataSrc": 'tableData'
  	  }
    });
  }
});

$('#add-policy-button').click(function() {
  if (areaList.length == 0) {
    //e.preventDefault();
    alert("No areas have been created. Please create one");
  }
  else {
    $('#create-policy-modal').modal({
      focus: true
    });
  }
});

//Finds a created area in the list of areas
function findArea(name) {
	for (var i = 0; i < areaList.length; i++) {
		if (areaList[i].areaName == name){
			return areaList[i];
		}
	}
	console.log("findArea: Could not find area specified")
}

//Finds an ACU in a given Area
function findACU(name, Area) {
	var acuList = Area.acuList;
	for (var i = 0; i < acuList.length; i++) {
		if (acuList[i].acuName == name){
			return acuList[i];
		}
	}
	console.log("findACU: Could not find ACU specified")
}

//Returns query string value given
function getQueryVariable(variable, queryString) {
  var query = queryString.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
       return decodeURIComponent(pair[1]);
    }
  }
  console.log('Query variable %s not found', variable);
}
