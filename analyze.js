// console.log('hello');
var links = document.getElementsByTagName("a");
console.log(links);

var domainMap = {};
var validLinkCount = 0;
for(var i=0; i<links.length; i++) {
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