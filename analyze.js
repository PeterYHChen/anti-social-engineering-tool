// console.log('hello');
var links = document.getElementsByTagName("a");
console.log(links);

var domainMap = {};
var validLinkCount = 0;
var popupLinkPageHTML = chrome.extension.getURL("popup-link.html");
for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseenter", mouseEnter);
    links[i].addEventListener("mouseleave", mouseLeave);
    links[i].innerHTML += "<div class=\"popup-box\" id=\"popup-linkr\">A Simple Popup!</div>";
    // links[i].innerHTML += "<div class=\"popup-link\">Popup box</div>";
    // links[i].innerHTML += '<object type="text/html" data="' + popupLinkPageHTML + '"></object>';
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

function mouseEnter() {
    this.style.color = "red";
    // var div = document.getElementById("popup-link");
    // if (div == null) {
    // var div = document.createElement('DIV');
    // div.id = "popup-link";
    // div.className = "popup-box";
    // div.innerText = "hello";
    // this.appendChild(div);
    // }
    // console.log(div);

    var popup = document.getElementById("popup-link");
    popup.style.display = "block";
    console.log(popup);
}

function mouseLeave() {
    this.style.color = "black";
    // document.removeChild(document.getElementById("popup-link"));

    var popup = document.getElementById("popup-link");
    popup.style.display = "none";
    console.log(popup);
}