/**
 * @fileOverview view类
 * @author 行列
 * @version 1.1
 */
define('magix/view', function(require) {
    var Magix = require("magix/magix");
    var Event = require("magix/event");
    var Body = require("magix/body");
    var Router = require("magix/router");

    var SafeExec = Magix.safeExec;
var Has = Magix.has;
var COMMA = ',';
var EMPTY_ARRAY = [];
var Noop = Magix.noop;
var Mix = Magix.mix;
var WIN = window;
var ResCounter = 0;
var WrapKey = '~';
var DestroyStr = 'destroy';

var WrapFn = function(fn) {
    return function() {
        var me = this;
        var u = me.notifyUpdate();
        if (u > 0) {
            SafeExec(fn, arguments, me);
        }
    };
};

var Destroy = function(res) {
    var fn = res && res[DestroyStr];
    if (fn) {
        SafeExec(fn, EMPTY_ARRAY, res);
    }
};
var DestroyTimer = function(id) {
    WIN.clearTimeout(id);
    WIN.clearInterval(id);
};
var DestroyAllManaged = function(onlyMR, keepIt) {
    var me = this;
    var cache = me.$res;

    for (var p in cache) {
        var c = cache[p];
        if (!onlyMR || c.mr) {
            me.destroyManaged(p, keepIt);
        }
    }
};

var EvtInfoCache = Magix.cache(40);
var Left = '<';
var Right = '>';

var MxEvt = /\smx-(?!view|defer|owner|vframe)[a-z]+\s*=\s*"/g;
var MxEvtSplit = String.fromCharCode(26);


var EvtInfoReg = /(\w+)(?:<(\w+)>)?(?:\(?{([\s\S]*)}\)?)?/;
var EvtParamsReg = /(\w+):([^,]+)/g;
var EvtMethodReg = /([$\w]+)<([\w,]+)>/;
/**
 * View类
 * @name View
 * @class
 * @constructor
 * @borrows Event.on as #on
 * @borrows Event.fire as #fire
 * @borrows Event.off as #off
 * @borrows Event.once as #once
 * @borrows Event.rely as #rely
 * @param {Object} ops 创建view时，需要附加到view对象上的其它属性
 * @property {String} id 当前view与页面vframe节点对应的id
 * @property {Vframe} owner 拥有当前view的vframe对象
 * @property {Object} vom vom对象
 * @property {Integer} sign view的签名，用于刷新，销毁等的异步标识判断，当view销毁时，该属性是小于等于零的数
 * @property {String} template 当前view对应的模板字符串(当hasTmpl为true时)，该属性在interact事件触发后才存在
 * @property {Boolean} rendered 标识当前view有没有渲染过，即primed事件有没有触发过
 * @property {Object} location window.locaiton.href解析出来的对象
 * @example
 * 关于事件:
 * 示例：
 *   html写法：
 *
 *   &lt;input type="button" mx-click="test({id:100,name:xinglie})" value="test" /&gt;
 *   &lt;a href="http://etao.com" mx-click="test&lt;prevent&gt;({com:etao.com})"&gt;http://etao.com&lt;/a&gt;
 *
 *   view写法：
 *
 *     'test&lt;click&gt;':function(e){
 *          //e.currentId 处理事件的dom节点id(即带有mx-click属性的节点)
 *          //e.targetId 触发事件的dom节点id(即鼠标点中的节点，在currentId里包含其它节点时，currentId与targetId有可能不一样)
 *          //e.params  传递的参数
 *          //e.params.com,e.params.id,e.params.name
 *      },
 *      'test&lt;mousedown&gt;':function(e){
 *
 *       }
 *
 *  //上述示例对test方法标注了click与mousedown事件，也可以合写成：
 *  'test&lt;click,mousedown&gt;':function(e){
 *      alert(e.type);//可通过type识别是哪种事件类型
 *  }
 */


var View = function(ops) {
    var me = this;
    Mix(me, ops);
    me.$ol = {
        ks: []
    };
    me.$ns = {};
    me.$res = {};
    me.sign = 1; //标识view是否刷新过，对于托管的函数资源，在回调这个函数时，不但要确保view没有销毁，而且要确保view没有刷新过，如果刷新过则不回调
    me.addNode(me.id);
    SafeExec(View.ms, [ops], me);
};
var VProto = View.prototype;
var Globals = {
    $host: window,
    $root: document
};
View.ms = [];
View.prepare = function(oView) {
    if (!oView[WrapKey]) { //只处理一次
        oView[WrapKey] = 1;
        //oView.extend = me.extend;
        var prop = oView.prototype;
        var old, temp, name, evts, idx, revts = {}, rsevts = [],
            node;
        for (var p in prop) {
            old = prop[p];
            temp = p.match(EvtMethodReg);
            if (temp) {
                name = temp[1];
                evts = temp[2];
                evts = evts.split(COMMA);
                for (idx = evts.length - 1; idx > -1; idx--) {
                    temp = evts[idx];
                    node = Globals[name];
                    if (node) {
                        rsevts.push({
                            n: name,
                            t: temp,
                            h: node,
                            f: old
                        });
                    } else {
                        revts[temp] = 1;
                        prop[name + Left + temp + Right] = old;
                    }
                }
            } else if (p == 'render' && old != Noop) {
                prop[p] = WrapFn(old);
            }
        }
        prop.$evts = revts;
        prop.$sevts = rsevts;
    }
};

/**
 * 扩展View
 * @param  {Object} props 扩展到原型上的方法
 * @param  {Function} ctor  在初始化view时进行调用的方法
 * @example
 * KISSY.add('app/tview',function(S,View){
 *     return View.mixin({
 *         test:function(){
 *             alert(this.$attr);
 *         }
 *     },function(){
 *          this.$attr='test';
 *     });
 * },{
 *     requires:['magix/view']
 * });
 * //加入Magix.start的extensions中
 *
 *  Magix.start({
 *      //...
 *      extensions:['app/tview']
 *
 *  });
 *
 * //这样完成后，所有的view对象都会有一个$attr属性和test方法
 * //当前上述功能也可以用继承实现，但继承层次太多时，可以考虑使用扩展来消除多层次的继承
 *
 */
View.mixin = function(props, ctor) {
    if (ctor) View.ms.push(ctor);
    Mix(VProto, props);
};

Mix(Mix(VProto, Event), {
    /**
     * @lends View#
     */
    /**
     * 使用xhr获取当前view对应的模板内容，仅在开发app阶段时使用，打包上线后html与js打包在一起，不会调用这个方法
     * @function
     * @param {String} path 路径
     * @param {Function} fn 获取完成后的回调
     * @private
     */
    fetchTmpl: Magix.unimpl,
    /**
     * 渲染view，供最终view开发者覆盖
     * @function
     */
    render: Noop,
    /**
     * 当window.location.href有变化时调用该方法（如果您通过observeLocation指定了相关参数，则这些相关参数有变化时才调用locationChange，否则不会调用），供最终的view开发人员进行覆盖
     * @function
     * @param {Object} e 事件对象
     * @param {Object} e.location window.location.href解析出来的对象
     * @param {Object} e.changed 包含有哪些变化的对象
     * @param {Function} e.prevent 阻止向所有子view传递locationChange的消息
     * @param {Function} e.toChildren 向特定的子view传递locationChange的消息
     * @example
     * //example1
     * locationChange:function(e){
     *     if(e.changed.isPathname()){//pathname的改变
     *         //...
     *         e.prevent();//阻止向所有子view传递改变的消息
     *     }
     * }
     *
     * //example2
     * locationChange:function(e){
     *     if(e.changed.isParam('menu')){//menu参数发生改变
     *         e.toChildren('magix_vf_menus');//只向id为 magix_vf_menus的view传递这个消息
     *     }
     * }
     *
     * //example3
     * //当不调用e.prevent或e.toChildren，则向所有子view传递消息
     * locationChange:function(e){
     *     //...
     * }
     */
    //locationChange: Noop,
    /**
     * 初始化方法，供最终的view开发人员进行覆盖
     * @param {Object} extra 初始化时，外部传递的参数
     * @param {Object} locChanged 地址栏变化的相关信息，比如从某个pathname过来的
     * @function
     */
    init: Noop,
    /**
     * 标识当前view是否有模板文件
     * @default true
     */
    hasTmpl: true,
    /**
     * 是否启用DOM事件(test<click,mousedown>事件是否生效)
     * @default true
     * @example
     * 该属性在做浏览器兼容时有用：支持pushState的浏览器阻止a标签的默认行为，转用pushState，不支持时直接a标签跳转，view不启用事件
     * Q:为什么不支持history state的浏览器上还要使用view？
     * A:考虑 http://etao.com/list?page=2#!/list?page=3; 在IE6上，实际的页码是3，但后台生成时候生成的页码是2，<br />所以需要magix/view载入后对相应的a标签链接进行处理成实际的3。用户点击链接时，由于view没启用事件，不会阻止a标签的默认行为，后续才是正确的结果
     */
    //enableEvent: true,
    /**
     * view刷新时是否采用动画
     * @type {Boolean}
     */
    //enableAnim:false,
    /**
     * 加载view内容
     * @private
     */
    load: function() {
        var me = this;
        var hasTmpl = me.hasTmpl;
        var args = arguments;
        // var tmplReady = Has(me, 'template');
        var ready = function(tmpl) {
            if (hasTmpl) {
                me.template = me.wrapMxEvent(tmpl);
            }
            me.dEvts();
            /*
                    关于interact事件的设计 ：
                    首先这个事件是对内的，当然外部也可以用，API文档上就不再体现了

                    interact : view准备好，让外部尽早介入，进行其它事件的监听 ，当这个事件触发时，view有可能已经有html了(无模板的情况)，所以此时外部可以去加载相应的子view了，同时要考虑在调用render方法后，有可能在该方法内通过setViewHTML更新html，所以在使用setViewHTML更新界面前，一定要先监听prerender rendered事件，因此设计了该  interact事件

                 */
            me.fire('interact', {
                tmpl: hasTmpl
            }, 1); //可交互
            SafeExec(me.init, args, me);
            me.fire('inited', 0, 1);
            me.owner.viewInited = 1;
            me.render();
            //
            var noTemplateAndNoRendered = !hasTmpl && !me.rendered; //没模板，调用render后，render里面也没调用setViewHTML

            if (noTemplateAndNoRendered) { //监视有没有在调用render方法内更新view，对于没有模板的view，需要派发一次事件
                me.rendered = 1;
                me.fire('primed', 0, 1); //primed事件只触发一次
            }
        };
        if (hasTmpl) {
            me.fetchTmpl(me.path, me.wrapAsync(ready));
        } else {
            ready();
        }
    },
    /**
     * 通知当前view即将开始进行html的更新
     * @param {String} [id] 哪块区域需要更新，默认整个view
     */
    beginUpdate: function(id) {
        var me = this;
        if (me.sign > 0 && me.rendered) {
            me.fire('prerender', {
                id: id
            });
            DestroyAllManaged.call(me, 0, 1);
        }
    },
    /**
     * 通知当前view结束html的更新
     * @param {String} [id] 哪块区域结束更新，默认整个view
     */
    endUpdate: function(id) {
        var me = this;
        if (me.sign > 0) {
            /*if(me.rendered&&me.enableAnim){
                var owner=me.owner;
                SafeExec(owner.newViewCreated,EMPTY_ARRAY,owner);
            }*/
            if (!me.rendered) { //触发一次primed事件
                me.fire('primed', 0, 1);
                me.rendered = 1;
            }
            me.fire('rendered', {
                id: id
            }); //可以在rendered事件中访问view.rendered属性
        }
    },
    /**
     * 通知当前view进行更新，与beginUpdate不同的是：begin是开始更新html，notify是开始调用更新的方法，通常render已经自动做了处理，对于用户自定义的获取数据并更新界面时，在开始更新前，需要调用一下该方法
     * @return {Integer} 当前view的签名
     */
    notifyUpdate: function() {
        var me = this;
        if (me.sign > 0) {
            me.sign++;
            me.fire('rendercall');
            DestroyAllManaged.call(me, 1, 1);
        }
        return me.sign;
    },
    /**
     * 包装mx-event，自动添加vframe id,用于事件发生时，调用该view处理
     * @param {String} html html字符串
     * @returns {String} 返回处理后的字符串
     */
    wrapMxEvent: function(html) {
        return (html + '').replace(MxEvt, '$&' + this.id + MxEvtSplit);
    },
    /**
     * 包装异步回调
     * @param  {Function} fn 异步回调的function
     * @return {Function}
     * @example
     * render:function(){
     *     setTimeout(this.wrapAsync(function(){
     *         //codes
     *     }),50000);
     * }
     * //为什么要包装一次？
     * //Magix是单页应用，有可能异步回调执行时，当前view已经被销毁。比如上例中的setTimeout，50s后执行回调，如果你的回调中去操作了DOM，则会出错，为了避免这种情况的出现，可以调用view的wrapAsync包装一次。(该示例中最好的做法是在view销毁时清除setTimeout，但有时候你很难控制回调的执行，所以最好包装一次)
     * //
     * //
     */
    wrapAsync: function(fn) {
        var me = this;
        var sign = me.sign;
        return function() {
            if (sign > 0 && sign == me.sign) {
                if (fn) fn.apply(this, arguments);
            }
        };
    },
    /**
     * 设置view的html内容
     * @param {String} id 更新节点的id
     * @param {Strig} html html字符串
     * @example
     * render:function(){
     *     this.setViewHTML(this.id,this.template);//渲染界面，当界面复杂时，请考虑用其它方案进行更新
     * }
     */
    /*
        1.首次调用：
            setNodeHTML -> delegate unbubble events -> rendered(事件) -> primed(事件)

        2.再次调用
            update(事件) -> prerender(事件) -> undelegate unbubble events -> anim... -> setNodeHTML -> delegate unbubble events -> rendered(事件)

        当prerender、rendered事件触发时，在vframe中

        prerender : unloadSubVframes

        rendered : loadSubVframes
     */
    setViewHTML: function(id, html) {
        var me = this,
            n;
        me.beginUpdate(id);
        if (me.sign > 0) {
            n = me.$(id);
            if (n) n.innerHTML = html;
        }
        me.endUpdate(id);
    },
    /**
     * 监视地址栏中的参数或pathname，有变动时，才调用当前view的locationChange方法。通常情况下location有变化就会引起当前view的locationChange被调用，但这会带来一些不必要的麻烦，所以你可以指定地址栏中哪些参数有变化时才引起locationChange调用，使得view只关注与自已需要刷新有关的参数
     * @param {Array|String|Object} args  数组字符串或对象
     * @example
     * return View.extend({
     *      init:function(){
     *          this.observeLocation('page,rows');//关注地址栏中的page rows2个参数的变化，当其中的任意一个改变时，才引起当前view的locationChange被调用
     *          this.observeLocation({
     *              pathname:true//关注pathname的变化
     *          });
     *          //也可以写成下面的形式
     *          //this.observeLocation({
     *          //    keys:['page','rows'],
     *          //    pathname:true
     *          //})
     *      },
     *      render:function(e){
     *          if(e.changed.isParam('page')){};//检测是否是page发生的改变
     *          if(e.changed.isParam('rows')){};//检测是否是rows发生的改变
     *      }
     * });
     */
    observeLocation: function(args) {
        var me = this,
            loc;
        loc = me.$ol;
        loc.f = 1;
        var keys = loc.ks;
        if (Magix._o(args)) {
            loc.pn = args.pathname;
            args = args.keys;
        }
        if (args) {
            loc.ks = keys.concat((args + '').split(COMMA));
        }
    },
    /**
     * 指定监控地址栏中pathname的改变
     * @example
     * return View.extend({
     *      init:function(){
     *          this.observePathname();//关注地址栏中pathname的改变，pathname改变才引起当前view的locationChange被调用
     *      },
     *      locationChange:function(e){
     *          if(e.changed.isPathname()){};//是否是pathname发生的改变
     *      }
     * });
     */
    /*observePathname:function(){
        var me=this;
        if(!me.$loc)me.$loc={};
        me.$loc.pn=true;
    },*/
    /**
     * 指定要监视地址栏中的哪些值有变化时，当前view的locationChange才会被调用。通常情况下location有变化就会引起当前view的locationChange被调用，但这会带来一些不必要的麻烦，所以你可以指定地址栏中哪些值有变化时才引起locationChange调用，使得view只关注与自已需要刷新有关的参数
     * @param {Array|String} keys            key数组或字符串
     * @param {Boolean} observePathname 是否监视pathname
     * @example
     * return View.extend({
     *      init:function(){
     *          this.observeParams('page,rows');//关注地址栏中的page rows2个参数的变化，当其中的任意一个改变时，才引起当前view的locationChange被调用
     *      },
     *      locationChange:function(e){
     *          if(e.changed.isParam('page')){};//检测是否是page发生的改变
     *          if(e.changed.isParam('rows')){};//检测是否是rows发生的改变
     *      }
     * });
     */
    /*observeParams:function(keys){
        var me=this;
        if(!me.$loc)me.$loc={};
        me.$loc.keys=Magix.isArray(keys)?keys:String(keys).split(COMMA);
    },*/
    /**
     * 检测通过observeLocation方法指定的key对应的值有没有发生变化
     * @param {Object} changed 对象
     * @return {Boolean} 是否发生改变
     * @private
     */
    olChg: function(changed) {
        var me = this;
        var loc = me.$ol;
        var res;
        if (loc.f) {
            if (loc.pn) {
                res = changed.pathname;
            }
            if (!res) {
                res = changed.isParam(loc.ks);
            }
        }
        return res;
    },

    /**
     * 销毁当前view
     * @private
     */
    oust: function() {
        var me = this;
        if (me.sign > 0) {
            me.sign = 0;
            me.fire(DestroyStr, 0, 1, 1);
            DestroyAllManaged.call(me);
            me.dEvts(1);
        }
        me.sign--;
    },
    /**
     * 获取渲染当前view的父view
     * @return {View}
     */
    parentView: function() {
        var me = this,
            vom = me.vom,
            owner = me.owner;
        var pVframe = vom.get(owner.pId),
            r = null;
        if (pVframe && pVframe.viewInited) {
            r = pVframe.view;
        }
        return r;
    },
    /**
     * 处理dom事件
     * @param {Object} e 事件信息对象
     * @private
     */
    pEvt: function(info, eventType, e) {
        var me = this;
        if ( /*me.enableEvent &&*/ me.sign > 0) {
            var m = EvtInfoCache.get(info);

            if (!m) {
                m = info.match(EvtInfoReg);
                m = {
                    n: m[1],
                    f: m[2],
                    i: m[3],
                    p: {}
                };
                if (m.i) {
                    m.i.replace(EvtParamsReg, function(x, a, b) {
                        m.p[a] = b;
                    });
                }
                EvtInfoCache.set(info, m);
            }
            var name = m.n + Left + eventType + Right;
            var fn = me[name];
            if (fn) {
                var tfn = e[m.f];
                if (tfn) {
                    tfn.call(e);
                }
                e.params = m.p;
                SafeExec(fn, e, me);
            }
        }
    },
    /**
     * 处理代理事件
     * @param {Boolean} dispose 是否销毁
     * @private
     */
    dEvts: function(destroy) {
        var me = this;
        var events = me.$evts;
        var vom = me.vom;
        for (var p in events) {
            Body.act(p, destroy, vom);
        }
        events = me.$sevts;
        p = events.length;
        while (p-- > 0) {
            vom = events[p];
            Body.lib(vom.h, vom.t, vom.f, destroy, me, 1);
        }
    },
    /**
     * 添加节点，用于inside的判断
     * @param {String} id dom节点id
     */
    addNode: function(id) {
        this.$ns[id] = 1;
    },
    /**
     * 移除节点
     * @param  {String} id dom节点id
     */
    removeNode: function(id) {
        delete this.$ns[id];
    },
    /**
     * 判断节点是否在当前view控制的dom节点内
     * @param  {String} node 节点id
     * @return {Boolean}
     */
    inside: function(node) {
        var me = this;
        var contained;
        for (var t in me.$ns) {
            contained = me.$c(node, t);
            if (contained) break;
        }
        if (!contained) {
            for (var p in me.cM) {
                var vframe = me.owner.get(p);
                contained = vframe.inside(node);
                if (contained) break;
            }
        }
        return contained;
    },
    /**
     * 调用magix/router的navigate方法
     * @function
     */
    navigate: Router.navigate,
    /**
     * 让view帮你管理资源，强烈建议对组件等进行托管
     * @param {String|Object} key 托管的资源或要共享的资源标识key
     * @param {Object} res 要托管的资源
     * @param {Boolean} [lastly] 是否在最终view销毁时才去销毁这个托管的资源，如果该参数为true时，可以调用destroyManaged来销毁这个资源
     * @return {Object} 返回传入的资源
     * @example
     * init:function(){
     *      this.manage('user_list',[//管理对象资源
     *          {id:1,name:'a'},
     *          {id:2,name:'b'}
     *      ],true);//仅在view销毁时才销毁这个托管的资源
     * },
     * render:function(){
     *      var _self=this;
     *      var m=new Model();
     *      m.load({
     *          success:function(resp){
     *              //TODO
     *              var brix=new BrixDropdownList();
     *
     *              _self.manage(brix);//管理组件
     *
     *              var pagination=_self.manage(new BrixPagination());//也可以这样
     *
     *              var timer=_self.manage(setTimeout(function(){
     *                  S.log('timer');
     *              },2000));//也可以管理定时器
     *
     *
     *              var userList=_self.getManaged('user_list');//通过key取托管的资源
     *
     *              S.log(userList);
     *          },
     *          error:function(msg){
     *              //TODO
     *          }
     *      });
     *
     *      _self.manage(m);
     * }
     */
    manage: function(key, res, lastly) {
        var me = this;
        var args = arguments;
        var hk = 1;

        var cache = me.$res;
        if (args.length == 1) {
            res = key;
            key = 'res_' + (ResCounter++);
            hk = 0;
        } else {
            //var old = cache[key];
            //if (old && old.res != res) { //销毁同key不同资源的旧资源
            me.destroyManaged(key); //
            //}
        }
        var oust;
        if (Magix._n(res)) {
            oust = DestroyTimer;
        } else {
            oust = Destroy;
        }
        var wrapObj = {
            hk: hk,
            res: res,
            ol: lastly,
            mr: res && res.$reqs,
            oust: oust
        };
        cache[key] = wrapObj;
        return res;
    },
    /**
     * 获取托管的资源
     * @param {String} key 托管资源时传入的标识key
     * @param {Boolean} [remove] 获取后是否从缓存中移除
     * @return {Object}
     */
    getManaged: function(key, remove) {
        var me = this;
        var cache = me.$res;
        var res = null;
        if (Has(cache, key)) {
            var wrapObj = cache[key];
            res = wrapObj.res;
            if (remove) {
                delete cache[key];
            }
        }
        return res;
    },
    /**
     * 移除托管的资源
     * @param {String|Object} key 托管时标识key或托管的对象
     * @return {Object} 返回移除的资源
     */
    removeManaged: function(key) {
        return this.getManaged(key, 1);
    },
    /**
     * 销毁托管的资源
     * @function
     * @param {String} key manage时提供的资源的key
     * @param {Boolean} [keepIt] 销毁后是否依然在缓存中保留该资源的引用
     * @return {Object} 返回销毁的托管资源
     */
    destroyManaged: function(key, keepIt) {
        var me = this;
        var cache = me.$res;
        var o = cache[key];
        var res;
        if (o && (!keepIt || !o.ol) /*&& (!o.mr || o.sign != view.sign)*/ ) { //暂不考虑render中多次setViewHTML的情况
            //var processed=false;
            res = o.res;
            o.oust(res);
            if (!o.hk || !keepIt) { //如果托管时没有给key值，则表示这是一个不会在其它方法内共享托管的资源，view刷新时可以删除掉
                delete cache[key];
            }
            /*me.fire('destroyManaged', {
                resource: res,
                processed: processed
            });*/
        }
        return res;
    }
    /**
     * 当您采用setViewHTML方法异步更新html时，通知view做好异步更新的准备，<b>注意:该方法最好和manage，setViewHTML一起使用。当您采用其它方式异步更新整个view的html时，仍需调用该方法</b>，建议对所有的异步更新回调使用manage方法托管，对更新整个view html前，调用beginAsyncUpdate进行更新通知
     * @example
     * // 什么是异步更新html？
     * render:function(){
     *      var _self=this;
     *      var m=new Model({uri:'user:list'});
     *      m.load({
     *          success:_self.manage(function(data){
     *              var html=Mu.to_html(_self.template,data);
     *              _self.setViewHTML(html);
     *          }),
     *          error:_self.manage(function(msg){
     *              _self.setViewHTML(msg);
     *          })
     *      })
     * }
     *
     * //如上所示，当调用render方法时，render方法内部使用model异步获取数据后才完成html的更新则这个render就是采用异步更新html的
     *
     * //异步更新带来的问题：
     * //view对象监听地址栏中的某个参数，当这个参数发生变化时，view调用render方法进行刷新，因为是异步的，所以并不能立即更新界面，
     * //当监控的这个参数连续变化时，view会多次调用render方法进行刷新，由于异步，你并不能保证最后刷新时发出的异步请求最后返回，
     * //有可能先发出的请求后返回，这样就会出现界面与url并不符合的情况，比如tabs的切换和tabPanel的更新，连续点击tab1 tab2 tab3
     * //会引起tabPanel这个view刷新，但是异步返回有可能3先回来2最后回来，会导致明明选中的是tab3，却显示着tab2的内容
     * //所以要么你自已在回调中做判断，要么把上面的示例改写成下面这样的：
     *  render:function(){
     *      var _self=this;
     *      _self.beginAsyncUpdate();//开始异步更新
     *      var m=new Model({uri:'user:list'});
     *      m.load({
     *          success:_self.manage(function(data){
     *              var html=Mu.to_html(_self.template,data);
     *              _self.setViewHTML(html);
     *          }),
     *          error:_self.manage(function(msg){
     *              _self.setViewHTML(msg);
     *          })
     *      });
     *      _self.endAsyncUpdate();//结束异步更新
     * }
     * //其中endAsyncUpdate是备用的，把你的异步更新的代码放begin end之间即可
     * //当然如果在每个异步更新的都需要这样写的话来带来差劲的编码体验，所以View会对render,renderUI,updateUI三个方法自动进行异步更新包装
     * //您在使用这三个方法异步更新html时无须调用beginAsyncUpdate和endAsyncUpdate方法
     * //如果除了这三个方法外你还要添加其它的异步更新方法，可调用View静态方法View.registerAsyncUpdateName来注册自已的方法
     * //请优先考虑使用render renderUI updateUI 这三个方法来实现view的html更新，其中render方法magix会自动调用，您就考虑后2个方法吧
     * //比如这样：
     *
     * renderUI:function(){//当方法名为 render renderUI updateUI时您不需要考虑异步更新带来的问题
     *      var _self=this;
     *      setTimeout(this.manage(function(){
     *          _self.setViewHTML(_self.template);
     *      }),5000);
     * },
     *
     * receiveMessage:function(e){
     *      if(e.action=='render'){
     *          this.renderUI();
     *      }
     * }
     *
     * //当您需要自定义异步更新方法时，可以这样：
     * KISSY.add("app/views/list",function(S,MxView){
     *      var ListView=MxView.extend({
     *          updateHTMLByXHR:function(){
     *              var _self=this;
     *              S.io({
     *                  success:_self.manage(function(html){
     *                      //TODO
     *                      _self.setViewHTML(html);
     *                  })
     *              });
     *          },
     *          receiveMessage:function(e){
     *              if(e.action=='update'){
     *                  this.updateHTMLByXHR();
     *              }
     *          }
     *      });
     *      ListView.registerAsyncUpdateName('updateHTMLByXHR');//注册异步更新html的方法名
     *      return ListView;
     * },{
     *      requires:["magix/view"]
     * })
     * //当您不想托管回调方法，又想消除异步更新带来的隐患时，可以这样：
     *
     * updateHTML:function(){
     *      var _self=this;
     *      var begin=_self.beginAsyncUpdate();//记录异步更新标识
     *      S.io({
     *          success:function(html){
     *              //if(_self.sign){//不托管方法时，您需要自已判断view有没有销毁(使用异步更新标识时，不需要判断exist)
     *                  var end=_self.endAsyncUpdate();//结束异步更新
     *                  if(begin==end){//开始和结束时的标识一样，表示view没有更新过
     *                      _self.setViewHTML(html);
     *                  }
     *              //}
     *          }
     *      });
     * }
     *
     * //顺带说一下signature
     * //并不是所有的异步更新都需要托管，考虑这样的情况：
     *
     * render:function(){
     *      ModelFactory.fetchAll({
     *          type:'User_List',
     *          cacheKey:'User_List'
     *      },function(m){
     *          //render
     *      });
     * },
     * //...
     * click:{
     *      addUser:function(e){
     *          var m=ModelFactory.getIf('User_List');
     *          var userList=m.get("userList");
     *          m.beginTransaction();
     *          userList.push({
     *              id:'xinglie',
     *              name:'xl'
     *          });
     *
     *          m.save({
     *              success:function(){//该回调不太适合托管
     *                  m.endTransaction();
     *                  Helper.tipMsg('添加成功')
     *              },
     *              error:function(msg){//该方法同样不适合托管，当数据保存失败时，需要回滚数据，而如果此时view有刷新或销毁，会导致该方法不被调用，无法达到数据的回滚
     *                  m.rollbackTransaction();
     *                  Helper.tipMsg('添加失败')
     *              }
     *          })
     *
     *      }
     * }
     *
     * //以上click中的方法这样写较合适：
     *
     * click:{
     *      addUser:function(e){
     *          var m=ModelFactory.getIf('User_List');
     *          var userList=m.get("userList");
     *          m.beginTransaction();
     *          userList.push({
     *              id:'xinglie',
     *              name:'xl'
     *          });
     *
     *          var sign=e.view.signature();//获取签名
     *
     *          m.save({
     *              success:function(){//该回调不太适合托管
     *                  m.endTransaction();
     *                  if(sign==e.view.signature()){//相等时表示view即没刷新也没销毁，此时才提示
     *                      Helper.tipMsg('添加成功')
     *                  }
     *              },
     *              error:function(msg){//该方法同样不适合托管，当数据保存失败时，需要回滚数据，而如果此时view有刷新或销毁，会导致该方法不被调用，无法达到数据的回滚
     *                  m.rollbackTransaction();
     *                  if(sign==e.view.signature()){//view即没刷新也没销毁
     *                      Helper.tipMsg('添加失败')
     *                  }
     *              }
     *          })
     *
     *      }
     * }
     *
     * //如果您无法识别哪些需要托管，哪些需要签名，统一使用托管方法就好了
     */
    /*beginAsyncUpdate:function(){
        return this.sign++;//更新sign
    },*/
    /**
     * 获取view在当前状态下的签名，view在刷新或销毁时，均会更新签名。(通过签名可识别view有没有搞过什么动作)
     */
    /*    signature:function(){
        return this.sign;
    },*/
    /**
     * 通知view结束异步更新html
     * @see View#beginAsyncUpdate
     */
    /*endAsyncUpdate:function(){
        return this.sign;
    },*/
    /**
     * 当view调用setViewHTML刷新前触发
     * @name View#prerender
     * @event
     * @param {Object} e
     */

    /**
     * 当view首次完成界面的html设置后触发，view有没有模板均会触发该事件，对于有模板的view，会等到模板取回，第一次调用setViewHTML更新界面后才触发，总之该事件触发后，您就可以访问view的HTML DOM节点对象（该事件仅代表自身的html创建完成，如果需要对整个子view也要监控，请使用created事件）
     * @name View#primed
     * @event
     * @param {Object} e view首次调用render完成界面的创建后触发
     */

    /**
     * 每次调用setViewHTML更新view内容完成后触发
     * @name View#rendered
     * @event
     * @param {Object} e view每次调用setViewHTML完成后触发，当hasTmpl属性为false时，并不会触发该事 件，但会触发primed首次完成创建界面的事件
     */

    /**
     * view销毁时触发
     * @name View#destroy
     * @event
     * @param {Object} e
     */

    /**
     * view调用init方法后触发
     * @name View#inited
     * @event
     * @param {Object} e
     */

    /**
     * view自身和所有子孙view创建完成后触发，常用于要在某个view中统一绑定事件或统一做字段校验，而这个view是由许多子孙view组成的，通过监听该事件可知道子孙view什么时间创建完成（注意：当view中有子view，且该子view是通过程序动态mountView而不是通过mx-view指定时，该事件会也会等待到view创建完成触发，而对于您在某个view中有如下代码：<div><vframe></vframe></div>，有一个空的vframe且未指定mx-view属性，同时您在这个view中没有动态渲染vframe对应的view，则该事件不会触发，magix无法识别出您留空vframe的意图，到底是需要动态mount还是手误，不过在具体应用中，出现空vframe且没有动态mount几乎是不存在的^_^）
     * @name View#created
     * @event
     * @param {Object} e
     * @example
     * init:function(){
     *      this.on('created',function(){
     *          //
     *      })
     * }
     */

    /**
     * view自身和所有子孙view有改动时触发，改动包括刷新和重新mountView，与created一起使用，当view自身和所有子孙view创建完成会触发created，当其中的一个view刷新或重新mountView，会触发childrenAlter，当是刷新时，刷新完成会再次触发created事件，因此这2个事件不只触发一次！！但这2个事件会成对触发，比如触发几次childrenAlter就会触发几次created
     * @name View#alter
     * @event
     * @param {Object} e
     */

    /**
     * 异步更新ui的方法(render)被调用前触发
     * @name View#rendercall
     * @event
     * @param {Object} e
     */

    /**
     * 当view准备好模板(模板有可能是异步获取的)，调用init和render之前触发。可在该事件内对template进行一次处理
     * @name View#interact
     * @event
     * @param {Object} e
     */
});
    var Paths = {};
    var Suffix = '?t=' + Math.random();

    /*var ProcessObject = function(props, proto, enterObject) {
        for (var p in proto) {
            if (Magix.isObject(proto[p])) {
                if (!Has(props, p)) props[p] = {};
                ProcessObject(props[p], proto[p], 1);
            } else if (enterObject) {
                props[p] = proto[p];
            }
        }
    };*/


    var Tmpls = {}, Locker = {};
    VProto.fetchTmpl = function(path, fn) {
        var me = this;
        var hasTemplate = 'template' in me;
        if (!hasTemplate) {
            if (Has(Tmpls, path)) {
                fn(Tmpls[path]);
            } else {
                var idx = path.indexOf('/');
                var name = path.substring(0, idx);
                if (!Paths[name]) {
                    Paths[name] = seajs.data.paths[name];
                }
                var file = Paths[name] + path.substring(idx + 1) + '.html';
                var l = Locker[file];
                var onload = function(tmpl) {
                    fn(Tmpls[path] = tmpl);
                };
                if (l) {
                    l.push(onload);
                } else {
                    l = Locker[file] = [onload];
                    $.ajax({
                        url: file + Suffix,
                        success: function(x) {
                            SafeExec(l, x);
                            delete Locker[file];
                        },
                        error: function(e, m) {
                            SafeExec(l, m);
                            delete Locker[file];
                        }
                    });
                }
            }
        } else {
            fn(me.template);
        }
    };

    View.extend = function(props, ctor, statics) {
        var me = this;
        var BaseView = function() {
            BaseView.superclass.constructor.apply(this, arguments);
            if (ctor) {
                SafeExec(ctor, arguments, this);
            }
        }
        BaseView.extend = me.extend;
        return Magix.extend(BaseView, me, props, statics);
    };
    return View;
});