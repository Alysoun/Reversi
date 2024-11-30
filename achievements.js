// Achievement definitions
const ACHIEVEMENTS = {
    firstWin: {
        id: 'firstWin',
        name: 'First Victory',
        description: 'Win your first game against the AI',
        icon: '🏆',
        secret: false,
        unlocked: false,
        reward: 'Unlocks the Dark theme'
    },
    perfectGame: {
        id: 'perfectGame',
        name: 'Perfect Game',
        description: 'Win a game with more than 75% of the board',
        icon: '⭐',
        secret: false,
        unlocked: false,
        reward: 'Unlocks the Ocean theme'
    },
    cornerMaster: {
        id: 'cornerMaster',
        name: 'Corner Master',
        description: 'Capture all four corners in a single game',
        icon: '📐',
        secret: false,
        unlocked: false,
        reward: 'Shows corner values when helper is enabled'
    },
    speedRunner: {
        id: 'speedRunner',
        name: 'Speed Runner',
        description: 'Win a game in under 1 minute',
        icon: '⚡',
        secret: true,
        unlocked: false,
        reward: 'Unlocks fast AI move animations'
    },
    grandMaster: {
        id: 'grandMaster',
        name: 'Grand Master',
        description: 'Win 10 games on Expert difficulty',
        icon: '👑',
        secret: false,
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        reward: 'Unlocks the Matrix theme'
    },
    strategist: {
        id: 'strategist',
        name: 'The Strategist',
        description: 'Win a game without losing any corners',
        icon: '🎯',
        secret: false,
        unlocked: false,
        reward: 'Shows potential AI moves'
    },
    comeback: {
        id: 'comeback',
        name: 'Epic Comeback',
        description: 'Win after being behind by 15 or more pieces',
        icon: '🔄',
        secret: false,
        unlocked: false,
        reward: 'Unlocks score prediction helper'
    },
    fullHouse: {
        id: 'fullHouse',
        name: 'Full House',
        description: 'Fill the entire board',
        icon: '🌑',
        secret: false,
        unlocked: false,
        reward: 'Unlocks the Golden theme'
    },
    winStreak3: {
        id: 'winStreak3',
        name: 'Hat Trick',
        description: 'Win 3 games in a row',
        icon: '🎩',
        secret: false,
        unlocked: false,
        reward: 'Unlocks move suggestions'
    },
    winStreak5: {
        id: 'winStreak5',
        name: 'Unstoppable',
        description: 'Win 5 games in a row',
        icon: '🔥',
        secret: false,
        unlocked: false,
        reward: 'Unlocks the Neon theme'
    },
    quickFlip: {
        id: 'quickFlip',
        name: 'Quick Flip',
        description: 'Flip 10 or more pieces in a single move',
        icon: '💫',
        secret: true,
        unlocked: false,
        reward: 'Unlocks special flip animations'
    },
    dominance: {
        id: 'dominance',
        name: 'Total Dominance',
        description: 'Win with your opponent having less than 5 pieces',
        icon: '💪',
        secret: true,
        unlocked: false,
        reward: 'Unlocks victory animations'
    }
};

// Define unlockable features
const UNLOCKABLE_FEATURES = {
    showCornerValues: false,
    fastAnimations: false,
    showAIMoves: false,
    scorePrediction: false,
    moveSuggestions: false,
    specialAnimations: false,
    victoryAnimations: false
};

// Define unlockable themes
const UNLOCKABLE_THEMES = {
    dark: {
        name: 'Dark',
        requiredAchievement: 'firstWin'
    },
    neon: {
        name: 'Neon',
        requiredAchievement: 'winStreak5'
    },
    matrix: {
        name: 'Matrix',
        requiredAchievement: 'grandMaster'
    },
    ocean: {
        name: 'Ocean',
        requiredAchievement: 'perfectGame'
    },
    golden: {
        name: 'Golden',
        requiredAchievement: 'fullHouse'
    }
};

class AchievementManager {
    constructor() {
        this.achievements = this.loadAchievements();
        this.features = this.loadFeatures();
        this.updateAvailableThemes();
        this.gameStartTime = null;
        this.winStreak = this.loadWinStreak();
        this.expertWins = this.loadExpertWins();
        this.maxScoreDifference = 0;
        this.trackCorners = { count: 0, corners: new Set() };
    }

    updateAvailableThemes() {
        const themeSelect = document.getElementById('theme');
        if (!themeSelect) return;
        
        // Hide all unlockable themes first
        Array.from(themeSelect.options).forEach(option => {
            const theme = option.value;
            if (UNLOCKABLE_THEMES[theme]) {
                const requiredAchievement = UNLOCKABLE_THEMES[theme].requiredAchievement;
                option.style.display = this.achievements[requiredAchievement]?.unlocked ? '' : 'none';
            }
        });
    }

    loadExpertWins() {
        return parseInt(localStorage.getItem('reversiExpertWins')) || 0;
    }

    loadFeatures() {
        const saved = localStorage.getItem('reversiFeatures');
        return saved ? JSON.parse(saved) : { ...UNLOCKABLE_FEATURES };
    }

    saveFeatures() {
        localStorage.setItem('reversiFeatures', JSON.stringify(this.features));
    }

    unlockFeature(feature) {
        this.features[feature] = true;
        this.saveFeatures();
    }

    unlockAchievement(id) {
        if (!this.achievements[id].unlocked) {
            this.achievements[id].unlocked = true;
            this.saveAchievements();
            this.showAchievementNotification(this.achievements[id]);
            
            // Handle rewards
            if (this.achievements[id].reward) {
                this.handleReward(id);
            }
        }
    }

    handleReward(achievementId) {
        const achievement = this.achievements[achievementId];
        
        // Update features based on achievement
        switch (achievementId) {
            case 'cornerMaster':
                this.unlockFeature('showCornerValues');
                break;
            case 'speedRunner':
                this.unlockFeature('fastAnimations');
                break;
            case 'strategist':
                this.unlockFeature('showAIMoves');
                break;
            case 'comeback':
                this.unlockFeature('scorePrediction');
                break;
            case 'winStreak3':
                this.unlockFeature('moveSuggestions');
                break;
            case 'quickFlip':
                this.unlockFeature('specialAnimations');
                break;
            case 'dominance':
                this.unlockFeature('victoryAnimations');
                break;
        }

        // Update available themes whenever an achievement is unlocked
        this.updateAvailableThemes();

        // Show reward notification
        this.showRewardNotification(achievement.reward);
    }

    showRewardNotification(reward) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-icon"></div>
            <div class="reward-text">
                <div class="reward-title">New Feature Unlocked!</div>
                <div class="reward-description">${reward}</div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }, 1000); // Show after achievement notification
    }

    checkGameEndAchievements(playerScore, aiScore, difficulty) {
        const totalTiles = playerScore + aiScore;
        const playerPercentage = (playerScore / 64) * 100;

        if (playerScore > aiScore) {
            this.winStreak++;
            this.unlockAchievement('firstWin');
            
            if (playerPercentage > 75) {
                this.unlockAchievement('perfectGame');
            }
            
            if (difficulty === 'expert') {
                this.expertWins++;
                localStorage.setItem('reversiExpertWins', this.expertWins);
                if (this.expertWins >= 10) {
                    this.unlockAchievement('grandMaster');
                }
            }

            if (this.winStreak >= 3) {
                this.unlockAchievement('winStreak3');
            }
            if (this.winStreak >= 5) {
                this.unlockAchievement('winStreak5');
            }

            if (aiScore <= 4) {
                this.unlockAchievement('dominance');
            }

            const gameTime = (Date.now() - this.gameStartTime) / 1000;
            if (gameTime < 60) {
                this.unlockAchievement('speedRunner');
            }

            if (this.maxScoreDifference >= 15) {
                this.unlockAchievement('comeback');
            }

            if (this.trackCorners.corners.size === 0) {
                this.unlockAchievement('strategist');
            }
        }

        if (totalTiles === 64) {
            this.unlockAchievement('fullHouse');
        }

        this.maxScoreDifference = 0;
        this.trackCorners = { count: 0, corners: new Set() };
        this.saveAchievements();
    }

    loadAchievements() {
        const saved = localStorage.getItem('reversiAchievements');
        if (saved) {
            const parsed = JSON.parse(saved);
            return Object.fromEntries(
                Object.entries(ACHIEVEMENTS).map(([key, achievement]) => [
                    key,
                    { ...achievement, unlocked: parsed[key]?.unlocked || false }
                ])
            );
        }
        return { ...ACHIEVEMENTS };
    }

    loadWinStreak() {
        return parseInt(localStorage.getItem('reversiWinStreak')) || 0;
    }

    saveAchievements() {
        localStorage.setItem('reversiAchievements', JSON.stringify(this.achievements));
        localStorage.setItem('reversiWinStreak', this.winStreak.toString());
    }

    startGame() {
        this.gameStartTime = Date.now();
        this.trackCorners = { count: 0, corners: new Set() };
        this.maxScoreDifference = 0;
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }, 100);
    }

    renderAchievementsList() {
        const achievementsList = document.getElementById('achievementsList');
        achievementsList.innerHTML = '';
        
        Object.values(this.achievements).forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item${achievement.unlocked ? ' unlocked' : ' locked'}${achievement.secret ? ' secret' : ''}`;
            
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">
                        ${achievement.secret && !achievement.unlocked ? '???' : achievement.name}
                        ${achievement.progress !== undefined ? 
                            `<div class="achievement-progress">
                                <div class="progress-bar" style="width: ${(achievement.progress / achievement.maxProgress) * 100}%"></div>
                                <span>${achievement.progress}/${achievement.maxProgress}</span>
                            </div>` : ''
                        }
                    </div>
                    <div class="achievement-description">
                        ${achievement.secret && !achievement.unlocked ? 'Secret achievement' : achievement.description}
                    </div>
                    ${achievement.unlocked ? `
                        <div class="achievement-reward">
                            <span class="reward-icon">🎁</span>
                            <span class="reward-text">Reward: ${achievement.reward}</span>
                        </div>
                    ` : ''}
                </div>
                ${!achievement.unlocked && !achievement.secret ? `
                    <div class="achievement-tooltip">
                        <span class="tooltip-icon">🎁</span>
                        Reward: ${achievement.reward}
                    </div>
                ` : ''}
            `;
            
            achievementsList.appendChild(achievementElement);
        });
    }

    resetAchievements() {
        if (confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
            this.achievements = { ...ACHIEVEMENTS };
            this.winStreak = 0;
            this.saveAchievements();
            this.renderAchievementsList();
        }
    }

    updateScoreDifference(playerScore, aiScore) {
        const difference = aiScore - playerScore;
        if (difference > this.maxScoreDifference) {
            this.maxScoreDifference = difference;
        }
    }

    trackCornerCapture(row, col, isAI) {
        if (isCorner(row, col) && isAI) {
            this.trackCorners.corners.add(`${row},${col}`);
        }
    }

    checkQuickFlip(flippedCount) {
        if (flippedCount >= 10) {
            this.unlockAchievement('quickFlip');
        }
    }
}

// Helper function to check if a position is a corner
function isCorner(row, col) {
    return (row === 0 || row === 7) && (col === 0 || col === 7);
}

// Create global instance
window.achievementManager = new AchievementManager();