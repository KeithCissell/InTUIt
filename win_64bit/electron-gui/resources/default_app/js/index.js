/***************************************************************************************************************** 
Programmed by: Austin Hinckley, James Hibben & Jared Hall
Description: This file contains important functions and resources for the entire UI, including cloud storage info,
             functions for interacting with the cloud service, and code dealing with IPMS settings (interval, etc.
Last Modified: 4/30/2016

******************************************************************************************************************/
//this command loads jquery properly
window.$ = window.jQuery = require('./js/jquery.min.js');

var fs = require('fs');
var azure = require('azure-storage');

loadingUI = false,	// boolean to prevent the UI from blocking dependencies from being added during initial load
testing = false;	// boolean variable used to set the UI to test mode, preventing sending data to Azure

var ipmsSettings = {
	'network': {
		'id': '',
		'status': 'disabled',
		'files': { // get set when network ID is set
			'alphaState': '',
			'basePolicy': '',
			'policyModel': '',
		}
	},	// must be set to send anything to the master
	'interval': {
		'num': '0',
		'unit': 'Seconds',
		'multiplier': '1'
	},
	'sentToMaster': {
		'alphaState': false,
		'basePolicy': false
	}
};

// Cloud service account info
var storageAccount = 'ipolicy';
var storageAccessKey = 'W6o4ws3qUhYYjvIyI/Ddq8zBslb91JjLTNiwCbmMlx1mRMvbInqq8lWVOBfblwcsqlePzRGlziCrrgrPr65KAQ==';
var alphaContainer = 'alphastate';
var evalContainer = 'rules';
var queueName = 'tomaster';

// Set up blob service and queue service using the storage account name and access key
var blobService = azure.createBlobService(storageAccount, storageAccessKey);
var queueService = azure.createQueueService(storageAccount, storageAccessKey);

// Create the storage queue and storage containers if needed
blobService.createContainerIfNotExists(alphaContainer, function (error, result, response) {
	if (error) {
		alert("Failure creating alpha-state storage container!");
	}
});
blobService.createContainerIfNotExists(evalContainer, function (error, result, response) {
	if (error) {
		alert("Failure creating evaluation model storage container!");
	}
});
queueService.createQueueIfNotExists(queueName, function (error, result, response) {
	if (error) {
		alert("Failure creating the storage queue!");
	}
});


// On application start, select the alpha-state tab and load files as needed
window.onload = function () {
	template = document.querySelector('#PageTemplate');    // Global so that the timescale can be accessed elsewhere
	template.selected = 0;    // Select Alpha-State tab first
	template.timescale = 0;   // Select seconds first

	// Find existing file (if it exists) and prompt the user to load it
	$.getJSON("./config/settings.json", function (settings_data) {
		var loadFile = confirm("An existing network settings file has been detected. Do you want to load it?");
		if (loadFile == true) {
			// User confirmed loading the file -- Build alphaState automatically
			loadSettings(settings_data);
			$.getJSON("./config/" + ipmsSettings.network.files.alphaState, function (data) {
				loadAlphaState(data);
			});
			$.getJSON('./config/' + ipmsSettings.network.files.basePolicy, function (data) {
				loadBasePolicy(data);
			});
		}
	});
}


function collapseGroup(selector) {
	// Run through all elements of a given selector to hide the element
	$(selector).each(function (index, element) {
		var target = $(element).attr("for");
		if ($(target).css('display') == 'block') {
			$(target).toggle();
		}
	});
}


function collapse(selector) {
	// write code for toggling the collapsibles at this level
	// scope should also be unique to the container in the case of attributes
	var toggle = ''
	if ($(selector).css('display') == 'none') {
		// figure out if this is an attribute or device
		if ($(selector).hasClass('attrib')) {
			// determine parent device
			var tmp = $(selector).parents('.device.collapsible');
			toggle = '#' + $(tmp).first().attr('id') + ' .attrib.toggle';
		}
		else {
			toggle = '#AlphaState .device.toggle';
		}
		// call collapseGroup with the toggle selector
		collapseGroup(toggle);
	}
	// toggle the collapsible that was originally targeted
	$(selector).toggle();
}


// Sends specified interval or an interval of 0, depending on when the button is clicked
function sendInterval() {
	var intervalButton = $('#IntervalButton').get(0);

	if (intervalButton.innerText.toLowerCase() == "start") {
		// Get the interval value
		var interval = ipmsSettings.interval.num * ipmsSettings.interval.multiplier;
		if (interval < 0) {
			return;
		}

		// Get the interval units and add the network ID to the beginning
		interval += " " + getIntervalUnits(template.timescale);
		interval = ipmsSettings.network.id;

		// Send the interval as a message to the service bus queue
		sendToQueue(interval)
		.then(function () {
			// Change the button to a red Stop button and display a confirmation to the user
			intervalButton.style.color = 'red';
			intervalButton.innerText = "Stop";
			ipmsSettings.interval.status = 'enabled';
			storeSettings();
			alert("The interval was successfully sent to the cloud service! Starting execution...");
		})
		.catch(function (err) {
			alert("Error sending interval: " + err);
		})
	}
	else {
		// Send an interval of 0 to the cloud's service bus queue
		sendToQueue(ipmsSettings.network.id)    // The 'seconds' part doesn't matter, of course
		.then(function () {
			// Change the button to a red Stop button and display a confirmation to the user
			intervalButton.style.color = 'green';
			intervalButton.innerText = "Start";
			ipmsSettings.interval.status = 'disabled';
			storeSettings();
			alert("An interval of 0 was successfully sent to the cloud service! Stopping execution...");
		})
		.catch(function (err) {
			alert("Error sending interval: " + err);
		})
	}
}


// Convert index of the selected interval units to the actual text value
function getIntervalUnits(timescaleNum) {
	switch(timescaleNum) {
		case 0: return "seconds";
		case 1: return "minutes";
		case 2: return "hours";
		case 3: return "days";
		default: return "";
	}
}


// Convert text value interval units to a numbered index
function getTimescaleNum(timescaleUnit) {
	switch(timescaleUnit) {
		case 'Seconds': return 0;
		case 'Minutes': return 1;
		case 'Hours': return 2;
		case 'Days': return 3;
		default: return -1;
	}
}


// Saves the given object to a file (returns a Promise for request chaining)
function writeToFile(filename, contents) {
	return new Promise(function (resolve, reject) {
		fs.writeFile('./resources/default_app/config/' + filename, contents, (err) => {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	})
}


// Sends a file to the cloud service as a blob (returns a Promise for request chaining)
function sendFileToStorage(filename, blobName, container) {
	// stop the function from doing anything if we're testing
	if(testing) {
		// console.log('Testing mode on- exiting sendFileToStorage function...');
		return;
	}
	return new Promise(function (resolve, reject) {
		blobService.createBlockBlobFromLocalFile(container, blobName, './resources/default_app/config/' + filename, function (err, result, response) {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});
}


// Sends a message to the cloud's service bus queue (returns a Promise for request chaining)
function sendToQueue(message) {
	// stop the function from doing anything if we're testing
	if(testing) {
		// console.log('Testing mode on- exiting sendToQueue function...');
		return;
	}
	return new Promise(function (resolve, reject) {
		queueService.createMessage(queueName, message, function (err) {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});
}


// Called when network ID changes or when items are sent to the cloud
function storeSettings() {
	// does not need parameters; everything being stored here is static data
	// get network ID and ensure that there is no leading or trailing whitespace
	var oldNetworkID = ipmsSettings.network.id;
	var newNetworkID = Polymer.dom($('#network_id')).node[0];
	newNetworkID.value = newNetworkID.value.trim();
	ipmsSettings.network.id = newNetworkID.value;
	// scan network ID for any spaces
	if(ipmsSettings.network.id.indexOf(' ') > -1) {
		alert('Error: Network ID cannot contain spaces.');
		ipmsSettings.network.id = '';
		return;
	}

	// set filenames
	var configPath = './resources/default_app/config/';
	ipmsSettings.network.files.alphaState = ipmsSettings.network.id + '_alphaState.json';
	if (oldNetworkID != newNetworkID.value) {
		try {
			// must check filesystem this way using fs.stat() due to Node using the electron executable as the program root
			if(fs.statSync(configPath + oldNetworkID + '_alphaState.json').isFile()) {
				// should return true if the file exists
				fs.rename(configPath + oldNetworkID + '_alphaState.json', configPath + ipmsSettings.network.files.alphaState);
				alert(oldNetworkID + '_alphaState.json renamed to ' + newNetworkID.value + '_alphaState.json');
			}
		}
		catch (err) {
			console.log('No alpha-state file found:\n\t' + err);
		}

		ipmsSettings.network.files.basePolicy = ipmsSettings.network.id + '_basePolicy.json';
		try {
			// must check filesystem this way using fs.stat() due to Node using the electron executable as the program root
			if(fs.statSync(configPath + oldNetworkID + '_basePolicy.json').isFile()) {
				// should return true if the file exists
				fs.rename(configPath + oldNetworkID + '_basePolicy.json', configPath + ipmsSettings.network.files.basePolicy);
				alert(oldNetworkID + '_basePolicy.json renamed to ' + newNetworkID.value + '_basePolicy.json');
			}
		}
		catch (err) {
			console.log('No base policy file found:\n\t' + err);
		}
		ipmsSettings.network.files.policyModel = ipmsSettings.network.id + '_policyModel.json';
		try {
			// must check filesystem this way using fs.stat() due to Node using the electron executable as the program root
			if(fs.statSync(configPath + oldNetworkID + '_policyModel.json').isFile()) {
				// should return true if the file exists
				fs.rename(configPath + oldNetworkID + '_policyModel.json', configPath + ipmsSettings.network.files.policyModel);
				alert(oldNetworkID + '_policyModel.json renamed to ' + newNetworkID.value + '_policyModel.json');
			}
		}
		catch (err) {
			console.log('No policy model file found:\n\t' + err);
		}
	}

	// get interval settings and save them to a file
	ipmsSettings.interval.num = Polymer.dom($('#Interval')).node[0].value
	var unitField = Polymer.dom($('paper-menu.Footer .iron-selected')).node[0],
			multiplier = 1;
	ipmsSettings.interval.unit = unitField.innerText;
	switch(unitField.innerText) {
		case 'Days':
			multiplier *= 24;
		case 'Hours':
			multiplier *= 60;
		case 'Minutes':
			multiplier *= 60;
		default:
			ipmsSettings.interval.multiplier = multiplier;
	}
	// save the settings to file
	writeToFile('settings.json', JSON.stringify(ipmsSettings, null, "  "));
}


function loadSettings(settings) {
	loadingUI = true;
	// load the network ID to the appropriate field
	Polymer.dom($('#network_id')).node[0].value = settings.network.id;

	// load the interval information to the footer
	Polymer.dom($('#Interval')).node[0].value = settings.interval.num;
	Polymer.dom($('paper-menu.Footer')).node[0].select(getTimescaleNum(settings.interval.unit));

	// check if both the alpha state and base policy objects have been sent yet
	if(settings.sentToMaster.alphaState == true) {
		$('#policy_eval').removeAttr('disabled');
	}
	if(settings.sentToMaster.alphaState == true && settings.sentToMaster.basePolicy == true) {
		// both have been sent; set the button accordingly
		$('#IntervalButton').removeAttr('disabled');
		if(settings.network.status == 'enabled') {
			$('#IntervalButton')
				.text('Stop')
				.css('color', 'red');
		}
		else if (settings.network.status == 'disabled') {
			$('#IntervalButton')
				.text('Start')
				.css('color', 'green');
		}
	}
	ipmsSettings = settings;
	loadingUI = false;
}


function toggleTesting() {
	testing = !testing;
	$('#TestButton').text('Testing (' + (testing ? 'on' : 'off') + ')');
	console.log(testing);
}
