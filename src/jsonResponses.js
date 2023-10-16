// let gameBoard = ['', '', '', '', '', '', '', '', ''];
// let pendingResponses = [];

// server
let rooms = {};
const respondJSON = (response, status, object) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.write(JSON.stringify(object));
  response.end();
};

// function to respond without json body
// takes request, response and status code
const respondJSONMeta = (request, response, status) => {
  response.writeHead(status);
  response.end();
};

const addData = (request, response, grid) => {
  let gameBoard = grid.board.split(',');
  const curTime = Date.now();

  if (rooms[grid.code] && rooms[grid.code].playerTurn == grid.playerID) {
    const filtered = rooms[grid.code].pendingResponses.filter((element) => element.time < curTime);
    rooms[grid.code].playerTurn = (parseInt(grid.playerID) + 1) % 2;

    filtered.forEach((element) => respondJSON(element.response, 200, { body: gameBoard, playerTurn: rooms[grid.code].playerTurn}));

    rooms[grid.code].pendingResponses = rooms[grid.code].pendingResponses.filter((element) => element.time >= curTime);
    
    return respondJSONMeta(request, response, 204);
  }
  return respondJSONMeta(request, response, 400);
};

const getData = (request, response, queryParams) => {
  const responseJSON = {
    message: 'Retrieved Board Data',
  };

  if (queryParams.longpoll === 'true' && rooms[queryParams.code]) {
    return rooms[queryParams.code].pendingResponses.push({ time: Date.now(), response });
  }

  if (rooms[queryParams.code]) {
    responseJSON.body = rooms[queryParams.code].gameBoard;
  }

  return respondJSON(response, 200, responseJSON);
};

const createRoom = (request, response, body) => {
  const responseJSON = {
    message: 'Room created! Waiting for Opponent',
  };

  if (!body.code) {
    responseJSON.message = 'Missing Room Code!';
    return respondJSON(response, 400, responseJSON);
  }

  if (rooms[body.code]) {
    if (rooms[body.code].userCount === 2) {
      responseJSON.message = 'Cannot join, room is full.';
      return respondJSON(response, 403, responseJSON);
    }
    // if room code exists, send back the room code and save it locally, and increment userCount
    responseJSON.code = body.code;
    responseJSON.message = 'Joined Room!';
    responseJSON.playerID = 1;
    responseJSON.playerTurn = 0;
    rooms[body.code].userCount = 2;
    rooms[body.code].gameStarted = true;
    rooms[body.code].playerTurn = 0;
    rooms[body.code].pendingResponses.forEach(element => respondJSON(element.response, 299, responseJSON));

    return respondJSON(response, 299, responseJSON);
  }

  responseJSON.code = body.code;
  responseJSON.playerID = 0;

  rooms[body.code] = { code: body.code, pendingResponses: [], gameBoard: ['', '', '', '', '', '', '', '', ''], userCount: 1, gameStarted: false, playerTurn: 0};

  return respondJSON(response, 201, responseJSON);
};

// public exports
module.exports = {
  addData,
  getData,
  createRoom,
};
