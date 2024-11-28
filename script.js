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

const DIFFICULTY_SETTINGS = {
    novice: { depth: 1, weight: 0.4 },
    easy: { depth: 2, weight: 0.6 },
    medium: { depth: 3, weight: 0.8 },
    hard: { depth: 4, weight: 1.0 },
    expert: { depth: 5, weight: 1.2 }
};

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
    
    checkAndIndicatePass();
};

const handleTileClick = (row, col) => {
    if (currentPlayer !== playerColor) return;
    
    if (board[row][col] !== null || !isValidMove(row, col, playerColor)) {
        messageElement.textContent = 'Invalid move. Please select a valid tile.';
        return;
    }
    
    const result = makeMove(row, col, playerColor);
    logMove(row, col, result.flippedTiles.length, result.positions);
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

    return { flippedTiles, positions: flippedTiles };
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

    const selectedMove = minimax(board, aiColor, aiDepth).move;
    const { row, col } = selectedMove;
    const result = makeMove(row, col, aiColor);
    logMove(row, col, result.flippedTiles.length, result.positions);
    currentPlayer = playerColor;
    renderBoard();
    updateScores();
    
    setTimeout(() => {
        checkWinCondition();
    }, 500);
};

const minimax = (boardState, player, depth, alpha = -Infinity, beta = Infinity) => {
    if (depth === 0 || isGameOver(boardState)) {
        return { score: evaluateBoardAdvanced(boardState, aiColor) };
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
        return { score: evaluateBoardAdvanced(boardState, aiColor) };
    }

    let bestMove;
    if (player === aiColor) {
        let bestScore = -Infinity;
        for (let i = 0; i < validMoves.length; i++) {
            const { row, col } = validMoves[i];
            const newBoard = JSON.parse(JSON.stringify(boardState));
            makeMove(row, col, player, true, newBoard);
            const score = minimax(newBoard, playerColor, depth - 1, alpha, beta).score;
            if (score > bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
            alpha = Math.max(alpha, score);
            if (alpha >= beta) break;
        }
        return { move: bestMove, score: bestScore };
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < validMoves.length; i++) {
            const { row, col } = validMoves[i];
            const newBoard = JSON.parse(JSON.stringify(boardState));
            makeMove(row, col, player, true, newBoard);
            const score = minimax(newBoard, aiColor, depth - 1, alpha, beta).score;
            if (score < bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
            beta = Math.min(beta, score);
            if (alpha >= beta) break;
        }
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
        currentPlayer = currentPlayer === playerColor ? aiColor : playerColor;
        messageElement.textContent = '';
        
        if (currentPlayer === aiColor) {
            setTimeout(aiMove, 500);
        }
        
        checkAndIndicatePass();
    } else {
        messageElement.textContent = 'You still have valid moves. You cannot pass.';
        setTimeout(() => {
            messageElement.textContent = '';
        }, 2000);
    }
};

function positionToNotation(row, col) {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rows = ['8', '7', '6', '5', '4', '3', '2', '1']; // Reversed to match chess notation
    return `${columns[col]}${rows[row]}`;
}

function highlightMove(row, col, flippedTiles) {
    const tiles = document.querySelectorAll('.tile');
    
    // Highlight played move
    const playedIndex = row * 8 + col;
    const playedTile = tiles[playedIndex];
    if (playedTile) {
        playedTile.classList.add('highlight-played-move');
    }
    
    // Highlight flipped tiles
    flippedTiles.forEach(({row: fRow, col: fCol}) => {
        const flippedIndex = fRow * 8 + fCol;
        const flippedTile = tiles[flippedIndex];
        if (flippedTile) {
            flippedTile.classList.add('highlight-flipped');
        }
    });
}

function removeHighlight() {
    document.querySelectorAll('.highlight-played-move, .highlight-flipped')
        .forEach(tile => {
            tile.classList.remove('highlight-played-move', 'highlight-flipped');
        });
}

function logMove(row, col, flippedCount, flippedTiles = []) {
    const moveNumber = moveLogBody.children.length + 1;
    const position = positionToNotation(row, col);
    const tr = document.createElement('tr');
    tr.dataset.row = row;
    tr.dataset.col = col;
    tr.dataset.flippedTiles = JSON.stringify(flippedTiles);
    
    tr.innerHTML = `
        <td>${moveNumber}</td>
        <td>${currentPlayer === playerColor ? 'Player' : 'AI'}</td>
        <td>${position}</td>
        <td>${flippedCount}</td>
    `;

    tr.addEventListener('mouseenter', () => highlightMove(row, col, flippedTiles));
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
    // Remove any existing modals first
    const existingModals = document.querySelectorAll('.modal-overlay');
    existingModals.forEach(modal => modal.remove());
    
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
    
    // Handle button clicks with proper cleanup
    const playAgainBtn = document.getElementById('playAgainBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    const closeModal = () => {
        modalOverlay.classList.remove('show');
        modal.classList.remove('show');
        setTimeout(() => {
            modalOverlay.remove();
        }, 300);
    };
    
    playAgainBtn.addEventListener('click', () => {
        closeModal();
        initBoard();
    });
    
    closeModalBtn.addEventListener('click', () => {
        closeModal();
    });
    
    // Optional: Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
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

function evaluateBoardAdvanced(boardState, maximizingColor) {
    let score = 0;
    const minimizingColor = maximizingColor === 'white' ? 'black' : 'white';

    // Corner weights
    const corners = [
        [0, 0], [0, 7], [7, 0], [7, 7]
    ];
    
    // Edge positions (excluding corners)
    const edges = [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [7, 2], [7, 3], [7, 4], [7, 5],
        [2, 0], [3, 0], [4, 0], [5, 0],
        [2, 7], [3, 7], [4, 7], [5, 7]
    ];

    // Positions near corners
    const nearCorners = [
        [0, 1], [1, 0], [1, 1],  // near top-left
        [0, 6], [1, 6], [1, 7],  // near top-right
        [6, 0], [6, 1], [7, 1],  // near bottom-left
        [6, 6], [6, 7], [7, 6]   // near bottom-right
    ];

    // Evaluate corners
    corners.forEach(([row, col]) => {
        if (boardState[row][col] === maximizingColor) score += CORNER_WEIGHT;
        else if (boardState[row][col] === minimizingColor) score -= CORNER_WEIGHT;
    });

    // Evaluate edges
    edges.forEach(([row, col]) => {
        if (boardState[row][col] === maximizingColor) score += EDGE_WEIGHT;
        else if (boardState[row][col] === minimizingColor) score -= EDGE_WEIGHT;
    });

    // Evaluate near-corner positions (penalty for occupying these)
    nearCorners.forEach(([row, col]) => {
        if (boardState[row][col] === maximizingColor) score += NEAR_CORNER_PENALTY;
        else if (boardState[row][col] === minimizingColor) score -= NEAR_CORNER_PENALTY;
    });

    // Count pieces with diminishing importance
    boardState.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            if (tile === maximizingColor) score += 1;
            else if (tile === minimizingColor) score -= 1;
        });
    });

    return score * aiWeight;
}

let aiDepth = DIFFICULTY_SETTINGS.medium.depth;
let aiWeight = DIFFICULTY_SETTINGS.medium.weight;
const CORNER_WEIGHT = 25;
const EDGE_WEIGHT = 5;
const NEAR_CORNER_PENALTY = -8;

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const difficultySelector = document.getElementById('difficulty');

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the difficulty name from the button text
            const difficulty = button.textContent.trim().toLowerCase();
            
            // Set the AI settings
            const settings = DIFFICULTY_SETTINGS[difficulty];
            aiDepth = settings.depth;
            aiWeight = settings.weight;
            
            // Update the dropdown selection
            difficultySelector.value = difficulty;
            
            // Hide splash screen and start game
            splashScreen.style.display = 'none';
            initBoard();
        });
    });
});

difficultySelector.addEventListener('change', (e) => {
    const difficulty = e.target.value;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    aiDepth = settings.depth;
    aiWeight = settings.weight;
    
    // Optional: restart the game when difficulty changes
    if (confirm('Change difficulty? This will restart the game.')) {
        initBoard();
    } else {
        // Revert the selector to previous value if user cancels
        difficultySelector.value = Object.entries(DIFFICULTY_SETTINGS)
            .find(([_, settings]) => settings.depth === aiDepth)
            ?.[0] || 'medium';
    }
});

function checkAndIndicatePass() {
    const currentColorToCheck = currentPlayer === playerColor ? playerColor : aiColor;
    const hasValidMoves = board.some((row, rowIndex) =>
        row.some((tile, colIndex) => 
            tile === null && isValidMove(rowIndex, colIndex, currentColorToCheck))
    );

    const passButton = document.getElementById('passButton');
    
    if (!hasValidMoves && currentPlayer === playerColor) {
        // Add visual indication that player must pass
        passButton.classList.add('must-pass');
        passButton.textContent = 'MUST PASS';
        passButton.title = 'No valid moves available - you must pass';
    } else {
        passButton.classList.remove('must-pass');
        passButton.textContent = 'PASS TURN';
        passButton.title = '';
    }
}

// Add this function to handle theme-specific color labels
function updateColorLabels(theme) {
    const playerColorSelect = document.getElementById('playerColor');
    const options = playerColorSelect.options;
    
    switch(theme) {
        case 'neon':
            options[0].text = 'Pink (First)';
            options[1].text = 'Cyan (Second)';
            break;
        case 'dark':
            options[0].text = 'Purple (First)';
            options[1].text = 'Blue (Second)';
            break;
        case 'matrix':
            options[0].text = 'Green (First)';
            options[1].text = 'Dark Green (Second)';
            break;
        case 'ocean':
            options[0].text = 'Light Blue (First)';
            options[1].text = 'Deep Blue (Second)';
            break;
        case 'soft':
            options[0].text = 'Light (First)';
            options[1].text = 'Dark (Second)';
            break;
        default: // Classic theme
            options[0].text = 'White (First)';
            options[1].text = 'Black (Second)';
    }
}

// Modify the existing theme switch handler
themeSelector.addEventListener('change', (e) => {
    const newTheme = e.target.value;
    switchTheme(newTheme);
    updateColorLabels(newTheme);
});

// Also update on initial load
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = themeSelector.value;
    updateColorLabels(currentTheme);
});