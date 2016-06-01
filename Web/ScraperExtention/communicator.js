//util
function getQueryParameterByUrl(url, name) {
    var qs = url.substring(1);
    name = name + "=";
    if (qs.length > 0) {
        var pos = qs.indexOf(name);
        if (pos != -1) {
            pos += name.length;
            end = qs.indexOf("&", pos);
            if (end == -1) {
                end = qs.length
            }
            return unescape(qs.substring(pos, end));
        }
    }
    return "";
};

function getQueryParameter(name) {
    return getQueryParameterByUrl(window.top.location.search, name);
};

function random(range) {
    return "scraper_" + Math.floor(Math.random() * (range != undefined ? range : 999999999));
};

function convertToDateObj(dateStr) {
    var date = null;
    try {
        date = new Date(dateStr);
    }
    catch (e) {
        //error message
    }
    return date;
};

String.prototype.isNullOrEmpty = function () { return this == null || this == ""; };

var taskTypes = {
    fullTask: "fullTask",
    test: "test",
    undefined: "undefined",
    none: "none"
};

var document_status = {
    moleCanScrap: false,
    isReady: false,
    scraperInProcess: false,
    tabId: -1,
    gloabalScenario: null,
    channelScenario: null,
    statusCodes: new Array(),
    lastStatusCode: null,
    stopPropertyCollection: false,
    task: {
        taskKey: "",
        file: "",
        channel: "",
        location: "",
        dateFrom: "",
        dateFromObj: null,
        dateFromYear: 0,
        dateFromMonth: 0,
        dateFromDay: 0,
        dateTo: "",
        dateToObj: null,
        dateToYear: 0,
        dateToMonth: 0,
        dateToDay: 0,
        type: taskTypes.none,
        checkPropId: 0,
        propertiesMaxCount: 200,
        properties: new Array()
    }
};

var scraper_status_codes = {
    scraper_optional_code: {
        type: 0,
        status: 0,
        message: "Optional",
        time: null
    },
    scraper_can_scrap: {
        type: 0,
        status: 1,
        message: "Scraper can scrap...",
        time: null
    },
    scraper_can_start: {
        type: 0,
        status: 2,
        message: "Scraper can start process...",
        time: null
    },
    scraper_global_scenario: {
        type: 0,
        status: 3,
        message: "Global scenario has loaded...",
        time: null
    },
    scraper_read_task: {
        type: 0,
        status: 4,
        message: "Start read steps...",
        time: null
    },
    scraper_finish_read_task: {
        type: 0,
        status: 5,
        message: "End read steps...",
        time: null
    },
    scraper_undefined:{
        type: 0,
        status: 6,
        message: "Scraper undefined, please enter - channel, location, dateFrom and DateTo...",
        time: null
    },
    scraper_test: {
        type: 0,
        status: 6,
        message: "Scraper can start test scrap...",
        time: null
    },
    scraper_start: {
        type: 0,
        status: 7,
        message: "Start scraping...",
        time: null
    },
    scraper_channel_scenario: {
        type: 0,
        status: 8,
        message: "Channel scenario has loaded...",
        time: null
    },
    scraper_search_page: {
        type: 0,
        status: 8,
        message: "Search page opened...",
        time: null
    }
};

var actions = {
    test: "test",
    set_document_status: "set_document_status",
    get_document_status: "get_document_status",
    status_message: "status_message",
    send_popup: "send_popup",
    load_gloabal_scenario: "load_gloabal_scenario",
    load_channel_scenario: "load_channel_scenario",
    set_task_type: "set_task_type"
};


//var docStatis = document_status;

//util

function Communicator(){
    var o = this;
    this.$loadScenario = $("<div></div>");


    //logic

    this.detectDates = function (docStatus) {
        docStatus.task.dateFromObj = convertToDateObj(docStatus.task.dateFrom);
        docStatus.task.dateFromYear = docStatus.task.dateFromObj.getFullYear();
        docStatus.task.dateFromMonth = docStatus.task.dateFromObj.getMonth();
        docStatus.task.dateFromDay = docStatus.task.dateFromObj.getDate();

        docStatus.task.dateToObj = convertToDateObj(docStatus.task.dateTo);
        docStatus.task.dateToYear = docStatus.task.dateToObj.getFullYear();
        docStatus.task.dateToMonth = docStatus.task.dateToObj.getMonth();
        docStatus.task.dateToDay = docStatus.task.dateToObj.getDate();
    };

    this.detectTask = function (tab) {
        var docStatus = o.getDocumentStatus(tab);
        var task = docStatus.task;
        if (!task.taskKey.isNullOrEmpty() && !task.file.isNullOrEmpty() && !task.channel.isNullOrEmpty() && !task.location.isNullOrEmpty() && !task.dateFrom.isNullOrEmpty() && !task.dateTo.isNullOrEmpty()) {
            task.type = taskTypes.fullTask;
        }
        else if (!task.channel.isNullOrEmpty() && !task.location.isNullOrEmpty() && !task.dateFrom.isNullOrEmpty() && !task.dateTo.isNullOrEmpty()) {
            task.type = taskTypes.test;
            //create file name
            var randomFileName = random() + ".xml";
            task.file = task.file == "" ? randomFileName : task.file;
        }
        else {
            task.type = taskTypes.undefined;
            //create file name
            var randomFileName = random() + ".xml";
            task.file = task.file == "" ? randomFileName : task.file;
        }
        o.setDocumentStatus(tab, docStatus);
        //
        //docStatus = o.getDocumentStatus(tab);
        //task = docStatus.task;
        //
        switch (task.type) {
            case taskTypes.fullTask:
                o.detectDates(docStatus);
                o.setDocumentStatus(tab, docStatus);
                o.setStatus(tab, scraper_status_codes.scraper_start);
                break;
            case taskTypes.test:
                o.detectDates(docStatus);
                o.setDocumentStatus(tab, docStatus);
                o.setStatus(tab, scraper_status_codes.scraper_test);
                break;
            case taskTypes.undefined:
                o.setStatus(tab, scraper_status_codes.scraper_undefined);
                break;
        }
        o.sendToPopup({ action: actions.send_popup, data: docStatus });
        //o.setDocumentStatus(tab, docStatus);
    };

    //load resources
    this.loadChannelScenario = function (tab, sendResponse) {
        var docStatus = o.getDocumentStatus(tab);
        o.$loadScenario.load("scenario/" + docStatus.task.channel + "/scenario.json", function (response, status, xhr) {
            if (status == "success") {
                var scenarioJson = JSON.parse(response.toString());
                docStatus.channelScenario = scenarioJson;
                o.setDocumentStatus(tab, docStatus);
                docStatus = o.getDocumentStatus(tab);
                o.setStatus(tab, scraper_status_codes.scraper_channel_scenario);
                docStatus = o.getDocumentStatus(tab);
                sendResponse(o.getDocumentStatus(tab));
            }
            else {
                //error code
            }
        });
    };

    this.loadGlobalScenario = function (tab, sendResponse) {
        var docStatus = o.getDocumentStatus(tab);
        o.$loadScenario.load("scenario/scraping_scenario.json", function (response, status, xhr) {
            if (status == "success") {
                var scenarioJson = JSON.parse(response.toString());
                docStatus.gloabalScenario = scenarioJson;
                o.setDocumentStatus(tab, docStatus);
                docStatus = o.getDocumentStatus(tab);
                o.setStatus(tab, scraper_status_codes.scraper_global_scenario);
                docStatus = o.getDocumentStatus(tab);
                sendResponse(o.getDocumentStatus(tab));
            }
            else {
                //error code
            }
        });
    };

    //listener method
    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
            case actions.test:
                sendResponse(actions.test);
                break;
            case actions.set_document_status:
                o.setDocumentStatus(sender.tab, request.data);
                sendResponse(o.getDocumentStatus(sender.tab));
                break;
            case actions.get_document_status:
                sendResponse(o.getDocumentStatus(sender.tab));
                break;
            case actions.status_message:
                o.setStatus(sender.tab, request.data);
                sendResponse(o.getDocumentStatus(sender.tab));
                break;
            case actions.load_gloabal_scenario:
                o.loadGlobalScenario(sender.tab, sendResponse);
                break;
            case actions.load_channel_scenario:
                o.loadChannelScenario(sender.tab, sendResponse);
                break;
            case actions.set_task_type:
                o.detectTask(sender.tab);
                sendResponse(o.getDocumentStatus(sender.tab));
                break;
        }
    });

    //send methods
    this.sendToPopup = function (request, onResponce) {
        chrome.runtime.sendMessage(request, function (responce) {
            if (onResponce != null) {
                onResponce(responce);
            }
        });
    };

    this.sendToCommunicator = function (request, onResponce) {
        chrome.extension.sendRequest(request, function (responce) {
            if (onResponce != null) {
                onResponce(responce);
            }
        });
    };

    this.sendToService = function () {

    };    

    //get methods
    this.getIdentification = function (tab) {
        if (tab != null) {
            return tab.id;
        }
        return null;
    };

    this.getDocumentStatus = function (tab) {
        var identification = o.getIdentification(tab);
        if (identification != null) {
            return dataStore.getData(identification);
        };
        return null;
    };

    //set methods
    this.setDocumentStatus = function (tab, data) {
        var identification = o.getIdentification(tab);
        if (identification != null) {
            data.tabId = identification;
            if (data.task.properties.length == data.task.propertiesMaxCount) {
                data.stopPropertyCollection = true;
            }
            dataStore.setData(tab.id, data);
        }
    };

    this.setStatus = function (tab, newStatus) {
        newStatus.time = new Date().getTime();
        var docStatus = o.getDocumentStatus(tab);
        if (docStatus.lastStatusCode == null) {
            docStatus.statusCodes[docStatus.statusCodes.length] = newStatus;
            docStatus.lastStatusCode = newStatus;
        }
        else if (docStatus.lastStatusCode.status != newStatus.status) {
            docStatus.statusCodes[docStatus.statusCodes.length] = newStatus;
            docStatus.lastStatusCode = newStatus;
        }
        o.setDocumentStatus(tab, docStatus);
        o.sendToPopup({ action: actions.send_popup, data: docStatus });
    };
    
    this.getNewData = function (onDocStatusChanged) {
        window.setTimeout(function () {
            o.sendToCommunicator({ action: actions.document_status, data: null }, function (responce) {
                if (onDocStatusChanged != null) {
                    onDocStatusChanged(responce);
                }
            });
            o.getNewData(onDocStatusChanged);
        }, 10);
    };
};

function DataStore() {
    var o = this;

    //this.updateData = function (identificator, data) {
    //    data.isDataPostedToMole = false;
    //    return o.setData(identificator, data);
    //};

    this.setData = function (identificator, data) {
        try {
            var sData = JSON.stringify(data);
            localStorage.setItem(identificator, sData);
        }
        catch (e) {
            return false;
        }
        return true;
    };

    this.getData = function (identificator) {
        var sData = "";
        var data = document_status;
        try {
            sData = localStorage.getItem(identificator);
            if (sData == null) {
                return data;
            }
        }
        catch (e) {
            //return null; show error message
        }
        try {
            data = JSON.parse(sData);
        }
        catch (e) {
            //return null; show error message
        }
        return data;
    };
};

var communicator = new Communicator();
var dataStore = new DataStore();