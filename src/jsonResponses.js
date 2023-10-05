let gameBoard = ["", "", "", "", "", "", "", "", ""];
let pendingResponses = [];

const respondJSON = (request, response, status, object) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify(object));

    pendingResponses.push(response);
};

// function to respond without json body
// takes request, response and status code
const respondJSONMeta = (request, response, status) => {
    response.writeHead(status);
    response.end();
};

const addData = (request, response, grid) => {
    tempBoard = grid.board.split(',');
    gameBoard = tempBoard;
    
    return respondJSONMeta(request, response, 204);
}

const getData = (request, response) => {
    const responseJSON = {
        message: 'Retrieved Board Data',
    };

    for (const element of pendingResponses) {
        element.end();
    }

    responseJSON.body = gameBoard;

    return respondJSON(request, response, 200, responseJSON);
}

// public exports
module.exports = {
    addData,
    getData,
};