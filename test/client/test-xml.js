'use strict';

describe('XML Operations', function () {

    var photoXml =
        '<PhotoObject>' +
            '    <Name></Name>' +
            '    <Title>{ "multiple": true, "summaryField": "Title" }</Title>' +
            '    <Type>' +
            '        <FirstPart/>' +
            '        <SecondPart/>' +
            '        <ThirdPart/>' +
            '    </Type>' +
            '    <AnotherSection>' +
            '        <FirstPart/>' +
            '        <SecondPart/>' +
            '    </AnotherSection>' +
            '</PhotoObject>';

    var expectedPhotoTree =
    {
        name: 'PhotoObject',
        elements: [
            {
                name: 'Name',
                config: {"line": true}
            },
            {
                name: 'Title',
                config: {"multiple": true, "summaryField": "Title", "line": true}
            },
            {
                name: 'Type',
                elements: [
                    {
                        name: 'FirstPart',
                        config: {"line": true}
                    },
                    {
                        name: 'SecondPart',
                        config: {"line": true}
                    },
                    {
                        name: 'ThirdPart',
                        config: {"line": true}
                    }
                ],
                config: {}
            },
            {
                name: 'AnotherSection',
                elements: [
                    {
                        name: 'FirstPart',
                        config: {"line": true}
                    },
                    {
                        name: 'SecondPart',
                        config: {"line": true}
                    }
                ],
                config: {}
            }
        ],
        config: {}
    };

    var expectedPhotoObject =
    {
        PhotoObject: {
            Name: 'one',
            Title: [ 'two' ],
            Type: {
                FirstPart: 'threeA',
                SecondPart: 'threeB'
            }
        }
    };

    var expectedPhotoObjectXml =
        '<PhotoObject>' +
            '   <Name>one</Name>' +
            '   <Title>two</Title>' +
            '   <Type>' +
            '      <FirstPart>threeA</FirstPart>' +
            '      <SecondPart>threeB</SecondPart>' +
            '   </Type>' +
            '</PhotoObject>';

    it('should parse an xml document and generate', function () {
        var tree = xmlToTree(photoXml);
        var jsonString = JSON.stringify(tree);
        var expectedString = JSON.stringify(expectedPhotoTree);

//        console.log(expectedString);
//        console.log(jsonString);

        expect(jsonString).toBe(expectedString);

        tree.elements[0].value = 'one';
        tree.elements[1].value = 'two';
        tree.elements[2].elements[0].value = 'threeA';
        tree.elements[2].elements[1].value = 'threeB';

        var object = treeToObject(tree);

        var objectString = JSON.stringify(object);
        var expectedObjectString = JSON.stringify(expectedPhotoObject);

//        console.log(object);
//        console.log(expectedPhotoObject);

        expect(objectString).toBe(expectedObjectString);

        var xml = objectToXml(object);
//        console.log(xml);
        expect(xml).toBe(expectedPhotoObjectXml);

        var summary = {};
        collectSummaryFields(tree, summary);
        expect(summary.Title).toBe('two');
    });

    var xmlToBeObject =
        '<Language>' +
            '<label>' +
            '<EditExplanation>Edit field explanation</EditExplanation>' +
            '<Yes>Yes</Yes>' +
            '<New>New</New>' +
            '<ShowPreviews>Show previews</ShowPreviews>' +
            '<ShowTranslationEditor>Show translation editor</ShowTranslationEditor>' +
            '</label>' +
            '<element>' +
            '<IdentificationNumber><title>Identification Number</title></IdentificationNumber>' +
            '<Title><title>Title</title></Title>' +
            '<ShortDescription><title>Short description</title></ShortDescription>' +
            '</element>' +
            '</Language>';

    var expectedObject = {
        Language: {
            label: {
                EditExplanation: 'Edit field explanation',
                Yes: 'Yes',
                New: 'New',
                ShowPreviews: 'Show previews',
                ShowTranslationEditor: 'Show translation editor'
            },
            element: {
                IdentificationNumber: { title: "Identification Number" },
                Title: { title: "Title" },
                ShortDescription: { title: "Short description" }
            }
        }
    };

    it('should turn XML into a nice object', function () {
        var object = xmlToObject(xmlToBeObject);
        var resultString = JSON.stringify(object);
        var expectedString = JSON.stringify(expectedObject);
//        console.log(expectedString);
//        console.log(resultString);
        expect(resultString).toBe(expectedString);
    });


    var xmlToBeList =
        '<Entries>' +
            '<Entry>' +
            '<Label>One</Label>' +
            '<ID>1</ID>' +
            '</Entry>' +
            '</Entries>';

    var expectedList = [
        { Label: 'One', ID: '1'}
    ];

    it('should turn XML into a nice object', function () {
        var list = xmlToArray(xmlToBeList);
        var resultString = JSON.stringify(list);
        var expectedString = JSON.stringify(expectedList);
//        console.log(expectedString);
//        console.log(resultString);
        expect(resultString).toBe(expectedString);
    });

    // todo: make sure a deeper hierarchy works
    var retrieved =
        '<Document>' +
            '<Header>' +
            ' <Identifier>ID01</Identifier>' +
            ' <Title>Big Crazy Bang</Title>' +
            ' <SchemaName>Photograph</SchemaName>' +
            '</Header>' +
            '<Body>' +
            ' <Photograph>' +
            '  <Title>Pic</Title>' +
            '  <ShortDescription>One</ShortDescription>' +
            '  <ShortDescription>Two</ShortDescription>' +
            '  <ShortDescription>Three</ShortDescription>' +
            '  <Deeper>' +
            '    <Dive>Splash</Dive>' +
            '  </Deeper>' +
            '  <Deeper>' +
            '    <Dive>Splurge</Dive>' +
            '  </Deeper>' +
            ' </Photograph>' +
            '</Body>' +
            '</Document>';

    var photographSchema =
        '<Photograph>' +
            '   <Title/>' +
            '   <ShortDescription>{ "multiple":true }</ShortDescription>' +
            '   <Deeper>' +
            '      { "multiple":true }' +
            '      <Dive/>' +
            '   </Deeper>' +
            '</Photograph>';


    it('should be able to populate a tree from a retrieved document', function () {
        var tree = xmlToTree(photographSchema);

//        console.log(tree);

        var object = xmlToObject(retrieved);
//        console.log(JSON.stringify(object));
        var body = object.Document.Body;
//        console.log("body=" + JSON.stringify(body));
        populateTree(tree, body);

//        console.log(tree);
//        console.log(JSON.stringify(tree));

        var title = tree.elements[0];
        var short1 = tree.elements[2];
        var short2 = tree.elements[3];
        expect(title.value).toBe('Pic');
        expect(short1.value).toBe('Two');
        expect(short1.config.multiple).toBe(true); // perhaps undefined if we end up using delete again for non-last ones
        expect(short2.value).toBe('Three');
        expect(short2.config.multiple).toBe(true);
        var splash = tree.elements[4].elements[0].value;
        expect(splash).toBe('Splash');
        var splurge = tree.elements[5].elements[0].value;
        expect(splurge).toBe('Splurge');
    });

});
