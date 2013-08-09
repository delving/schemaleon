![delving logo](http://delving.eu/sites/all/themes/delving_pool/logo.png)

# OSCR Identifiers

As digital objects and descriptive records are introduced to the OSCR system, they are assigned unique identifiers.
These will be considered permanent internal identifiers and they are generated in a way that guarantees that values
are unique.  The different parts of the identifier are separated by dashes, and they all look like the following:

    {system}-{type}-{millis}-{disambiguator}

## Prefixes

Every identifier within OSCR begins with the letters **OSCR** in order to distinguish it from other sets of
identifiers generated elsewhere. Beyond that, different kinds of objects within OSCR are given another
prefix to indicate what they identify, consisting of two capital letters.

The types are listed here:

* **PH**: Photograph document
* **IM**: Image metadata and image file names
* **VO**: Vocabulary entry
* **US**: User
* **GR**: Group

So far the identifier looks like this:

    OSCR-IM

## Milliseconds

The generation time of an identifier is part of the identifier to clearly define the chance of identifier
collision.  Identifiers generated during two different milliseconds will already have different identifiers
by this strategy, so we only need to concern ourselves with what might happen during a single millisecond.

The identifier now looks like this:

    OSCR-IM-7hmylqu

The number of milliseconds is from the beginning of 2013 and it is recorded using base-36 notation where the
digits and all lower case letters are used.

## Disambiguator

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

    OSCR-IM-7hmylqu-u7w

## Images

Identifiers are also used for digital object file names, since they need to be properly identified upon
being introduced to OSCR and their file names before that time very often overlap.

When storing images on the file system, it is convenient to have them characterized with their appropriate
digital object type, so that they can easily be displayed.  The file names therefore start with the
OSCR identifier but they have file name extensions

The name of a file corresponding JPEG file would be:

    OSCR-IM-7hmylqu-u7w.jpg

When an image is introduced, it is always accompanied by a small XML record of very basic metadata, and
the association between these is via the identifier.

    Identifier of XML meta record : OSCR-IM-7hmylqu-u7w
    Identifier of JPG image file  : OSCR-IM-7hmylqu-u7w.jpg

===

* Gerald de Jong <gerald@delving.eu>

