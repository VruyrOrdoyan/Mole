communicator.sendToCommunicator({ action: actions.document_status, data: null }, function (responce) {
    document_status = responce;
    document_status.isReady = false;
    communicator.sendToCommunicator({ action: actions.document_status, data: document_status });
});

$(document).ready(function () {
    document_status.isReady = true;
    communicator.sendToCommunicator({ action: actions.document_status, data: document_status });
    communicator.getNewData(function (responce) {
        if (!responce.isDataPostedToMole) {
            document_status = responce;
            execute();
            document_status.isDataPostedToMole = true;
            communicator.sendToCommunicator({ action: actions.data_post_save, data: document_status });
        }
    });
});

function execute() {
    if (document_status.storeData != null) {
        try {
            var lastPage = getLastPage();
            var lastIdentification = getLastIdentification(lastPage);
            while (lastIdentification != null) {
                lastPage.IdentificationPassed = chekIdentification(lastIdentification);
                if (!lastPage.IdentificationPassed) {
                    break;
                }
                lastIdentification = getLastIdentification(lastPage);
            }
            if (!lastPage.IdentificationPassed) {
                return;
            }
            lastPage.Steps
        } 
        catch (e) { }
    }
};

function getLastPage() {
    for (var pagesIndex = 0; pagesIndex < document_status.storeData.AllowPages.length; pagesIndex++) {
        var page = document_status.storeData.AllowPages[pagesIndex];
        if (!page.Compleated) {
            page.Compleated = true
            return page;
        }
    }
    return null;
};

function getLastIdentification(page) {
    for (var identificationIndex = 0; identificationIndex < page.Identifications.length; identificationIndex++) {
        var identification = page.Identifications[identificationIndex];
        if (!identification.Compleated) {
            identification.Compleated = true
            return identification;
        }
    }
    return null;
};

function chekIdentification(identification) {
    var actionData = null;
    eval("actionData = " + identification.Action);
    switch (identification.Type) {
        case "Contains":
            if (actionData.indexOf(identification.Contains) || actionData == identification.Contains) {
                identification.Passed = true;
            }
            break;
    }
    return identification.Passed;
};