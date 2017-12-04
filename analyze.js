
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
        "<meter id=\"severity-meter-" + i + "\" class=\"safety-bar\" min=\"0\" low=\"40\" high=\"75\" max=\"100\" value=\"0\" optimum=\"90\"></meter>" +
        "<div id=\"severity-" + i + "\"></div>" +
        "<div id=\"tags-" + i + "\" class=\"tags\"></div>" +
        "<canvas id=\"pieChart-" + i + "\" width=\"500\" height=\"500\"></canvas>" +
        "</div>";
    links[i].title = links[i].href;
    links[i].style = 'color: DarkGreen;';
    // let wordsInLink = links[i].href.split(/[^A-Za-z]/);
    // let wordsInLinkSet = new Set(wordsInLink);

    // if (links[i].href != links[i].innerText) {
    //     // wordsInLink = links[i].href.split(/[^A-Za-z]/);
    //     // wordsInLinkSet = new Set(wordsInLink);
    //     if (!wordsInLinkSet.has(links[i].innerText.toLowerCase())) {
    //         links[i].style = 'color: red;';
    //     }
    //     // links[i].innerText = links[i].innerText + '(' + links[i].href + ')';
    // }
}

function getDomainMapFromDoc(htmlDoc, baseUrl) {
    let links = htmlDoc.getElementsByTagName("a");
    // console.log(links);

    let urls = [];
    for (let i = 0; i < links.length; i++) {
        let rootDomain = extractRootDomain(links[i].href);
        urls.push(links[i].href);
    }

    let domainCountMap = getDomainCountMapFromUrls(urls, baseUrl);
    return domainCountMap;
}

function getDomainCountMapFromUrls(urls, baseUrl) {
    urls = preprocessUrls(urls, baseUrl);
    let baseDomain = extractRootDomain(baseUrl);

    let domainCountMap = {};
    for (let i = 0; i < urls.length; i++) {
        let rootDomain = extractRootDomain(urls[i]);
        // If no root domain, it is based on the baseDomain for navigation
        if (rootDomain == null || rootDomain.trim() == '') {
            if (baseDomain == null) {
                continue;
            }
            rootDomain = baseDomain;
        }
        // console.log(rootDomain + "    " + urls[i]);

        // Add to the map for counting
        if (domainCountMap[rootDomain] == null) {
            domainCountMap[rootDomain] = 0;
        }
        domainCountMap[rootDomain] = domainCountMap[rootDomain] + 1;
    }
    return domainCountMap;
}

function preprocessUrls(urls, baseUrl) {
    for (let i = 0; i < urls.length; i++) {
        if (urls[i] == null) {
            urls[i] = baseUrl;
        } else if (urls[i].trim() == "" || urls[i].startsWith("#")) {
            urls[i] = baseUrl + urls[i];
        }
    }
    return urls;
}

function extractHostname(url) {
    if (url == null) {
        return url;
    }

    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
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
    if (url == null) {
        return url;
    }

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
var urlDomainCountMap = {};
var urlCheckedMap = {};

function showPopup(index, url) {
    // console.log(index);
    console.log(url);
    // this.style.color = "red";
    var popup = document.getElementById("popup-link-" + index);
    popup.style.display = "block";

    // Index is used to identify each url
    // If the url of current index has been visited and requests for it have been sent out
    if (!urlCheckedMap[index]) {
        urlCheckedMap[index] = true;

        // Send url to Google for checking
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

        // Get links of the webpage of the url and evaluate trust
        sendUrlToGetWebPageLinks(url, function (arrayLinks) {
            if (arrayLinks instanceof Array) {
                let domainCountMap = getDomainCountMapFromUrls(arrayLinks, url);
                urlDomainCountMap[index] = domainCountMap;
                sendDataToExtentionPopup("getDomains", domainCountMap, url);

                // Draw trust graph
                let domains = [];
                for (let domain in domainCountMap) {
                    domains.push(domain);
                }
                sendUrlsForWOTCheck(domains, function (wotObjects) {
                    let dataMap = {};
                    for (let wotObject of wotObjects) {
                        let trustLevel = null;
                        if (wotObject.rate >= 80) {
                            trustLevel = "Excellent";
                        } else if (wotObject.rate >= 60) {
                            trustLevel = "Good";
                        } else if (wotObject.rate >= 40) {
                            trustLevel = "Unsatisfactory";
                        } else if (wotObject.rate >= 20) {
                            trustLevel = "Poor";
                        } else if (wotObject.rate >= 0) {
                            trustLevel = "Very poor";
                        } else {
                            trustLevel = "Unknown";
                        }

                        if (dataMap[trustLevel] == null) {
                            dataMap[trustLevel] = 0;
                        }
                        dataMap[trustLevel]++;
                    }
                    drawChart(dataMap, index);
                });
            }
        });

        // Evaluate the target url from WOT API and get tags to display
        let currDomain = extractRootDomain(url);
        sendUrlsForWOTCheck([currDomain], function (wotObjects) {
            console.log(JSON.stringify(wotObjects));
            if (wotObjects.length > 0) {
                document.getElementById("tags-" + index).innerHTML = wotObjects[0].tags;
                document.getElementById("severity-meter-" + index).value = wotObjects[0].rate;
                if (wotObjects[0].rate < 0) {
                    document.getElementById("severity-" + index).innerHTML = "This website has unknown reputation";
                } else {
                    document.getElementById("severity-" + index).innerHTML = "This website is " + wotObjects[0].rate + "% to be a good site.";
                }
            }
        });
    }

    if (urlDomainCountMap[index]) {
        sendDataToExtentionPopup("getDomains", urlDomainCountMap[index], url);
    }
}

function sendDataToExtentionPopup(action, domainCountMap, baseUrl) {
    var domainObject = {};
    domainObject.domainCountMap = domainCountMap;
    domainObject.baseUrl = baseUrl;
    chrome.runtime.sendMessage({
        action: action,
        source: domainObject
    });
}

function hidePopup(index) {
    // console.log(index);
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


function drawChart(trustLevelMap, index) {
    // Calculate the sum of total links
    let validLinkCount = 0;
    for (let trustLevel in trustLevelMap) {
        validLinkCount += trustLevelMap[trustLevel];
    }

    // Transform trustLevel map to percentage
    let trustLevelPercentMap = {};
    for (let trustLevel in trustLevelMap) {
        trustLevelPercentMap[trustLevel] = (trustLevelMap[trustLevel] * 100 / validLinkCount).toFixed(1);
    }

    var trustLevelData = [];
    var trustLevels = [];
    var counts = [];
    var backgroundColor = [];
    var hoverBackgroundColor = [];
    for (let trustLevel in trustLevelPercentMap) {
        trustLevels.push(trustLevel + "(" + trustLevelPercentMap[trustLevel] + "%)");
        counts.push(trustLevelMap[trustLevel]);
        backgroundColor.push(getTrustLevelColor(trustLevel, false));
        hoverBackgroundColor.push(getTrustLevelColor(trustLevel, true));
    }

    var pieChartData = {};
    pieChartData.labels = trustLevels;
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
        options: {
            title: {
                display: true,
                text: 'Target Website Links Trust Chart'
            }
        }
    });
}

function getTrustLevelColor(trustLevel, isHover) {
    let r = 0, g = 0, b = 0;
    if (isHover) {
        r += 20;
        g += 20;
        b += 20;
    }
    if (trustLevel == "Excellent") {
        r += 0;
        g += 230;
        b += 0;
    } else if (trustLevel == "Good") {
        r += 0;
        g += 153;
        b += 51;
    } else if (trustLevel == "Unsatisfactory") {
        r += 0;
        g += 0;
        b += 230;
    } else if (trustLevel == "Poor") {
        r += 230;
        g += 230;
        b += 0;
    } else if (trustLevel == "Very poor") {
        r += 230;
        g += 0;
        b += 0;
    } else {
        // Unknown level
        r += 209;
        g += 209;
        b += 224;
    }
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function sendUrlToGetWebPageLinks(url, callback) {
    var request = makeHttpObject();
    request.open("GET", "https://anti-social-engineering-tool.mybluemix.net/links?url=" + url, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            var linkArray = JSON.parse(request.responseText);
            callback(linkArray);
        }
    };
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

function sendUrlsForWOTCheck(domains, callback) {
    var request = makeHttpObject();
    let requestUrl = "https://api.mywot.com/0.4/public_link_json2?hosts=https://";
    for (let domain of domains) {
        requestUrl += domain + "/";
    }
    requestUrl += "&key=491c8197a10b1f60cd725ee5e9bbf51836676f71";
    request.open("GET", requestUrl, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            let jsonResponse = JSON.parse(request.responseText);
            let wotObjects = [];
            for (let domain in jsonResponse) {
                let wotObject = {};
                wotObject.domain = domain;
                wotObject.rate = jsonResponse[domain]["0"] ? jsonResponse[domain]["0"][0] : -1;
                wotObject.tags = [];
                if (jsonResponse[domain]["categories"]) {
                    for (let categoryCode in jsonResponse[domain]["categories"]) {
                        if (getCategoryName(categoryCode) != null) {
                            wotObject.tags.push(getCategoryName(categoryCode));
                        }
                    }
                }
                wotObjects.push(wotObject);
            }
            callback(wotObjects);
        }
    };
}

function getCategoryName(categoryCode) {
    switch (categoryCode) {
        case '101':
            return "<span style=\"color:red\">Malware or viruses</span>";
        case '102':
            return "<span style=\"color:red\">Poor customer experience</span>";
        case '103':
            return "<span style=\"color:red\">Phishing</span>";
        case '104':
            return "<span style=\"color:red\">Scam</span>";
        case '105':
            return "<span style=\"color:red\">Potentially illegal</span>";
        case '201':
            return "<span style=\"color:darkgoldenrod\">Misleading claims or unethical</span>";
        case '202':
            return "<span style=\"color:darkgoldenrod\">Privacy risk</span>";
        case '203':
            return "<span style=\"color:darkgoldenrod\">Suspicious</span>";
        case '204':
            return "<span style=\"color:darkgoldenrod\">Hate, discrimination</span>";
        case '205':
            return "<span style=\"color:darkgoldenrod\">Spam</span>";
        case '206':
            return "<span style=\"color:darkgoldenrod\">Potentially unwanted programs</span>";
        case '207':
            return "<span style=\"color:darkgoldenrod\">Ads / pop-ups</span>";
        case '301':
            return "<span style=\"color:blue\">Online tracking</span>";
        case '302':
            return "<span style=\"color:blue\">Alternative or controversial medicine</span>";
        case '303':
            return "<span style=\"color:blue\">Opinions, religion, politics</span>";
        case '501':
            return "<span style=\"color:green\">Good site</span>";
        default:
            return null;
    }
}