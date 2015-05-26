FROM schemaleon_foundation

MAINTAINER gerald@delving.eu

RUN mkdir -p /Schemaleon/SchemaleonFiles /Schemaleon/BaseXData


ADD . /Schemaleon/App
ADD ./dot-basex.txt /Schemaleon/SchemaleonFiles/.basex

WORKDIR /Schemaleon/App

RUN grunt

ENV HOME /Schemaleon/SchemaleonFiles

VOLUME ["/Schemaleon/SchemaleonFiles"]

VOLUME ["/Schemaleon/BaseXData"]

EXPOSE 9000

CMD /Schemaleon/App/run-prod
