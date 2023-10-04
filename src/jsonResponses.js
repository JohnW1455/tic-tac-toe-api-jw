let gameBoard = [];
const pendingResponses = [];

const respondJSON = (request, response, status, object) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify(object));
    response.end();
    //pendingResponses.push(response);
};

// function to respond without json body
// takes request, response and status code
const respondJSONMeta = (request, response, status) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end();
};

const addData = (request, response, grid) => {
    if (grid.board != gameBoard) {
        gameBoard = grid.board.split(',');
        console.log(gameBoard);
    }

    const responseJSON = {
        message: 'Data Received.',
        body: gameBoard,
    };

    //pendingResponses.forEach(element => element.end());

    return respondJSON(request, response, 200, responseJSON);
}

// public exports
module.exports = {
    addData,
};