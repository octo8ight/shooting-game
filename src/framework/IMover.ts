
interface IMover{
    x : number;
    y : number;
    z : number;
    vx : number;
    vy : number;


    //内部情報更新
    update(nowFrame):void;

}
