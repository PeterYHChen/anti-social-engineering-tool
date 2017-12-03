
var domainMap = getDomainMapFromDoc(document);
var links = document.getElementsByTagName("a");
for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseenter", () => {
        showPopup(i, links[i].href);
    });
    links[i].addEventListener("mouseleave", () => {
        hidePopup(i);
    });
    links[i].innerHTML += "<div class=\"popup-box\" id=\"popup-link-" + i + "\">" +
        "<div id=\"link-check-" + i + "\" class=\"link-check\"></div>" +
        "<meter id=\"severity-meter-" + i + "\" class=\"severity-bar\" min=\"0\" low=\"40\" high=\"75\" max=\"100\" value=\"0\" optimum=\"90\"></meter>" +
        "<div id=\"severity-" + i + "\"></div>" +
        "<canvas id=\"pieChart-" + i + "\" width=\"500\" height=\"500\"></canvas>" +
        "</div>";
    links[i].title = links[i].href;

    let wordsInLink = links[i].href.split(/[^A-Za-z]/);
    let wordsInLinkSet = new Set(wordsInLink);

    if (links[i].href != links[i].innerText) {
        // wordsInLink = links[i].href.split(/[^A-Za-z]/);
        // wordsInLinkSet = new Set(wordsInLink);
        if (!wordsInLinkSet.has(links[i].innerText.toLowerCase())) {
            links[i].style = 'color: red;';
        }
        // links[i].innerText = links[i].innerText + '(' + links[i].href + ')';
    }
}

chrome.runtime.sendMessage({
    action: "getDomains",
    source: domainMap
});

function getDomainMapFromDoc(htmlDoc) {
    var links = htmlDoc.getElementsByTagName("a");
    console.log(links);

    var domainMap = {};
    for (let i = 0; i < links.length; i++) {
        let rootDomain = extractRootDomain(links[i].href);

        // Skip empty string
        if (rootDomain == null || rootDomain == '') {
            continue;
        }

        // Add to the map for counting
        if (domainMap[rootDomain] == null) {
            domainMap[rootDomain] = 0;
        }
        domainMap[rootDomain] = domainMap[rootDomain] + 1;
    }
    return domainMap;
}

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

// Set up a global variable map to avoid re-sending request for the same url.
var urlCheckedMap = {};

function showPopup(index, url) {
    console.log(index);
    console.log(url);
    // this.style.color = "red";
    var popup = document.getElementById("popup-link-" + index);
    popup.style.display = "block";

    // Index is used to identify each url
    // If the url of current index has been visited and requests for it have been sent out
    if (urlCheckedMap[index]) {
        return;
    }
    urlCheckedMap[index] = true;

    getUrlSafeBrowserCheck(url, function (response) {
        let linkCheck = document.getElementById("link-check-" + index);
        linkCheck.innerText = response.message;
        if (response.status == "SUCCESS") {
            linkCheck.style.color = "green";
        } else {
            linkCheck.style.color = "red";
        }
        console.log("response: " + JSON.stringify(response));
    });

    var request = makeHttpObject();
    request.open("GET", "https://anti-social-engineering-tool.mybluemix.net/page?url=" + url, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            // console.log(request);
            var dummyDoc = document.createElement('dummyDoc');
            dummyDoc.innerHTML = request.responseText;
            var domainMap = getDomainMapFromDoc(dummyDoc);
            drawChart(domainMap, index, url);
        }
    };
}

function hidePopup(index) {
    console.log(index);

    var popup = document.getElementById("popup-link-" + index);
    popup.style.display = "none";
}

function makeHttpObject() {
    try { return new XMLHttpRequest(); }
    catch (error) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP"); }
    catch (error) { }
    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
    catch (error) { }

    throw new Error("Could not create HTTP request object.");
}


function drawChart(domainMap, index, url) {
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
    var canvas = document.getElementById("pieChart-" + index);
    var ctx = canvas.getContext("2d");

    var myChart = new Chart(ctx, {
        type: 'pie',
        data: pieChartData,
    });

    // Set severity by comparing the current url with the one in the chart
    let currDomain = extractRootDomain(url);
    let currDomainPercent = domainPercentMap[currDomain];
    if (currDomainPercent == null) {
        currDomainPercent = 0;
    }

    document.getElementById("severity-" + index).innerHTML = currDomainPercent + "% of the links in this websites are safe.";
    document.getElementById("severity-meter-" + index).value = currDomainPercent;
}

// Send URL for Google safe browsing API check
function getUrlSafeBrowserCheck(url, callback) {
    var request = makeHttpObject();
    request.open("POST", "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyAmcWZ1DEmX4IAtri4FUTNoKz2_Uh0ngPk", true);
    request.setRequestHeader("Content-type", "application/json");

    // Set up json body for Google safe browsing API check on URL
    var jsonRequestBody = {
        "client": {
            "clientId": "nyu-pcs",
            "clientVersion": "1.0.0"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION", "THREAT_TYPE_UNSPECIFIED"],
            "platformTypes": ["ALL_PLATFORMS"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [
                // { "url": "http://goooogleadsence.biz/" },
                { "url": url }
            ]
        }
    };

    var responseObject = {};
    request.onreadystatechange = function () {//Call a function when the state changes.
        if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
            let jsonResponse = JSON.parse(request.responseText);
            // No threat matches found
            if (jsonResponse.matches == null) {
                callback({
                    "status": "SUCCESS",
                    "message": "No threat is found in this link"
                });
            } else {
                var message = "This link contains ";
                console.log("matches: " + JSON.stringify(jsonResponse.matches));
                for (let match of jsonResponse.matches) {
                    message += match.threatType + ", ";
                }
                message += "be aware!";
                callback({
                    "status": "ERROR",
                    "message": message
                });
            }
        } else if (request.readyState == XMLHttpRequest.DONE) {
            callback({
                "status": "ERROR",
                "message": "No connection. Fail to check safety on this link. Response code is " + request.status
            });
        }
    };

    // Send out json body
    request.send(JSON.stringify(jsonRequestBody));
}