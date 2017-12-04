# AIzaSyDWcNFNEsDWagvfgjZGHw0Y9LNvtgz3LhE

from gglsbl import SafeBrowsingList
 
sbl = SafeBrowsingList('AIzaSyDWcNFNEsDWagvfgjZGHw0Y9LNvtgz3LhE')

threat_list = sbl.lookup_url('http://github.com/')
if threat_list == None:
	print('None.')
else:
	print('Threats: ' + str(threat_list))