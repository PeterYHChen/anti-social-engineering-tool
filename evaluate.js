
var domainCountMap = getDomainMapFromDoc(document, null);
var links = document.getElementsByTagName("a");
for (let i = 0; i < links.length; i++) {
    links[i].title = links[i].href;

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

sendDataToExtentionPopup("getDomains", domainCountMap, window.location.href);

function sendDataToExtentionPopup(action, domainCountMap, baseUrl) {
    var domainObject = {};
    domainObject.domainCountMap = domainCountMap;
    domainObject.baseUrl = baseUrl;
    chrome.runtime.sendMessage({
        action: action,
        source: domainObject
    });
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
