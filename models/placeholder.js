class World {
    soundEnabled = true; 

    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar('health');
    coinBar = new StatusBar('coin');
    bottleBar = new StatusBar('bottle');
    throwableObjects = []; 
    droppedCoins = [];

    sounds = {
        'throw': new Audio('audio/SHOOT011.mp3'),
        'collect-bottle': new Audio('audio/collect-bottle.wav'),
        'collect-life': new Audio('audio/collect-life.ogg'),
        'explode': new Audio('audio/8bit_bomb_explosion.wav'),
        'win': new Audio('audio/Won!.wav'),
        'bottle-hit': new Audio('audio/1.mp3'),
        'coin-lost': new Audio(''),
        
        
    };
    gameOverImage = new Image();
    gameOverImageShown = false;
    gameOver = false;
    fullscreenButton = new Button(500, 10, 100, 50, 'Fullscreen');
    restartButton = new Button(620, 10, 100, 50, 'Restart');
    soundButton = new Button(740, 10, 50, 50, '');
    soundIcon = new Image();

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.setWorld();
        this.checkCollision();
        this.checkThrowBottle(); 
        this.bottleBar.setPercentage(this.character.bottleCount * 20); 

        this.soundIcon.src = this.soundEnabled ? 'img/assets/Mic-On.svg' : 'img/assets/Mic-Off.svg';

        let self = this;
        canvas.addEventListener('mousemove', (e) => {
            let rect = canvas.getBoundingClientRect();
            self.mouseX = e.clientX - rect.left;
            self.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('click', (e) => {
            let rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
        
            if (self.fullscreenButton.isClicked(x, y)) {
                if (canvas.requestFullscreen) {
                    canvas.requestFullscreen();
                } else if (canvas.webkitRequestFullscreen) {
                    canvas.webkitRequestFullscreen();
                } else if (canvas.msRequestFullscreen) {
                    canvas.msRequestFullscreen();
                }
            } else if (self.restartButton.isClicked(x, y)) {
                restartGame();
            } else if (self.soundButton.isClicked(x, y)) {
                self.soundEnabled = !self.soundEnabled;
                self.soundIcon.src = self.soundEnabled ? 'img/assets/Mic-On.svg' : 'img/assets/Mic-Off.svg';
                soundEnabled = self.soundEnabled;
                console.log('Sound enabled:', soundEnabled);
            }
        });    

        this.draw();
    }
    
    
    
    

    setWorld() {
        this.character.world = this;
    }

    checkCollision() {
        setInterval(() => {
            if (this.gameOver) return; 
            this.level.enemies.forEach((enemy) => {
                if (!enemy.isDead && this.character.isColliding(enemy)) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy);
                    if (this.character.energy <= 0) {
                        this.showGameOverImage('lose');
                    }
                }
            });
            
    
            this.level.collectibles.forEach((collectible, index) => {
                if (this.character.isColliding(collectible)) {
                    if (collectible.type === 'coin') {
                        if (this.coinBar.percentage < 100) {
                            this.coinBar.percentage += 20;
                            if (this.coinBar.percentage > 100) {
                                this.coinBar.percentage = 100;
                            }
                            this.coinBar.setPercentage(this.coinBar.percentage);
                            this.level.collectibles.splice(index, 1);
                            
                        }
                    } else if (collectible.type === 'bottle') {
                        if (this.character.bottleCount < 5) {
                            this.character.bottleCount++;
                            this.bottleBar.setPercentage(this.character.bottleCount * 20);
                            this.level.collectibles.splice(index, 1);
                            this.playSound('collect-bottle');
                        }
                    } else if (collectible.type === 'life') {
                        if (this.character.energy < 100) { 
                            this.character.energy += 20;   
                            if (this.character.energy > 100) {
                                this.character.energy = 100; 
                            }
                            this.statusBar.setPercentage(this.character.energy);
                            this.level.collectibles.splice(index, 1);
                            this.playSound('collect-life');
                        }
                    }
                    else {
                        this.level.collectibles.splice(index, 1);
                    }
                }
            });
            for (let i = this.throwableObjects.length - 1; i >= 0; i--) {
                const bottle = this.throwableObjects[i];
                this.level.enemies.forEach((enemy) => {
                    if (bottle.owner !== enemy && bottle.isColliding(enemy) && !enemy.isDead && !bottle.hasHit) {
                        bottle.splash(); 
                        bottle.hasHit = true; 
                        enemy.hit(); 
                        this.playSound('explode');
                    }
                });
            
                // Check if the bottle hits the character
                if (bottle.owner instanceof Endboss && bottle.isColliding(this.character) && !bottle.hasHit) {
                    bottle.splash(); 
                    bottle.splash(); 
                    bottle.hasHit = true; 
                    this.character.hit();
                    this.playSound('bottle-hit');
                    this.statusBar.setPercentage(this.character.energy);
                    if (this.character.energy <= 0) {
                        this.showGameOverImage('lose');
                    }
                }
            
                if (bottle.finishedSplash) {
                    this.throwableObjects.splice(i, 1);
                }
            }
                        
        }, 1000/66);
    }
    
    checkThrowBottle() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'd' && this.character.bottleCount > 0 && !this.gameOver) {
                this.throwBottle();
                this.playSound('throw');
            }
        });
    }
    throwBottle() {
        let bottle = new ThrowableObject(this.character.x + 50, this.character.y + 50, this.character.otherDirection);
        this.throwableObjects.push(bottle);
        this.character.bottleCount--;
        this.bottleBar.setPercentage(this.character.bottleCount * 20);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(this.camera_x, 0);
    
        this.addObjectsToMap(this.level.backgroundobjects); 
        this.addToMap(this.character); 
        this.addObjectsToMap(this.level.collectibles);      
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.level.clouds);
    
        this.throwableObjects.forEach((bottle) => bottle.move());
        this.addObjectsToMap(this.throwableObjects);
    
        this.ctx.translate(-this.camera_x, 0);
    
        this.addToMap(this.bottleBar);
        this.addToMap(this.statusBar);
        this.addToMap(this.coinBar);

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
        roundRect(this.ctx, 490, 0, 310, 70, 10);
        this.ctx.shadowBlur = 0;

        if (this.fullscreenButton.isClicked(this.mouseX, this.mouseY)) {
            this.fullscreenButton.drawHover(this.ctx);
        } else {
            this.fullscreenButton.draw(this.ctx);
        }

        if (this.restartButton.isClicked(this.mouseX, this.mouseY)) {
            this.restartButton.drawHover(this.ctx);
        } else {
            this.restartButton.draw(this.ctx);
        }

        if (this.soundButton.isClicked(this.mouseX, this.mouseY)) {
            this.soundButton.drawHover(this.ctx);
        } else {
            this.soundButton.draw(this.ctx);
        }

        if (this.soundIcon.complete) {
            this.ctx.drawImage(this.soundIcon, this.soundButton.x + 10, this.soundButton.y + 10, 30, 30);
        }
    
        this.ctx.translate(this.camera_x, 0);
        this.ctx.translate(-this.camera_x, 0);
    
        if (this.gameOverImageShown && this.gameOverImage.complete) {
            console.log('Drawing game over image', this.gameOverImage.src);
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.drawImage(this.gameOverImage, this.canvas.width / 2 - 200, this.canvas.height / 2 - 100, 400, 200);
            this.ctx.restore();
            console.log('Game over image drawn');
        } else if (this.gameOverImageShown && !this.gameOverImage.complete) {
            console.log('Game over image not loaded yet', this.gameOverImage.src);
        }    
        if (!this.gameOver) {
            let self = this;
            requestAnimationFrame(function() {
                self.draw();
            });
        }
        this.droppedCoins.forEach((coin) => {
            coin.update();
            this.addToMap(coin);
        });
    }

    // ...


    addObjectsToMap(objects) {
        objects.forEach(o => {
            this.addToMap(o);
        });
    }

    addToMap(mo) {
        if (mo.otherDirection) {
            this.flipImage(mo);
        }
        mo.draw(this.ctx);
        mo.drawFrame(this.ctx);
        if (mo.otherDirection) {
            this.flipImageBack(mo);
        }
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
    

    playSound(name) {
        if (this.soundEnabled) {
            const sound = this.sounds[name];
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.play().catch(err => console.error('Sound error:', err));
            }
        }
    }

    showGameOverImage(result) {
        console.log('Showing game over image');
        this.gameOver = true;
        this.level.enemies.forEach((enemy) => {
            enemy.speed = 0; // Stop the enemies from moving
        });
    
        this.gameOverImage.src = result === 'win' ? 'img/img/You won, you lost/You Won B.png' : 'img/img/You won, you lost/You Lost B.png';
        if (result === 'win') {
            this.playSound('win');
        } else {
            this.sounds['lose'] = new Audio('audio/lose.wav'); 
            this.playSound('lose');
        }
        this.gameOverImage.onload = () => {
            console.log('Game over image loaded');
            this.gameOverImageShown = true;
            this.draw(); // Force the canvas to update
        };
        this.gameOverImage.onerror = () => {
            console.log('Error loading game over image');
        };
    }
}
/*class World {
    soundEnabled = true; 

    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar('health');
    coinBar = new StatusBar('coin');
    bottleBar = new StatusBar('bottle');
    throwableObjects = []; 
    droppedCoins = [];

    sounds = {
        'throw': new Audio('audio/SHOOT011.mp3'),
        'collect-bottle': new Audio('audio/collect-bottle.wav'),
        'collect-life': new Audio('audio/collect-life.ogg'),
        'explode': new Audio('audio/8bit_bomb_explosion.wav'),
        'win': new Audio('audio/Won!.wav'),
        'bottle-hit': new Audio('audio/1.mp3'),
        'coin-lost': new Audio(''),
        
        
    };
    gameOverImage = new Image();
    gameOverImageShown = false;
    gameOver = false;
    fullscreenButton = new Button(500, 10, 100, 50, 'Fullscreen');
    restartButton = new Button(620, 10, 100, 50, 'Restart');
    soundButton = new Button(740, 10, 50, 50, '');
    soundIcon = new Image();

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.setWorld();
        this.checkCollision();
        this.checkThrowBottle(); 
        this.bottleBar.setPercentage(this.character.bottleCount * 20); 

        this.soundIcon.src = this.soundEnabled ? 'img/assets/Mic-On.svg' : 'img/assets/Mic-Off.svg';

        let self = this;
        canvas.addEventListener('mousemove', (e) => {
            let rect = canvas.getBoundingClientRect();
            self.mouseX = e.clientX - rect.left;
            self.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('click', (e) => {
            let rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
        
            if (self.fullscreenButton.isClicked(x, y)) {
                if (canvas.requestFullscreen) {
                    canvas.requestFullscreen();
                } else if (canvas.webkitRequestFullscreen) {
                    canvas.webkitRequestFullscreen();
                } else if (canvas.msRequestFullscreen) {
                    canvas.msRequestFullscreen();
                }
            } else if (self.restartButton.isClicked(x, y)) {
                restartGame();
            } else if (self.soundButton.isClicked(x, y)) {
                self.soundEnabled = !self.soundEnabled;
                self.soundIcon.src = self.soundEnabled ? 'img/assets/Mic-On.svg' : 'img/assets/Mic-Off.svg';
                soundEnabled = self.soundEnabled;
                console.log('Sound enabled:', soundEnabled);
            }
        });    

        this.draw();
    }
    
    
    
    

    setWorld() {
        this.character.world = this;
    }

    checkCollision() {
        setInterval(() => {
            if (this.gameOver) return; 
            this.level.enemies.forEach((enemy) => {
                if (!enemy.isDead && this.character.isColliding(enemy)) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy);
                    if (this.character.energy <= 0) {
                        this.showGameOverImage('lose');
                    }
                }
            });
            
    
            this.level.collectibles.forEach((collectible, index) => {
                if (this.character.isColliding(collectible)) {
                    if (collectible.type === 'coin') {
                        if (this.coinBar.percentage < 100) {
                            this.coinBar.percentage += 20;
                            if (this.coinBar.percentage > 100) {
                                this.coinBar.percentage = 100;
                            }
                            this.coinBar.setPercentage(this.coinBar.percentage);
                            this.level.collectibles.splice(index, 1);
                            
                        }
                    } else if (collectible.type === 'bottle') {
                        if (this.character.bottleCount < 5) {
                            this.character.bottleCount++;
                            this.bottleBar.setPercentage(this.character.bottleCount * 20);
                            this.level.collectibles.splice(index, 1);
                            this.playSound('collect-bottle');
                        }
                    } else if (collectible.type === 'life') {
                        if (this.character.energy < 100) { 
                            this.character.energy += 20;   
                            if (this.character.energy > 100) {
                                this.character.energy = 100; 
                            }
                            this.statusBar.setPercentage(this.character.energy);
                            this.level.collectibles.splice(index, 1);
                            this.playSound('collect-life');
                        }
                    }
                    else {
                        this.level.collectibles.splice(index, 1);
                    }
                }
            });
            for (let i = this.throwableObjects.length - 1; i >= 0; i--) {
                const bottle = this.throwableObjects[i];
                this.level.enemies.forEach((enemy) => {
                    if (bottle.owner !== enemy && bottle.isColliding(enemy) && !enemy.isDead && !bottle.hasHit) {
                        bottle.splash(); 
                        bottle.hasHit = true; 
                        enemy.hit(); 
                        this.playSound('explode');
                    }
                });
            
                // Check if the bottle hits the character
                if (bottle.owner instanceof Endboss && bottle.isColliding(this.character) && !bottle.hasHit) {
                    bottle.splash(); 
                    bottle.splash(); 
                    bottle.hasHit = true; 
                    this.character.hit();
                    this.playSound('bottle-hit');
                    this.statusBar.setPercentage(this.character.energy);
                    if (this.character.energy <= 0) {
                        this.showGameOverImage('lose');
                    }
                }
            
                if (bottle.finishedSplash) {
                    this.throwableObjects.splice(i, 1);
                }
            }
                        
        }, 1000/66);
    }
    
    checkThrowBottle() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'd' && this.character.bottleCount > 0 && !this.gameOver) {
                this.throwBottle();
                this.playSound('throw');
            }
        });
    }
    throwBottle() {
        let bottle = new ThrowableObject(this.character.x + 50, this.character.y + 50, this.character.otherDirection);
        this.throwableObjects.push(bottle);
        this.character.bottleCount--;
        this.bottleBar.setPercentage(this.character.bottleCount * 20);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(this.camera_x, 0);
    
        this.addObjectsToMap(this.level.backgroundobjects); 
        this.addToMap(this.character); 
        this.addObjectsToMap(this.level.collectibles);      
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.level.clouds);
    
        this.throwableObjects.forEach((bottle) => bottle.move());
        this.addObjectsToMap(this.throwableObjects);
    
        this.ctx.translate(-this.camera_x, 0);
    
        this.addToMap(this.bottleBar);
        this.addToMap(this.statusBar);
        this.addToMap(this.coinBar);

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
        roundRect(this.ctx, 490, 0, 310, 70, 10);
        this.ctx.shadowBlur = 0;

        if (this.fullscreenButton.isClicked(this.mouseX, this.mouseY)) {
            this.fullscreenButton.drawHover(this.ctx);
        } else {
            this.fullscreenButton.draw(this.ctx);
        }

        if (this.restartButton.isClicked(this.mouseX, this.mouseY)) {
            this.restartButton.drawHover(this.ctx);
        } else {
            this.restartButton.draw(this.ctx);
        }

        if (this.soundButton.isClicked(this.mouseX, this.mouseY)) {
            this.soundButton.drawHover(this.ctx);
        } else {
            this.soundButton.draw(this.ctx);
        }

        if (this.soundIcon.complete) {
            this.ctx.drawImage(this.soundIcon, this.soundButton.x + 10, this.soundButton.y + 10, 30, 30);
        }
    
        this.ctx.translate(this.camera_x, 0);
        this.ctx.translate(-this.camera_x, 0);
    
        if (this.gameOverImageShown && this.gameOverImage.complete) {
            console.log('Drawing game over image', this.gameOverImage.src);
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.drawImage(this.gameOverImage, this.canvas.width / 2 - 200, this.canvas.height / 2 - 100, 400, 200);
            this.ctx.restore();
            console.log('Game over image drawn');
        } else if (this.gameOverImageShown && !this.gameOverImage.complete) {
            console.log('Game over image not loaded yet', this.gameOverImage.src);
        }    
        if (!this.gameOver) {
            let self = this;
            requestAnimationFrame(function() {
                self.draw();
            });
        }
        this.droppedCoins.forEach((coin) => {
            coin.update();
            this.addToMap(coin);
        });
    }

    // ...


    addObjectsToMap(objects) {
        objects.forEach(o => {
            this.addToMap(o);
        });
    }

    addToMap(mo) {
        if (mo.otherDirection) {
            this.flipImage(mo);
        }
        mo.draw(this.ctx);
        mo.drawFrame(this.ctx);
        if (mo.otherDirection) {
            this.flipImageBack(mo);
        }
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
    

    playSound(name) {
        if (this.soundEnabled) {
            const sound = this.sounds[name];
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.play().catch(err => console.error('Sound error:', err));
            }
        }
    }

    showGameOverImage(result) {
        console.log('Showing game over image');
        this.gameOver = true;
        this.level.enemies.forEach((enemy) => {
            enemy.speed = 0; // Stop the enemies from moving
        });
    
        this.gameOverImage.src = result === 'win' ? 'img/img/You won, you lost/You Won B.png' : 'img/img/You won, you lost/You Lost B.png';
        if (result === 'win') {
            this.playSound('win');
        } else {
            this.sounds['lose'] = new Audio('audio/lose.wav'); 
            this.playSound('lose');
        }
        this.gameOverImage.onload = () => {
            console.log('Game over image loaded');
            this.gameOverImageShown = true;
            this.draw(); // Force the canvas to update
        };
        this.gameOverImage.onerror = () => {
            console.log('Error loading game over image');
        };
    }
}
*/