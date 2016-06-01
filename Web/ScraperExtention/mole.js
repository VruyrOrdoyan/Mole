var docStatus = document_status;
var documentReady = false;
var gottenLastDocStatus = false;

$(document).ready(function () {
    documentReady = true;
});

//get last doc status
communicator.sendToCommunicator({ action: actions.get_document_status, data: null }, function (responce) {
    docStatus = responce;
    gottenLastDocStatus = true;
    if (!docStatus.scraperInProcess) {
        docStatus = document_status;
        docStatus.moleCanScrap = true;
        communicator.sendToCommunicator({ action: actions.set_document_status, data: docStatus }, function (responce) {
            docStatus = responce;
            communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_can_scrap }, function (responce) {
                docStatus = responce;
            });
        });
    }
});

function checkDocStatus() {
    if (documentReady && gottenLastDocStatus) {
        onDocumentReady();
    }
    else {
        window.setTimeout(function () {
            checkDocStatus();
        }, 10);
    }
};

function onDocumentReady() {
    if (docStatus.scraperInProcess) {
        var mole = new Mole(docStatus);
        mole.process();
    }
    else {
        docStatus.isReady = true;
        communicator.sendToCommunicator({ action: actions.set_document_status, data: docStatus }, function (responce) {
            communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_can_start }, function (responce) {
                docStatus = responce;
                var mole = new Mole(docStatus);
                mole.process();
            });
        });
    }
};

function StartScenario(index) {
    communicator.sendToCommunicator({ action: actions.get_document_status, data: null }, function (responce) {
        var mole = new Mole(responce);
        mole.startChannelScenario(index);
    });
};

checkDocStatus();

function Mole(docStatus) {
    var o = this;
    this.docStatus = docStatus;
    this.lastPage = null;
    this.asynchronActionsMaxCount = 100;
    this.asynchronActionsCount = 0;
    this.asynchronActionsDuration = 1000;

    this.startChannelScenario = function (index) {
        var channelScenario = o.docStatus.channelScenario;
        o.clearPageScenario(o.docStatus.channelScenario, index)
    };

    this.clearPageScenario = function (scenario, index) {
        for (var pagesIndex = 0; pagesIndex < scenario.AllowPages.length; pagesIndex++) {
            var page = scenario.AllowPages[pagesIndex];
            if (page.Id == index) {
                page.Compleated = false;
                o.clearSubSteps(page.Identifications);
                o.clearSubSteps(page.Steps);
            }
        }
        communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
            o.docStatus = responce;
            o.process();
        });
    };

    this.clearSubSteps = function (subSteps) {
        for (var itemIndex = 0; itemIndex < subSteps.length; itemIndex++) {
            var item = subSteps[itemIndex];
            item.Compleated = false;
            item.Passed = false;
            if (item.Steps != null) {
                o.clearSubSteps(item.Steps);
            }
        }
    };

    this.process = function () {
        if (o.docStatus.scraperInProcess) {
            o.lastPage = o.getNotCompletedLastPage(o.docStatus.channelScenario);
            communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                o.docStatus = responce;
                var status = scraper_status_codes.scraper_optional_code;
                status.message = o.lastPage.Name;
                status.status = o.lastPage.StatusCode;
                communicator.sendToCommunicator({ action: actions.status_message, data: status }, function (responce) {
                    o.docStatus = responce;
                    o.pageIdentification(o.lastPage);
                });
            });
        }
        else {
            communicator.sendToCommunicator({ action: actions.load_gloabal_scenario, data: null }, function (responce) {
                o.docStatus = responce;
                if (o.docStatus.gloabalScenario != null) {
                    //mole page identification
                    o.lastPage = o.getNotCompletedLastPage(o.docStatus.gloabalScenario);
                    var status = scraper_status_codes.scraper_optional_code;
                    status.message = o.lastPage.Name;
                    status.status = o.lastPage.StatusCode;
                    communicator.sendToCommunicator({ action: actions.status_message, data: status }, function (responce) {
                        o.docStatus = responce;
                        o.pageIdentification(o.lastPage);
                    });
                }
            });
        }
    };

    this.startCheckIsTaskComplite = function () {
        communicator.sendToCommunicator({ action: actions.get_document_status, data: null }, function (responce) {
            o.docStatus = responce;
            switch (o.docStatus.task.type) {
                case taskTypes.none:
                    //nothing
                    break
                case taskTypes.fullTask:
                    o.navigate();
                    break;
                case taskTypes.test:
                    o.navigate();
                    break;
                case taskTypes.undefined:
                    window.setTimeout(function () {
                        o.startCheckIsTaskComplite();
                    }, 10);
                    break;
            }
        });
    };

    this.navigate = function () {
        //navigate to channel
        communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_start }, function (responce) {
            o.docStatus = responce;
            o.docStatus.scraperInProcess = true;
            communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                o.docStatus = responce;
                communicator.sendToCommunicator({ action: actions.load_channel_scenario, data: null }, function (responce) {
                    o.docStatus = responce;
                    var channel = o.docStatus.task[o.lastPage.Navigation.SetValue];
                    doAction(o.lastPage.Navigation, channel);
                });
            });
        });
    };

    this.pageIdentification = function (page) {
        var identification = o.getLastIdentification(page);
        if (identification != null) {
            doAction(identification);
            if (identification.Passed) {
                var status = scraper_status_codes.scraper_optional_code;
                status.message = identification.Name;
                status.status = identification.StatusCode;
                communicator.sendToCommunicator({ action: actions.status_message, data: status }, function (responce) {
                    o.docStatus = responce;
                    o.pageIdentification(page);
                });
            }
            else {
                var status = scraper_status_codes.scraper_optional_code;
                if (identification.AllowAsynchron != null && identification.AllowAsynchron) {
                    status.message = "Warning on " + identification.Name + " start asynchron action...";
                }
                else {
                    status.message = "Error on " + identification.Name;
                }
                status.status = identification.StatusCode;
                communicator.sendToCommunicator({ action: actions.status_message, data: status }, function (responce) {
                    o.docStatus = responce;
                    //do doAsynchronAction
                    if (identification.AllowAsynchron != null && identification.AllowAsynchron) {
                        o.asynchronActionsCount = 0;
                        identification.Compleated = false;
                        identification.StatusCode = identification.StatusCode + 10000;
                        communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                            o.docStatus = responce;
                            doAsynchronAction(identification, null, page, o.pageIdentification);
                        });
                    }
                });
            }
        }
        else {
            communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_read_task }, function (responce) {
                o.docStatus = responce;
                o.startSteps(page);
            });
        }
    };

    this.startSteps = function (stepOwner) {
        var step = o.getLastStep(stepOwner);
        if (step != null) {
            var newVal = null;
            if (step.SetValue != null) {
                if (typeof step.SetValue === "string" || step.SetValue.length == null || (step.SetValue.length != null && step.SetValue.length == 1)) {
                    newVal = o.docStatus.task[step.SetValue];
                }
                else {
                    newVal = [];
                    for (var valIndex = 0; valIndex < step.SetValue.length; valIndex++) {
                        var setVal = step.SetValue[valIndex];
                        newVal[newVal.length] = o.docStatus.task[setVal];
                    }
                }
            }
            if (step.Type == "Iteration") {
                newVal = o.docStatus.task[step.SetValue].length;
            }
            var actionVal = doAction(step, newVal);
            if (actionVal != null) {
                var taskField = o.docStatus.task[step.SetValue];
                if (typeof taskField === "object" && taskField.length != null) {
                    if (taskField[step.IterationIndex] == null) {
                        taskField[step.IterationIndex] = {};
                    }
                    taskField[step.IterationIndex][step.Field] = actionVal;
                }
                else {
                    o.docStatus.task[step.SetValue] = actionVal;
                }
            }
            var status = scraper_status_codes.scraper_optional_code;
            status.message = step.Name;
            status.status = step.StatusCode;
            communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                o.docStatus = responce;
                communicator.sendToCommunicator({ action: actions.status_message, data: status }, function (responce) {
                    o.docStatus = responce;
                    if (o.docStatus.stopPropertyCollection) {
                        o.startCommectUnits();
                        return;
                    }
                    o.startSteps(stepOwner);
                });
            });
        }
        else {
            if (!o.docStatus.scraperInProcess) {
                communicator.sendToCommunicator({ action: actions.set_document_status, data: o.docStatus }, function (responce) {
                    o.docStatus = responce;
                    communicator.sendToCommunicator({ action: actions.status_message, data: scraper_status_codes.scraper_finish_read_task }, function (responce) {
                        o.docStatus = responce;
                        communicator.sendToCommunicator({ action: actions.set_task_type, data: o.docStatus }, function (responce) {
                            o.docStatus = responce;
                            o.startCheckIsTaskComplite();
                        });
                    });
                });
            }
        }
    };

    this.startCommectUnits = function () {
        alert("start scrap Units");
    };

    function doAction(action, newVal) {
        var actionData = null;
        switch (action.Type) {
            case "ReplaceString":
                if (newVal != null) {
                    if (typeof newVal === "string" || newVal.length == null || (newVal.length != null && newVal.length == 1)) {
                        action.Action = action.Action.replace(action.InsertValue, newVal);
                    }
                    else {
                        for (var newValIndex = 0; newValIndex < newVal.length; newValIndex++) {
                            var nVal = newVal[newValIndex];
                            action.Action = action.Action.replace(action.InsertValue[newValIndex], nVal);
                        }
                    }
                }
                break;
        }
        eval("actionData = " + action.Action);
        switch (action.Type) {
            case "Contains":
                if (actionData.indexOf(action.Contains) != -1 || actionData == action.Contains) {
                    action.Passed = true;
                }
                break;
            case "Get":
                return actionData;
            case "Equals":
                if (typeof actionData === "string" && typeof action.Equals === "string") {
                    if (actionData == action.Equals) {
                        action.Passed = true;
                    }
                }
                else if (typeof actionData === "number" && typeof action.Equals === "number") {
                    if (actionData == action.Equals) {
                        action.Passed = true;
                    }
                }
                break;
            case "EqualsMore":
                if (typeof actionData === "number" && typeof action.EqualsMore === "number") {
                    if (actionData >= action.EqualsMore) {
                        action.Passed = true;
                    }
                }
                break;
            case "Set":
                break;
            case "More":
                if (typeof actionData === "number" && typeof action.EqualsMore === "number") {
                    if (actionData > action.EqualsMore) {
                        action.Passed = true;
                    }
                }
                break;
            case "Iteration":
                if (actionData) {
                    action.IterationIndex = newVal;
                    //if (action.IterationIndex == null) {
                    //    action.IterationIndex = newVal;
                    //}
                    //else {
                    //    action.IterationIndex++;
                    //}
                }
                else {
                    action.Passed = true;
                }
                break;
        }
        return null;
    };
    
    function doAsynchronAction(action, newVal, page, callback) {
        window.setTimeout(function () {
            doAction(action, newVal);
            if (action.Passed && callback != null || o.asynchronActionsCount == o.asynchronActionsMaxCount) {
                callback(page);
            }
            else {
                doAsynchronAction(action, newVal, page, callback)
            }
        }, o.asynchronActionsDuration);
    };
    
    this.getNotCompletedLastPage = function (scenario) {
        for (var pageIndex = 0; pageIndex < scenario.AllowPages.length; pageIndex++) {
            var page = scenario.AllowPages[pageIndex];
            if (!page.Compleated) {
                page.Compleated = true
                return page;
            }
        }
        return null;
    };

    this.getLastIdentification = function (page) {
        for (var identificationIndex = 0; identificationIndex < page.Identifications.length; identificationIndex++) {
            var identification = page.Identifications[identificationIndex];
            if (!identification.Compleated) {
                identification.Compleated = true
                return identification;
            }
        }
        return null;
    };

    this.getLastStep = function (stepOwner) {
        for (var stepIndex = 0; stepIndex < stepOwner.Steps.length; stepIndex++) {
            var step = stepOwner.Steps[stepIndex];
            if (step.Enable != null && !step.Enable) {
                continue;
            }
            if (step.Type != null && step.Type == "Iteration" && step.Compleated && !step.Passed) {
                var subStep = o.getLastStep(step);
                if (subStep == null) {
                    for (var subStepIndex = 0; subStepIndex < step.Steps.length; subStepIndex++) {
                        var subStep = step.Steps[subStepIndex];
                        subStep.Compleated = false;
                    }
                    return step;
                }
                else {
                    subStep.IterationIndex = step.IterationIndex;
                    return subStep;
                }
            }
            if (!step.Compleated) {
                step.Compleated = true
                return step;
            }
        }
        return null;
    };
};