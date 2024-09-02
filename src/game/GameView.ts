/// <reference path="../DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="../framework/CView.ts"/>
/// <reference path="Stage.ts"/>
/// <reference path="Enemy.ts"/>

class GameView extends CView {

    //Game Objects
    private self: Mover;
    private enemies: Enemy[] = new Array();
    private enemyBullets: Mover[] = new Array();
    private bullets: Mover[] = new Array();
    private bg: Stage;
    private skybox;

    private isKeyLock = false;
    private waitingRestart = false;
    private timerId = 0;

    private sceneData;
    private nextActionFrame = 0;
    private nextActionNum = 0;

    private isInBossBattle = false;
    private boss;
    private gm: GameManager;

    private zPosition;

    //todo raycaster test
    private raycaster;
    private hitTestObjects = new Array();

    constructor() {
        super();

        this.nextActionNum = 0;

        this.gm = GameManager.getInstance();
        this.sceneData = this.gm.getSceneData(0);
        this.zPosition = this.gm.zPosition;

        //gamestart
        this.startGame();

    }

    public keyEvent(e: any) {
        if (this.isKeyLock == true) {
            return;
        }
        switch (e.data.keyCode) {
            case 32:
                if (this.waitingRestart == true) {
                    this.restart();
                    return;
                }
                //shot bullets
                var b = new Bullet(0, 12);
                b.setPosition(this.self.x, this.self.y, this.zPosition);
                this.addMover(b);
                this.bullets.push(b);
                break;
            case 65:
                this.self.x -= 10;
                break;
            case 87:
                this.self.y += 10;
                break;
            case 68:
                this.self.x += 10;
                break;
            case 83:
                this.self.y -= 10;
                break;
        }
    }

    public onMouseDown(e: any) {
        //console.log("onMouseStart");
    }

    public onMouseMove(e: any) {

        //var nowX = e.data.x
        //var nowY = e.data.y
        //
        //if (this.app.ua != "pc") {
        //	nowX = e.data.touches[0].clientX;
        //	nowY = e.data.touches[0].clientY;
        //}
        //
        //var w = window.innerWidth;
        //var h = window.innerHeight;
        //
        //this.self.setPosition(-240 + 480 * nowX / w, 320 - 640 * nowY / h, this.zPosition)

        var mouse = new THREE.Vector2();
        mouse.set((e.data.x / window.innerWidth) * 2 - 1, - (e.data.y / window.innerHeight) * 2 + 1);

        this.raycaster.setFromCamera(mouse, this.app.getCamera());

        var intersects = this.raycaster.intersectObjects(this.hitTestObjects);

        if (intersects.length > 0) {
            var intersect = intersects[0];
            this.self.setPosition(intersect.point.x, intersect.point.y, this.zPosition);
        }
    }

    public onMouseUp(e: any) {
        if (this.isKeyLock == true) {
            return;
        }
        if (this.waitingRestart == true) {
            this.restart();
            return;
        }
    }

    public update() {
        var currentFrame = this.app.getCurrentFrame();
        this.gm.debug(currentFrame);
        if (this.nextActionNum < this.sceneData.length && currentFrame == this.sceneData[this.nextActionNum].frame) {
            var enemies = this.sceneData[this.nextActionNum].enemies;
            for (var i = 0; i < enemies.length; i++) {
                if (enemies[i].type == 1) {
                    var e = new Enemy(this.app.getCurrentFrame());
                    e.setPosition(enemies[i].x, enemies[i].y, this.zPosition);
                    this.addMover(e);
                    this.enemies.push(e);
                } else if (enemies[i].type == 2) {
                    var e = new EnemyMid(this.app.getCurrentFrame());
                    e.setPosition(enemies[i].x, enemies[i].y, this.zPosition);
                    this.addMover(e);
                    this.enemies.push(e);
                } else if (enemies[i].type == 3) {
                    var b = new EnemySmall(this.app.getCurrentFrame());
                    b.setPosition(enemies[i].x, enemies[i].y, this.zPosition);
                    this.addMover(b);
                    this.enemies.push(b);
                } else if (enemies[i].type == 4) {
                    var boss = new EnemyBoss(this.app.getCurrentFrame());
                    boss.setPosition(enemies[i].x, enemies[i].y, this.zPosition);
                    this.addMover(boss);
                    this.enemies.push(boss);
                    //todo boss
                    this.isInBossBattle = true;
                    this.boss = boss;
                }
            }
            this.nextActionNum++;
        }

        this.hitTest();
        this.checkLiveTest();
        super.update(currentFrame);

        if (this.skybox) {this.skybox.rotation.y += 0.01;}

    }

	/**
	 * 当たり判定
	 */
    public hitTest() {
        if (this.boss != null && this.boss.isDead) {
            for (var i = 0; i < this.bullets.length; i++) {
                this.bullets[i].isDead = true;
                this.bullets[i].waitRemove = true;
            }
            this.isInBossBattle = false;
            this.boss = null;
            this.waitingRestart = true;
            this.isKeyLock = true;
            setTimeout(() => {
                this.setClear();
            }, 3000);

            return;
        }

        for (var i = 0; i < this.bullets.length; i++) {
            for (var j = 0; j < this.enemies.length; j++) {
                //攻撃受ける側でhitTes行う仕様
                if (this.enemies[j].hitTest(this.bullets[i].hitArea) == true) {
                    if (!this.enemies[j].isDead) {
                        this.bullets[i].isDead = true;
                        this.bullets[i].waitRemove = true;
                        this.enemies[j].hit();
                        if (this.enemies[j].isDead == true) {
                            this.gm.addScore(this.enemies[j].getPoint());
                        }

                    }
                }
            }
        }

        //敵の弾と自分の当たり判定
        for (var j = 0; j < this.enemies.length; j++) {
            var bulletArray = this.enemies[j].getBullets();
            for (var k = 0; k < bulletArray.length; k++) {
                var b = bulletArray[k];
                if (this.self.hitTest(b.hitArea) == true) {
                    if (!this.self.isDead) {
                        this.self.isDead = true;
                        this.self.explode();
                    }
                }
            }
        }

        //敵と自分の当たり判定
        for (var j = 0; j < this.enemies.length; j++) {
            if (this.self.hitTest(this.enemies[j].hitArea) == true) {
                if (!this.self.isDead) {
                    this.self.isDead = true;
                    this.self.explode();
                }
            }
        }
    }

	/**
	 * キャラクタの表示確認
	 */
    public checkLiveTest() {

        if (this.self.isDead == true && this.waitingRestart == false) {
            //3秒後くらいにゲームオーバー表示させる→スペース押したらreplay
            this.waitingRestart = true;
            this.isKeyLock = true;
            setTimeout(() => {
                this.setGameOver();
            }, 3000);
            return;
        }
        var n = 0;
        for (var i = 0; i < this.bullets.length; i++) {
            if (this.bullets[n].isDead == true) {
                this.bullets.splice(n, 1);
            } else {
                n++;
            }
        }
        n = 0;
        for (var i = 0; i < this.enemies.length; i++) {
            if (this.enemies[n].waitRemove == true) {
                this.enemies.splice(n, 1);
            } else {
                n++;
            }
        }
    }

	/**
	 * ゲームオーバー処理
	 */
    public setGameOver() {
        //gameover表示
        $("#overlay").show();
        $("#view-gameover").show();
        this.isKeyLock = false;
    }

    public setClear() {
        $("#overlay").show();
        $("#view-stageclear").show();
        this.isKeyLock = false;
    }

	/**
	 * ゲーム開始
	 */
    public startGame() {
        $("#view-gameover").hide();
        $("#view-stageclear").hide();
        $("#overlay").hide();

        this.bg = new Stage();
        this.bg.init();
        this.addMover(this.bg);

        this.self = new MyShip();
        this.self.setPosition(0, -300, 0);
        this.addMover(this.self);
        this.gm.setSelfCharacter(this.self);
        this.app.setStartTime();


        //todo skybox
        var path = "image/skybox/";
        var format = ".jpg";
        var urls = [
            path + "px" + format, path + "nx" + format,
            path + "py" + format, path + "ny" + format,
            path + "pz" + format, path + "nz" + format
        ];
        var textureCube = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeRefractionMapping);
        var shader = THREE.ShaderLib["cube"];
        shader.uniforms["tCube"].value = textureCube;
        var material = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), material);
        this.add(mesh);

        //todo test raycaster
        this.raycaster = new THREE.Raycaster();
        var geometry = new THREE.PlaneBufferGeometry(480, 640);
        var material2 = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: false });
        var plane = new THREE.Mesh(geometry, material2);
        plane.visible = false;
        this.add(plane);
        this.hitTestObjects.push(plane);


        //dummy enemy generate
        //var func = ()=> {
        //	this.timerId = setTimeout(()=> {
        //		var e = new Enemy(this.app.getCurrentFrame());
        //		e.setPosition(-320 + Math.random() * 640, 320, this.zPosition);
        //		this.addMover(e);
        //		this.enemies.push(e);
        //		func();
        //	}, 500)
        //}
        //func();
    }

	/**
	 * リスタート処理
	 */
    public restart() {
        this.waitingRestart = false;
        clearTimeout(this.timerId);
        this.removeAll();
        this.bullets.length = 0;
        this.enemies.length = 0;
        this.gm.setScore(0);
        this.startGame();
        this.nextActionNum = 0;
    }

    public resize() {
        this.gm.resize();
    }
}
