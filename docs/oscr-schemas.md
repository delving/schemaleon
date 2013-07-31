# OSCR Schemas

OSCR is a flexible client-server _Open Source Collection Registration_ platform which stores its data
in the form of XML documents.  The structure and content of the documents is specified by schemas which
also determine how the data is to be edited.  This means that the user interface is generated from the
schemas.

Collection registration in this context differs significantly from what we might call data entry, since
the purpose registering collections is to put artifacts in context.  This means that the main focus of
the user interface is geared toward selecting rather than typing, and it explains the strong focus on
the use of _vocabularies_.

__Note__: The schema format described here is not finalized, but it is easily extensible as it is now.

__Note__: It restricts the XML formats to using only elements and no attributes, but since the purpose of OSCR is to
store _semantic_ information, this should not be a limitation.

## Prototypes

Schemas in OSCR take the form of a kind of _prototype_ document, since the schema actually bears a strong
resemblence to the documents which the system ultimately stores.

A prototype approach is much more intuitive and it makes the generation of an editing user interface in software much
more natural. This contrasts with the abstract formulation represented by XML Schema documents where the schema
and document are not comparable at all, so only experts feel comfortable with them.

A simple example might be this schema:

    <Photograph>
        <Title>{ "required": true }</Title>
        <PhotoType>{ "vocabulary": "PhotoType" }</PhotoType>
        <ShortDescription>{ "paragraph": true }</ShortDescription>
        <Creation>
            <Photographer>{ "vocabulary": "Actors" }</Photographer>
            <Place>{ "vocabulary": "Places" }</Place>
            <Date>{ "validator": "Date" }</Date>
        </Creation>
        <Depicts>{ "multiple": "true" }
            <Person>{ "vocabulary": "Actors" }</Person>
            <Place>{ "vocabulary": "Places" }</Place>
            <Comment>{ "paragraph": true }</Comment>
        </Depicts>
        <TechnicalDescription>
            <Dimension>{ "validator": "pixels" }</Dimension>
            <ISO>{ "vocabulary": "PhotoISO" }</ISO>
            <ExposureTime>{ "vocabulary": "PhotoExposure" }</ExposureTime>
            <LensAperture>{ "vocabulary": "PhotoAperture" }</LensAperture>
        <TechnicalDescription>
    </Photograph>

It will produce records like this:

    <Photograph>
        <Title>Berlin Wall</Title>
        <PhotoType>
            <Label>Black and White</Label>
            <ID>OSCR-V-sghe5as-3az</ID>
            <URI>http://typemaster.com/BlackAndWhite</URI>
        </PhotoType>
        <ShortDescription>This depicts people climbing over the wall</ShortDescription>
        <Creation>
            <Photographer>
                <Label>Ansel Adams</Label>
                <ID>OSCR-V-9s8x6gg-66s</ID>
                <URI>http://actors-master.eu/actors/928827410</URI>
            </Photographer>
            <Place>
                <Label>Brandenburg Gate</Label>
                <ID>OSCR-V-jsa76aas0-e3s</ID>
                <URI>http://place-master.eu/place/a8a9gd9h
            </Place>
            <Date>1989-12-6</Date>
        </Creation>
        <Depicts>
            <Comment>East german youth</Comment>
        </Depicts>
        <Depicts>
            <Comment>Broken pieces of the wall</Comment>
        </Depicts>
        <TechnicalDescription>
            <Dimension>1024x768</Dimension>
            <ISO>
                <Label>ISO 400</Label>
                <ID>OSCR-V-65ht3s-ytx</ID>
            </ISO>
            <ExposureTime>
                <Label>1/60th second</Label>
                <ID>OSCR-V-zn4422zs-90z</ID>
            </ExposureTime>
            <LensAperture>
                <Label>F 3.4</Label>
                <ID>OSCR-V-ioxztz87-px3</ID>
            </LensAperture>
        <TechnicalDescription>
    </Photograph>

The tags <Label>, <ID>, etc are derived by referring to the vocabulary schemas, which are defined elsewhere so they
can be reused, but in the same schema format. More about that later.

## Embedded JSON Properties in XML

The OSCR schema structures the documents by placing fields in a hierarchy, and the contents of the fields
themselves is specified by JSON objects contained within the tags.  This is both a very convenient way to
handle front-end interpretation in Javascript and a very generic approach to passing in a map of name-value
pairs.

__Note__: The same could be done with a set of pre-defined attributes in the XML but the present approach leaves
the option open to use attributes for entirely different purposes.  We may switch to attributes later if they
have not been found useful for something else.

### Property: required

No document may be stored with this value not filled in will be considered valid.  Using _required_ will make
the item in the user interface clearly indicate that it must be entered.

### Property: multiple

This tag may appear more than once, which means that it will appear in the user interface with a plus-sign icon
for expanding.  Pressing the plus button creates a new entry after the existing one.  Fields containing
data directly can be multiple, but tags that wrap a block of fields can as well.

### Property: validator

The name of the validation strategy to be used for this field.  There is a mechanism in place for creating validator
strategies using Javascript code.  This makes it easy to have the user inteface in the browser to do the work of
analyzing inputs and reporting back to the user what the problem currently is. The result will be immediately
responsive in the user interaction, and Javascript has excellent support for many string evaluation and manipulations,
such as using regular expressions when validating.

### Property: vocabulary

This is the name of the vocabulary which is to determine values for the field.  It automatically creates a number of
sub-fields in the user interface.  Which fields appear are determined by the named vocabulary schema, which is stored
separately.

### Property: paragraph

The input field should not be a single line of text, but rather consist of a block of multiple lines of text.  We
may consider using the Markdown format so that there is an option to easily create richly formatted text rather
than plain.

## Vocabulary Handling

The most important aspect of OSCR is that it links things together at every opportunity, which means that users
work mostly by selecting from options rather than typing values.

The options from which they can choose are considered to be _shared data_, either made available via an external
lookup service or built by users collaboratively on a regional level.

Expanding a vocabulary with a new entry is always possible when users cannot find matching entries, and
the user interface streamlines this workflow.  All vocabulary entries used, whether locally invented or
fetched from an authority service, have a representative entry in the OSCR database with its own generated
identifier.

The tags introduced to capture parts of the vocabulary choice in the example above are specified in a separate
collection of vocabulary schemas.

    <VocabularySchemas>
        <PhotoType>
            <Entry>
                <Label/>
                <ID/>
                <URI/>
            </Entry>
        </PhotoType>
        <PhotoISO>
            <Entry>
                <Label/>
                <ID/>
            </Entry>
        </PhotoISO>
        ....
    <VocabularySchemas>

The example above is very simple since it doesn't contain any embedded JSON structures, but it could.  That means
that we could use validation and perhaps some of the other features available to OSCR schemas as well.

When a vocabulary is intended to capture entries to externally available authority lists, its records will
need to contain the URI of the external entries.  This would imply wrapping the external vocabulary choice
inside the internal one. This could work as follows, where one vocabulary refers to another.

    <VocabularySchemas>
        <ExternalPlaces>
            ... specification of how to search and interpret results into fields ...
        </ExternalPlaces>
        <Places>
            <Entry>
                <Label/>
                <ID>
                <ExternalPlace>{ "vocabulary": "ExternalPlaces }</ExternalPlace>
            </Entry>
        </Places>
        ....
    <VocabularySchemas>

The vocabulary entry should also cache any necessary fields available from the authority list for display, so that
external lookups are not always necessary.

# Under Development

The schema definition is part of a working prototype that is now undergoing initial alpha testing, so it is
still open for improvement or adjustment if needs arise.  This approach has made the rapid development of
the prototype possible, and offers much in the area of flexibility.

## Vocabulary Nesting

The scenario with nested vocabularies has not yet been implemented.  It will consist of a specification
of how to search in the external vocabulary and how to interpret the results into a block of fields.
The server side of OSCR will play the role of proxy, making the queries and returning results in
consistent.

## Validation Strategies

Currently a framework is in place which connects the _validator_ attribute from the schema to a piece of
Javascript code within the _Validator_ service on the client side.  There is a great potential for expanding
this validation strategy into an extensive library of validators from which to choose.

A validator examines a value and returns either a string explain what is not yet correct, or null if
the current value is valid.  So far only test validations have been built.  This will develop somewhat
organically as requirements appear.

## Heterogeneous Database

It is possible within OSCR to store any number of different schemas, so with the proper version naming
strategies we will be able to seamlessly keep older versions of documents after we create new schema versions.

The challenge then becomes upgrading from an older to a newer version of the same schema. In the general case, we
could consider using XSLT to specify the transformation of the data from one version to the next. Other
simpler alternatives become available when the nature of the changes is restricted.

### Attributes 'since' and 'until'?

Elements of the schemas can be marked to reflect their existence in the lifespan of the schema, which would
mean that an element can be added to a schema at any time as long as it was marked with a __since__ attribute.
With this attribute the software could consider the element to exist depending on whether or not the version
number corresponds.

Likewise any element can be removed by giving it an attribute __until__, which would indicate to the software
when this element was removed.  Documents marked with earlier versions would contain the element but those
from later versions will not.

It may be more straightforward to use time stamps instead of version numbers so that their meaning is obvious
instead of dependent on the meanings of the version numbers.

For example:

    <Photograph>
        <Title>{ "required": true }</Title>
        <PhotoType>{ "until": "2013-09-26" }</PhotoType>
        <PhotoType>{ "vocabulary": "PhotoType", "since": "2013-09-26" }</PhotoType>
        <ShortDescription>{ "paragraph": true }</ShortDescription>
    </Photograph>

This shows a tricky example where an element is removed and re-added, effective the given date.  It was
a text field but was replaced by a reference to a vocabulary.

The software implementation would reads the schema with a particular date "in mind" and then removes
values appropriately.

***

Gerald de Jong <gerald@delving.eu>
