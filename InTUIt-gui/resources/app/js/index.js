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
var ndfFile = username + '-' + networkName + '.ndf';
console.log(ndfFile); //should show the expected file name in the chrome console


//script that executes once index page is fully loaded
$('document').ready(function() {
  //Populate the Username and Network Fields bassed on Login
  $('#user-name').html('User: ' + username);
  $('#network-name').html('Network: ' + networkName);
});

//Function to construct the NDF file for a user network
function buildNDF(NSRD) {
  var stream = fs.createWriteStream('./resources/app/ndf/' + ndfFile);
  stream.write('NDF, ' + username + ', ' + networkName + '\n');
  stream.write(NSRD);
  stream.end();
}

//ADDING A DEVICE INTO NETWORK
function addDevice() {
  var deviceName = $('#deviceName').val();
  var deviceStates = $('#deviceStates').val();
  var deviceActions = $('#deviceActions').val();
  var deviceDependencies = $('#deviceDependencies').val();

  var NSRD = deviceName + ' ' + deviceStates + ' ' + deviceActions + ' ' + deviceDependencies + '\n';
  buildNDF(NSRD);
}
