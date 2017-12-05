// a18a900127926b2b18a988310b5d305fd2e25ddaa Don't care about key. 
// http://api.mywot.com/0.4/public_link_json2?hosts=www.google.com/&callback=process&key=18a900127926b2b18a988310b5d305fd2e25ddaa

// var request = new XMLHttpRequest();

// request.onreadystatechange = function() {
// 	if (request.readyState === 4) {
// 		if (request.status === 200) {
// 			document.body.className = 'ok';
// 			console.log(request.responseText);
// 		} else {
// 			document.body.className = 'error';
// 		}
// 	}
// };

// request.open("GET", url, true);
// request.send(null);

// var http = require('http');

// var options = {
//   host: 'http://api.mywot.com',
//   path: '/0.4/public_link_json2?hosts=www.google.com/&callback=process&key=18a900127926b2b18a988310b5d305fd2e25ddaa'
//   port
// };

// http.get(options, function(resp){
//   resp.on('data', function(chunk){
//    	print(chunk);
//   });
// }).on("error", function(e){
//   console.log("Got error: " + e.message);
// });

const request = require('request');
var resp = ''
 
request('http://api.mywot.com/0.4/public_link_json2?hosts=www.google.com/&callback=process&key=18a900127926b2b18a988310b5d305fd2e25ddaa', { json: true }, (err, res, body) => {
  if (err) { return console.log(err); }
  var resp = body;
  console.log(resp);
});