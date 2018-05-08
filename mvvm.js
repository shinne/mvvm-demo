function Mvvm(options = {}) {
    //vm.$options Vue 上是讲所有属性挂在在上面
    //所以我们也同样实现，讲所有属性挂在$options
    this.$options = options;
    //this._data这里也和Vue一样
    let data = this._data = this.$options.data;

    //数据劫持
    observe(data);

    //数据代理
    //数据代理就是让我们每次拿data里的数据时，不用每次都写一长串，mvvm._data.a.b
    //通过数据代理可以直接写成mvvm.a.b
    //this代理了this._data
    for(let key in data){
        Object.defineProperty(this,key,{
            configurable:true,
            get(){
                return this._data[key];
            },
            set(newVal){
                this._data[key] = newVal;
            }
        })
    }

    //编译
    new Compile(options.el,this);
}

//创建一个Observe构造函数
//写数据劫持的主要逻辑
function Observe(data) {
    let dep = new Dep();
    //所谓数据劫持就是给对象增加get,set
    //先遍历一遍对象
    for(let key in data){
        let val = data[key];
        observe(val);  //递归继续向下找，实现深度的数据劫持
        Object.defineProperty(data,key,{
            configurable:true,
            get(){
                //todo Dep.target与Watch的构造方法，是为了低耦合
                Dep.target && dep.addSub(Dep.target); //将watcher添加到订阅事件中[watcher]
                return val;
            },
            //更改值的时候
            set(newVal){
                //设置的值和 以前值一样就不理它
                if(val === newVal){
                    return;
                }
                val = newVal;  //如果以后再获取值get的时候，将刚才设置的值再返回去
                observe(newVal); //当设置为新值后，也需要把新值再去定义成属性
                dep.notify();
            }
        })
    }
}

//外面再写一个函数，不用每次调用都写new,也方便递归调用
function observe(data) {
    //如果不是对象的话就直接return,
    if(!data || typeof data != "object"){
        return;
    }
    return new Observe(data);
}

//创建Compile构造函数
function Compile(el,vm) {
    //将el挂在在实例上方便调用
    vm.$el = document.querySelector(el);
    //在el防卫里将内容都拿到，当然不能一个一个的拿
    //可以选择一道内存去然后放入文档碎片中，节省开销
    let fragment = document.createDocumentFragment();
    //todo 此时将el中的内容放入内存中
    //while这个循环是怎么运行的？
    while(child = vm.$el.firstChild){
        fragment.appendChild(child);
    }

    //对el里面的内容进行替换
    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent;
            let reg = /\{\{(.*?)\}\}/g; // 正则匹配{{}}
            if (node.nodeType == 3 && reg.test(txt)) {
                //即是文本节点又有大括号的情况
                console.log(RegExp.$1) //匹配到的第一个分组，如a.b,c
                let arr = RegExp.$1.split(".");
                let val = vm;
                arr.forEach(key => {
                    val = val[key];  //这里处理多层数据，例如a.b.k，经过一层层的取值，最终获得a.b.k
                });
                //用trim方法去除一下首尾空格
                node.textContent = txt.replace(reg, val).trim();

                //监听变化
                //给Watcher再添加两个参数，用来取新的值(newVal)给回调函数传参
                new Watcher(vm, RegExp.$1, newVal => {
                    node.textContent = txt.replace(reg, newVal).trim();
                })
            }
            //元素节点
            if(node.nodeType == 1){
                let nodeAttr = node.attributes; //获取dom上的所有属性，是个类数组
                Array.from(nodeAttr).forEach(attr => {
                    let name = attr.name;   //v-model type
                    let exp = attr.value   //    c   text
                    if(name.includes('v-')){
                        node.value = vm[exp];   //this.c
                    }
                    //监听变化
                    new Watcher(vm,exp,function (newVal) {
                        node.value = newVal;  //当watcher触发时会自动将内容放入输入框中
                    });

                    node.addEventListener("input",e =>{
                        let newVal = e.target.value;
                        //相当于给this.c赋了一个新值
                        //而值得改变会调用set,set中又会调用notify，notify中调用watcher的update方法实现了更新
                        vm[exp] = newVal;
                    })
                });
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node);
            }
        });
    }
    replace(fragment);
    vm.$el.appendChild(fragment) //再将文档碎片放入el中
}

//写Watcher构造函数
function Watcher(vm,exp,fn) {
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;

    //添加一个事件
    //这里我们先定义一个属性
    Dep.target = this;
    let arr = exp.split(".");
    let val = vm;
    arr.forEach(key => {
        val = val[key];  //获取this.a.b，默认就会调用get方法
    });
    Dep.target = null;
}

Watcher.prototype.update = function () {
    //notify的时候值已经更改了
    //再通过vm,exp来获取新的值
    let arr = this.exp.split(".");
    let val = this.vm;
    arr.forEach(key =>{
        val = val[key];   //通过get获取到新的值
    });
    this.fn(val);
}


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