![delving logo](http://delving.eu/sites/all/themes/delving_pool/logo.png)

# OSCR Internationalization

There is no established i18n strategy built in to the Angular JS user interface technology used for OSCR, but
a very convenient solution has been found.  The process is completely interactive!

Since this project is to persist all of its information in an XML database, OSCR persists all translations
in BaseX.  There is a folder called __i18n__ in the database, and it contains an XML document for each language,
and their format is as follows (this example is Dutch):

    <Language>
      <label>
        <Documents>Documenten</Documents>
        <ID>Identificatienummer</ID>
        <LoggedInAs>Ingelogd als</LoggedInAs>
        .....
      </label>
      <element>
        <ShortDescription>
          <title>Korte Omschrijving</title>
          <doc>De korte omschrijving is voor informatie die niet elders past</doc>
        </ShortDescription>
        <Title>
          <title>Titel</title>
          <doc>De titel wordt gebruikt om in een oogopslag</doc>
        </Title>
        <Authenticity>
          <title>Echtheid</title>
          <doc>Hier een keuze uit een aantal soorten echtheid</doc>
        </Authenticity>
        ...
      </element>
    </Language>

Labels are for things that appear all the time on the various pages of the user interface, and they are
separated from the _title_ and _documentation_ associated with the fields of the document schemas.

When a user has the permission to do translations, a toggle button appears in the user interface.  Whenever
the toggle is pressed, translation icons appear beside every string which needs translation.

Each message, title, menu item, button, or explanation can have text, and the words that appear should of course
be in the user's language.  Language can be chosen from a drop-down in the interface.

When the user clicks on the translation icon for an item in the interface, a dialog pops up where
the user can type the translated text.  Submitting this dialog results in an HTTP call to the
OSCR server side which records the submitted value in the appropriate language document.  The value
is stored and the interface shows the resulting change immediately.

This will make creating a new language version of OSCR a very rapid and effective process which can easily
be delegated to a knowlegeable user.

Exporting and importing these XML Language documents to and from Basex is trivial since the format is
XML, so it will be easy to take the results from one translation effort and use it for another
deployment.

===

* Gerald de Jong <gerald@delving.eu>

