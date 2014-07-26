![delving logo](https://github.com/delving/Schemaleon/blob/master/docs/DelvingLogo.png?raw=true)

----

# Schemaleon

### "Schema Chamelion"

---

## Introduction

The Schemaleon system was originally built for historical societies and small museums as a tool for them to record and publish media and information about their cultural heritage artifacts.  At its core are flexibility, transparency, and user interface attention to detail, and its purpose is to have users contextualize rather than enter data.  This means that it focuses on selecting rather than typing, and encourages linking to shared lists.

The flexibility of Schemaleon lies in the ability to generate user interface elements based on the content of a series of schemas.  When everything depends on the schemas, it becomes easy to define proper formats for different kinds of cultural heritage artifacts, and put them to use immediately.  New things can be recorded in their own way without any changes to the code.

The data stored by Schemaleon is in the form of XML, in a database which holds XML in a form as if it were simply a file system filled with XML files.  In fact, Schemaleon has a database dump function which exports the entire database contents as a ZIP file which unpacks to exactly that, a directory structure of files.  This makes data storage extremely transparent.

To make Schemaleon adaptable in an international environment, special attention has been paid to making the application very easily translatable.  When it is to appear in a new country, a user speaking the target language can just toggle “translation mode” and add translations for every bit of text.  This is a quick process, and the results are stored in the database.

## Technologies

Schemaleon has been built on the basis of three technologies which have insipired many of the design aspects of the platform.  Data is stored in an XML database, and the rest of the platform is built with Javascript technologies.

### [Angular JS](http://angularjs.org/)

The challenge in building Schemaleon lie in the fact that it is to act like an application but function in a browser, which means that it must be a “one-page app”.  It needed to be much more complicated than typical browser application to the Angular javascript framework was used to manage the complexity.

AngularJS provides a clean separation between model (data) and view (HTML), and contains some indispensable code organization principles.  The binding mechanism, which changes the HTML page automatically upon changes in the model, made it possible to build an application that acts as a chameleon, changing appearance for different schemas.

### [Node JS](http://nodejs.org/)

For the initial version of Schemaleon we have chosen to use Javascript for the back-end as well as the front end, building the server using NodeJS technology.  The server side of Schemaleon bridges the gap between the client application to the storage system for the data, and 

### [BaseX](http://basex.org/)

The XML stored by Schemaleon in the BaseX database is queried using standard XPath/XQuery with a few extensions.  It can be instructed to index specific fields in the XML, and it can also easily use full-text search according to the 1.0 W3C standard. 

## Design Principles

At its core, Schemaleon is a system for describing cultural heritage objects and storing the associated digital representations, but since a number such systems have been built in the past it is important to understand how Schemaleon is different and why various design choices were made.

### Schema-Driven

The platform is intended to make the best use of the latest browser technologies, and its design was clearly inspired by the ideas behind the Angular JS framework.  It was built to be extremely flexible in terms of defining the structure of the documents that it stores, since the user interface structure and behavior is generate on-the-fly on the basis of the schemas that are deployed into the database.

### International

To make it easy to deploy Schemaleon internationally, extra effort has been put into allowing administrators to adjust language tags within the application itself.  This is much faster and more convenient than maintaining translation files separately, and the results are immediately available to users.

### Educational

There is a learning process involved when people want to properly document cultural heritage objects, so Schemaleon was built with education in mind.  There are different modes of operation for experts and beginners, and the beginner interface provides documentation about each field in the data model.  As with the language features described above, adding content to these instructional descriptions is something done interactively within the program itself.

### Link-Oriented

The documents stored in Schemaleon are not simply the typed contents of a number of fields in a web form.  Actually only a minority of fields such as titles, descriptions, and notes are to contain typed text.  Most fields have content which was chosen from lists, or found through search interfaces to internal or external instances of other documents.  Contextualization involves pointing from object documentation to shared authority data.

### Transparent

Comprehensive transparency is also a design principle of Schemaleon, which is manifest in the ability for administrators to download the entire contents of the data storage whenever they wish.

The ability to upload media files and store them for describing and later for viewing is another important aspect of the platform. To resolve the issue of file naming and potential conflicts, media files are given names based on an MD5 hash of their contents so that the name depends purely on the content.

### Open-Ended

A number of specific things have been implemented in Schemaleon so that it can function as a basic collection management system for historical societies and small museums, but the emphasis in the design is to have a framework in place which can be easily extended with new and potentially parallel approaches to user interface elements.

## Documentation

We decribe the important aspects of the Schemaleon platform in a series of documents in the *docs* directory of this project. Please let us know if you think there are things missing.

* **[Storage](https://github.com/delving/schemaleon/blob/master/docs/storage.md)** - how documents and media are stored

* **[Schemas](https://github.com/delving/schemaleon/blob/master/docs/schemas.md)** - what the schemas look like and how they work

* **[Development](https://github.com/delving/schemaleon/blob/master/docs/development.md)** - how to set up for development


===

* Eric van der Meulen <eric@delving.eu>
* Gerald de Jong <gerald@delving.eu>

	


		
		
	
