/// <reference path="../DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="Mover.ts"/>

class MyShip extends Mover {

    constructor() {
        super();

        this.vy = -2;

        var geometry = new THREE.BoxGeometry(20, 20, 20);

        //複数のマテリアルを使用する
        //var material = new THREE.MeshBasicMaterial({
        //	color: 0xff0000,
        //	wireframe: true
        //});

        var materials = [
            new THREE.MeshLambertMaterial({
                color: 0xff0000,
            }),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: true,
                transparent: true
            })
        ];
        this._obj = THREE.SceneUtils.createMultiMaterialObject(geometry, materials);

        this._obj.castShadow = true;

        this.hitArea.push(new HitArea(20, 20, this.x, this.y));
        this.hitAreaPos.push(new THREE.Vector2(0, 0));
    }

    public update(nowFrame) {
        this.setPosition(this.x, this.y, this.z);
    }

    public explode() {
        this.waitRemove = true;

        var v = GameApp.getInstance().getCurrentView();
        //v.remove(this._obj)
        var ex = new Explosion(this.x, this.y, 0xFF0000);
        v.addMover(ex);
    }

    public setPosition(x, y, z) {
        for (var i = 0; i < this.hitArea.length; i++) {
            this.hitArea[i].update(x + this.hitAreaPos[i].x, y + this.hitAreaPos[i].y);
        }
        super.setPosition(x, y, z);
    }
}
