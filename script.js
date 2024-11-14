const boardElement = document.getElementById('board');
const resetButton = document.getElementById('resetButton');
const passButton = document.getElementById('passButton');
const difficultySelector = document.getElementById('difficulty');
const themeSelector = document.getElementById('theme');
const playerScoreElement = document.getElementById('playerScore');
const aiScoreElement = document.getElementById('aiScore');
const messageElement = document.getElementById('message');
const moveLogBody = document.getElementById('moveLogBody');
const playerColorSelector = document.getElementById('playerColor');

let board = [];
let currentPlayer = 'player';
let moveCount = 0;
let playerColor = 'white';  // 'white' or 'black'
let aiColor = 'black';      // opposite of playerColor

const directions = [
    { row: -1, col: 0 }, { row: 1, col: 0 }, // Vertical
    { row: 0, col: -1 }, { row: 0, col: 1 }, // Horizontal
    { row: -1, col: -1 }, { row: -1, col: 1 }, // Diagonal up
    { row: 1, col: -1 }, { row: 1, col: 1 }  // Diagonal down
];

const initBoard = () => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    currentPlayer = 'white';
    moveCount = 0;
    messageElement.textContent = '';
    moveLogBody.innerHTML = '';
    renderBoard();
    updateScores();
    
    if (playerColor === 'black') {
        setTimeout(() => {
            aiMove();
        }, 100);
    }
};

const renderBoard = () => {
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            const tileElement = document.createElement('div');
            tileElement.classList.add('tile');
            if (tile === 'white') tileElement.classList.add('white');
            if (tile === 'black') tileElement.classList.add('black');
            
            if (currentPlayer === playerColor) {
                tileElement.addEventListener('click', () => handleTileClick(rowIndex, colIndex));
            }
            
            if (currentPlayer === playerColor && 
                tile === null && 
                isValidMove(rowIndex, colIndex, playerColor)) {
                tileElement.classList.add('valid-move');
            }
            
            boardElement.appendChild(tileElement);
        });
    });
};

const handleTileClick = (row, col) => {
    if (currentPlayer !== playerColor) return;
    
    if (board[row][col] !== null || !isValidMove(row, col, playerColor)) {
        messageElement.textContent = 'Invalid move. Please select a valid tile.';
        return;
    }
    
    const flippedTiles = makeMove(row, col, playerColor);
    logMove(row, col, flippedTiles.length);
    currentPlayer = aiColor;
    messageElement.textContent = '';
    renderBoard();
    updateScores();
    
    setTimeout(() => {
        checkWinCondition();
        if (currentPlayer === aiColor) {
            aiMove();
        }
    }, 500);
};

const isValidMove = (row, col, player, testMode = false, testBoard = board) => {
    for (const { row: dRow, col: dCol } of directions) {
        let r = row + dRow;
        let c = col + dCol;
        let hasOpponentTile = false;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (testBoard[r][c] === null) break;
            if (testBoard[r][c] !== player) {
                hasOpponentTile = true;
            } else if (hasOpponentTile) {
                return true;
            } else {
                break;
            }
            r += dRow;
            c += dCol;
        }
    }
    return false;
};

const makeMove = (row, col, player, testMode = false, testBoard = board) => {
    testBoard[row][col] = player;
    let flippedTiles = [];
    
    for (const { row: dRow, col: dCol } of directions) {
        let r = row + dRow;
        let c = col + dCol;
        let tilesToFlip = [];
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (testBoard[r][c] === null) break;
            if (testBoard[r][c] !== player) {
                tilesToFlip.push({ row: r, col: c });
            } else {
                if (!testMode) {
                    tilesToFlip.forEach(({ row, col }) => {
                        testBoard[row][col] = player;
                        flippedTiles.push({ row, col });
                    });
                }
                break;
            }
            r += dRow;
            c += dCol;
        }
    }

    if (!testMode) {
        const tiles = document.querySelectorAll('.tile');
        flippedTiles.forEach(({ row, col }) => {
            const index = row * 8 + col;
            const tile = tiles[index];
            tile.classList.add('flipping');
            setTimeout(() => {
                tile.classList.remove('flipping');
            }, 800);
        });
        const placedTile = tiles[row * 8 + col];
        placedTile.classList.add('flipping');
        setTimeout(() => {
            placedTile.classList.remove('flipping');
        }, 800);
    }

    return flippedTiles;
};

const aiMove = () => {
    if (currentPlayer !== aiColor) return;
    
    const validMoves = [];
    board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === null && isValidMove(rowIndex, colIndex, aiColor)) {
                validMoves.push({ row: rowIndex, col: colIndex });
            }
        });
    });
    
    if (validMoves.length === 0) {
        messageElement.textContent = 'AI has no valid moves. AI passes turn.';
        currentPlayer = playerColor;
        renderBoard();
        checkWinCondition();
        return;
    }

    const difficulty = difficultySelector.value;
    let selectedMove;

    if (difficulty === 'easy') {
        selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else if (difficulty === 'medium') {
        let maxFlips = 0;
        validMoves.forEach(({ row, col }) => {
            const flips = makeMove(row, col, aiColor, true).length;
            if (flips > maxFlips) {
                maxFlips = flips;
                selectedMove = { row, col };
            }
        });
    } else if (difficulty === 'hard') {
        selectedMove = minimax(board, aiColor, 3).move;
    }

    const { row, col } = selectedMove;
    const flippedTiles = makeMove(row, col, aiColor);
    logMove(row, col, flippedTiles.length);
    currentPlayer = playerColor;
    renderBoard();
    updateScores();
    
    setTimeout(() => {
        checkWinCondition();
    }, 500);
};

const minimax = (boardState, player, depth) => {
    if (depth === 0 || isGameOver(boardState)) {
        return { score: evaluateBoard(boardState, aiColor) };
    }

    const validMoves = [];
    boardState.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === null && isValidMove(rowIndex, colIndex, player, true, boardState)) {
                validMoves.push({ row: rowIndex, col: colIndex });
            }
        });
    });

    if (validMoves.length === 0) {
        return { score: evaluateBoard(boardState, aiColor) };
    }

    let bestMove;
    if (player === aiColor) {
        let bestScore = -Infinity;
        validMoves.forEach(({ row, col }) => {
            const newBoard = JSON.parse(JSON.stringify(boardState));
            makeMove(row, col, player, true, newBoard);
            const score = minimax(newBoard, playerColor, depth - 1).score;
            if (score > bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
        });
        return { move: bestMove, score: bestScore };
    } else {
        let bestScore = Infinity;
        validMoves.forEach(({ row, col }) => {
            const newBoard = JSON.parse(JSON.stringify(boardState));
            makeMove(row, col, player, true, newBoard);
            const score = minimax(newBoard, aiColor, depth - 1).score;
            if (score < bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
        });
        return { move: bestMove, score: bestScore };
    }
};

const evaluateBoard = (boardState, maximizingColor) => {
    let score = 0;
    boardState.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === maximizingColor) score++;
            if (tile === (maximizingColor === 'white' ? 'black' : 'white')) score--;
        });
    });
    return score;
};

const isGameOver = (boardState) => {
    const hasPlayerMoves = hasValidMoves(boardState, playerColor);
    const hasAIMoves = hasValidMoves(boardState, aiColor);
    
    return !hasPlayerMoves && !hasAIMoves;
};

const hasValidMoves = (boardState, color) => {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] === null && isValidMove(row, col, color, true, boardState)) {
                return true;
            }
        }
    }
    return false;
};

const passTurn = () => {
    const currentColorToCheck = currentPlayer === playerColor ? playerColor : aiColor;
    const validMoves = board.some((row, rowIndex) =>
        row.some((tile, colIndex) => 
            tile === null && isValidMove(rowIndex, colIndex, currentColorToCheck))
    );
    
    if (!validMoves) {
        messageElement.textContent = `No valid moves. ${currentPlayer === playerColor ? 'Player' : 'AI'} passes turn.`;
        currentPlayer = currentPlayer === playerColor ? aiColor : playerColor;
        checkWinCondition();
        if (currentPlayer === aiColor) {
            setTimeout(aiMove, 500);
        }
    } else {
        messageElement.textContent = 'You still have valid moves. You cannot pass.';
    }
};

const logMove = (row, col, flips) => {
    moveCount++;
    const player = currentPlayer === 'player' ? 'Player' : 'AI';
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${moveCount}</td>
        <td>${player}</td>
        <td>(${row + 1}, ${col + 1})</td>
        <td>${flips}</td>
    `;
    moveLogBody.insertBefore(newRow, moveLogBody.firstChild);
};

const updateScores = () => {
    let whiteScore = 0;
    let blackScore = 0;
    board.forEach(row => {
        row.forEach(tile => {
            if (tile === 'white') whiteScore++;
            if (tile === 'black') blackScore++;
        });
    });
    if (playerColor === 'white') {
        playerScoreElement.textContent = whiteScore;
        aiScoreElement.textContent = blackScore;
    } else {
        playerScoreElement.textContent = blackScore;
        aiScoreElement.textContent = whiteScore;
    }
};

const checkWinCondition = () => {
    if (isGameOver(board)) {
        const playerScore = parseInt(playerScoreElement.textContent);
        const aiScore = parseInt(aiScoreElement.textContent);
        if (playerScore > aiScore) {
            messageElement.textContent = 'Game over. You win!';
        } else if (aiScore > playerScore) {
            messageElement.textContent = 'Game over. AI wins!';
        } else {
            messageElement.textContent = 'Game over. A tie!';
        }
        setTimeout(() => {
            if (confirm('Game over. Would you like to play again?')) {
                initBoard();
            }
        }, 1000);
    } else if (!hasValidMoves(board, currentPlayer)) {
        messageElement.textContent = `No valid moves for ${currentPlayer === playerColor ? 'Player' : 'AI'}. Turn passed.`;
        currentPlayer = currentPlayer === playerColor ? aiColor : playerColor;
        setTimeout(() => {
            messageElement.textContent = '';
            if (currentPlayer === aiColor) {
                aiMove();
            }
        }, 1500);
    }
};

resetButton.addEventListener('click', initBoard);
passButton.addEventListener('click', passTurn);

themeSelector.addEventListener('change', (e) => {
    document.body.className = '';
    if (e.target.value === 'neon') {
        document.body.classList.add('neon-theme');
    } else if (e.target.value === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

playerColorSelector.addEventListener('change', () => {
    playerColor = playerColorSelector.value;
    aiColor = playerColor === 'white' ? 'black' : 'white';
    initBoard();
});

document.addEventListener('DOMContentLoaded', initBoard);