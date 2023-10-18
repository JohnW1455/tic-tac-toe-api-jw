// let gameBoard = ['', '', '', '', '', '', '', '', ''];
// let pendingResponses = [];

// server holds room data in this object
const rooms = {};
const winStates = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

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

// called when board data is received from the client
// taps into the correct room and if its that player's turn, add their data
// to the room's board and respond to all pending GET requests with the new data
const addData = (request, response, grid) => {
  const gameBoard = grid.board.split(',');
  const curTime = Date.now();
  console.log(gameBoard);
  // checks if the room with the sent code exists and
  // if its the turn of the playe who sent the data
  if (rooms[grid.code] && rooms[grid.code].playerTurn === parseInt(grid.playerID, 10)) {
    let statusCode = 200;
    winStates.forEach((state) => {
      // checks the spots on the board based on the winstates
      const one = gameBoard[state[0]];
      const two = gameBoard[state[1]];
      const three = gameBoard[state[2]];

      // if any of the spots is empty there is no winner in that win state
      if (one !== '' && two !== '' && three !== '') {
        // status code becomes 298 if someone wins
        if (one === two && two === three) {
          statusCode = 298;
        }
      }
    });
    // status code becomes 297 if nobody wins
    if (!gameBoard.includes('') && statusCode !== 298) statusCode = 297;

    // filter out the old responses from the pending responses array
    const filtered = rooms[grid.code].pendingResponses.filter((element) => element.time < curTime);
    // change the player turn to the other player using this simple calculation
    if (statusCode !== 298) {
      rooms[grid.code].playerTurn = (parseInt(grid.playerID, 10) + 1) % 2;
    }

    // respond with the new board and the new player turn
    filtered.forEach((element) => respondJSON(
      element.response,
      statusCode,
      { body: gameBoard, playerTurn: rooms[grid.code].playerTurn },
    ));

    // filter out old responses from the room's pending responses
    rooms[grid.code].pendingResponses = rooms[grid.code].pendingResponses.filter(
      (element) => element.time >= curTime,
    );

    if (statusCode === 298 || statusCode === 297) {
      delete rooms[grid.code];
    }

    // return a header with a success
    return respondJSONMeta(request, response, 204);
  }
  // return 400 if the room code doesn't correspond to any room the server is holding
  return respondJSONMeta(request, response, 400);
};

// the server side part of the long polling process
const getData = (request, response, queryParams) => {
  const responseJSON = {
    message: 'Retrieved Board Data',
  };

  // if the player is asking for a long poll (which in almost every case they will be)
  // push the request into the pending request array of the matching room based on the code
  // the Date object is to make sure not to answer any new requests that come in
  // while responding to any of the old requests
  if (queryParams.longpoll === 'true' && rooms[queryParams.code]) {
    return rooms[queryParams.code].pendingResponses.push({ time: Date.now(), response });
  }

  // if the client is not asking for a long poll,
  // add the rooms board to the response JSON
  if (rooms[queryParams.code]) {
    responseJSON.body = rooms[queryParams.code].gameBoard;
  }

  return respondJSON(response, 200, responseJSON);
};

// chunky method for creating rooms and only allowing 2 players in each
// if the client doesn't send a code it will send back a 400 error
// if the room doesn't exist yet, initialize all the appropriate data and create it
// if the room doesn't have 2 players yet, join it and send the right data back
const createRoom = (request, response, body) => {
  const responseJSON = {
    message: 'Room created! Waiting for Opponent',
  };

  // client didn't submit a code
  if (!body.code) {
    responseJSON.message = 'Missing Room Code!';
    return respondJSON(response, 400, responseJSON);
  }

  // if the room exists,
  if (rooms[body.code]) {
    // if there are already 2 players, send back a forbidden error
    if (rooms[body.code].userCount === 2) {
      responseJSON.message = 'Cannot join, room is full.';
      return respondJSON(response, 403, responseJSON);
    }
    // add the data the client needs to the responss JSON
    responseJSON.code = body.code;
    responseJSON.message = 'Joined Room!';
    responseJSON.playerID = 1;
    responseJSON.playerTurn = 0;
    // update the room's user count and set game started to true,
    // and set the player turn to 0 (player who created the room)
    rooms[body.code].userCount = 2;
    rooms[body.code].gameStarted = true;
    rooms[body.code].playerTurn = 0;
    // respond to both players that the game has started
    rooms[body.code].pendingResponses.forEach(
      (element) => respondJSON(element.response, 299, responseJSON),
    );

    return respondJSON(response, 299, responseJSON);
  }

  // fill response JSON with the appropriate data
  responseJSON.code = body.code;
  responseJSON.playerID = 0;

  // create game room by initializing pending responses,
  // game board, user count, game started bool, and player turn
  rooms[body.code] = {
    code: body.code,
    pendingResponses: [],
    gameBoard: ['', '', '', '', '', '', '', '', ''],
    userCount: 1,
    gameStarted: false,
    playerTurn: 0,
  };

  // send back 201, success fulfilled and room created
  return respondJSON(response, 201, responseJSON);
};

// public exports
module.exports = {
  addData,
  getData,
  createRoom,
};
