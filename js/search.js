function getQueryURL(textToSearch) {
    // TODO website configurable
    var queryTemplate = 'https://www.google.com/search?q={}';
    return queryTemplate.replace('{}', textToSearch);
}

/* Creates a new tab and opens the queried URL */
function openTabInWindow(win, url, index) {
    var queryOptions = {
        'active': true,
        'windowId': win.id,
    };
    chrome.tabs.query(queryOptions, function (baseTabs) {
        // Guaranteed that it will only be one (because of active: true)
        baseTab = baseTabs[0]
        //console.log("%o\n", baseTab);
        if (typeof index === 'undefined') {
            // Next to the current focus
            index = baseTab.index + 1;
        }
        var newTapProps = {
            'windowId': baseTab.windowId,
            'url': url,
            'index': index,
        };
        chrome.tabs.create(newTapProps, function () {});
    });
}

/* Opens the given URL in an incognito window */
function openURLInIncognito(url, focus) {
    if (typeof focus === 'undefined') {
        focus = false;
    }

    var getInfo = {'populate': true};
    chrome.windows.getAll(getInfo, function(windows) {
        // Find incognito window
        var foundIncognito = false;
        for (win of windows) {
            if (win.incognito) {
                // TODO: make index (tab position) configurable
                // Use default (next to current active) tab position
                openTabInWindow(win, url, undefined);

                // Focus to tab if necessary
                if (focus) {
                    var updateInfo = {'focused': true};
                    chrome.windows.update(win.id, updateInfo, function () {});
                }
                foundIncognito = true;
                break;
            }
        }

        if (!foundIncognito) {
            chrome.windows.create({'url': url, 'incognito': true});
        }
    });
}

/* Search for a term in incognito window for URL */
function searchTermInIncognito(textToSearch, focus) {
    var queryURL = getQueryURL(textToSearch);
    openURLInIncognito(queryURL, focus);
}

/* Context menu search in incognito */
function contextMenuSearchIncognito(info, currentTab) {
    var textToSearch = info.selectionText;

    if (typeof textToSearch === 'undefined') {
        return;
    }

    if (textToSearch.match(/^(https?|ftp):\/\/.+/)) {
        openURLInIncognito(textToSearch);
    }
    else if (textToSearch.match(/[^\/]+\.(com|edu|org|(co\.)?jp)\/?/)) {
        textToSearch = 'http://' + textToSearch;
        openURLInIncognito(textToSearch);
    }
    else {
        searchTermInIncognito(textToSearch);
    }
}

/* Omnibox search in incognito */
function omniboxSearchIncognito(text, disposition) {
    if (typeof text === 'undefined') {
        return;
    }

    searchTermInIncognito(text);
}

/* Initialize stuff */
chrome.runtime.onInstalled.addListener(function () {
    /* Context menu */
    var contextMenuEntry = {
        'id': 'incog-neet#search',
        'title': chrome.i18n.getMessage('contextMenuSearch'),
        'contexts': ['selection'],
    };
    chrome.contextMenus.create(contextMenuEntry);
});

/* Add listeners */
chrome.contextMenus.onClicked.addListener(contextMenuSearchIncognito);
chrome.omnibox.onInputEntered.addListener(omniboxSearchIncognito);
