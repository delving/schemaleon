'use strict';

describe('Service: Docs', function () {

    beforeEach(module('CultureCollectorApp'))

    var docs;

    beforeEach(inject(function (Docs) {
        docs = Docs;
    }));

    it('should supply a doc', function() {
        expect(docs.query().name).toBe('Document');
        expect(docs.query().identifier).toBe('DOC123z');
    });

//    it('should parse an xml document', function(xmlFilter) {
//        var xml = xmlFilter('<gumby><pokey id="who"><horse/></pokey><pokey id="why"><clay/></pokey></gumby>');
//        expect(xml.find('pokey').count()).toBe(2);
//    })

});

