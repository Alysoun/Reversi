const boardElement = document.getElementById('board');
const resetButton = document.getElementById('resetButton');
const passButton = document.getElementById('passButton');
const difficultySelector = document.getElementById('difficulty');
const themeSelector = document.getElementById('theme');
const playerScoreElement = document.getElementById('playerScore');
const aiScoreElement = document.getElementById('aiScore');
const messageElement = document.getElementById('message');
const moveLogBody = document.getElementById('moveLogBody');
const colorSelector = document.getElementById('playerColor');

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
    renderBoard();
    updateScores();
    messageElement.textContent = '';
    moveLogBody.innerHTML = '';
    moveCount = 0;
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
    checkWinCondition();
    
    if (currentPlayer === aiColor) {
        setTimeout(aiMove, 500);
    }
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
    checkWinCondition();
};

const minimax = (boardState, player, depth) => {
    if (depth === 0 || isGameOver(boardState)) {
        return { score: evaluateBoard(boardState) };
    }

    const validMoves = [];
    boardState.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === null && isValidMove(rowIndex, colIndex, player)) {
                validMoves.push({ row: rowIndex, col: colIndex });
            }
        });
    });

    let bestMove;
    if (player === 'ai') {
        let bestScore = -Infinity;
        validMoves.forEach(({ row, col }) => {
            const newBoard = JSON.parse(JSON.stringify(boardState));
            makeMove(row, col, player, false, newBoard);
            const score = minimax(newBoard, 'player', depth - 1).score;
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
            makeMove(row, col, player, false, newBoard);
            const score = minimax(newBoard, 'ai', depth - 1).score;
            if (score < bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
        });
        return { move: bestMove, score: bestScore };
    }
};

const evaluateBoard = (boardState) => {
    let aiScore = 0;
    let playerScore = 0;
    boardState.forEach(row => {
        row.forEach(tile => {
            if (tile === 'ai') aiScore++;
            if (tile === 'player') playerScore++;
        });
    });
    return aiScore - playerScore;
};

const isGameOver = (boardState) => {
    const validMovesPlayer = boardState.some((row, rowIndex) =>
        row.some((tile, colIndex) => 
            tile === null && isValidMove(rowIndex, colIndex, 'player', false, boardState))
    );
    const validMovesAI = boardState.some((row, rowIndex) =>
        row.some((tile, colIndex) => 
            tile === null && isValidMove(rowIndex, colIndex, 'ai', false, boardState))
    );
    return !validMovesPlayer && !validMovesAI;
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

colorSelector.addEventListener('change', (e) => {
    playerColor = e.target.value;
    aiColor = playerColor === 'white' ? 'black' : 'white';
    initBoard();
});

document.addEventListener('DOMContentLoaded', initBoard);