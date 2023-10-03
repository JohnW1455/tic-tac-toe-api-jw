const http = require('http');
const url = require('url');
const query = require('querystring');

const htmlHandler = require('./htmlResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getCSS,
}

const onRequest = (request, response) => {
    const parsedUrl = url.parse(request.url);
  
    if (urlStruct[parsedUrl.pathname]) {
      urlStruct[parsedUrl.pathname](request, response);
    }
    return true;
  };

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on port ${port}`);
  });