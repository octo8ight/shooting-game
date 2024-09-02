//GameApp
//theee.jsのカメラやレンダリングなどを管理する

//定義ファイル
/// <reference path="../DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="../DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="../framework/CView.ts"/>
/// <reference path="ControlManager.ts"/>
/// <reference path="../DefinitelyTyped/stats/stats.d.ts" />

interface Window {
    webkitRequestAnimationFrame: any;
    mozRequestAnimationFrame: any;
    oRequestAnimationFrame: any;
}

interface Performance {
    mozNow: any;
    msNow: any;
    oNow: any;
    webkitNow: any;
}

class GameApp {

    private static _instance: GameApp = null;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer;
    private controls;

    //2d
    private camera2d: THREE.OrthographicCamera;
    private scene2d: THREE.Scene;
    private use2d = true;

    private stageWidth = 480;
    private stageHeight = 640;

    public isStop: boolean = false;

    //現在のビュー
    private currentView: CView;

    //stats用
    private stats: Stats;

    //タイマー管理
    private startTime = 0;
    private currentFrame = 0;
    private requestAnimationFrame;
    private getTime;
    private fps = 60.0;
    private frameLength = 60.0;

    public ua;
    private useControl = true;

    constructor() {
        if (GameApp._instance) {
            throw new Error("must use the getInstance.");
        }
        GameApp._instance = this;
        this.initialize();
    }

    public static getInstance(): GameApp {
        if (GameApp._instance === null) {
            GameApp._instance = new GameApp();
        }
        return GameApp._instance;
    }

    public initialize() {

        //scene default initialize
        this.scene = new THREE.Scene();

        //camera default initialize
        //this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);

        this.camera.position.set(0, -300, 240);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        //renderer default initialize
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        //setPixelRatioを設定すると重くなる
        //this.renderer.setPixelRatio( window.devicePixelRatio );
        //this.renderer.setClearColor(0x000000);
        //this.renderer.shadowMapEnabled = true;

        var container = document.getElementById("container");
        container.appendChild(this.renderer.domElement);


        //タイマ管理設定
        this.requestAnimationFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 1000.0 / 60.0);
                };
        })();
        var now = window.performance && (
            performance.now ||
            performance.mozNow ||
            performance.msNow ||
            performance.oNow ||
            performance.webkitNow);

        this.getTime = function() {
            return (now && now.call(performance)) || (new Date().getTime());
        };
        this.startTime = this.getTime();


        /*** ADDING SCREEN SHOT ABILITY ***/
        window.addEventListener("keyup", (e) => {
            var imgData, imgNode;
            //Listen to 'P' key
            if (e.which !== 80) {return;}
            try {
                imgData = this.renderer.domElement.toDataURL();
                console.log(imgData);
            }
            catch (e) {
                console.log(e);
                console.log("Browser does not support taking screenshot of 3d context");
                return;
            }
        });

        //stats
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms
        this.stats.domElement.style.position = "absolute";
        this.stats.domElement.style.right = "0px";
        this.stats.domElement.style.top = "0px";
        document.body.appendChild(this.stats.domElement);

        this.ua = "pc";
        var ua = navigator.userAgent;
        if (ua.indexOf("iPhone") > 0) {
            this.ua = "ios";
        } else if (ua.indexOf("Android") > 0) {
            this.ua = "android";
        }

        //orbitcontrol
        if (this.useControl == true) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.addEventListener("change", () => {
                //console.log(this.camera)
            });
        }

        //操作機能
        var ctmanager = ControlManager.getInstance();

        this.resize();
        $(window).resize(() => {
            this.resize();
            if (this.currentView != undefined && this.currentView != null) {
                this.currentView.resize();
            }
        });

        if (this.use2d == true) {this.init2d();};
    }

	/**
	 * 2d描画初期化
	 */
    private init2d() {
        console.info("using 2d");
        this.camera2d = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight);
        this.scene2d = new THREE.Scene();
    }

    public resize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
    }

    public update() {
        if (this.useControl == true) {this.controls.update();}
        if (this.currentView && this.isStop == false) {
            this.currentView.update(this.currentFrame);
        }
    }

    public render() {
        this.renderer.clear();
        this.renderer.render(this.scene2d, this.camera2d);
        this.renderer.render(this.scene, this.camera);
    }

    public animate() {

        this.stats.begin();
        this.update();
        this.render();
        this.stats.end();

        requestAnimationFrame((e) => {
            this.animate();
        }
            );

        //do not frame skip
        //this.currentFrame = Math.floor(( this.getTime() - this.startTime ) / ( 1000.0 / this.fps ));
        this.currentFrame++;
    }

    public setStartTime() {
        this.startTime = this.getTime();
        this.currentFrame = 0;
    }

    public setView(v: CView) {
        if (this.currentView) {
            this.currentView.destructor();
        }
        this.currentView = v;
        this.currentView.resize();
    }

    //stageサイズ返却
    public getStageSize() {
        return { width: this.stageWidth, height: this.stageHeight };
    }

    //viewへの参照
    public getCurrentFrame() {
        return this.currentFrame;
    }

    public getCurrentView() {
        return this.currentView;
    }

    public getScene() {
        return this.scene;
    }

    public getScene2d() {
        return this.scene2d;
    }

    public getRenderer() {
        return this.renderer;
    }

    public getCamera() {
        return this.camera;
    }

    public start() {
        this.animate();
    }
}
