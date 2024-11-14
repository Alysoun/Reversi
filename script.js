const boardElement = document.getElementById('board');
const resetButton = document.getElementById('resetButton');
const passButton = document.getElementById('passButton');
const difficultySelector = document.getElementById('difficulty');
const themeSelector = document.getElementById('theme');
const playerScoreElement = document.getElementById('playerScore');
const aiScoreElement = document.getElementById('aiScore');
const messageElement = document.getElementById('message');
const moveLogBody = document.getElementById('moveLogBody');
const moveLogContainer = document.getElementById('moveLogContainer');
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
        
        setTimeout(() => {
            messageElement.textContent = '';
            if (!hasValidMoves(board, playerColor)) {
                checkWinCondition();
            }
        }, 2000);
        
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

function positionToNotation(row, col) {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rows = ['8', '7', '6', '5', '4', '3', '2', '1']; // Reversed to match chess notation
    return `${columns[col]}${rows[row]}`;
}

function highlightMove(row, col) {
    const tiles = document.querySelectorAll('.tile');
    const index = row * 8 + col;
    const tile = tiles[index];
    if (tile) {
        tile.classList.add('highlight-move');
    }
}

function removeHighlight() {
    document.querySelectorAll('.highlight-move').forEach(tile => {
        tile.classList.remove('highlight-move');
    });
}

function logMove(row, col, flippedCount) {
    const moveNumber = moveLogBody.children.length + 1;
    const position = positionToNotation(row, col);
    const tr = document.createElement('tr');
    tr.dataset.row = row;
    tr.dataset.col = col;
    
    tr.innerHTML = `
        <td>${moveNumber}</td>
        <td>${currentPlayer === playerColor ? 'Player' : 'AI'}</td>
        <td>${position}</td>
        <td>${flippedCount}</td>
    `;

    tr.addEventListener('mouseenter', () => highlightMove(row, col));
    tr.addEventListener('mouseleave', () => removeHighlight());
    
    moveLogBody.appendChild(tr);
    moveLogContainer.scrollTop = moveLogContainer.scrollHeight;
}

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

function showGameOverModal(message) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <h2 class="modal-title">Game Over!</h2>
        <p class="modal-message">${message}</p>
        <div class="modal-buttons">
            <button class="modal-button primary" id="playAgainBtn">Play Again</button>
            <button class="modal-button secondary" id="closeModalBtn">Close</button>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Add animation classes after a brief delay
    requestAnimationFrame(() => {
        modalOverlay.classList.add('show');
        modal.classList.add('show');
    });
    
    // Handle button clicks
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        modalOverlay.remove();
        initBoard();
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modalOverlay.remove();
    });
}

const checkWinCondition = () => {
    const hasPlayerMoves = hasValidMoves(board, playerColor);
    const hasAIMoves = hasValidMoves(board, aiColor);
    
    if (!hasPlayerMoves && !hasAIMoves) {
        const playerScore = parseInt(playerScoreElement.textContent);
        const aiScore = parseInt(aiScoreElement.textContent);
        
        let message;
        if (playerScore > aiScore) {
            message = `Congratulations! You win!\nFinal Score - Player: ${playerScore}, AI: ${aiScore}`;
        } else if (aiScore > playerScore) {
            message = `Game over. AI wins!\nFinal Score - Player: ${playerScore}, AI: ${aiScore}`;
        } else {
            message = `It's a tie!\nFinal Score - Player: ${playerScore}, AI: ${aiScore}`;
        }
        showGameOverModal(message);
    }
};

resetButton.addEventListener('click', initBoard);
passButton.addEventListener('click', passTurn);

// Theme initialization and event handling
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for theme changes
    const themeSelector = document.getElementById('theme');
    
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            switchTheme(e.target.value);
        });
        
        // Load saved theme on page load
        const savedTheme = localStorage.getItem('reversiTheme') || 'classic';
        themeSelector.value = savedTheme;
        switchTheme(savedTheme);
    }
});

// Theme switching function
function switchTheme(theme) {
    const body = document.body;
    // Remove all existing theme classes
    body.classList.remove(
        'classic-theme',
        'dark-theme',
        'neon-theme',
        'matrix-theme',
        'cyberpunk-theme',
        'ocean-theme'
    );
    
    // Add the new theme class
    body.classList.add(`${theme}-theme`);
    
    // Save theme preference
    localStorage.setItem('reversiTheme', theme);
}

playerColorSelector.addEventListener('change', () => {
    playerColor = playerColorSelector.value;
    aiColor = playerColor === 'white' ? 'black' : 'white';
    initBoard();
});

document.addEventListener('DOMContentLoaded', initBoard);

function createBoardCoordinates() {
    const boardContainer = document.querySelector('.board-container');
    const tileSize = 45; // Match your tile size
    const padding = 30; // Match container padding
    
    // Create column labels (A-H)
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'coordinate-label coordinate-column';
        label.textContent = String.fromCharCode(65 + i); // A, B, C, etc.
        // Align directly under each column
        label.style.left = `${padding + (i * tileSize) + (tileSize / 2)}px`;
        label.style.bottom = '2px'; // Move closer to board
        boardContainer.appendChild(label);
    }
    
    // Create row labels (1-8)
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'coordinate-label coordinate-row';
        label.textContent = 8 - i; // 8, 7, 6, etc.
        // Align directly beside each row
        label.style.top = `${padding + (i * tileSize) + (tileSize / 2)}px`;
        label.style.right = '2px'; // Move closer to board
        boardContainer.appendChild(label);
    }
}

// Call createBoardCoordinates after the board is initialized
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    createBoardCoordinates();
});