// console.log('hello');
var links = document.getElementsByTagName("a");
console.log(links);
for(var i=0; i<links.length; i++) {
    //array.push(links[i].href);
    if (links[i].href != links[i].innerText) {
        // links[i].innerText = links[i].innerText + '(' + links[i].href + ')';
        links[i].style = 'color: red;';
    }
}
