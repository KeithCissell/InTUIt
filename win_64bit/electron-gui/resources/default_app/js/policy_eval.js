/*****************************************************************************************************************
Programmed by: Austin Hinckley, James Hibben & Jared Hall
Description: This file contains all of the necessary JavaScript code for the Policy Eval tab, including adding
             statements relating the alpha-state's states with actions and submitting the policy evaluation model.
Last Modified: 5/4/2016

******************************************************************************************************************/

var MAX_STATEMENTS = 1000;

var basePolicy = {};	// JSON object for the base policy evaluation
var deviceMap = {}; // map device names to IDs (e.g., dev1 => dv1)
var stmtIndex = {};
var stmtCount = {};
stmtCount['totalStmtCount'] = 0;    // Initialize total to 0


function addEvalDevice(dv) {
	// Add device to base policy tab
	// Parse the policy template
	var policyDevice = $.parseHTML(evalDevice);
	// determine insertion point
	var insertPoint = $('#policy_eval').get(0);
	$(policyDevice).each(function (index, element) {
		if ($(element).hasClass('toggle')) {
			$(element).attr({
				id: 'eval_' + dv + '_toggle',
				onclick: 'collapse(\'#eval_' + dv + '\')',
				for: 'eval_' + dv
			});
			$(element).text($('#' + dv + '_toggle').text());
		}
		else if ($(element).hasClass('collapsible')) {
			$(element).attr('id', 'eval_' + dv);
		}
		// insert the element
		$(insertPoint).append(element);
	});
	// add the device to the base policy model
	if (!basePolicy.hasOwnProperty($('#' + dv + '_toggle').text())) {
		basePolicy[$('#' + dv + '_toggle').text()] = {};
	}
	// make sure the submit policy button is at the bottom of the tab
	$('#submit_base_policy').appendTo('#policy_eval');
}


function addEvalAttrib(dv, attr) {
	// convert string to html
	var policyAttrib = $.parseHTML(evalAttrib);
	// determine insertion point
	var insertPoint = $('#eval_' + dv + ' > div');
	$(policyAttrib).each(function (index, element) {
		if ($(element).hasClass('toggle')) {
			$(element).attr({
				id: 'eval_' + attr + '_toggle',
				onclick: 'collapse(\'#eval_' + attr + '\')',
				for: 'eval_' + attr
			});
			$(element).text($('#' + attr + '_toggle').text());
		}
		else if ($(element).hasClass('collapsible')) {
			$(element).attr('id', 'eval_' + attr);
			$(element).find('.add_stmt').attr('onclick', 'addStmt(\'eval_' + attr + '\')')
		}
		// insert the element
		$(insertPoint).append(element);
	});
}


function addDevToPolicyModel(newDevName, oldDevName) {
	if (basePolicy.hasOwnProperty(newDevName)) {
		alert('Base policy already has a device named ' + newDevName + '.');
	}
	else if (basePolicy.hasOwnProperty(oldDevName)) {
		// update the base model to reflect the name change
		basePolicy[newDevName] = basePolicy[oldDevName];
		stmtIndex[newDevName] = stmtIndex[oldDevName];
		stmtCount[newDevName] = stmtCount[oldDevName];
		delete basePolicy[oldDevName];
		delete stmtIndex[oldDevName];
		delete stmtCount[oldDevName];
	}
	else {
		// just add the device to the policy model
		basePolicy[newDevName] = {};
		stmtCount[newDevName] = {};
		stmtIndex[newDevName] = {};
	}
}


function addAttrToPolicyModel(devName, newAttrName, oldAttrName) {
	// For now, this function assumes that devName is already in the basePolicy object
	//  This function may be updated later to check for that and either correct the
	//  problem or just alert the user to the problem
	if (basePolicy[devName][oldAttrName]) {
		// rename the attribute
		basePolicy[devName][newAttrName] = basePolicy[devName][oldAttrName];
		stmtCount[devName][newAttrName] = stmtCount[devName][oldAttrName];
		stmtIndex[devName][newAttrName] = stmtIndex[devName][oldAttrName];
		delete basePolicy[devName][oldAttrName];
		delete stmtCount[devName][oldAttrName];
		delete stmtIndex[devName][oldAttrName];
	}
	else {
		// add the attribute to the model
		basePolicy[devName][newAttrName] = [];
		stmtCount[devName][newAttrName] = 0;
		stmtIndex[devName][newAttrName] = 0;
	}
}


function removePolicyObject(type, container, collapsible) {
	if (type == 'device') {
		var deviceName = $(collapsible + ' .device_name').get(0).value.toLowerCase();
		collapsible = "#eval_" + collapsible.substring(1);  // set removal target
		// remove device from base policy, count, and index objects
		delete basePolicy[deviceName];
		delete stmtCount[deviceName];
		delete stmtIndex[deviceName];
	}
	else if (type == 'attrib') {
		var deviceName = $(container + ' .device_name').get(0).value.toLowerCase();
		var attrName = $(collapsible + ' .attrib_name').get(0).value.toLowerCase();
		collapsible = '#eval_' + collapsible.substring(1); // set this to the removal target
		// remove attribute from base policy, count, and index objects
		delete basePolicy[deviceName][attrName];
		// Only try removing the statement info if it exists
		// We can safely remove the statement count and index info here because the containing object no longer exists
		if (stmtCount[deviceName][attrName] != null) {
			delete stmtCount[deviceName][attrName];
		}
		if (stmtIndex[deviceName][attrName] != null) {
			delete stmtIndex[deviceName][attrName];
		}
	}

	// Remove item from the policy tab
	$(collapsible).remove();
	$(collapsible + '_toggle').remove();
}


function addStmtToPolicyModel(devName, attrName, stmtID) {
	// executes when the user clicks the "Add Statement" button
	// Check for stmtID -- If it doesn't exist yet, append the statement to the array.
	if (!basePolicy[devName][attrName][stmtID - 1]) {
		// statement doesn't exist yet; make it
		var stmt = {
			'state': null,
			'action': null
		};
		// add functional dependencies to the statement object
		var fdList = alphaState[devName][attrName]['dependencies'];
		for (var index in fdList) {
			var dependency = verifyDependencyExistence(fdList[index]);
			if (dependency) {
				// add the attribute name to the dependency
				stmt[dependency[1]] = null;
			}
		}
		basePolicy[devName][attrName].push(stmt);
	}
}


function updatePolicyModelStmt(dev, attr, stmtID) {
	// get the device and attribute names from the window
	// verify that the statement exists in base policy object
	// get the values of all menus and update them in the object
	var devName = $('#' + dev + '_toggle').text().toLowerCase().trim(),
      attrName = $('#' + dev + '_' + attr + '_toggle').text().toLowerCase().trim();
	// console.log(basePolicy[devName][attrName]);
	if (basePolicy[devName][attrName][stmtID - 1]) {
		var stmt = $('#eval_' + dev + '_' + attr + '_s' + stmtID),
        stmtObj = basePolicy[devName][attrName][stmtID - 1];
		// get the currently selected action
		stmtObj.action = $(stmt).find('.actions paper-dropdown-menu')[0].value;
		// get the states from the menus
		$(stmt).find('.states').children('paper-dropdown-menu').each(function (item, element) {
			var menuName = $(element).attr('label');
			menuName = menuName.slice(0, menuName.indexOf(' '));
			if (menuName == attrName) {
				stmtObj.state = $(element)[0].value;
			}
			else {
				stmtObj[menuName] = $(element)[0].value;
			}
		});
	}
}


function removeStmt(dev, attr, stmtID) {
	// executes when the user removes a statement
	// Check for stmtID
	// If it exists, prompt the user for confirmation.
	// If the user agrees:
	//  - remove the statement from both the basePolicy object and the DOM
	//    - set index in basePolicy to null to keep indices at (n-1) for all statements
	//  - update stmtCount
	var devName = $('#' + dev + '_toggle').text().toLowerCase(),
      attrName = $('#' + dev + '_' + attr + '_toggle').text().toLowerCase();
	if (basePolicy[devName][attrName][stmtID - 1]) {
		var remStmt = confirm("Are you sure you want to remove this statement?");
		if (remStmt) {
			// code to remove the statement from the DOM and base policy object
			// set the index to null in base policy object
			basePolicy[devName][attrName][stmtID - 1] = null;
			// remove the statement from the DOM
			$('#eval_' + dev + '_' + attr + '_s' + stmtID + '_toggle').remove();
			$('#eval_' + dev + '_' + attr + '_s' + stmtID).remove();
			// update counts
			stmtCount['totalStmtCount'] -= 1;
			stmtCount[devName][attrName] -= 1;
		}
	}
	else {
		// notify the user that there's a problem and offer solution (remove stray statement)
		// this assumes that the object is not in the basePolicy object at all, and its presence in the DOM is coincidental
		var removeQuery = confirm('Error: No matching statement was found in the base policy model. Click OK to remove the statement from the window, or Cancel to leave it.\nTip: If you need to remake the statement, leave the broken version alone until the new copy has been created.');
		if (removeQuery) {
			$('#eval_' + dev + '_' + attr + '_s' + stmtID + '_toggle').remove();
			$('#eval_' + dev + '_' + attr + '_s' + stmtID).remove();
		}
	}
}


function buildPolicyModel() {
	// Restructure base policy to send:
	//  deviceName:
	//    attributeName:
	//      "Given {state,fd1,fd2,...}" associate action"
	//
	// Functional dependences (fd#) need to be in the same order that they appear in their menu for the alpha state tab
	//  - this should be the same order that they appear on the base policy tab, but verification is necessary

	var policy = {};
	for (var device in basePolicy) {
		// check if the device has any properties (attributes); skip this iteration if it doesn't
		if (Object.keys(basePolicy[device]).length == 0) {
			continue;
		}
		// insert the devices into the policy object
		policy[device] = {};
		// insert the functional attributes into the device
		for (var attribute in basePolicy[device]) {
			policy[device][attribute] = [];
			// need to verify the order of dependencies
			// need to get the list of functional dependencies for a given device->attribute
			// need to cycle through the statements in the basePolicy to generate the phrases necessary
			var fdList = alphaState[device][attribute].dependencies;
			for (var stmt in basePolicy[device][attribute]) {
				var statement = 'Given {';
				statement += basePolicy[device][attribute][stmt].state;
				for (var index in fdList) {
					statement += ', ';
					// iterate through the fd list and split the strings to get our information
					var dependency = verifyDependencyExistence(fdList[index]);
					if (dependency) {
						var dev = dependency[0],
                attr = dependency[1];
						statement += basePolicy[device][attribute][stmt][attr];
					}
				}
				statement += '} associate ' + basePolicy[device][attribute][stmt].action;
				policy[device][attribute].push(statement);
			}
		}
	}

	return policy;
}


function submitBasePolicy() {
	// Make sure alphaState has at least one device
	if (Object.keys(basePolicy).length == 0) {
		alert("Error: The base policy must have at least one named device");
		return;
	}

	// Make sure devices have at least one attribute
	//for (var device in basePolicy) {
	//	if (Object.keys(basePolicy[device]).length == 0) {
	//		alert("Error: All devices must have at least one named attribute");
	//		return;
	//	}
	//}

	var policyModel = buildPolicyModel();

	// This is the file that is used to save the state of the Policy Eval tab. If this is not saved, then
	//  the entire tab is rebuilt and the user would have to re-enter all of the statements they had before.
	//  Due to the way the policyModel object stores the statements, it would be much more difficult to reload
	//  the Policy Eval tab.
	writeToFile(ipmsSettings.network.files.basePolicy, JSON.stringify(basePolicy, null, "  "));

	// Writing the policy model object to file only for purposes of sending to the cloud service master.
	//  This code block is the only time it will be referenced as a file, as loading it like the base
	//  policy object to rebuild the Policy Eval tab will be far too difficult right now.
	writeToFile(ipmsSettings.network.files.policyModel, JSON.stringify(policyModel, null, "  "))
	.then(function () {
		// When that's done, send the file to cloud storage
		return sendFileToStorage(ipmsSettings.network.files.policyModel, ipmsSettings.network.id+".rules", evalContainer);
	})
	.then(function () {
		// This is the last step, so display a confirmation to the user
		ipmsSettings.sentToMaster.basePolicy = true;
		storeSettings();
		$("#IntervalButton").removeAttr('disabled');    // Enable start button
		alert("The base policy evaluation model was successfully sent to the cloud service!");
	})
	.catch(function (err) {
		// Something failed somewhere
		alert("Error submitting base policy: " + err);
		return;
	});
}


function verifyDependencyExistence(dependency) {
	// takes a string parameter
	// returns an array consisting of the device and attribute if succussful
	// returns false otherwise
	var depArray = dependency.split(':');
	// double-check that both items exist
	if (alphaState[depArray[0]][depArray[1]] == undefined || alphaState[depArray[0]][depArray[1]] == null) {
		// one or both parts of the array do not exist in the system; return false
		return false;
	}
	// both items exist; return the array
	return depArray;
}


function addStmt(parent) {
	// collapse all other attribute statements
	collapseGroup(parent + ' .stmt.toggle');
	// check if the policy object is at MAX_STATEMENTS
	//    if it is, display a message and exit the function
	if (stmtCount['totalStmtCount'] >= MAX_STATEMENTS) {
		alert('The maximum number of statements has already been reached. No further statements can be added.');
		return;
	}

	// split apart parent to get the device and attribute info
	var devStart = parent.indexOf('_');
	var devEnd = parent.lastIndexOf('_');
	var device = parent.substring(devStart + 1, devEnd);
	var deviceName = $('#eval_' + device + '_toggle').get(0).innerText.toLowerCase().trim();
	var attrib = parent.substring(devEnd + 1);
	var attribName = $('#' + parent + '_toggle').get(0).innerText.toLowerCase().trim();

	// do stmtIndex and stmtCount have a value?
	if (stmtIndex[deviceName][attribName] == null) {
		stmtIndex[deviceName][attribName] = 0;
	}
	if (stmtCount[deviceName][attribName] == null) {
		stmtCount[deviceName][attribName] = 0;
	}

	// Increment counters
	stmtCount[deviceName][attribName] += 1;
	stmtIndex[deviceName][attribName] += 1;
	stmtCount['totalStmtCount'] += 1;

	var newStmt = $.parseHTML(evalStatement),
      stmt = parent + '_s' + stmtIndex[deviceName][attribName],
      insertPoint = document.querySelector('#' + parent + ' > div');

	// determine the set of attributes involved
	$(newStmt).each(function (index, element) {
		if ($(element).hasClass('toggle')) {
			// set attributes for the statement
			$(element).attr({
				id: stmt + '_toggle',
				for: stmt,
				onclick: 'collapse(\'#' + stmt + '\')',
				defaultname: 'Statement ' + stmtIndex[deviceName][attribName]
			});
			// set the text for the toggle button
			Polymer.dom(element).innerHTML = $(element).attr('defaultname');
		}
		else if ($(element).hasClass('collapsible')) {
			// set collapsible id
			$(element).attr('id', stmt);

			// add any functional dependencies
			$('#' + stmt + '_toggle').text('Statement ' + stmtIndex[parent]);
			var fdObj = alphaState[deviceName][attribName]['dependencies'],
          actObj = alphaState[deviceName][attribName]['actions'],
          stateObj = alphaState[deviceName][attribName]['states'];
			var fd, action, dev, attr, st;

			// set the class for the attribute's state menu
			$(element).find('.states paper-dropdown-menu').attr({
				class: deviceName + ' ' + attribName,
				label: attribName + ' state',
				onclick: 'updatePolicyModelStmt(\'' + device + '\',\'' + attrib + '\',' + stmtIndex[deviceName][attribName] + ')'
			});
			$(element).find('.actions paper-dropdown-menu').attr({
				onclick: 'updatePolicyModelStmt(\'' + device + '\',\'' + attrib + '\',' + stmtIndex[deviceName][attribName] + ')'
			});

			// set the onclick attribute for the remove button
			$(element).find('.actions .remove_stmt').attr({
				onclick: 'removeStmt(\'' + device + '\', \'' + attrib + '\', ' + stmtIndex[deviceName][attribName] + ')'
			});
			// add items to the attribute state dropdown
			for (var index in fdObj) {
				// console.log(fd);
				var newMenu = $.parseHTML('<paper-dropdown-menu></paper-dropdown-menu>');
				var newSubMenu = $.parseHTML('<paper-menu class=\'dropdown-content\'></paper-menu>');
				var state, item, menuItem;
				// verify that the dependency being inspected exists
				fd = verifyDependencyExistence(fdObj[index]);
				if (fd) {
					dev = fd[0];
					attr = fd[1];

					$(newMenu).attr({
						class: dev + ' ' + attr,
						label: attr + ' state',
						onclick: 'updatePolicyModelStmt(\'' + device + '\',\'' + attrib + '\',' + stmtIndex[deviceName][attribName] + ')'
					});
					var depStates = alphaState[dev][attr]['states'];
					for (state = 0; state < depStates.length; ++state) {
						menuItem = $.parseHTML('<paper-item>' + depStates[state] + '</paper-item>')[0];
						Polymer.dom($(newSubMenu).get(0)).appendChild(menuItem);
					}
				}
				$(newMenu).find('.dropdown-content').append(newSubMenu);
				Polymer.dom(element).querySelector('.states').appendChild($(newMenu).get(0));
			}

			// add the list of actions to its menu
			for (action in actObj) {
				var menuItem = $.parseHTML('<paper-item>' + actObj[action] + '</paper-item>')[0],
        selector = '.actions paper-dropdown-menu paper-menu.dropdown-content';
				Polymer.dom($(element).find(selector).get(0)).appendChild(menuItem);
			}

			// add the list of states to its menu
			for (state in stateObj) {
				var menuItem = $.parseHTML('<paper-item>' + stateObj[state] + '</paper-item>')[0],
        selector = '.states paper-dropdown-menu paper-menu.dropdown-content';
				Polymer.dom($(element).find(selector).get(0)).appendChild(menuItem);
			}
		}

		// insert the element to the DOM
		insertPoint.appendChild(element);
	});

	// bump the add and remove buttons to the bottom
	$(insertPoint).append($('#' + parent + ' .add_stmt'));
	// add the statement to the base policy
	addStmtToPolicyModel(deviceName, attribName, stmtIndex[deviceName][attribName]);
}


function loadBasePolicy(data) {
	// uses deviceMap to reverse-lookup the ID for the target elements
	//  - necessary to select the correct device-attribute combo to create
	//    statement(s) in
	loadingUI = true;
	for (var device in data) {
		var devID = deviceMap[device].name;
		for (var attrib in data[device]) {
			// create the statements in the correct device->attribute
			if (attrib != 'name') {
				var attrID = deviceMap[device][attrib],
            evalTarget = '#eval_' + devID + '_' + attrID,
            attrObj = alphaState[device][attrib];
				// cycle through the saved base policy object
				for (var index in data[device][attrib]) {
					if (data[device][attrib][index] == null) {
						stmtIndex[device][attrib] += 1;
						basePolicy[device][attrib][index] = null;
						continue;
					}
					var stmtNum = parseInt(index, 10) + 1,
              stmtTarget = evalTarget + '_s' + stmtNum;
					$(evalTarget).find('.add_stmt').click();

					// get the correct index from the alphaState object
					var found = attrObj['states'].indexOf(data[device][attrib][index].state);
					if (found > -1) {
						Polymer.dom($(stmtTarget).get(0)).querySelector('.' + device + '.' + attrib).querySelector('paper-menu.dropdown-content').select(found);
					}

					// get the action from the alphaState object
					found = attrObj['actions'].indexOf(data[device][attrib][index].action);
					if (found > -1) {
						Polymer.dom($(stmtTarget).get(0)).querySelector('.actions paper-dropdown-menu paper-menu.dropdown-content').select(found);
					}
					// get the functional dependencies from the alphaState object
					for (var index2 in attrObj['dependencies']) {
						var dependency = verifyDependencyExistence(attrObj['dependencies'][index2]);
						// check if the dependency exists and select the item from the menu
						if (dependency) {
							var dev = dependency[0],
                  attr = dependency[1];
							found = alphaState[dev][attr]['states'].indexOf(data[device][attrib][index][attr]);
							if (found > -1) {
								Polymer.dom($(stmtTarget).get(0)).querySelector('.' + dev + '.' + attr).querySelector('paper-menu.dropdown-content').select(found);
							}
						}
					}
					// make sure everything gets added to the base policy object
					basePolicy = data;
				}
			}
		}
	}
	loadingUI = false;
}
