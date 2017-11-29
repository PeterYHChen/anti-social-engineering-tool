
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

function showPopup(index, url) {
    console.log(index);
    console.log(url);
    // this.style.color = "red";
    var popup = document.getElementById("popup-link-" + index);
    popup.style.display = "block";

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
