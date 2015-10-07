function moveTabToWindow(currentTab, windowId, incognito) {
    var destinationProp = {
        'windowId': windowId,
        // TODO: customizable?
        // Use current tab's index in the destination window
        'index': currentTab.index,
    }

    // normal => incognito can't be done with move() (see API)
    if (incognito || currentTab.incognito) {
        // Additional information when cloning tab in other window
        destinationProp.url = currentTab.url;
        destinationProp.active = true;

        // Since we cannot move() normal => incognito vice versa
        chrome.tabs.create(destinationProp);
        // Now delete the current tab
        chrome.tabs.remove(currentTab.id);
    }
    // If normal => normal, just move it (doesn't need to reload)
    else {
        chrome.tabs.move(currentTab.id, destinationProp);
    }

    // Update the tabs list at the very list
    chrome.windows.getAll({'populate': true}, function (windows) {
        for (win of windows) {
            if (typeof win.tabs[0] === 'undefined') {
                continue;
            }
            // Note: ID is important! See contextMenuMove()
            var id = 'incog-neet#move#window' + String(win.id);
            var firstTabTitle = win.tabs[0].title;
            chrome.contextMenus.update(id, {'title': firstTabTitle});
        }
    });
}

function contextMenuMove(info, currentTab) {
    // Search Google for... was clicked
    if (!info.menuItemId.match(/^incog-neet#move/)) {
        return;
    }

    // Refresh the list of windows
    if (info.menuItemId == 'incog-neet#move#reloadMenu') {
        // Remove, then recreate the context menu in callback function
        chrome.contextMenus.remove('incog-neet#move', createMoveContextMenu);
        return;
    }

    var windowIdStr = info.menuItemId.replace('incog-neet#move#window', '');
    var windowId = parseInt(windowIdStr);

    chrome.windows.get(windowId, function (win) {
        moveTabToWindow(currentTab, windowId, win.incognito);
    });
}

var createMoveContextMenu = function () {
    /* Context menu */
    var contextMenuEntry = {
        'id': 'incog-neet#move',
        'title': chrome.i18n.getMessage('contextMenuMove'),
        'contexts': [
            'page', 'link', 'image', 'video', 'audio',
        ],
    };
    chrome.contextMenus.create(contextMenuEntry);
    chrome.windows.getAll({'populate': true}, function (windows) {
        var reloadMenuEntry = {
            'id': 'incog-neet#move#reloadMenu',
            'parentId': 'incog-neet#move',
            'title': chrome.i18n.getMessage('reloadMenu'),
            'contexts': [
                'page', 'link', 'image', 'video', 'audio',
            ],
        }
        chrome.contextMenus.create(reloadMenuEntry);
        for (win of windows) {
            var firstTabTitle = win.tabs[0].title;
            var contextMenuEntry = {
                'id': 'incog-neet#move#window' + String(win.id),
                'parentId': 'incog-neet#move',
                'title': firstTabTitle,
                'contexts': [
                    'page', 'link', 'image', 'video', 'audio',
                ],
            }
            chrome.contextMenus.create(contextMenuEntry);
        }
    });
};

/* Add context menu for moving tab */
chrome.runtime.onInstalled.addListener(createMoveContextMenu);

chrome.contextMenus.onClicked.addListener(contextMenuMove);
