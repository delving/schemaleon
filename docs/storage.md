![delving logo](DelvingLogo.png?raw=true)

----

# OSCR Storage

There are two parts to the system of storing data behind the platform, the XML database is used for documents, and the media files are stored on the file system.  The documents must be searchable by content, and the media files are always referred to from documents so they must be consistently organized and named.

## BaseX Database Structure

The main database structure is this:

	/schemas/shared
	/shared/<schema>
	/schemas/primary
	/primary/<group>/<schema>/
	/vocabulary
	/people/groups
	/people/users
	/i18n
	/log

Two of the above sections of the database actually correspond to multiple actual directories, since documents are always stored in collections according the the name of the schema to which they belong.  The shared documents are structured directly that way, while the primary documents are first dividied into sections according to the group of users to which they belong.

There is one special group with the identifier **OSCR** which is to contain the powerful administrator users who have the rights to do things like group management and language translation.

### /schemas/shared and /schemas/primary

This is the collection of schema documents describing the data objects that all groups share and to which they refer in order to contextualize their own objects.

	/schemas/shared/Location.xml
	/schemas/shared/Person.xml
	/schemas/shared/Organization.xml
	/schemas/primary/Film.xml
	/schemas/primary/Photo.xml
	/schemas/primary/Publication.xml

The content of these schemas is described in [schemas.md](schemas.md).

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

An XML file for each vocabulary defined in any of the schemas is stored here.

	<Entries>
	  <Entry>
	    <Label>Large</Label>
	    <Identifier>OSCR-VO-emp1amz-vms</Identifier>
	  </Entry>
	  <Entry>
	    <Label>Medium</Label>
	    <Identifier>OSCR-VO-eu5f206-720</Identifier>
	  </Entry>
	  <Entry>
	    <Label>Small</Label>
	    <Identifier>OSCR-VO-eu5pb8g-yyi</Identifier>
	  </Entry>
	</Entries>

Vocabularies are shared by all users[^1] and their values can either be fixed[^2] or created on-the-fly by users.

[^1]: This is a permission issue that we still need to think about.

[^2]: Fixed vocabularies not implemented yet.

### /people/groups

In this collection there is one XML file for each OSCR group.  The structure is currently as follows, but it can be changed or extended depending on what should be displayed to identify a group.

	<Group>
	  <Identifier>HS_343/Identifier>
	  <Name>Old Town Historical Society</Name>
	  <Address>
	    <Street>2 Main Street</Street>
	    <Postcode>5000 AA</Postcode>
	    <Place>Old Town</Place>
	  </Address>
	</Group>
	
Other fields can be added to this as long as the associated user interface knows about the contents and can do something to display them.

### /people/users

This collection contains one XML file per user and each file looks like this:

	<User>
	  <Identifier>OSCR-US-e6m08tx-3hx</Identifier>
	  <Profile>
	    <firstName>John</firstName>
	    <lastName>Smith</lastName>
	    <email>j.smith@home.nl</email>
	    <username>johnny</username>
	  </Profile>
	  <SaveTime>1391164572597</SaveTime>
	  <Membership>
	    <GroupIdentifier>HS_343</GroupIdentifier>
	    <Role>Administrator</Role>
	  </Membership>
	</User>
	
The *Identifier* is of course to be unique within the system, and the *SaveTime* records the last time that the user record was saved.

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
	    <Who>OSCR-US-egs231vc-dqn</Who>
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
	    <Who>OSCR-US-egs231vc-dqn</Who>
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

The files are stored in a directory called *OSCR-Files* within the home directory, and the media files for the different groups of users in the system are stored separately according to the group identifer.

	<home-directory>/OSCR-Files/MediaStorage/<group-identifier>/
	
Within the directory for group name, the media files are stored in *bucket* directories corresponding to the first two letters of hashed name of the file.
	
	
    <group-identifier>/43/43b1d37e14c94950d561cf2d8c6da47c.mp4
	<group-identifier>/43/thumbnail/43b1d37e14c94950d561cf2d8c6da47c.jpg

Here you can see that the thumbnail derivative has been stored in a subdirectory under exactly the same base name but with the thumbnail extension.  This will be true in the future as well for any other kinds of derivative media that is created.

## Generated Identifiers

When descriptive records are introduced by users to the OSCR system via the interface, they are assigned identifiers which are generated in order to ensure uniqueness.  The generated identifiers are also intended to given some indication of the nature of the thing they identify.

The different parts of the identifier are separated by dashes, and they all look like the following:

    OSCR-{type}-{millis}-{disambiguator}

The identifier is built up piece by piece in the following sections:

1. Type

	When an identifier is prefixed with OSCR we know that it was generated within the platform, but the second portion is to indicate what type of thing is being identified.  There is no fixed strategy for defining the letters to indicate a type aside from the usage of the schema name when a document is created.
	
	    OSCR-Photo
	
	The above example will be the first part of an identifier generated for a Photo document.

2. Milliseconds

	The generation time of an identifier is part of the identifier to clearly define the chance of identifier collision.  Identifiers generated during two different milliseconds will already have different identifiers
	by this strategy, so we only need to concern ourselves with what might happen during a single millisecond.
	
	The identifier now looks like this:
	
	    OSCR-Photo-7hmylqu
	
	The number of milliseconds is from the beginning of 2013 and it is recorded using base-36 notation where the
	digits and all lower case letters are used.

3. Disambiguator

	Much can happen inside of a single millisecond, and if the OSCR system were used on a very large scale
	there would be a distinct chance that two identifiers generated in two different places could happen
	during one millisecond.  To ensure that this will essentially never result in an identifier conflict,
	there is another portion added to the identifier which generally contains a random number.
	
	The disambiguator is generated as three random characters in base-36, which corresponds to a number between
	0 and 46656.  The chance that two identifiers minted in the same millisecond will have the same random
	number is sufficiently small that we can consider it negligible.
	
	In cases where batch imports are performed, there may be many identifiers created within a millisecond, but
	in these cases the random number can be replaced by an incrementing number, and even extended if necessary.
	
	The complete identifier then looks like this:
	
	    OSCR-Photo-7hmylqu-u7w
	
When documents and media are migrated to the OSCR storage, they will be given identifiers according to the strategy used by the person doing the migration.


===

* Gerald de Jong <gerald@delving.eu>
* Eric van der Meulen <eric@delving.eu>

