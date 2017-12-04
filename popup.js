
/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, (tabs) => {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');
        console.log("Current URL: " + url);
        callback(url);
    });

    // Most methods of the Chrome extension APIs are asynchronous. This means that
    // you CANNOT do something like this:
    //
    // var url;
    // chrome.tabs.query(queryInfo, (tabs) => {
    //   url = tabs[0].url;
    // });
    // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Change the dropdown option of the current page.
 *
 * @param {string} option The new dropdown option.
 */
function changeDropdownOption(option) {
    var script;
    if (option == 'analyze') {
        analyze();
    } else if (option == 'evaluate') {
        evaluate();
    } else {
        // script = 'document.body.style.dropdown olor="' + option + '";';
        //   // See https://developer.chrome.com/extensions/tabs#method-executeScript.
        //   // chrome.tabs.executeScript allows us to programmatically inject JavaScript
        //   // into a page. Since we omit the optional first argument "tabId", the script
        //   // is inserted into the active tab of the current window, which serves as the
        //   // default.
        //   chrome.tabs.executeScript({
        //     code: script
        //   });
    }
}

function analyze() {
    chrome.tabs.executeScript(null, { file: 'chartjs/Chart.js' }, function () {
        chrome.tabs.executeScript({ file: 'analyze.js' });
    });
    chrome.tabs.insertCSS(null, { file: 'popup-link.css' });
}

function evaluate() {
    chrome.tabs.executeScript(null, { file: 'chartjs/Chart.js' }, function () {
        chrome.tabs.executeScript({ file: 'evaluate.js' });
    });
    chrome.tabs.insertCSS(null, { file: 'popup-link.css' });
}

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getDomains") {
        let domainObject = request.source;
        console.log(domainObject);
        drawChart(domainObject.domainCountMap, domainObject.baseUrl);
        return true;
    }
});

// Keep a reference to the created chart
var myPieChart = null;
function drawChart(domainMap, baseUrl) {
    // Calculate the sum of total links
    let validLinkCount = 0;
    for (let domain in domainMap) {
        validLinkCount += domainMap[domain];
    }

    // Transform domain map to percentage
    let domainPercentMap = {};
    for (let domain in domainMap) {
        domainPercentMap[domain] = (domainMap[domain] * 100 / validLinkCount).toFixed(1);
    }

    var domainData = [];
    var domains = [];
    var counts = [];
    for (let domain in domainPercentMap) {
        domains.push(domain + "(" + domainPercentMap[domain] + "%)");
        counts.push(domainMap[domain]);
    }

    var backgroundColor = [];
    var hoverBackgroundColor = [];

    for (let i = 0; i < domains.length; i++) {
        r = Math.floor(Math.random() * 200);
        g = Math.floor(Math.random() * 200);
        b = Math.floor(Math.random() * 200);
        v = Math.floor(Math.random() * 500);
        c = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        h = 'rgb(' + (r + 20) + ', ' + (g + 20) + ', ' + (b + 20) + ')';
        backgroundColor.push(c);
        hoverBackgroundColor.push(h);
    }

    var pieChartData = {};
    pieChartData.labels = domains;
    pieChartData.datasets = [];
    pieChartData.datasets.push({
        data: counts,
        backgroundColor: backgroundColor,
        hoverBackgroundColor: hoverBackgroundColor
    });

    console.log(pieChartData);
    var ctx = document.getElementById("pieChart").getContext("2d");

    if (myPieChart == null) {
        myPieChart = new Chart(ctx, {
            type: 'pie',
            data: pieChartData
        });
    } else {
        myPieChart.config.data = pieChartData;
        myPieChart.update();
    }

    // Set severity by comparing the current url with the one in the chart
    let currDomain = extractRootDomain(baseUrl);
    let currDomainPercent = domainPercentMap[currDomain];
    if (currDomainPercent == null) {
        currDomainPercent = 0;
    }
    document.getElementById("currUrl").innerHTML = "Evaluating url: " + baseUrl;
    document.getElementById("severity").innerHTML = currDomainPercent + "% of the links belongs to the website of this page.";
    document.getElementById("severity-meter").value = currDomainPercent;
    document.getElementById("severity-meter").title = baseUrl;
}


/**
 * Gets the saved dropdown option for url.
 *
 * @param {string} url URL whose dropdown option is to be retrieved.
 * @param {function(string)} callback called with the saved dropdown option for
 *     the given url on success, or a falsy value if no option is retrieved.
 */
function getSavedDropdownOption(url, callback) {
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
    // for chrome.runtime.lastError to ensure correctness even when the API call
    // fails.
    chrome.storage.sync.get(url, (items) => {
        callback(chrome.runtime.lastError ? null : items[url]);
    });
}

/**
 * Sets the given dropdown option for url.
 *
 * @param {string} url URL for which dropdown option is to be saved.
 * @param {string} option The dropdown option to be saved.
 */
function saveDropdownOption(url, option) {
    var items = {};
    items[url] = option;
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
    // optional callback since we don't need to perform any action once the
    // dropdown option is saved.
    chrome.storage.sync.set(items);
}

// This extension loads the saved dropdown option for the current tab if one
// exists. The user can select a new dropdown option from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl((url) => {
        var dropdown = document.getElementById('dropdown');

        // Load the saved dropdown option for this page and modify the dropdown
        // value, if needed.
        getSavedDropdownOption(url, (savedOption) => {
            if (savedOption) {
                changeDropdownOption(savedOption);
                dropdown.value = savedOption;
            }
        });

        // Ensure the dropdown option is changed and saved when the dropdown
        // selection changes.
        dropdown.addEventListener('change', () => {
            changeDropdownOption(dropdown.value);
            saveDropdownOption(url, dropdown.value);
        });
    });
});


function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}


