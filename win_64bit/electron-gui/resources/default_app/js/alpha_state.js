/*****************************************************************************************************************
Programmed by: Austin Hinckley & James Hibben
Description: This file contains all of the necessary JavaScript code for the Alpha-State tab, including adding and
             removing devices, attributes, and attribute components and submitting the alpha-state to the cloud.
Last Modified: 5/4/2016

******************************************************************************************************************/

var deviceIndex = 0,  // Device index -- NOT decremented when a device is removed
		deviceCount = 0,  // Device count -- IS decremented when a device is removed
		attribIndex = {},  // attribute index for default attribute names and id's -- so they don't overlap after removal
    attribCount = {},  // attribute totals counted per device, ordered by device name ("device #" if it has no name)
		alphaState = {},    // Json object for the alpha state
		stateLimit = 100,    // state limit per device
		actionLimit = 10;    // action limit per device


// This function gets called when an existing alpha-state file is loaded
function loadAlphaState(data) {
	loadingUI = true;
	for (var device in data) {
		// Set device name and trigger onchange to change the toggle button text
		$('#new_dev_button').click();    // Click Add New Device
		var dv = 'dv' + deviceIndex;
		$('#' + dv + ' .device_name').get(0).value = device;    // Change input text
		$('#' + dv + ' .device_name').get(0).onchange();    // Make button text change

		for (var attrib in data[device]) {
			// Set attribute name and trigger onchange event to change the toggle button text
			$('#' + dv + ' .add_attrib').click();    // Click Add New Attribute
			var attr = dv + '_attr' + attribIndex[dv];
			$('#' + attr + ' .attrib_name').get(0).value = attrib;
			$('#' + attr + ' .attrib_name').get(0).onchange();

			// Add states, actions, and dependencies to their listboxes
			var states = data[device][attrib]["states"];
			var actions = data[device][attrib]["actions"];
			var dependencies = data[device][attrib]["dependencies"];
			for (var i = 0; i < states.length; i++) {
				$('#' + attr + ' .states paper-input').get(0).value = states[i];    // Set state name input value
				$('#' + attr + ' .states paper-button').first().click();    // Click Add New State
				$('#' + attr + ' .states paper-input').get(0).value = "";    // Clear the input
			}
			for (var i = 0; i < actions.length; i++) {
				$('#' + attr + ' .actions paper-input').get(0).value = actions[i];    // Set action name input value
				$('#' + attr + ' .actions paper-button').first().click();    // Click Add New Action
				$('#' + attr + ' .actions paper-input').get(0).value = "";    // Clear the input
			}
			for (var i = 0; i < dependencies.length; i++) {
				$('#' + attr + ' .dependencies paper-input').get(0).value = dependencies[i];    // Set dependency input value
				$('#' + attr + ' .dependencies paper-button').first().click();    // Click Add New Dependency
				$('#' + attr + ' .dependencies paper-input').get(0).value = "";    // Clear the input
			}
			// Click attribute toggle to collapse
			$('#' + attr + '_toggle').click();
		}

		// Click device toggle button to collapse
		$('#' + dv + '_toggle').click();
	}
	loadingUI = false;
}


// *********** Devices ***********


// called when one of the "Add New ____" buttons is pressed
function addDevice() {
	// set the toggle var and collapse devices
	var toggle = '.device.toggle';
	collapseGroup(toggle);

	// increment counter variables
	++deviceIndex;
	++deviceCount;
	// var to use as base ID
	var dv = 'dv' + deviceIndex;
	// parse the template as HTML for iteration
	var dev = $.parseHTML(devTemplate);
	// loop through each top-level element
	$(dev).each(function (index, element) {
		if ($(element).hasClass('toggle')) {
			// assign toggle button's attributes
			$(element).attr({
				id: dv + '_toggle',
				for: '#' + dv,
				onclick: 'collapse(\'#' + dv + '\')',
				defaultname: 'Device ' + deviceIndex
			});
			$(element).text('Device ' + deviceIndex);
		}
		else if ($(element).hasClass('collapsible')) {
			// assign collapsible area's id and major children's attributes
			$(element).attr('id', dv);
			$(element).find('div > paper-input').attr('onchange', 'renameDevice(\'#' + dv + '\')');
			$(element).find('.add_attrib').attr({
				id: dv + '_add_attrib',
				onclick: 'addAttribute(\'' + dv + '\')'
			});
		}
		// insert the current element before the "Add New Device" button
		$('#new_dev_button').before(element);
	});
	// update attribute count and index objects to include new device (with 0 attributes)
	if (attribCount[dv] == null) {
		attribCount[dv] = 0;
	}
	if (attribIndex[dv] == null) {
		attribIndex[dv] = 0;
	}
	// Set the remove button to the new device
	$('#' + dv + ' .remove_dev_button').attr('onclick', 'removeItem(\'device\', \'#AlphaState\', \'#' + dv + '\');');
}


// Change the device/attrib button label when name is changed
function renameDevice(container) {
	var input = container + ' > div > paper-input',
			toggle = container + '_toggle';

	// Query for the dom objects -- do it as few times as possible to maximize performance
	var toggleButton = $(toggle).get(0);
	var inputValue = $(input).get(0).value;
	if (alphaState.hasOwnProperty(inputValue.toLowerCase())) {
		// Don't change the name if the device name is already in the alpha state
		// This also prevents attribute names being the same as device names (which is why this is here and not below)
		$(input).get(0).value = toggleButton.innerText.toLowerCase();
		alert("The alpha-state already has a device named " + inputValue + ".");
		return;
	}

	// Reflect name change in the alphaState object
	// ToLowerCase() is used because the toggle buttons automatically convert labels to upper case
	var oldDevName = toggleButton.innerText.toLowerCase();
	var newDevName = inputValue.toLowerCase();
	if (alphaState.hasOwnProperty(oldDevName)) {
		// A previous device exists in alphaState, so change its name
		alphaState[newDevName] = alphaState[oldDevName];
		delete alphaState[oldDevName];
	}
	else {
		// Make a new entry in alphaState for the newly-named device
		alphaState[newDevName] = {};
	}

	// insert the device to the base policy model
	addDevToPolicyModel(newDevName, oldDevName);

	// change the text of the toggle button
	if (inputValue != "") {
		toggleButton.innerText = inputValue;
		if (!container.includes('attr')) {
			// Name entered -- enable add attribute button
			$(container + ' .add_attrib').removeAttr('disabled');
		}
	}
	else {
		toggleButton.innerText = $(toggle).attr('defaultname');
		if (!container.includes('attr')) {
			// Name not entered -- disable add attribute button
			$(container + ' .add_attrib').attr('disabled', 'disabled');
		}
	}

	// check if the device has already been added to the policy tab
	var evalContainer = '#eval_' + container.substring(1) + '_toggle';
	if ($(evalContainer).get() == 0) {
		// container not yet added to policy tab; add it
		addEvalDevice(container.substring(1));
	}
	// rename the device to match its alpha state counterpart
	$(evalContainer).text($(toggleButton).text());
	if (deviceMap[oldDevName] == null) {
		// device did not previously exist; add it
		deviceMap[newDevName] = {
			'name': container.substring(1)
		};
	}
	else {
		// migrate the data to newDevName
		deviceMap[newDevName] = deviceMap[oldDevName];
		delete deviceMap[oldDevName];
	}
}


// *********** Attributes ***********


function addAttribute(parent) {
	var toggle = '.attrib.toggle'
	// Minimize any expanded collapsibles at the same level
	collapseGroup(toggle);

	// clone a new object and populate its attributes
	var dv = parent;
	++attribIndex[dv];
	++attribCount[dv];
	var attr = dv + '_attr' + (attribIndex[dv])
	// parse the attribute template and store it
	var attrib = $.parseHTML(attTemplate);
	// determine the insertion point
	var insertPoint = $('#' + parent + ' > div').get(0);
	$(attrib).each(function (index, element) {
		// find out if we need to set any attributes
		if ($(element).hasClass('toggle')) {
			// set attributes for toggle class
			$(element).attr({
				id: attr + '_toggle',
				onclick: 'collapse(\'#' + attr + '\')',
				for: '#' + attr,
				defaultname: 'Attribute ' + attribIndex[dv]
			});
			$(element).text('Attribute ' + attribIndex[dv]);
		}
		else if ($(element).hasClass('collapsible')) {
			// set id for collapsible element
			$(element).attr('id', attr);
		}
		// insert element into the dom
		insertPoint.appendChild(element);
		$('#' + attr + ' > paper-input').attr('onchange', 'renameAttrib(\'#' + attr + '\')');
	});
	// bump the add-attribute button to the bottom of its containing element
	$('#' + parent + ' > div').append($('#' + dv + '_add_attrib'));

	// Set the remove button for the new attribute
	$('#' + attr + ' .remove_attrib_button').attr('onclick', 'removeItem(\'attrib\', \'#' + parent + '\', \'#' + attr + '\');');

	// Set event handlers for states
	var stateButtons = $('#' + attr + ' .states paper-button');
	// stateButtons.first().attr('onclick', 'addAttribPart(\'states\', \'#' + dv +'\', \'#' + attr + '\')')
	stateButtons.get(0).onclick = function () { addAttribPart('states', '#' + dv, '#' + attr) };
	stateButtons.get(1).onclick = function () { removeAttribPart('states', '#' + dv, '#' + attr) };
	$('#' + attr + ' .states paper-listbox paper-item').attr('onclick', 'clickListItem(\'states\', \'#' + attr + '\');');

	// Set event handlers for dependencies
	var depButtons = $('#' + attr + ' .dependencies paper-button');
	depButtons.get(0).onclick = function () { addAttribPart('dependencies', '#' + dv, '#' + attr) };
	depButtons.get(1).onclick = function () { removeAttribPart('dependencies', '#' + dv, '#' + attr) };
	$('#' + attr + ' .dependencies paper-listbox paper-item').attr('onclick', 'clickListItem(\'dependencies\', \'#' + attr + '\');');

	// Set event handlers for actions
	var actionButtons = $('#' + attr + ' .actions paper-button');
	actionButtons.get(0).onclick = function () { addAttribPart('actions', '#' + dv, '#' + attr) };
	actionButtons.get(1).onclick = function () { removeAttribPart('actions', '#' + dv, '#' + attr) };
	$('#' + attr + ' .actions paper-listbox paper-item').attr('onclick', 'clickListItem(\'actions\', \'#' + attr + '\');');
}


function renameAttrib(container) {
	var input = container + ' > paper-input',
			toggle = container + '_toggle';

	// query for DOM objects
	var toggleButton = $(toggle).get(0),
			inputValue = $(input).get(0).value;
	if (alphaState[inputValue.toLowerCase()] != undefined) {
		// Prevent attributes from having the same names as devices
		$(input).get(0).value = toggleButton.innerText.toLowerCase();    // Change back to the previous name
		alert("Attributes cannot have the same names as devices.");
		return;
	}

	// Reflect name change in the alphaState object
	// ToLowerCase() is used because the toggle buttons automatically convert labels to upper case
	var oldAttrName = toggleButton.innerText.toLowerCase();
	var newAttrName = inputValue.toLowerCase();
	var device = container.substring(0, container.indexOf('_'));
	var deviceName = $(device + " > div > paper-input").get(0).value.toLowerCase();
	if (alphaState[deviceName].hasOwnProperty(newAttrName)) {
		// Don't do anything if the attribute name is already being used for this device
		$(input).get(0).value = oldAttrName;
		alert("This device already has an attribute named " + inputValue + ".");
		return;
	}

	if (alphaState[deviceName].hasOwnProperty(oldAttrName)) {
		// A previous attribute exists in this slot, so change its name
		alphaState[deviceName][newAttrName] = alphaState[deviceName][oldAttrName];
		deviceMap[deviceName][newAttrName] = deviceMap[deviceName][oldAttrName];
		delete alphaState[deviceName][oldAttrName];
	}
	else {
		// Make a new entry for the attribute for this device
		alphaState[deviceName][newAttrName] = { 'states': [], 'dependencies': [], 'actions': [] };
	}

	// change the text of the toggle button
	if (inputValue != "") {
		toggleButton.innerText = inputValue;
		if (!container.includes('attr')) {
			// Name entered -- enable add attribute button
			$(container + ' .add_attrib').removeAttr('disabled');
		}
	}
	else {
		toggleButton.innerText = $(toggle).attr('defaultname');
		if (!container.includes('attr')) {
			// Name not entered -- disable add attribute button
			$(container + ' .add_attrib').attr('disabled', 'disabled');
		}
	}
}


// Called when "Remove Device" or "Remove Attribute" button is clicked
function removeItem(type, container, collapsible) {
	// Removes a collapsible and a toggle button (both include the #)
	// Interestingly, calling this function with the name 'remove' makes the button disappear

	if (type == 'device') {
		var deviceName = $(collapsible + ' .device_name').get(0).value.toLowerCase();
		delete alphaState[deviceName];    // Remove the device from the alphaState object
		--deviceCount;    // not needed? (can just do alphaState.length)
	}
	else if (type == 'attrib') {
		var deviceName = $(container + ' .device_name').get(0).value.toLowerCase();
		var attrName = $(collapsible + ' .attrib_name').get(0).value.toLowerCase();
		delete alphaState[deviceName][attrName];    // Remove the device's attribute from the alphaState object
		--attribCount[container.substring(1)];    // substring takes out the #
	}
	// remove the device/attribute from the basePolicy object
	removePolicyObject(type, container, collapsible);

	// Remove the whole collapsible and the toggle button that goes with it
	$(collapsible).remove();
	$(collapsible + "_toggle").remove();
}


// *********** Attribute Components ***********


// Called when "Add State", "Add Dependency", or "Add Action" buttons are clicked
// device and attribute both include #, and type is also the container classname
function addAttribPart(type, device, attribute) {
	var container = attribute + " ." + type;
	var inputValue;    // This is what goes in the listbox
	var deviceName = $(device + " > div > paper-input").get(0).value.toLowerCase();
	var attrName = $(attribute + " > paper-input").get(0).value.toLowerCase();
	var attrObject = alphaState[deviceName][attrName];
	if (alphaState[deviceName][attrName] == null) {
		alert("Please name the attribute before adding attribute components.");
		return;
	}

	if (type == "dependencies") {
		// Get the dependency from the input
		inputValue = $(container + " paper-input").get(0).value.toLowerCase();
		$(container + " paper-input").get(0).value = "";    // Clear text input

		// Split on : to get device and attribute
		var colonIndex = inputValue.indexOf(':');
		if (colonIndex <= 0 || colonIndex == inputValue.length - 1) {
			alert("Invalid dependency format - must be entered as Device:Attribute");
			return;
		}
		else {
			depDevice = inputValue.substring(0, colonIndex);
			depAttrib = inputValue.substring(colonIndex + 1);
		}

		// Make sure the device and attribute exist and the attribute is not a self-reference
		if (!loadingUI) {
			if (alphaState[depDevice] == undefined) {
				alert("Device '" + depDevice + "' not found.");
				return;
			}
			else if (alphaState[depDevice][depAttrib] == undefined) {
				alert("Attribute '" + depAttrib + "' for device '" + depDevice + "' not found.");
				return;
			}
			else if (depAttrib === attrName) {
				alert("Attributes cannot depend upon themselves.");
				return;
			}
		}
		// Check for duplicates
		for (var i = 0; i < attrObject[type].length; i++) {
			var dep = attrObject[type][i];
			var dev = dep.substring(0, dep.indexOf(':'));
			var attr = dep.substring(dep.indexOf(':') + 1);
			if (dev === depDevice && attr === depAttrib) {
				// Exact dependency found for the attribute, so don't add it
				alert("This attribute already contains a dependency for '" + attr + "'.");
				return;
			}
		}

		// Add the dependency to the alphaState object
		attrObject[type].push(inputValue);
	}
	else {
		// Get the state/action name from the input
		inputValue = $(container + " paper-input").get(0).value.toLowerCase();
		$(container + " paper-input").get(0).value = "";    // Clear text input

		// Check for duplicate or empty state/action names
		if (attrObject[type].indexOf(inputValue) != -1 || inputValue == "") {
			alert("Names of attribute components must be unique.");
			return;
		}
		// Enforce limit of 100 states or 10 actions
		if (type == 'states' && attrObject[type].length >= stateLimit) {
			alert("Error: Cannot add more than" + stateLimit + " states per attribute");
			return;
		}
		else if (type == 'actions' && attrObject[type].length >= actionLimit) {
			alert("Error: Cannot add more than " + actionLimit + " 10 actions per attribute");
			return;
		}
		// Add the state/action into the alphaState object
		attrObject[type].push(inputValue);

		// add attribute to policy tab
		if (type == 'actions') {
			if ($('#eval_' + attribute.substring(1)).get() == 0) {
				// HTML object does not exist- make it
				addEvalAttrib(device.substring(1), attribute.substring(1));
				$('#eval_' + attribute.substring(1) + '_toggle').text($(attribute + '_toggle').text());
			}
			// add attribute to base policy model
			addAttrToPolicyModel(deviceName, attrName, '');
		}
	}
	// insert the new attribute into the device map
	deviceMap[deviceName][attrName] = attribute.substring(attribute.indexOf('_') + 1);

	// Insert the item into its listbox -- this should work with all types
	var newItem = "<paper-item onclick=\"clickListItem(\'" + type + "\', \'" + attribute + "\', this.innerText);\">" + inputValue + "</paper-item>";
	$(container + " paper-listbox div").append(newItem);
}


// Called when "Remove State", "Remove Dependency", or "Remove Action" buttons are clicked
// device and attribute both include #, and type is also the container classname
// This function removes the item specified in the "Name" field, if it exists
function removeAttribPart(type, device, attribute) {
	var container = attribute + " ." + type;
	var deviceName = $(device + " > div > paper-input").get(0).value.toLowerCase();
	var attrName = $(attribute + " > paper-input").get(0).value.toLowerCase();
	var attrObject = alphaState[deviceName][attrName];

	// Remove the state/action/dependency from listbox
	var removeText = $(container + " paper-input").get(0).value.toLowerCase();
	$(container + " paper-input").get(0).value = "";    // Clear text input
	$(container + " paper-listbox paper-item").filter(function () { return this.innerText == removeText; }).remove();

	// Remove the state/action from alphaState
	attrObject[type].splice(attrObject[type].indexOf(removeText), 1);
}


// Called whenever an item in a listbox is clicked -- this will place the item in the input(s)
// attribute includes #, and type is also the container classname
function clickListItem(type, attribute, itemText) {
	var container = attribute + " ." + type;
	$(container + " paper-input").get(0).value = itemText;
}


// *********** Alpha-State Submission ***********


// Write alphaState object to a file and send it to the Policy Engine
function submitAlphaState() {
	// Prevent sending anything until the network ID has been set
	if (!ipmsSettings.network.id) {
		alert('Error: The network ID must be set before sending the alpha-state.');
		return;
	}

	// Make sure alphaState has at least one device
	if (Object.keys(alphaState).length == 0) {
		alert("Error: The alpha-state must have at least one named device");
		return;
	}

	// Make sure devices have at least one attribute
	for (var device in alphaState) {
		if (Object.keys(alphaState[device]).length == 0) {
			alert("Error: All devices must have at least one named attribute");
			return;
		}
	}

	writeToFile(ipmsSettings.network.files.alphaState, JSON.stringify(alphaState, null, "  "))
	.then(function () {
		// When that's done, send the file to cloud storage
		return sendFileToStorage(ipmsSettings.network.files.alphaState, ipmsSettings.network.id+".alpha", alphaContainer);
	})
	.then(function () {
		// This is the last step for the alphaState file stuff, so display a confirmation to the user
		ipmsSettings.sentToMaster.alphaState = true;
		storeSettings();
		// unlock the base policy tab
		$('#policy_eval').removeAttr('disabled');
		alert("The alpha-state was successfully sent to the cloud service!");
	})
	.catch(function (err) {
		// Something failed somewhere
		alert("Error submitting alpha-state: " + err);
	});
}
