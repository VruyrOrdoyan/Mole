var document_status = {
    moleCanScrap: false,
    isReady: false,
    tabId: -1,
    scenarioLoaded: false,
    isDataPostedToMole: true,
    gloabalScenario: null,
    storeData: null,
    statusCodes: new Array(),
    lastStatusCode: null,
    task: {
        taskKey: "",
        file: "",
        channel: "",
        location: "",
        dateFrom: "",
        dateTo: "",
        checkPropId: 0,
        properties: new Array()
    }
};

var scraper_status_codes = {
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
        message: "Start read task...",
        time: null
    },
    scraper_finish_read_task: {
        type: 0,
        status: 5,
        message: "End read task...",
        time: null
    },
    scraper_start: {
        type: 0,
        status: 6,
        message: "Start scraping...",
        time: null
    }
};

var actions = {
    test: "test",
    set_document_status: "set_document_status",
    get_document_status: "get_document_status",
    status_message: "status_message",
    send_popup: "send_popup",
    load_gloabal_scenario: "load_gloabal_scenario"
};


//var docStatis = document_status;

//util

function Communicator(){
    var o = this;
    this.$loadScenario = $("<div></div>");

    //load resources
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

            
            //case actions.document_status:
            //    if (request.data != null) {
            //        request.data.tabId = sender.tab.id;
            //        dataStore.updateData(sender.tab.id, request.data);
            //        if (request.data.isReady && !request.data.scenarioLoaded) {
            //            //load scenario
            //            o.loadScenario(request.data);
            //        }
            //    }
            //    var data = communicator.getDocumentStatus(sender.tab.id);
            //    sendResponse(data);
            //    break;
            //case actions.data_post_save:
            //    if (request.data != null) {
            //        request.data.tabId = sender.tab.id;
            //        dataStore.setData(sender.tab.id, request.data);
            //    }
            //    break;
            //case actions.status:
            //    var docStatus = dataStore.getData(sender.tab.id);
            //    docStatus.statusLine = "\n" + request.data;
            //    dataStore.setData(sender.tab.id, docStatus);
            //    o.sendToPopup(request);
            //    break;
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
        else if (docStatus.lastStatusCode.status < newStatus.status) {
            docStatus.statusCodes[docStatus.statusCodes.length] = newStatus;
            docStatus.lastStatusCode = newStatus;
        }
        o.setDocumentStatus(tab, docStatus);
        o.sendToPopup({ action: actions.send_popup, data: docStatus });
    };
    /*
    this.getDocumentStatus = function (currentTabId, onResponce) {
        if (currentTabId == null) {
            if (onResponce != null) {
                o.sendToCommunicator({ action: actions.document_status, data: null }, onResponce);
            }
            return;
        }
        var docStatus = dataStore.getData(currentTabId);
        if (docStatus == null) {
            docStatus = document_status;
        }
        else {
            o.sendToPopup({ action: actions.document_status, data: docStatus });
        }
        return docStatus;
    };
    */
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

    this.updateData = function (identificator, data) {
        data.isDataPostedToMole = false;
        return o.setData(identificator, data);
    };

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
        var data = null;
        try {
            sData = localStorage.getItem(identificator);
        }
        catch (e) {
            return null;
        }
        try {
            data = JSON.parse(sData);
        }
        catch (e) {
            return null;
        }
        return data;
    };
};

var communicator = new Communicator();
var dataStore = new DataStore();