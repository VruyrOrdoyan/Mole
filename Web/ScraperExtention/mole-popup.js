/*
var currentTabId = null;



function ready() {
    $("#getTabId").click(function () {
        setStatus(currentTabId);
    });
    $("#reload").click(function () {
        chrome.tabs.reload(currentTabId);
    });

    $("#sendToMole").click(function () {
        dataStore.updateData(currentTabId, document_status);
    });

    $("#store").click(function () {
        document_status.storeData = $("#storeData").val();
        dataStore.updateData(currentTabId, document_status);
    });

    $("#getStore").click(function () {
        document_status = communicator.getDocumentStatus(currentTabId);
        alert(document_status.storeData);
    });


    

    document_status = communicator.getDocumentStatus(currentTabId);
    setPopupCondition();
    
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
            case actions.document_status:
                if (document_status.isReady != request.data.isReady) {
                    if (currentTabId == request.data.tabId) {
                        document_status = request.data;
                        setPopupCondition();
                    }
                }
                break;
            case actions.status:
                $("#actions_status").val($("#actions_status").val() + "\n" + request.data);
                break;
        }
    });
    
    
    $("#btn").click(function () {
        chrome.extension.sendRequest({ action: actions.test, data: null }, function (response) {
            setStatus(response);
        });
    });
};

function setStatus(statusText) {
    $("#status").html(statusText);
};

function setPopupCondition() {
    alert(document_status.statusLine);
    $("#actions_status").val(document_status.statusLine);

    $("#btn").prop("disabled", true);

    $("#storeData").val("");
    $("#sendToMole").prop("disabled", true);
    $("#getStore").prop("disabled", true);
    $("#store").prop("disabled", true);
    $("body").removeClass("ready");
    $("body").addClass("loading");    
    setStatus("Loading...");
    if (document_status.isReady) {
        $("#btn").prop("disabled", false);

        $("#storeData").val(document_status.storeData);
        $("#sendToMole").prop("disabled", false);
        $("#getStore").prop("disabled", false);
        $("#store").prop("disabled", false);
        $("body").removeClass("loading");
        $("body").addClass("ready");
        setStatus("Ready");
    }
};

*/

function MolePopup(identification) {
    var o = this;
    this.identification = identification;
    this.dataStore = new DataStore();
    this.communicator = new Communicator();
    this.$statusArea = $("#statusArea");
    this.$btnDisplayStatus = $("#btnDisplayStatus");
    this.$btnRemoveStatus = $("#btnRemoveStatus");
    this.$btnReload = $("#btnReload");
    this.$txtTaskKey = $("#txtTaskKey");
    this.$txtFile = $("#txtFile");
    this.$txtChannel = $("#txtChannel");
    this.$txtLocation = $("#txtLocation");
    this.$txtDateFrom = $("#txtDateFrom");
    this.$txtDateTo = $("#txtDateTo");

    this.ready = function () {
        //o.displayCurrentStatus();
        o.$btnDisplayStatus.unbind("click", o.displayCurrentStatus);
        o.$btnDisplayStatus.bind("click", o.displayCurrentStatus);
        o.$btnRemoveStatus.unbind("click", o.removeCurrentStatus);
        o.$btnRemoveStatus.bind("click", o.removeCurrentStatus);
        o.$btnReload.unbind("click", o.reload);
        o.$btnReload.bind("click", o.reload);
    };

    this.displayCurrentStatus = function () {
        var ststusLine = "";
        o.$statusArea.val(ststusLine);
        var data = o.dataStore.getData(o.identification);
        for (var ststusIndex = 0; ststusIndex < data.statusCodes.length; ststusIndex++) {
            var status = data.statusCodes[ststusIndex];
            var message = status.message + " " + status.time;
            if (ststusLine == "") {
                ststusLine = message;
            }
            else {
                ststusLine = ststusLine + "\n" + message;
            }
        }
        o.$statusArea.val(ststusLine);

        o.$txtTaskKey.val(data.task.taskKey);
        o.$txtFile.val(data.task.file);
        o.$txtChannel.val(data.task.channel);
        o.$txtLocation.val(data.task.location);
        o.$txtDateFrom.val(data.task.dateFrom);
        o.$txtDateTo.val(data.task.dateTo);
    };

    this.removeCurrentStatus = function () {
        var data = o.dataStore.getData(o.identification);
        data.statusCodes = new Array();
        o.dataStore.setData(o.identification, data);
        o.displayCurrentStatus();
    };

    this.reload = function () {
        o.removeCurrentStatus();
        chrome.tabs.reload(o.identification);
    };
 
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
            case actions.send_popup:
                if (request.data.tabId == o.identification) {
                    o.displayCurrentStatus();
                }
                break;
        }
    });
};


document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.getSelected(function (o) {
        var molePopup = new MolePopup(o.id);
        $("#txtDateFrom").datepick({
            minDate: 0,
            onSelect: function (selected) {
                var startDate = new Date(selected);
                $("#txtDateTo").datepick("option", "minDate", startDate);
            },
            autoclose: true
        });
        $("#txtDateTo").datepick({
            minDate: 0,
            onSelect: function (selected) {
                var endDate = new Date(selected);
                $("#txtDateFrom").datepick("option", "maxDate", endDate);
            },
            autoclose: true
        });
        molePopup.ready();
    });
});
