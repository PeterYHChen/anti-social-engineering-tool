// console.log('hello');
var links = document.getElementsByTagName("a");
console.log(links);

var domainMap = {};
var validLinkCount = 0;
var popupLinkPageHTML = chrome.extension.getURL("popup-link.html");
for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseenter", () => {
        showPopup(i, links[i].href);
    });
    links[i].addEventListener("mouseleave", () => {
        hidePopup(i);
    });
    links[i].innerHTML += "<div class=\"popup-box\" id=\"popup-link-" + i + "\">A Simple Popup!</div>";
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
    validLinkCount++;

    links[i].title = links[i].href;
    let wordsInLink = links[i].href.split(/[^A-Za-z]/);
    let wordsInLinkSet = new Set(wordsInLink);
    links[i].onclick = function () {
        console.log(wordsInLinkSet);
    };

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
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4)
            alert(request.responseText);
        // popup.innerHTML = request.responseText;
    };
}

function hidePopup(index) {
    console.log(index);
    // this.style.color = "black";

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