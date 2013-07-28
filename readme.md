![delving logo](http://delving.eu/sites/all/themes/delving_pool/logo.png)

---
# CULTURE-COLLECTOR (working title: OSCR)
***OSCR*** stands for "Open Source Collection Registration". It aims to ensure that data about collections and it's containing objects is recorded properly according to the [CIDOC-CRM](http://www.cidoc-crm.org/) model and practices.



##Development environment setup

###Prerequisites
Before you can get to work on developing OSCR you will need to have the following installed on your system:

1. Node JS
2. Node Package Manager (npm)
3. Bower
4. Grunt
5. Basex client

####NodeJS
You can download and install Node.js directly from here: <http://nodejs.org/download/>, or if you have a package manager installed on your system you can follow the instructions found here: <https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager>.

####NPM
The Node Package Manager is included with your NodeJS installation

####Bower
To install Bower open up the terminal and type the following (you will want to sudo this):
<pre>npm install -g bower</pre>
	
####Grunt
To install Grunt open up the terminal and type the following (you will want to sudo this):
<pre>npm install -g grunt-cli</pre>
	
####Basex
You can get the Basex client application here: <http://basex.org/products/download/all-downloads/>

##Running the development environment
	
1. clone the OSCR source-code from this repository
2. start up the previously installed Basex client application
3. via the terminal navigate to the root of the application: <pre>cd /path/to/cloned/culture-collector</pre>
4. run the application: <pre>grunt run</pre>  
Your default browser will load with the following url: <http://localhost:9000/#/>
5. Any changes made and saved in the application code will trigger the browser to automatically reload the page so that your changes are immediately visible.


	


		
		
	
