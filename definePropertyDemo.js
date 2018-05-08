let obj = {};
let song = '发如雪';
obj.singer = '周杰伦';

Object.defineProperty(obj, 'music', {
    // 1\. value: '七里香',
    configurable: true, // 2\. 可以配置对象，删除属性
    // writable: true, // 3\. 可以修改对象
    enumerable: true, // 4\. 可以枚举（遍历）,例如使用for循环进行访问
    // ☆ get,set设置时不能设置writable和value，它们代替了二者且是互斥的
    get() { // 5\. 获取obj.music的时候就会调用get方法
        return song;
    },
    set(val) { // 6\. 将修改的值重新赋给song
        song = val;
    }
});

console.log(obj.music);
obj.music = "一路向北";
console.log("通过对obj.music 进行赋值会调用music.set方法，对song的值进行更改，song由'发如雪'更改为" + song);
//设置了enumerable可以对defineProperty定义的属性进行枚举遍历
console.log("设置了enumerable可以对defineProperty定义的属性进行枚举遍历");
for(let key in obj){
    console.log(key);
}