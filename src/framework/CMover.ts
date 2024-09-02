/// <reference path="../DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="CEventDispatcher.ts"/>

class CMover extends events.EventDispatcher implements IMover {

    public x = 0;
    public y = 0;
    public z = 0;

    public vx = 0;
    public vy = 0;

    public _obj: THREE.Object3D;

    public waitRemove: boolean = false;

    constructor() {
        super();
        this._obj = new THREE.Object3D();
    }

    public update(nowFrame) {
        //todo
    }

    public getObject() {
        return this._obj;
    }

    public remove() {
        //todo implemation
    }

    public setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this._obj.position.set(x, y, z);
    }

}
