'use strict';

describe('XML Operations', function () {

    var photoXml =
        '<PhotoObject>' +
            '    <IdentificationNumber></IdentificationNumber>' +
            '    <Title>{ "multiple": true }</Title>' +
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
                name: 'IdentificationNumber',
                textInput: {}
            },
            {
                name: 'Title',
                valueExpression: {"multiple": true},
                textInput: {},
                multiple: true
            },
            {
                name: 'Type',
                elements: [
                    {
                        name: 'FirstPart',
                        textInput: {}
                    },
                    {
                        name: 'SecondPart',
                        textInput: {}
                    },
                    {
                        name: 'ThirdPart',
                        textInput: {}
                    }
                ]
            },
            {
                name: 'AnotherSection',
                elements: [
                    {
                        name: 'FirstPart',
                        textInput: {}
                    },
                    {
                        name: 'SecondPart',
                        textInput: {}
                    }
                ]
            }
        ]
    };

    var exprectedPhotoObject =
    {
        PhotoObject: {
            IdentificationNumber: 'one',
            Title: ['two'],
            Type: {
                FirstPart: 'threeA',
                SecondPart: 'threeB'
            }
        }
    };

    var expectedPhotoObjectXml =
        '<PhotoObject>' +
            '   <IdentificationNumber>one</IdentificationNumber>' +
            '   <Title>two</Title>' +
            '   <Type>' +
            '      <FirstPart>threeA</FirstPart>' +
            '      <SecondPart>threeB</SecondPart>' +
            '   </Type>' +
            '</PhotoObject>';

    it('should parse an xml document and generate', function () {
        var result = xmlToTree(photoXml);
        var jsonString = JSON.stringify(result);
        var expectedString = JSON.stringify(expectedPhotoTree);

//        console.log(expectedString);
//        console.log(jsonString);

        expect(jsonString).toBe(expectedString);

        result.elements[0].value = 'one';
        result.elements[1].value = 'two';
        result.elements[2].elements[0].value = 'threeA';
        result.elements[2].elements[1].value = 'threeB';

        var cleaned = treeToObject(result);

        var cleanedString = JSON.stringify(cleaned);
        var expectedCleanedString = JSON.stringify(exprectedPhotoObject);
        expect(cleanedString).toBe(expectedCleanedString);
//        console.log(cleanedString);

        var xml = objectToXml(cleaned);
//        console.log(xml);
        expect(xml).toBe(expectedPhotoObjectXml);
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

    var retrieved =
        '<Document>' +
            '<Header>' +
            '<Identifier>ID01</Identifier>' +
            '<Title>Big Crazy Bang</Title>' +
            '<SchemaName>Photograph</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photograph>' +
            '<Title>Test Document</Title>' +
            '<ShortDescription>An attempt</ShortDescription>' +
            '</Photograph>' +
            '</Body>' +
            '</Document>';

    var photographSchema =
        '<Photograph>' +
            '   <Title/>' +
            '   <ShortDescription/>' +
            '</Photograph>';


    it('should be able to populate a tree from a retrieved document', function () {
        var tree = xmlToTree(photographSchema);
        console.log(JSON.stringify(tree));
        var object = xmlToObject(retrieved);
//        expect(object.Document.Body.Photograph).tobe()
//        console.log(JSON.stringify(object));
        var body = object.Document.Body;
        console.log("body=" + JSON.stringify(body));
        populateTree(tree, body);
        console.log(JSON.stringify(tree));
    });

});
