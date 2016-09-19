/*****************************************************************************************************************
Programmed by: Christopher Franklyn
Description: This file contains important functions and resources for the entire UI, including cloud storage info,
             functions for interacting with the cloud service, and code dealing with IPMS settings (interval, etc.
Last Modified: 9/19/2016

******************************************************************************************************************/
//this command loads jquery properly
window.$ = window.jQuery = require('./js/jquery.min.js');


loadingUI = false,	// boolean to prevent the UI from blocking dependencies from being added during initial load
testing = false;	// boolean variable used to set the UI to test mode, preventing sending data to Azure
