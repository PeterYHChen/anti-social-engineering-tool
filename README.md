# Anti Social Engineering Tool
A chrome extension that helps users to avoid tricks in social engineering. With this extension, users could easily apply the suggested anti social engineering policies and protect themselves. To be specific, this extension tells you in English if the site is bad or not. If you have a bit more experience, it will also shows what percentage of links go where.

## Example of Low-reputation Website
Here is a screenshot of our extension when hovering on a website with low reputation.

+ Right below the hovered link, a popup is displayed to indicate the site status.
    * It tells that no threat is discovered. This is retrieved from Google Safe Browsing API and it tells you whether this site is social engineering site or contains threats like malwares and unwanted software.
    * A reputation bar chart of this site is retrieved from Web Of Trust (WOT) API.
    * Tags or categories of this site are retrieved also from WOT API.
    * A pie chart is generated based on all the links inside the target site. For each link in the site, we call WOT API for its reputation and categorize as a reputation distribution chart (Excellent >= 80, Good >= 60, Unsatisfactory >= 40, Poor >= 20, Very Poor >= 0).

+ In the top-right corner, another popup is displayed to show a domain distribution pie chart, indicating how many links inside the target site belongs to the same domain, and what those domains are.

<img src="screenshots/bad-website-screenshot.png" width="100%">

## Example of Good-reputation Website
Here is an example of good site, which is official website of New York University.

<img src="screenshots/good-website-screenshot.png" width="100%">

## Example of Malware Website
When a threat is discovered, Google Safe Browsing API would indicate what it is.

<img src="screenshots/virus-website.png" width="100%">