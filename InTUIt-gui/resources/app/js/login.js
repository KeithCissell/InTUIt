/*****************************************************************************************************************
Programmed by: Christopher Franklyn, Jess Geiger
Description: This file contains important functions and resources for the entire UI, including cloud storage info,
             functions for interacting with the cloud service, and code dealing with IPMS settings (interval, etc.
Last Modified: 10/14/2016
******************************************************************************************************************/

//this command loads jquery properly
window.$ = window.jQuery = require('./js/jquery.min.js');
//for file system reading/writing
var fs = require('fs');

var userName; //Variable for logged in user. Default is 'generic'
var networkName; //Variable for current network. Default is 'network'


//script that executes once index page is fully loaded
$(document).ready(function() {

	$("#login").submit(function(e) {
    e.preventDefault();
		login();
	});

});

//script that executes once login buton is clicked - display modal
//var loginButton = document.getElementById("login");
//loginButton.onclick = function() {
//	modal.style.display = "block";
//}

//modal function to log user into system
function login() {
  userName = $('#userName').val();
  networkName = $('#networkName').val();
  window.location.assign('./homepage.html?userName=' + userName +'&networkName=' + networkName);
}
