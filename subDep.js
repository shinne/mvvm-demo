//发布订阅模式 订阅和发布

function Dep() {
    //一个数组（存放函数的事件池）
    this.subs = [];
}

Dep.prototype = {
    addSub(sub){
        this.subs.push(sub);
    },
    notify(){
        //绑定的方法，都有一个update方法
        this.subs.forEach(sub => sub.update());
    }
}

//通过watcher这个类创建的实例，都拥有update方法
function Watcher(fn) {
    this.fn = fn;  //将fn放到实例上
}

Watcher.prorotype.update = function () {
    this.fn();
}

let watcher = new Watcher(() => console.log(111));
let dep = new Dep();
dep.addSub(watcher);  //将waatcher放到数组中，watcher自带update方法