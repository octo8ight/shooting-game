class EnemyBoss extends Enemy {

    private moveType = 0;
    private farmecount = 0;
    private isLoop = false;

    constructor(startframe) {
        super(startframe);
    }

    public initialize() {
        this.vy = -2;
        this.vx = 0;
        //var material = new THREE.MeshBasicMaterial({
        //	color: 0x00ff00,
        //	wireframe: true
        //});
        //
        //this._obj.add(new THREE.Mesh(new THREE.IcosahedronGeometry(120, 3), material));

        this.baseColor = 0x00ff00;
        var materials = [
            new THREE.MeshLambertMaterial({
                color: this.baseColor,
            }),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: true,
                transparent: true
            })
        ];
        this._obj = THREE.SceneUtils.createMultiMaterialObject(new THREE.IcosahedronGeometry(120, 3), materials);

        this._obj.castShadow = true;
        this.setShooter(new SingleShooter());
        this.setLife(600);
        this.setLifeTime(-1);
        this.setBaseColor(0x00FF00);

        this.hitArea.push(new HitArea(120, 120, this.x, this.y));
        this.hitAreaPos.push(new THREE.Vector2(0, 0));
        this.receiveDamage = false;
    }

    public doAction() {

        var duration = 30;
        var vx = 3;
        if (this.life <= 300) {
            duration = 18;
            vx = 5;
        }
        if (this.isLoop) {

            this.farmecount++;
            if (this.farmecount % duration == 0) {
                this.shot();
            }

            if (this.x > 320) {
                this.x = 320;
                this.vx = -vx;
            } else if (this.x < -320) {
                this.x = -320;
                this.vx = vx;
            }
            return;
        }

        if (this.currentFrame >= 240) {
            this.vy = 0;
            this.vx = 2;
            this.isLoop = true;
            this.receiveDamage = true;
        }

    }
}
