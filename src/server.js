const http = require('http');
const url = require('url');
const query = require('querystring');

const jsonHandler = require('./jsonResponses.js');
const htmlHandler = require('./htmlResponses.js');
const { parse } = require('path');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request, response) => {
  const body = [];

  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    jsonHandler.addData(request, response, bodyParams);
  });
}

const urlStruct = {
  '/': htmlHandler.getIndex,
  '/style.css': htmlHandler.getCSS,
  '/sendData': parseBody,
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