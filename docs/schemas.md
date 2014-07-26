![delving logo](DelvingLogo.png?raw=true)

---

# Schemaleon Schemas

The schemas are XML documents stored in the database determine what stored records look like and how they are to be edited by users. The structure is nested hierarchical XML with descriptive parts recorded in JSON.  The syntax and the structure of the schemas is intended to be very concise and easy to understand. 

The main features are these:

1. Prototypes

	The schemas are structured as document prototypes rather than in the standard XML Schema language. That is to say that the schema's XML structure is a direct reflection of how the records look when they are stored in the database. This makes the schema much more intuitive to non-experts, so easier to understand and manage.

1. Embedded JSON

	Within the XML prototype schema there are fragments of JSON objects embedded which describe how a given field or block of fields is to be edited, and whether it is required or can appear multiple times. The edit configuration parts of the JSON describe how the field is to appear to the user, where its content is to come from, and 

1. Implicit Content

	There are a number of aspects of the stored records which are not described explicitly in the schema, since they appear frequently and abide by the same patterns everywhere. This is true for **vocabulary** choices, **media** elements, and **instance** references.  To facilitate migration from existing databases, there is also an optional structure wihin instance entries which allows for the storage of arbitrary "link facts" which will later aid the establishment of actual links.

## An Example

The best way to start is to examine a simple example which contains usages of all the various existing configuration elements.  Each element will be explained in a section below.

A simple example might be this schema:

    <Photograph>
        <Title>{ "required": true }</Title>
        <PhotoType>{ "vocabulary": "PhotoType" }</PhotoType>
        <Description>{ "paragraph": true }</Description>
        <Creation>
            <Photographer>{ "instance": "Person" }</Photographer>
            <Place>{ "instance": "Location" }</Place>
            <Date>{ "validator": "TimePrimitive" }</Date>
        </Creation>
        <Depicts>{ "multiple": "true" }
            <Person>{ "instance": "Person" }</Person>
            <Place>{ "instance": "Location" }</Place>
            <Note>{ "paragraph": true }</Note>
        </Depicts>
    </Photograph>

It could produce a record like this:

    <Photograph>
        <Title>Berlin Wall</Title>
        <PhotoType>
            <Label>Black and White</Label>
            <ID>SCH-V-sghe5as-3az</ID>
        </PhotoType>
        <ShortDescription>This depicts people climbing over the wall</ShortDescription>
        <Creation>
            <Photographer>
            	<Header>
			    	<Identifier/>
			    	<SchemaName/>
			    	<SavedBy/>
			    	<GroupIdentifier/>
			    	<TimeStamp/>
			    	<SummaryFields/>
			    	<DocumentState/>
			    </Header>
            </Photographer>
            <Date>1989-12-6</Date>
        </Creation>
        <Depicts>
            <Comment>East german youth</Comment>
        </Depicts>
        <Depicts>
            <Comment>Broken pieces of the wall</Comment>
        </Depicts>
    </Photograph>

Note that the stored document will simply omit blocks and fields which are not used.

### Cardinality Properties

* **required**

	No document may be stored with this value not filled in will be considered valid.  Using *required* will make the item in the user interface clearly indicate that it must be entered and the validation indicators will show that it is incomplete until it is filled in.

* **multiple**

	To mark an element as multiple is to indicate that it may appear more than once in a record, which means that it will appear in the user interface with a plus-sign icon for creating new ones after an existing one.  Fields can be multiple, but elements that represent blocks of fields can be as well.

### Format Properties

* **paragraph**

	The input field should not be a single line of text, but rather consist of a block of multiple lines of plain text.  The default format of a field, if nothing is specified is to make it a single line text field.

* **validator**

	The name of the validation strategy to be used for this field.  There is a mechanism in place for creating validator strategies using Javascript code.  This makes it easy to have the user inteface in the browser to do the work of analyzing inputs and reporting back to the user what the problem currently is. The result will be immediately responsive in the user interaction, and Javascript has excellent support for many string evaluation and manipulations,
such as using regular expressions when validating.

### Cache Property

* **summaryField**

	True if you want this field to become part of the document header which is stored alongside the document's data and is shown in the document list. Upon saving a document, the *SummaryFields* block of the header is created by harvesting the contents of the fields marked by this property.

### Link Properties

* **vocabulary**

	This is the name of the vocabulary which is to determine values for the field.  When a vocabulary is named in a schema, a corresponding document to store the entries is automatically created in the database if it doesn't yet exist.

* **vocabularyFixed**

	This property indicates that the user will not be allowed to create new entries on-the-fly for this vocabulary, when set to *true*. When this property is not used or is *false*, the vocabulary is considered to be "open".

* **media**

	The *media* property triggers the creation of a media chooser input in the user interface which allows for choosing among previously uploaded media objects, but also offers the option to upload new media on-the-fly while editing the document.  Currently the only value the property can have is *MediaMetadata* referring to the schema that is to represent every stored media object.
	
		<Picture>
			<Identifier>535e4bef2de5019396263897f8f2fc0d</Identifier>
			<GroupIdentifier>GROUP_06</GroupIdentifier>
			<MimeType>image/jpeg</MimeType>
			<OriginalFileName>0147_2003_0830_142831AA.JPG</OriginalFileName>
		</Picture>
	
	The content of the XML element for a field marked as *media* will be the contents of the referenced *MediaMetadata* document, augmented with two fields: the *user* and *group* identifiers.  These extra fields locate the *MediaMetadata* record in the database so that the search scope can be more limited, and they also allow for immediately displaying provenance information.

* **instance**

	An *instance* field is one that contains the information needed to refer to an instance of another document, typically a */shared/* document within Schemaleon itself. An instance field can allow choices from a single schema or from multiple.
	
		<Photographer>{ "instance": "Person" }</Photographer>
		<Entity>{ "instance": [ "Location", "Person", "Organization" }</Entity>
	
	When an instance is chosen the *header* portion of the target document will be inserted as content of the XML tag. Other options are also possible for the content, and currently there is one more option to facilitate migration of data from other systems to Schemaleon.
	
	**Header**
	
	When a */shared/* document is linked to in an *instance* field, the *Header* portion of the document is copied verbatim into the XML element.  Headers contain all of the identification information so it will be possible to construct a URL which links to the shared document in question.
	
		<Person>
			<Header>
				<SchemaName>Person</SchemaName>
				<Identifier>SCH-Person-ezwasujw-dnh</Identifier>
				<GroupIdentifier>GROUP_249</GroupIdentifier>
				<SummaryFields>
					<Title>Joe Smith</Title>
				</SummaryFields>
				<DocumentState>public</DocumentState>
				<TimeStamp>1391716121324</TimeStamp>
				<SavedBy>SCH-US-eaz3313x-rm2</SavedBy>
			</Header>
		</Person>
	
	It also contains some cached *SummaryFields* so that it is possible to quickly show a human-readable value in the field **without** having to de-reference the link.
	
	**LinkFact** Entries
	
	During data migraton it is not always possible or desirable to establish a link immediately, because the most important thing is that the links not be *wrong*, and computer algorithms cannot be trusted to make these choices in most cases.  At the same time, source data being migrated will often contain some information which suggests a particular instance, whether strongly or not so strongly.
	
	To allow the migration to take place without any loss of information, the XML element for the *instance* can contain a number of *LinkFact* elements, each having a name and a value.

		<Person>	
			<LinkFact>
				<Name>Full Name</Name>
				<Value>Joe Smith</Value>
			</LinkFact>
			<LinkFact>
				<Name>Date of Birth</Name>
				<Value>1836</Value>
			</LinkFact>
		<Person>	
	
	The *LinkFact* elements are intended to be of assistance to a user who is in the process of making the choice of link.  They could be considered helpful search terms when the user is looking for the right link.  These facts should have human-readable *Name* elements.  Optionally, once a link has been made, some or all of the *LinkFact* entries could be removed from the element, since there will be *Header* chosen to fully describe the instance.

# Future Development

The schema definition is part of a working prototype that is now undergoing initial alpha testing, so it is still open for improvement or adjustment if needs arise.  This approach has made the rapid development of the prototype possible, and offers much in the area of flexibility.

* **Validation Strategies for Line fields**

	Currently a framework is in place which connects the **validator** attribute from the schema to a block of Javascript code within the *Validator* service on the client side.  There is a great potential for expanding this validation strategy into an extensive library of validators from which to choose.

* **Rich Text Paragraphs**

	The *paragraph* property currently indicates that multiple lines of text will be edited and stored in the given element.  In the future we should also allow for rich text to be placed in paragraph form, in which case the database will store the contained value in **CDATA** form in the XML.

* **Other Types of Fields**

	We currently have these kinds of fields: line, paragraph, vocabulary, media, and instance. The system is very flexible regarding the number and variety of fields possible because all that is required is specific things in the field configuration JSON and the accompanying code in the application.  It would be quite easy to add checkboxes, radio buttons, selections, and anything else that would make the functionality richer.

* **External Instances**

	The function of choosing instances and recording links to them currently works for making links to local *Shared* documents like *Location*, but in the future it will be necessary to have these choices result from actual searches performed on external "master" servers containing predefined authority data.  For this we would create an attribute *externalInstance* and have the server-side function as a proxy to the "master" server.  The choice made from the external source will be recorded internally as a URI.

* **Attributes 'since' and 'until'**

	Elements of the schemas can be marked to reflect their existence in the lifespan of the schema, which would mean that an element can be added to a schema at any time as long as it was marked with a **since** attribute. With this attribute the software could consider the element to exist depending on whether or not the version number corresponds.

	Likewise any element can be removed by giving it an attribute **until**, which would indicate to the software when this element was removed.  Documents marked with earlier versions would contain the element but those from later versions will not.

	It may be more straightforward to use time stamps instead of version numbers so that their meaning is obvious instead of dependent on the meanings of the version numbers.

	For example:

	    <Photograph>
	        <Title>{ "required": true }</Title>
	        <PhotoType>{ "until": "2013-09-26" }</PhotoType>
	        <PhotoType>{ "vocabulary": "PhotoType", "since": "2013-09-26" }</PhotoType>
	        <ShortDescription>{ "paragraph": true }</ShortDescription>
	    </Photograph>

	This shows a tricky example where an element is removed and re-added, effective the given date.  It was a text field but was replaced by a reference to a vocabulary.

	The software implementation would reads the schema with a particular date "in mind" and then removes values appropriately.

Contact us if you would like to discuss other potential future developments of the schema system.  It is intentionally open-ended so that new ideas can be easily adopted.

===

* Gerald de Jong <gerald@delving.eu>
* Eric van der Meulen <eric@delving.eu>


