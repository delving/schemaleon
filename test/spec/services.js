'use strict';

describe('Service: Docs', function () {

    beforeEach(module('CultureCollectorApp'));
    beforeEach(module('xml'));

    var docs, filter;

    beforeEach(inject(function (Docs, xmlFilter) {
        docs = Docs;
        filter = xmlFilter;
    }));

    it('should supply a doc', function() {
        expect(docs.query().name).toBe('Document');
        expect(docs.query().identifier).toBe('DOC123');
    });

    it('should parse an xml document', function() {
        var xml = filter('<gumby><pokey id="who"><horse/></pokey><pokey id="why"><clay/></pokey></gumby>');
        expect(xml.find('pokey').length).toBe(2);
    })

});

