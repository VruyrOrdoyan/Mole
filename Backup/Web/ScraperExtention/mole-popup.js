var currentTabId = null;

//window.onload = function () {
//    chrome.tabs.getSelected(function (o) {
//        currentTabId = o.id;
//        ready();
//    });
//};

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
        if (request.action == actions.document_status) {
            if (document_status.isReady != request.data.isReady) {
                if (currentTabId == request.data.tabId) {
                    document_status = request.data;
                    setPopupCondition();
                }
            }
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

//function CheckStatus

document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.getSelected(function (o) {
        currentTabId = o.id;
        ready();
    });
});