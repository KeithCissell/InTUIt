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

var username = 'generic'; //Variable for logged in user. Default is 'generic'
var networkName = 'network'; //Variable for current network. Default is 'network'
var ndfFilename = username + '-' + networkName + '.ndf'; //file name to write NDF to

var areaList = new Array(); //Array of all areas in the Network
var deviceList = new Array(); //Array of all ACUs in the Network

var deviceTable;


//Area Class-------------------------------------------------------------------
function Area(areaName) {
  this.areaName = areaName;
  this.acuList = new Array();

  this.addACU = function addACU(acu) {
    this.acuList.push(acu);
  }

  this.printArea = function printArea() {
    var areaString = "{" + this.areaName + ":{";
    for(var index = 0; index < acuList.length; index++){
      areaString += acuList[index].printACU();
    }
    return areaString;
  }
}
//-----------------------------------------------------------------------------

//ACU Class--------------------------------------------------------------------
function ACU(name, states, dependencies, actions) {
	this.name = name;
	this.states = states;
	this.dependencies = dependencies;
	this.actions = actions;

	this.printACU = function printACU(){
		return "\"" + this.name + "\":{\"states\": [" + this.states + "], \"actions\": [" + this.actions +
		"], \"dependencies\": [" + this.dependencies + "]}";
	}
}
//-----------------------------------------------------------------------------


//script that executes once index page is fully loaded
$(document).ready(function() {
  //Populate the Username and Network Fields bassed on Login
  $('#user-name').html('User: ' + username);
  $('#network-name').html('Network: ' + networkName);

  $('#addDeviceForm').submit(function(e){
    e.preventDefault(); //prevent form from redirect
    setTimeout(function(){ //allow addDevice to execute before refresh
      deviceTable.ajax.reload();
      $('#addDeviceForm')[0].reset();
    }, 100);
    addDevice();
  });

  $('#addAreaForm').submit(function(e){
    e.preventDefault(); //prevent form from redirect
    this.reset(); //resets the fields within the form
  });

});

//Function to construct the NDF file for a user network
$('#submitNDF').click(function buildNDF() {
  var stream = fs.createWriteStream('./resources/app/ndf/' + ndfFilename);
  stream.write(username + ', ' + networkName + '\n');
  for (var i; i < areaList.length; i++) {
    stream.write(i.printArea());
  }
  stream.end();
});

//ADDING A DEVICE INTO NETWORK
function addDevice() {
  var tempDevice = new ACU($('#deviceName').val(), $('#deviceStates').val(), $('#deviceDependencies').val(), $('#deviceActions').val());
  deviceList.push(tempDevice); //Adds device to JS array of device objects
  var date = new Date();

  //function call to add the device to the stored json of devices
  $.getJSON("./json/devices.json", function(json) {
    console.log(json); // this will show the info it in firebug console
    var deviceJSON = [date.toLocaleString(), $('#deviceName').val(), $('#deviceStates').val(), $('#deviceActions').val(), $('#deviceDependencies').val()];
    json.tableData.push(deviceJSON);
    var stream = fs.createWriteStream('./resources/app/json/devices.json');
    stream.write(JSON.stringify(json));
    stream.end();
  });
}

//ADDING AN AREA INTO NETWORK
function addArea() {
  var tempArea = new Area($('#areaName').val());
  areaList.push(tempArea); //Adds area to JS array of area objects
}

//Create Device Datatable when button to summon modal is clicked
$('#add-device-button').click(function() {
  if (!($.fn.dataTable.isDataTable('#deviceTable'))){ //if the datatable isn't created, make it
    deviceTable = $('#deviceTable').DataTable({
  	  "paging": true,
  	  "iDisplayLength": 5,
      "lengthMenu": [[5, 10, 25, 50, 100, -1], [5, 10, 25, 50, 100, "All"]],
      "responsive": true,
      "autoWidth": false,
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
