![delving logo](http://delving.eu/sites/all/themes/delving_pool/logo.png)

----

# OSCR

## Open Source Collection Registration

The OSCR project is dedicated to building a streamlined client and server side platform for properly capturing
cultural heritage data.  Users will be young and old, expert and novice.

The purpose is to capture data properly according to the [CIDOC Conceptual Reference Model](http://www.cidoc-crm.org/)
and OSCR stores such data in an XML database.  The dominant theme in this approach to registering data is
contextualization, which means that users choose from shared lists much more than they type field values.

The key feature of OSCR is the fact that it is schema-driven, in other words the user interface is actually
generated rather than built by hand.  This means that it can support the creation and evolution of a series
of schema descriptions for the documents it stores, and the database will contain objects built from any of
these schemas.

Tree-shaped documents are created and edited in a way that makes it possible for their parts to link explicitly
to items from external authority lists and services. The intended user base for OSCR is the membership of local
historical societies, so the user-friendliness is among the highest priorities.

## Documentation

In the docs directory you will find documents describing the various aspects of the OSCR system.

* **[oscr-i18n.md](https://github.com/delving/oscr/blob/master/docs/oscr-i18n.md)**:
explains how the multi-language interface works

* **[oscr-schemas.md](https://github.com/delving/oscr/blob/master/docs/oscr-schemas.md)**:
explains the prototype-style schemas and how they work

## Development Environment

The development environment is end-to-end Javascript, with **Angular JS** as the framework for the client
side and **Node JS** as the prototype back-end server providing a REST interface that interfaces to the
**BaseX** database.

### Prerequisites

Before you can get to work on developing OSCR you will need to have the following installed on your system:

1. **Node JS**: server side Javascript framework

    You can download and install Node.js directly from here: <http://nodejs.org/download/>, or if you have a package manager installed on your system you can follow the instructions found here: <https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager>.

1. **NPM**: node package manager for handling server side dependencies

    The Node Package Manager is included with your NodeJS installation

1. **Bower**: package manager for client-side dependencies.

    To install Bower open up the terminal and type the following (you will want to sudo this):

        npm install -g bower

1. **Grunt**: build tool

    To install Grunt open up the terminal and type the following (you will want to sudo this):

        npm install -g grunt-cli

1. **BaseX**: database for persisting XML

    You can get the BaseX client application here: <http://basex.org/products/download/all-downloads/>

### Developing
	
1. clone the OSCR source-code from this repository

        git clone git@github.com:delving/oscr.git

1. start up the BaseX application, start its server

        go to Database / Server Administration...
        click on Local Server "start" button

1. via the terminal navigate to the root of the application:

        cd /path/to/cloned/oscr

1. run the application:

        grunt run

1. currently the Gruntfile.js in the root of the project is set to load Chrome with following url:

        http://localhost:9000/
        
    * edit Gruntfile.js for your own browser preference
    * changes made and saved in the application code will trigger the browser to reload the page

===

* Eric van der Meulen <eric@delving.eu>
* Gerald de Jong <gerald@delving.eu>

	


		
		
	
