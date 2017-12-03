# Copyright 2015 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
import requests
from flask import Flask, jsonify, request
from BeautifulSoup import BeautifulSoup

app = Flask(__name__)

@app.route('/')
def Welcome():
    return app.send_static_file('index.html')


# 408 for timeout error, 503 for no network error
@app.route('/page')
def getPage():
    url = request.args.get('url')
    if url:
        try:
            result = requests.get(url, timeout=10)
            return result.content
        except requests.exceptions.Timeout:
            return "Timeout to get webpage from " + url, 408
        except:
            return "Network problem, fail to commuicate with url: " + url, 503
    else:
        return "No url is specified"

# 408 for timeout error, 503 for no network error
@app.route('/links')
def getLinks():
    url = request.args.get('url')
    if url:
        try:
            result = requests.get(url, timeout=10)
            soup = BeautifulSoup(result.content)
            hrefs = list()
            for link in soup.findAll('a'):
                hrefs.append(link.get('href'))
            return json.dumps(hrefs)
        except requests.exceptions.Timeout:
            return "Timeout to get links from " + url, 408
        except:
            return "Network problem, fail to commuicate with url: " + url, 503
    else:
        return "No url is specified"

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port))
