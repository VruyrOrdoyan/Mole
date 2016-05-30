﻿//util
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
    return null;
};

function getQueryParameter(name) {
    return getQueryParameterByUrl(window.top.location.search, name);
};

var docStatus = document_status;
docStatus.moleCanScrap = true;

communicator.sendToCommunicator({ action: actions.set_document_status, data: docStatus }, function (responce) {
    docStatus = responce;
    window.console.log("1");
    communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_can_scrap }, function (responce) {
        docStatus = responce;
    });
});

$(document).ready(function () {
    docStatus.isReady = true;
    window.console.log("2");
    communicator.sendToCommunicator({ action: actions.set_document_status, data: docStatus }, function (responce) {
        communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_can_start }, function (responce) {
            docStatus = responce;
            var mole = new Mole(docStatus);
            mole.process();
        });
    });



    //communicator.getNewData(function (responce) {
    //    if (!responce.isDataPostedToMole) {
    //        document_status = responce;
    //        execute();
    //        document_status.isDataPostedToMole = true;
    //        communicator.sendToCommunicator({ action: actions.data_post_save, data: document_status });
    //    }
    //});
});

function Mole(docStatus) {
    var o = this;
    this.docStatus = docStatus;
    this.process = function () {
        communicator.sendToCommunicator({ action: actions.load_gloabal_scenario, data: null }, function (responce) {
            o.docStatus = responce;
            if (o.docStatus.gloabalScenario != null) {
                //mole page identification
                var lastPage = o.getNotCompletedLastPage(o.docStatus.gloabalScenario);
                if (o.pageIdentification(lastPage)) {
                    communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_read_task }, function (responce) {
                        o.docStatus = responce;
                        for (var stepIndex = 0; stepIndex < lastPage.Steps.length; stepIndex++) {
                            var step = lastPage.Steps[stepIndex];
                            o.docStatus.task[step.SetValue] = doAction(step);
                        }
                        communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                            communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_finish_read_task }, function (responce) {
                                o.docStatus = responce;

                            });
                        });
                    });
                }
            }
        });
    };

    this.pageIdentification = function (page) {
        for (var identificationIndex = 0; identificationIndex < page.Identifications.length; identificationIndex++) {
            var identification = page.Identifications[identificationIndex];
            if (!doAction(identification)) {
                page.IdentificationPassed = false;
                break;
            }
            else {
                page.IdentificationPassed = true;
            }
        }
        if (!page.IdentificationPassed) {
            return false;
        }
        return true;
    };

    function getData(step) {
        var actionData = null;
        eval("actionData = " + identification.Action);
    };

    function doAction(identification) {
        var actionData = null;
        eval("actionData = " + identification.Action);
        switch (identification.Type) {
            case "Contains":
                if (actionData.indexOf(identification.Contains) != -1 || actionData == identification.Contains) {
                    identification.Passed = true;
                }
                return identification.Passed;
            case "Get":
                return actionData;
        }
        return null;
    };

    this.getNotCompletedLastPage = function (scenario) {
        for (var pagesIndex = 0; pagesIndex < scenario.AllowPages.length; pagesIndex++) {
            var page = scenario.AllowPages[pagesIndex];
            if (!page.Compleated) {
                page.Compleated = true
                return page;
            }
        }
        return null;
    };
};



function execute() {
    if (document_status.storeData != null) {
        try {
            var lastPage = getLastPage();
            for (var identificationIndex = 0; identificationIndex < lastPage.Identifications.length; identificationIndex++) {
                var identification = lastPage.Identifications[identificationIndex];
                if (!doAction(identification)) {
                    lastPage.IdentificationPassed = false;
                    break;
                }
                else {
                    lastPage.IdentificationPassed = true;
                }
            }
            if (!lastPage.IdentificationPassed) {
                communicator.sendToCommunicator({ action: actions.status, data: lastPage.Name + " Page not found" });
                return;
            }
            else {
                communicator.sendToCommunicator({ action: actions.status, data: lastPage.Name + " Page found" });
            }
            //var lastIdentification = getLastIdentification(lastPage);
            //while (lastIdentification != null) {
            //    lastPage.IdentificationPassed = doAction(lastIdentification);
            //    if (!lastPage.IdentificationPassed) {
            //        break;
            //    }
            //    lastIdentification = getLastIdentification(lastPage);
            //}
            //if (!lastPage.IdentificationPassed) {
            //    return;
            //}
            //lastPage.Steps
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

function doAction(identification) {
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