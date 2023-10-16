const http = require('http');
const url = require('url');
const query = require('querystring');

const jsonHandler = require('./jsonResponses.js');
const htmlHandler = require('./htmlResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// method for putting back together post requests sent from client
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

    // if a board is sent (which is every time besides the first post) then add the 
    // data to the correct room held by the server
    if (bodyParams.board) {
      jsonHandler.addData(request, response, bodyParams);
    } else {
      // otherwise check to create or join a room
      jsonHandler.createRoom(request, response, bodyParams);
    }
  });
};

// holds the methods for all the url requests from the client
const urlStruct = {
  '/': htmlHandler.getIndex,
  '/style.css': htmlHandler.getCSS,
  '/sendData': parseBody,
  '/getData': jsonHandler.getData,
  '/checkRoom': parseBody
};

// method called when the server gets a request
// calls the urlStruct to administer the right method
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);
  const params = query.parse(parsedUrl.query);
  if (urlStruct[parsedUrl.pathname]) {
    urlStruct[parsedUrl.pathname](request, response, params);
  }
  return true;
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on port ${port}`);
});
