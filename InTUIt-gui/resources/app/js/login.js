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
var password; //Password of user for login

//call function to 
$(document).ready(function() {
	$('#choose-network-load').load('./html/modals/login_network.html');
	$("#login").submit(function(e) {
    e.preventDefault();
		login();
	});
});

//modal function to log user into system
function login() {
  userName = $('#userName').val();
  password = $('#password').val();
  networkName = $('#chooseNetwork').val();
  	$('#homepage-redirect').click(function() {
		window.location='./homepage.html?userName=' + userName +'&networkName=' + networkName
	});
	$('#logout').click(function() {
		window.location.reload(true);
	});
}
