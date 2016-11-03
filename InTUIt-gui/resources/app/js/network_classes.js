/*
network_classes.js: A file containing all of the js classes for InTUIt
*/

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
        var ACUString = "\"" + this.acuName + "\": [";
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
