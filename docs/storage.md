![delving logo](DelvingLogo.png?raw=true)

----

# Schemaleon Storage

There are two parts to the system of storing data behind the platform, the XML database is used for documents, and the media files are stored on the file system.  The documents must be searchable by content, and the media files are always referred to from documents so they must be consistently organized and named. The chosen naming is a hash of the file's content, so that identical files are not stored more than once.

The entire XML content of the document database can be downloaded on demand by administrators at any time in the form of a *tar-gzip* archive, for backup or other purposes, which makes the storage completely transparent.  Within the archive the files are organized and appear exactly as they do in the database itself so a subsequent import is straightforward.

## BaseX Database Structure

The global database structure is as follows, where **schemaName** and **groupId** are deployment choices:

	/schemas/shared
	/schemas/primary
	/shared/<schemaName>
	/primary/<groupId>/<schema>/
	/vocabulary
	/people/groups
	/people/users
	/i18n
	/log

The dynamically named sections of the database (where schema and group are named by administrators actually correspond to multiple actual directories, since documents are always stored in collections according the the name of the schema to which they belong.  The shared documents are structured directly that way, while the primary documents are first dividied into sections according to the group of users to which they belong.

There is one special group with the identifier **Schemaleon** which is to contain the  administrator users who have the rights to do things like group management and language translation.

### /schemas/shared and /schemas/primary

This is the collection of schema documents describing the data objects that all groups share and to which they refer in order to contextualize their own objects.

	/schemas/SchemaMap.xml
	/schemas/shared/Location.xml
	/schemas/shared/Person.xml
	/schemas/shared/Organization.xml
	/schemas/primary/Film.xml
	/schemas/primary/Photo.xml
	/schemas/primary/Publication.xml

How these schemas are structured and what they contain is described in [schemas.md](schemas.md).

There is a file called **SchemaMap.xml** located in the */schemas/* directory and it tells Schemaleon which schemas of the different kinds are to be used.  Its contents are very simple:

	<SchemaMap>
	   <primary>Photo,Film,Publication</primary>
	   <shared>Location,Person,Organization</shared>
	</SchemaMap>

It contains comma-delimited lists of all of the schema names belonging to the primary and shared groups.	

### /shared/&lt;schema> and /primary/&lt;group>/&lt;schema>/

Each document in the database is stored within a *Document* element with a *Header* and *Body* blocks.

    <Document>
        <Header>
            [identification metadata]
        </Header>
        <Body>
            [document contents]
        </Body>
    </Document>

The *Header* information describes the identify of the document, as well as various other pieces of administrative data.  The *Body* block is defined by the various schemas.  To understand the schemas, please refer to [schemas.md](schemas.md).

    <Header>
    	<Identifier/>
    	<SchemaName/>
    	<SavedBy/>
    	<GroupIdentifier/>
    	<TimeStamp/>
    	<SummaryFields/>
    	<DocumentState/>
    </Header>

This *Header* section is the same for all stored documents. The *Identifier* is of course the unique string identifying the record, and this is also used for the XML file name of the stored document.  The *SchemaName* identifies how the content in the *Body* block is to be interpreted.

The identifier of the last user to save this document is stored in the *SavedBy* field and the save time is stored as a number of milliseconds since 1970 in the *TimeStamp* field.  The group to which this user belongs is identified with the *GroupIdentifier*.

The *SummaryFields* section is created every time a document is stored, and it represents a few fields harvested from the *Body* of the document (specified in the schema) so that it can easily be identified and displayed in lists.  The *SummaryField* block is therefore considered to only represent a cache of the field content.

Finally the *DocumentState* records whether a document is considered "Private", "Public" or "Deleted".

### /vocabulary

An XML file for each vocabulary defined in any of the schemas is stored here, and has the following form with entries each having a *Label* and an *Identifier*.

	<Entries>
	  <Entry>
	    <Label>Large</Label>
	    <Identifier>S10-emp1amz-vms</Identifier>
	  </Entry>
	  <Entry>
	    <Label>Medium</Label>
	    <Identifier>S10-eu5f206-720</Identifier>
	  </Entry>
	  <Entry>
	    <Label>Small</Label>
	    <Identifier>S10-eu5pb8g-yyi</Identifier>
	  </Entry>
	</Entries>

Vocabularies are currently shared among all users, and they can be either fixed or open. Fixed vocabularies cannot change over time, and are therefore pre-installed by the administrators of the Schemaleon platform (see bootstrapping below).

An open vocabulary can be given a new entry on-the-fly by a user very quickly and easily.  The values of open vocabularies are "controlled" in the sense that users will be encouraged to re-use values that have already been used, although they will not be limited.  The purpose of these open vocabularies is to encourage re-use of values, so that spelling and capitalization differences are minimal, but otherwise the contents of the field are simlar to a free-text input field.

Ultimately, this definition of controlled vocabularies will probably change to accommodate making associations with external terminology authority lists (see future developments).

### /people/groups

In this collection there is one XML file for each Schemaleon group.  The structure is currently as follows, but it can be changed or extended depending on what should be displayed to identify a group.

	<Group>
	  <Identifier>HS_343/Identifier>
	  <Name>Old Town Historical Society</Name>
	  <Address>
	    <Street>2 Main Street</Street>
	    <Postcode>5000 AA</Postcode>
	    <Place>Old Town</Place>
	  </Address>
	</Group>
	
Other fields can be added to this as long as the associated user interface knows about the contents and can do something to display them.  This has yet to be finalized.

### /people/users

This collection contains one XML file per user and each file looks like this:

	<User>
	  <Identifier>S10-e6m08tx-3hx</Identifier>
	  <Credentials>
		 <Username>johnny</Username>
		 <PasswordHash>TECYLDgbTcSTKceIHbAtZl5fqa6trbMUgNBvYidSo6c=</PasswordHash>
	  </Credentials>
	  <Profile>
	    <FirstName>John</FirstName>
	    <LastName>Smith</LastName>
	    <EMail>j.smith@home.nl</EMail>
	  </Profile>
	  <SaveTime>1391164572597</SaveTime>
	  <Membership>
	    <GroupIdentifier>S10-uqkmmu1-h3l</GroupIdentifier>
	    <Role>Administrator</Role>
	  </Membership>
	</User>
	
The *Identifier* is of course to be unique within the system, and the *SaveTime* records the last time that the user record was saved.

The *Credentials* are for authentication, and the password hash encodes the password without revealing it.

The *Membership* block records the group to which the user belongs as well as what *Role* they play in that group.

The *Profile* contains information to display about the user.

### /i18n

Here a file is stored for each language, for example English would be stored in **en.xml**.  This is what a Dutch example might look like:

	<Language>
	  <label>
	    <Community>Gemeenschap</Community>
	    <People>Mensen</People>
	    .....
	    <UserManagement>Gebruikersbeheer</UserManagement>
	  </label>
	  <element>
	    <FirstName>
	      <title>Voornaam</title>
	      <doc>....explanation....</doc>
	    </FirstName>
	    ....
	    <Copyright>
	      <title>Rechten</title>
	      <doc>....explanation....</doc>
	    </Copyright>
	  </element>
	</Language>

The *label* section holds the translations of any language keys which are used within the user interface page templates.

The *element* section holds the translations of the tag names arising from the schemas (not known to the user interface until the the schema is used), as well as an explanatory text to tell the user what the field means and how it is typically used.

### /log

Here two different series of files are stored, and since these are log files they are created in the typical *rollover* fashion of log systems.  Every activity performed by a user which modifies the database is stored in files prefixed with **activity-** while the chat messages exchanged by users are stored in files prefixe with **chat-**.

	activity-YYYY-MM-DD.xml
	chat-YYYY-MM-DD.xml

There will be one of these files for each day. The activity log looks like this:

	<Activities>
	  <Activity>
	    <Op>Authenticate</Op>
	    <Who>S10-egs231vc-dqn</Who>
	    <TimeStamp>1392104217764</TimeStamp>
	  </Activity>
	  ...
	  <Activity>
	     ...
	  </Activity>
	</Activities>

The structure of the chat file is like this:

	<ChatMessages>
	  <ChatMessage>
	    <time>1391794342797</time>
	    <text>the text that was written</text>
	    <user>user's name</user>
	    <Who>S10-egs231vc-dqn</Who>
	    <TimeStamp>1391794342797</TimeStamp>
	  </ChatMessage>
	  <ChatMessage>
	     ....
	  </ChatMessage>
	  ...
	</ChatMessages>

## Media File System Structure

The media files are stored on the filesystem under very specific names, based on the actual binary content of each file.  Before a file is saved, an MD5 hash is taken of its contents, and the name given to the file will be that hash string in hexadecimal notation, plus the file extension appropriate to the file's mime type.

Some examples might be

	654d8ce69ba5f403f7d554ae1e53449e.mp4
	f631ca05dd6a9900c77d16192761d944.mov
	d4073779a2badcf36607d86623bd681e.jpg

Derived files such as thumbnails (JPEG) are stored with the exact same base file names but within sub-directories, as shown below.

The files are stored in a directory called *SchemaleonFiles* within the home directory, and the media files for the different groups of users in the system are stored separately according to the group identifer.

	<home-directory>/SchemaleonFiles/MediaStorage/<group-identifier>/
	
Within the directory for group name, the media files are stored in *bucket* directories corresponding to the first two letters of hashed name of the file.

    <group-identifier>/43/43bd37e14c94950d561cf2d8c6da47c.mp4
	<group-identifier>/43/thumbnail/43b1d37e14c94950d561cf2d8c6da47c.jpg

Here you can see that the thumbnail derivative has been stored in a subdirectory under exactly the same base name but with the thumbnail extension.  This will be true in the future as well for any other kinds of derivative media that is created.

#### Media Metadata

There is one more kind of document called MediaMetadata which is stored within the primary collections.  Each record is structured the same way as the other primary documents with a *Header* and *Body*, and accompanies a single media object and its derivatives (thumbnail etc) stored in the media file system (described below).

	<Document>
	  <Header>
	    <SchemaName>MediaMetadata</SchemaName>
	    <GroupIdentifier>S10-ej624lw-5nk</GroupIdentifier>
	    <Identifier>98cc4992ada9457c4aee538ac40b0664</Identifier>
	    <TimeStamp>1391804850492</TimeStamp>
	  </Header>
	  <Body>
	    <MediaMetadata>
	      <UserIdentifier>S10-ej624lw-5nk</UserIdentifier>
	      <OriginalFileName>20101208072.jpg</OriginalFileName>
	      <MimeType>image/jpeg</MimeType>
	      <Derivative>thumbnail</Derivative>
	    </MediaMetadata>
	  </Body>
	</Document>

Records of this kind are generated automatically when media is uploaded and ingested, and they are not edited in the same way as the other primary documents.  It contains information about the file in terms of what it was originally called, what it is called now, its *mime type* and information about the derivatives that have been created.  It also records who uploaded it, when it happened, and to which group the user doing it belongs.

## Generated Identifiers

Any entity introduced by users to the Schemaleon system via the interface, they are assigned identifiers which are generated in order to ensure uniqueness.  Each identifier generated is prefixed with **"S10-"** which stands for "Schemalion" in the tradition where "i18n" means "internationalization".

The different parts of the identifier are separated by dashes, and they all look like the following:

    S10-{millis}-{disambiguator}

The identifier is built up piece by piece in the following sections:

1. Milliseconds

	The generation time of an identifier is part of the identifier to clearly define the chance of identifier collision.  Identifiers generated during two different milliseconds will already have different identifiers by this strategy, so we only need to concern ourselves with what might happen during a single millisecond.
	
	The identifier now looks like this:
	
	    S10-7hmylqu
	
	The number of milliseconds is from the beginning of 2015 and it is recorded using base-36 notation where the digits and all lower case letters are used.

1. Disambiguator

	Much can happen inside of a single millisecond, and if the Schemaleon system were used on a very large scale there would be a distinct chance that two identifiers generated in two different places could happen during one millisecond.  To ensure that this will essentially never result in an identifier conflict, there is another portion added to the identifier which generally contains a random number.
	
	The disambiguator is generated as three random characters in base-36, which corresponds to a number between 0 and 46656.  The chance that two identifiers minted in the same millisecond will have the same random number is sufficiently small that we can consider it negligible.
	
	In cases where batch imports are performed, there may be many identifiers created within a millisecond, but in these cases the random number can be replaced by an incrementing number, and even extended if necessary.
	
	The complete identifier then looks like this:
	
	    S10-7hmylqu-u7w
	
When documents and media are migrated to the Schemaleon storage, they will be given identifiers according to the strategy used by the person doing the migration.
 
## Bootstrap Data

Schemaleon stores all of its data in the XML document database, but in order to start it needs a few things to exist in the database. The server has functionality built in to populate an empty database before starting to make this easy.  While experimenting, at any time the database can be dropped and refreshed by providing new bootstrap data.

When Schemaleon starts up, it attempts to open the **Schemaleon** database after contacting database, but if the database is not found, it is created.  Upon creation it is also set up with a **fulltext** index and then the bootstrap data is loaded.

Bootstrap data takes the form of a directory of XML files called **~/Schemaleon/BootstrapData/** inside the  Schemaleon directory in the user's home directory.  It has exactly same structure as the database described above, and the documents contained are imported and indexed as-is. 

	It is good practice to store a basic bootstrap structure in a source-control system like *Git* so that can be carefully managed.

The documents that should be put into source control will generally be everything except the */primary/* and */shared/* directories, because they contain entered data.

* **SchemaMap.xml** - which schemas are to be used
* **primary**, **shared** - where to put the schemas
* **translations** all languages
* **users** and **groups** - only if they are to be pre-determined
* **vocabularies** - fixed ones, and current state of dynamic ones

An example can be found in the project's [test](../test/bootstrap) directory.  If there is no 

### Start from milestone

The bootstrapping system of Schemaleon is so straightforward that it can even be used to save the entire state of the system at some milestone moment. A dump can be created when the milestone is reached and then this can be used anytime as bootstrap data.  It becomes a starting point which can be revisited, or even duplicated.

## Future Development

* **Private Controlled Vocabularies**

	Vocabularies are now shared among all users, and although this is arguably a good idea for fixed vocabularies it raises questions for vocabularies which can be expanded by users.  There is a danger that they may end up littered with inconsistent entries after a while.  It may make sense at some time to have the open controlled vocabularies operate on a group-specific basis and therefore be stored in the */primary/* directories.
	
	Perhaps a mechanism of adoption could be created, in which new entries are initially created in a group-specific way, but Schemaleon administrators would be able to move individual entries into the shared lists.  This could probably best happen at the moment that external authority references are added to the entries.
	
* **Vocabulary Linking**

	Vocabularies built on-the-fly by users should ultimately have their entries associated with values in external terminology authority lists, and this can of course be done by hand. However, since this association activity will probably be done by administrators on a regular basis, it would make sense to have a user interface for this purpose. Such an interface would re-use most of the software currently used to support document editing, including user-friendly assistance in the process of searching for the appropriate link.
	
* **Deletion Sweeps**

	Currently records can be marked as deleted, because it makes sense to have this process not be immediate.  It is to somewhat resemble the "trash can" analogy of modern operating systems, where things are not immediately and permanently discarded but instead can be recovered as long as the trash can is not emptied.

	Eventually a sweep mechanism should be built in which scans the records that are marked for deletion and actually does the work of deleting them, but since this kind of data consists of many connections among documents, this is not necessarily trivial.  The deletion system should ensure that removing a record permanently does not result in a broken link, so each record marked for deletion should first be checked so that no other document refers to it.

* **Git Integration**

	The documents stored in the database are currently replaced when they are changed by users.  As mentioned in the beginning, an archive can be made of the entire contents whenever an administrator likes, and this could also be done automatically on a regular basis.  But this could be improved.
	
	The documents consist of (XML) text and changes will generally be localized, so the contents of the database actually quite closely resembles the source code of a software project.  The extremely popular "Git" version control system (http://git-scm.com/), which is used for the Schemaleon source code, would be an ideal tool for maintaining a comprehensive history of everything that ever changes in the Schemaleon database.
	
	The Schemaleon server side could be made to save every changed or added document to the file system within a local Git repository, and then the necessary commands to commit the changes.  On a regular basis the local Git repository could be "pushed" or synchronized with a Git server (github.com, or an installation of Atlassian Stash, for example) for safe-keeping.  The advantage of this Git-based approach is that each and every change in the data can be recalled, since the entire history is maintained.
	
	As described above in bootstrapping, the contents of such a Git repository could be used as bootstrap data in the event that it becomes necessary to re-initialize a database from an empty state.

===

* Gerald de Jong <gerald@delving.eu>
* Eric van der Meulen <eric@delving.eu>

