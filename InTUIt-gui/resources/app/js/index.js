/*****************************************************************************************************************
Programmed by: Christopher Franklyn, Jess Geiger
Description: This file contains important functions and resources for the entire UI, including cloud storage info,
             functions for interacting with the cloud service, and code dealing with IPMS settings (interval, etc.
Last Modified: 10/14/2016

******************************************************************************************************************/

/****************UNTESTED CODE***********************/

//this command loads jquery properly
window.$ = window.jQuery = require('./js/jquery.min.js');
//for file system reading/writing
var fs = require('fs');

var userName; //Variable for logged in user. Default is 'generic'
var networkName; //Variable for current network. Default is 'network'
var ndfFile = username + '-' + networkName + '.ndf';
console.log(ndfFile); //should show the expected file name in the chrome console


//script that executes once index page is fully loaded
$('document').ready(function() {
  //Populate the Username and Network Fields bassed on Login  
  if (userName == "") {
  userName = "Generic User";
  }
  if (networkName == "") {
  networkName = "Generic Network";
  }  
  $('#user-name').html('User: ' + username);
  $('#network-name').html('Network: ' + networkName);
});

//script that executes once login buton is clicked - display modal
var loginButton = document.getElementById("login");
loginButton.onclick = function() {
	modal.style.display = "block";
}

//modal function to log user into system
function login() {
  userName = $('#userName').val();
  networkName = $('#networkName').val();
  //reload page
}
