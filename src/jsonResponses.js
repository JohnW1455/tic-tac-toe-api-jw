let gameBoard = ["", "", "", "", "", "", "", "", ""];
let pendingResponses = [];

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
    gameBoard = grid.board.split(',');
    pendingResponses.forEach(element => respondJSON(element, 200, { body: gameBoard }));
    pendingResponses.length = 0;
    return respondJSONMeta(request, response, 204);
}

const getData = (request, response, queryParams) => {
    const responseJSON = {
        message: 'Retrieved Board Data',
    };

    if (queryParams.longpoll === 'true') {
        return pendingResponses.push(response);
    }

    responseJSON.body = gameBoard;

    return respondJSON(response, 200, responseJSON);
}

// public exports
module.exports = {
    addData,
    getData,
};