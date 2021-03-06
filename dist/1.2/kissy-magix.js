(function(NULL,WINDOW,DOCUMENT,LIB,IdIt,COUNTER){COUNTER=0;IdIt=function(n){return n.id||(n.id='mx_n_'+(++COUNTER))};/**
 * @fileOverview Magix全局对象
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.1
 **/
LIB.add('magix/magix', function(S) {
    var Slice = [].slice;
    var Include = function(path) {
        var magixPackages = S.Config.packages.magix;
        var mPath = magixPackages.base || magixPackages.path || magixPackages.uri;

        var url = mPath + path + ".js?r=" + Math.random() + '.js';
        var xhr = WINDOW.ActiveXObject || WINDOW.XMLHttpRequest;
        var r = new xhr('Microsoft.XMLHTTP');
        r.open('GET', url, false);
        r.send(null);
        return r.responseText;
    };
    var PathRelativeReg = /\/\.\/|\/[^\/.]+?\/\.{2}\/|([^:\/])\/\/+|\.{2}\//; // ./|/x/../|(b)///
var PathTrimFileReg = /\/[^\/]*$/;
var PathTrimParamsReg = /[#?].*$/;
var EMPTY = '';
var ParamsReg = /([^=&?\/#]+)=?([^&=#?]*)/g;
var Path = 'path';
var ProtocalReg = /^https?:\/\//i;
//var Templates = {};
var CacheLatest = 0;
var Slash = '/';
var DefaultTagName = 'vframe';
var Newline = '\n';
var Console = WINDOW.console;
var SupportError = Console && Console.error;
/**
待重写的方法
@method imimpl
**/
var Unimpl = function() {
    throw new Error('unimplement method');
};
/**
 * 空方法
 */
var Noop = function() {};

var Cfg = {
    tagName: DefaultTagName,
    rootId: 'magix_vf_root',
    coded: 1,
    execError: function(e) {
        if (SupportError) {
            Console.error(e);
        }
    }
};
var HasProp = Cfg.hasOwnProperty;
/**
 * 检测某个对象是否拥有某个属性
 * @param  {Object}  owner 检测对象
 * @param  {String}  prop  属性
 * @return {Boolean} 是否拥有prop属性
 */
var Has = function(owner, prop) {
    return owner && HasProp.call(owner, prop); //false 0 null '' undefined
};
var GSObj = function(o) {
    return function(k, v, r) {
        switch (arguments.length) {
            case 0:
                r = o;
                break;
            case 1:
                if (Magix._o(k)) {
                    r = Mix(o, k);
                } else {
                    r = Has(o, k) ? o[k] :NULL;
                }
                break;
            case 2:
                if (v ===NULL) {
                    delete o[k];
                    r = v;
                } else {
                    o[k] = r = v;
                }
                break;
        }
        return r;
    };
};
var CacheSort = function(a, b) {
    return b.f - a.f || b.t - a.t;
};
var Cache = function(max, buffer) {
    var me = this;
    if (me.get) {
        me.c = [];
        me.x = max || 20;
        me.b = me.x + (buffer | 0 || 5); //buffer先取整，如果为0则再默认5
    } else {
        me = new Cache(max, buffer);
    }
    return me;
};

/**
 * 混合对象的属性
 * @param  {Object} aim    要mix的目标对象
 * @param  {Object} src    mix的来源对象
 * @param  {Object} ignore 在复制时，忽略的值
 * @return {Object}
 */
var Mix = function(aim, src, ignore) {
    for (var p in src) {
        if (!ignore || !Has(ignore, p)) {
            aim[p] = src[p];
        }
    }
    return aim;
};

Mix(Cache.prototype, {
    get: function(key) {
        var me = this;
        var c = me.c;
        var r;
        key = Path + key;
        if (Has(c, key)) {
            r = c[key];
            if (r.f >= 1) {
                r.f++;
                r.t = CacheLatest++;
                //
                r = r.v;
                //
            }
        }
        return r;
    },
    list: function() {
        return this.c;
    },
    set: function(okey, value, onRemove) {
        var me = this;
        var c = me.c;

        var key = Path + okey;
        var r = c[key];

        if (!Has(c, key)) {
            if (c.length >= me.b) {
                c.sort(CacheSort);
                var t = me.b - me.x;
                while (t--) {
                    r = c.pop();
                    //
                    delete c[r.k];
                    if (r.m) {
                        SafeExec(r.m, r.o, r);
                    }
                }
            }
            r = {};
            c.push(r);
            c[key] = r;
        }
        r.o = okey;
        r.k = key;
        r.v = value;
        r.f = 1;
        r.t = CacheLatest++;
        r.m = onRemove;
        return value;
    },
    del: function(k) {
        k = Path + k;
        var c = this.c;
        var r = c[k];
        if (r) {
            r.f = -1E5;
            r.v = EMPTY;
            delete c[k];
            if (r.m) {
                SafeExec(r.m, r.o, r);
                r.m = EMPTY;
            }
        }
    },
    has: function(k) {
        return Has(this.c, Path + k);
    }
});

var PathToObjCache = Cache(40);
var PathCache = Cache();

/**
 * 以try cache方式执行方法，忽略掉任何异常
 * @param  {Array} fns     函数数组
 * @param  {Array} args    参数数组
 * @param  {Object} context 在待执行的方法内部，this的指向
 * @return {Object} 返回执行的最后一个方法的返回值
 */
var SafeExec = function(fns, args, context, i, r, e) {
    if (!Magix._a(fns)) {
        fns = [fns];
    }
    if (!args || (!Magix._a(args) && !args.callee)) {
        args = [args];
    }
    for (i = 0; i < fns.length; i++) {
        
        e = fns[i];
        r = e && e.apply(context, args);
        
             
        
    }
    return r;
};


/**
 * Magix对象，提供常用方法
 * @name Magix
 * @namespace
 */
var Magix = {
    /**
     * @lends Magix
     */
    /**
     * 判断o是否为数组
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断o是否为对象
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断o是否为函数
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断o是否为正则
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断o是否为字符串
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断o是否为数字
     * @function
     * @param {Object} o 待检测的对象
     * @return {Boolean}
     */
    //
    /**
     * 判断是否可转为数字
     * @param  {Object}  o 待检测的对象
     * @return {Boolean}
     */
    /*  isNumeric: function(o) {
        return !isNaN(parseFloat(o)) && isFinite(o);
    },*/
    /**
     * 利用底层类库的包机制加载js文件，仅Magix内部使用，不推荐在app中使用
     * @function
     * @param {String} name 形如app/views/home这样的字符串
     * @param {Function} fn 加载完成后的回调方法
     * @private
     */
    
    /**
     * 通过xhr同步获取文件的内容，仅开发magix自身时使用
     * @function
     * @param {String} path 文件路径
     * @return {String} 文件内容
     * @private
     */
    
    /**
     * 把src对象的值混入到aim对象上
     * @function
     * @param  {Object} aim    要mix的目标对象
     * @param  {Object} src    mix的来源对象
     * @param  {Object} [ignore] 在复制时，需要忽略的key
     * @example
     *   var o1={
     *       a:10
     *   };
     *   var o2={
     *       b:20,
     *       c:30
     *   };
     *
     *   Magix.mix(o1,o2);//{a:10,b:20,c:30}
     *
     *   Magix.mix(o1,o2,{c:true});//{a:10,b:20}
     *
     *
     * @return {Object}
     */
    mix: Mix,
    /**
     * 未实现的方法
     * @function
     * @type {Function}
     * @private
     */
    
    /**
     * 检测某个对象是否拥有某个属性
     * @function
     * @param  {Object}  owner 检测对象
     * @param  {String}  prop  属性
     * @example
     *   var obj={
     *       key1:undefined,
     *       key2:0
     *   }
     *
     *   Magix.has(obj,'key1');//true
     *   Magix.has(obj,'key2');//true
     *   Magix.has(obj,'key3');//false
     *
     *
     * @return {Boolean} 是否拥有prop属性
     */
    has: Has,
    /**
     * 以try catch的方式执行方法，忽略掉任何异常
     * @function
     * @param  {Array} fns     函数数组
     * @param  {Array} args    参数数组
     * @param  {Object} context 在待执行的方法内部，this的指向
     * @return {Object} 返回执行的最后一个方法的返回值
     * @example
     * var f1=function(){
     *      throw new Error('msg');
     * };
     *
     * var f2=function(msg){
     *      return 'new_'+msg;
     * };
     *
     * var result=Magix.safeExec([f1,f2],new Date().getTime());
     *
     * S.log(result);//得到f2的返回值
     */
    safeExec: SafeExec,
    /**
     * 空方法
     * @function
     */
    noop: Noop,
    /**
     * 配置信息对象
     */
    /**
     * 设置或获取配置信息
     * @function
     * @param {Object} [cfg] 配置信息对象
     * @return {Object} 配置信息对象
     * @example
     * Magix.config({
     *      naviveHistory:true,
     *      rootId:'J_app_main'
     * });
     *
     * var config=Magix.config();
     *
     * S.log(config.rootId);
     */
    config: GSObj(Cfg),
    /**
     * 应用初始化入口
     * @param  {Object} cfg 初始化配置参数对象
     * @param {Boolean} cfg.nativeHistory 是否使用history state,当为true，并且浏览器支持的情况下会用history.pushState修改url，您应该确保服务器能给予支持。如果nativeHistory为false将使用hash修改url
     * @param {String} cfg.defaultView 默认加载的view
     * @param {String} cfg.defaultPathname 默认view对应的pathname
     * @param {String} cfg.notFoundView 404时加载的view
     * @param {Object} cfg.routes pathname与view映射关系表
     * @param {String} cfg.iniFile ini文件位置
     * @param {String} cfg.rootId 根view的id
     * @param {Array} cfg.extensions 需要加载的扩展
     * @param {Boolean} cfg.coded 是否对地址栏中的参数进行编码或解码，默认true
     * @param {Function} cfg.execError 发布版以try catch执行一些用户重写的核心流程，当出错时，允许开发者通过该配置项进行捕获。注意：您不应该在该方法内再次抛出任何错误！
     * @example
     * Magix.start({
     *      useHistoryState:true,
     *      rootId:'J_app_main',
     *      iniFile:'',//是否有ini配置文件
     *      defaultView:'app/views/layouts/default',//默认加载的view
     *      defaultPathname:'/home',
     *      routes:{
     *          "/home":"app/views/layouts/default"
     *      }
     * });
     */
    start: function(cfg) {
        var me = this;
        Mix(Cfg, cfg);
        me.use(['magix/router', 'magix/vom', cfg.iniFile], function(R, V, I) {
            Cfg = Mix(Cfg, I, cfg);
            Cfg['!tnc'] = Cfg.tagName != DefaultTagName;

            R.on('!ul', V.locChged);
            R.on('changed', V.locChged);

            me.use(Cfg.extensions, R.start);
        });
    },
    /**
     * 获取对象的keys
     * @function
     * @param  {Object} obj 要获取key的对象
     * @example
     *    var obj={
     *        key1:20,
     *        key2:60,
     *        a:3
     *    };
     *
     *    Magix.keys(obj);//['key1','key2','a']
     *
     * @return {Array}
     */
    keys: Object.keys || function(obj) {
        var keys = [];
        for (var p in obj) {
            if (Has(obj, p)) {
                keys.push(p);
            }
        }
        return keys;
    },
    /**
     * 获取或设置本地数据，您可以把整个app需要共享的数据，通过该方法进行全局存储，方便您在任意view中访问这份数据
     * @function
     * @param {String|Object} key 获取或设置数据的key
     * @param {[type]} [val] 设置的对象
     * @return {Object|Undefined}
     * @example
     * Magix.local({//以对象的形式存值
     *      userId:'58782'
     * });
     *
     * Magix.local('userName','xinglie.lkf');
     *
     * var userId=Magix.local('userId');//获取userId
     *
     * var locals=Magix.local();//获取所有的值
     *
     * S.log(locals);
     */
    local: GSObj({}),
    /**
     * 路径
     * @param  {String} url  参考地址
     * @param  {String} part 相对参考地址的片断
     * @return {String}
     * @example
     * http://www.a.com/a/b.html?a=b#!/home?e=f   /   => http://www.a.com/
     * http://www.a.com/a/b.html?a=b#!/home?e=f   ./     =>http://www.a.com/a/
     * http://www.a.com/a/b.html?a=b#!/home?e=f   ../../    => http://www.a.com/
     * http://www.a.com/a/b.html?a=b#!/home?e=f   ./../  => http://www.a.com/
     */
    path: function(url, part) {
        var key = url + Newline + part;
        var result = PathCache.get(key);
        if (!result) {
            if (ProtocalReg.test(part)) {
                result = part;
            } else {
                url = url.replace(PathTrimParamsReg, EMPTY).replace(PathTrimFileReg, EMPTY) + Slash;

                if (part.charAt(0) == Slash) {
                    var ds = ProtocalReg.test(url) ? 8 : 0;
                    var fs = url.indexOf(Slash, ds);

                    /* if(fs==-1){
                        result=url+part;
                    }else{*/
                    result = url.substring(0, fs) + part;
                    //}

                } else {
                    result = url + part;
                }
            }
            while (PathRelativeReg.test(result)) {
                //
                result = result.replace(PathRelativeReg, '$1/');
            }
            PathCache.set(key, result);
        }
        return result;
    },
    /**
     * 把路径字符串转换成对象
     * @param  {String} path 路径字符串
     * @param {Boolean} decode 是否对value进行decodeURIComponent
     * @return {Object} 解析后的对象
     * @example
     * var obj=Magix.pathToObject('/xxx/?a=b&c=d');
     * //obj={path:'/xxx/',params:{a:'b',c:'d'}}
     */
    pathToObject: function(path, decode) {
        //把形如 /xxx/a=b&c=d 转换成对象 {path:'/xxx/',params:{a:'b',c:'d'}}
        //1. /xxx/a.b.c.html?a=b&c=d  path /xxx/a.b.c.html
        //2. /xxx/?a=b&c=d  path /xxx/
        //3. /xxx/#?a=b => path /xxx/
        //4. /xxx/index.html# => path /xxx/index.html
        //5. /xxx/index.html  => path /xxx/index.html
        //6. /xxx/#           => path /xxx/
        //7. a=b&c=d          => path ''
        //8. /s?src=b#        => path /s params:{src:'b'}
        var key = path + Newline + decode;
        var r = PathToObjCache.get(key);
        if (!r) {
            r = {};
            var params = {};

            var pathname = EMPTY;
            if (PathTrimParamsReg.test(path)) { //有#?号，表示有pathname
                pathname = path.replace(PathTrimParamsReg, EMPTY);
            } else if (!~path.indexOf('=')) { //没有=号，路径可能是 xxx 相对路径
                pathname = path;
            }
            var querys = path.replace(pathname, EMPTY);
            if (pathname) {
                if (ProtocalReg.test(pathname)) { //解析以https?:开头的网址
                    var first = pathname.indexOf(Slash, 8); //找最近的 /
                    if (~first) {
                        pathname = pathname.substring(first); //截取
                    } else { //未找到，比如 http://etao.com
                        pathname = Slash; //则pathname为  /
                    }
                }
            }
            querys.replace(ParamsReg, function(match, name, value) {
                if (decode) {
                    try {
                        value = decodeURIComponent(value);
                    } catch (e) {

                    }
                }
                params[name] = value;
            });
            r[Path] = pathname;
            r.params = params;
            PathToObjCache.set(key, r);
        }
        return r;
    },
    /**
     * 把对象内容转换成字符串路径
     * @param  {Object} obj 对象
     * @param {Boolean} [encode] 是否对value进行encodeURIComponent
     * @param {Object} [keo] 是否保留空白值的对象
     * @return {String} 字符串路径
     * @example
     * var str=Magix.objectToPath({path:'/xxx/',params:{a:'b',c:'d'}});
     * //str==/xxx/?a=b&c=d
     *
     * var str=Magix.objectToPath({path:'/xxx/',params:{a:'',c:2}});
     *
     * //str==/xxx/?c=2
     *
     * var str=Magix.objectToPath({path:'/xxx/',params:{a:'',c:2}},{a:1});
     *
     * //str==/xxx/?a=&c=2
     */
    objectToPath: function(obj, encode, keo) { //上个方法的逆向
        var pn = obj[Path];
        var params = [];
        var oPs = obj.params;
        var v;
        for (var p in oPs) {
            v = oPs[p];
            if (!keo || v || Has(keo, p)) {
                if (encode) {
                    v = encodeURIComponent(v);
                }
                params.push(p + '=' + v);
            }
        }
        if (params.length) {
            pn = pn + '?' + params.join('&');
        }
        return pn;
    },
    /**
     * 读取或设置view的模板
     * @param  {String} key   形如~seed/app/common/footer的字符串
     * @param  {String} [value] 模板字符串
     * @return {String}
     */
    /*tmpl: function(key, value) {
        if (arguments.length == 1) {
            return {
                v: Templates[key],
                h: has(Templates, key)
            };
        }
        Templates[key] = value;
        return value;
    },*/
    /**
     * 把列表转化成hash对象
     * @param  {Array} list 源数组
     * @param  {String} key  以数组中对象的哪个key的value做为hahs的key
     * @return {Object}
     * @example
     * var map=Magix.listToMap([1,2,3,5,6]);
     * //=> {1:1,2:1,3:1,4:1,5:1,6:1}
     *
     * var map=Magix.listToMap([{id:20},{id:30},{id:40}],'id');
     * //=>{20:{id:20},30:{id:30},40:{id:40}}
     *
     * var map=Magix.listToMap('submit,focusin,focusout,mouseenter,mouseleave,mousewheel,change');
     *
     * //=>{submit:1,focusin:1,focusout:1,mouseenter:1,mouseleave:1,mousewheel:1,change:1}
     *
     */
    listToMap: function(list, key) {
        var i, e, map = {}, l;
        if (Magix._s(list)) {
            list = list.split(',');
        }
        if (list && (l = list.length)) {
            for (i = 0; i < l; i++) {
                e = list[i];
                map[key ? e[key] : e] = key ? e : 1;
            }
        }
        return map;
    },
    /**
     * 创建缓存对象
     * @function
     * @param {Integer} max 最大缓存数
     * @param {Integer} buffer 缓冲区大小
     * @example
     * var c=Magix.cache(5,2);//创建一个可缓存5个，且缓存区为2个的缓存对象
     * c.set('key1',{});//缓存
     * c.get('key1');//获取
     * c.del('key1');//删除
     * c.has('key1');//判断
     * //注意：缓存通常配合其它方法使用，不建议单独使用。在Magix中，对路径的解释等使用了缓存。在使用缓存优化性能时，可以达到节省CPU和内存的双赢效果
     */
    cache: Cache
};
    return Mix(Magix, {
        
        use: function(name, fn) {
            S.use(name && (name + EMPTY), function(S) {
                if (fn) {
                    fn.apply(S, Slice.call(arguments, 1));
                }
            });
        },
        _a: S.isArray,
        _f: S.isFunction,
        _o: S.isObject,
        //isRegExp: S.isRegExp,
        _s: S.isString,
        _n: S.isNumber
    });
});
/**
 * @fileOverview 路由
 * @author 行列
 * @version 1.1
 */
LIB.add('magix/router', function(S, Magix, Event, SE) {
    var EMPTY = '';
var PATH = 'path';
var VIEW = 'view';

var Has = Magix.has;
var Mix = Magix.mix;

var OKeys = Magix.keys;
var MxConfig = Magix.config();
var HrefCache = Magix.cache();
var ChgdCache = Magix.cache(40);

var TLoc, LLoc = {
    params: {},
    href: EMPTY
}, Pnr;
var TrimHashReg = /#.*$/,
    TrimQueryReg = /^[^#]*#?!?/;
var PARAMS = 'params';
var UseNativeHistory;
var Coded;
var SupportState, HashAsNativeHistory;

var IsParam = function(params, r, ps) {
    if (params) {
        ps = this[PARAMS];
        params = (params + EMPTY).split(',');
        for (var i = 0; i < params.length; i++) {
            r = Has(ps, params[i]);
            if (r) break;
        }
    }
    return r;
};
var IsPath = function() {
    return this[PATH];
};
var IsView = function() {
    return this[VIEW];
};


var GetSetParam = function(key, value, me, params) {
    me = this;
    params = me[PARAMS];
    return arguments.length > 1 ? params[key] = value : params[key];
};


var Path = function(path) {
    var o = Magix.pathToObject(path, Coded);
    var pn = o[PATH];
    if (pn && HashAsNativeHistory) { //如果不是以/开头的并且要使用history state,当前浏览器又不支持history state则放hash中的path要进行处理
        o[PATH] = Magix.path(WINDOW.location.pathname, pn);
    }
    return o;
};

//var PathTrimFileParamsReg=/(\/)?[^\/]*[=#]$/;//).replace(,'$1').replace(,EMPTY);
//var PathTrimSearch=/\?.*$/;
/**
 * 路由对象，操作URL
 * @name Router
 * @namespace
 * @borrows Event.on as on
 * @borrows Event.fire as fire
 * @borrows Event.off as off
 * @borrows Event.once as once
 * @borrows Event.rely as rely
 */
var Router = Mix({
    /**
     * @lends Router
     */
    /**
     * 使用history state做为改变url的方式来保存当前页面的状态
     * @function
     * @private
     */
    
    /**
     * 使用hash做为改变url的方式来保存当前页面的状态
     * @function
     * @private
     */
    
    /**
     * 根据地址栏中的path获取对应的前端view
     * @param  {String} path 形如/list/index这样的path
     * @param {Object} loc 内部临时使用的对象
     * @return {Object} 返回形如{view:'app/views/default',path:'/home'}这样的对象
     * @private
     */
    viewInfo: function(path, loc) {
        var r, result;
        if (!Pnr) {
            Pnr = {
                rs: MxConfig.routes || {},
                nf: MxConfig.notFoundView
            };
            //var home=pathCfg.defaultView;//处理默认加载的view
            //var dPathname=pathCfg.defaultPathname||EMPTY;
            var defaultView = MxConfig.defaultView;
            /*if (!defaultView) {
                throw new Error('unset defaultView');
            }*/
            Pnr.dv = defaultView;
            var defaultPathname = MxConfig.defaultPathname || EMPTY;
            //if(!Magix.isFunction(temp.rs)){
            r = Pnr.rs;
            Pnr.f = Magix._f(r);
            if (!Pnr.f && !r[defaultPathname] && defaultView) {
                r[defaultPathname] = defaultView;
            }
            Pnr[PATH] = defaultPathname;
        }

        if (!path) path = Pnr[PATH];

        r = Pnr.rs;
        if (Pnr.f) {
            result = r.call(MxConfig, path, loc);
        } else {
            result = r[path]; //简单的在映射表中找
        }
        return {
            view: result || Pnr.nf || Pnr.dv,
            path: path
        };
    },
    /**
     * 开始路由工作
     * @private
     */
    start: function() {
        var H = WINDOW.history;
        /*
        尽可能的延迟配置，防止被依赖时，配置信息不正确
         */
        UseNativeHistory = MxConfig.nativeHistory;
        Coded = MxConfig.coded;

        SupportState = UseNativeHistory && H.pushState;
        HashAsNativeHistory = UseNativeHistory && !SupportState;

        if (SupportState) {
            Router.useState();
        } else {
            Router.useHash();
        }
        Router.route(); //页面首次加载，初始化整个页面
    },

    /**
     * 解析href的query和hash，默认href为WINDOW.location.href
     * @param {String} [href] href
     * @return {Object} 解析的对象
     */
    parseQH: function(href, inner) {
        href = href || WINDOW.location.href;
        /*var cfg=Magix.config();
        if(!cfg.originalHREF){
            try{
                href=DECODE(href);//解码有问题 http://fashion.s.etao.com/search?q=%CF%CA%BB%A8&initiative_id=setao_20120529&tbpm=t => error:URIError: malformed URI sequence
            }catch(ignore){

            }
        }*/
        var result = HrefCache.get(href);
        if (!result) {
            var query = href.replace(TrimHashReg, EMPTY);
            //
            //var query=tPathname+params.replace(/^([^#]+).*$/g,'$1');
            var hash = href.replace(TrimQueryReg, EMPTY); //原始hash
            //
            var queryObj = Path(query);
            //
            var hashObj = Path(hash); //去掉可能的！开始符号
            //
            var comObj = {}; //把query和hash解析的参数进行合并，用于hash和pushState之间的过度
            Mix(comObj, queryObj[PARAMS]);
            Mix(comObj, hashObj[PARAMS]);
            result = {
                get: GetSetParam,
                set: GetSetParam,
                href: href,
                refHref: LLoc.href,
                srcQuery: query,
                srcHash: hash,
                query: queryObj,
                hash: hashObj,
                params: comObj
            };
            HrefCache.set(href, result);
        }
        if (inner && !result[VIEW]) {
            //
            var tempPathname;
            /*
                1.在选择path时，不能简单的把hash中的覆盖query中的。有可能是从不支持history state浏览器上拷贝链接到支持的浏览器上，分情况而定：
                如果hash中存在path则使用hash中的，否则用query中的

                2.如果指定不用history state则直接使用hash中的path

                以下是对第1条带hash的讨论
                // http://etao.com/list/?a=b#!/home?page=2&rows=20
                //  /list/index
                //  /home
                //   http://etao.com/list?page=3#!/home?page=2;
                // 情形A. path不变 http://etao.com/list?page=3#!/list?page=2 到支持history state的浏览器上 参数合并;
                // 情形B .path有变化 http://etao.com/list?page=3#!/home?page=2 到支持history state的浏览器上 参数合并,path以hash中的为准;
            */
            //if (UseNativeHistory) { //指定使用history state
            /*
                if(Router.supportState()){//当前浏览器也支持
                    if(hashObj[PATH]){//优先使用hash中的，理由见上1
                        tempPathname=hashObj[PATH];
                    }else{
                        tempPathname=queryObj[PATH];
                    }
                }else{//指定使用history 但浏览器不支持 说明服务器支持这个路径，规则同上
                    if(hashObj[PATH]){//优先使用hash中的，理由见上1
                        tempPathname=hashObj[PATH];
                    }else{
                        tempPathname=queryObj[PATH];
                    }
                }
                合并后如下：
                */
            //
            // tempPathname = result.hash[PATH] || result.query[PATH];
            //} else { //指定不用history state ，那咱还能说什么呢，直接用hash
            //tempPathname = result.hash[PATH];
            //}
            //上述if else简写成以下形式，方便压缩
            tempPathname = result.hash[PATH] || (UseNativeHistory && result.query[PATH]);
            var view = Router.viewInfo(tempPathname, result);
            Mix(result, view);
        }
        return result;
    },
    /**
     * 获取2个location对象之间的差异部分
     * @param  {Object} oldLocation 原始的location对象
     * @param  {Object} newLocation 当前的location对象
     * @return {Object} 返回包含差异信息的对象
     * @private
     */
    getChged: function(oldLocation, newLocation) {
        var oKey = oldLocation.href;
        var nKey = newLocation.href;
        var tKey = oKey + '\n' + nKey;
        var result = ChgdCache.get(tKey);
        if (!result) {
            var hasChanged, from, to;
            result = {};
            result[VIEW] = to;
            result[PATH] = to;
            result[PARAMS] = {};
            var tArr = [PATH, VIEW],
                idx, key;
            for (idx = 1; idx >= 0; idx--) {
                key = tArr[idx];
                from = oldLocation[key];
                to = newLocation[key];
                if (from != to) {
                    result[key] = {
                        from: from,
                        to: to
                    };
                    hasChanged = 1;
                }
            }


            var oldParams = oldLocation[PARAMS],
                newParams = newLocation[PARAMS];
            tArr = OKeys(oldParams).concat(OKeys(newParams));
            for (idx = tArr.length - 1; idx >= 0; idx--) {
                key = tArr[idx];
                from = oldParams[key];
                to = newParams[key];
                if (from != to) {
                    result[PARAMS][key] = {
                        from: from,
                        to: to
                    };
                    hasChanged = 1;
                }
            }
            result.occur = hasChanged;
            result.isParam = IsParam;
            result.isPath = IsPath;
            result.isView = IsView;
            ChgdCache.set(tKey, result);
        }
        return result;
    },
    /**
     * 根据WINDOW.location.href路由并派发相应的事件
     */
    route: function() {
        var location = Router.parseQH(0, 1);
        var firstFire = !LLoc.get; //是否强制触发的changed，对于首次加载会强制触发一次
        var changed = Router.getChged(LLoc, location);
        LLoc = location;
        if (changed.occur) {
            TLoc = location;
            Router.fire('changed', {
                location: location,
                changed: changed,
                force: firstFire
            });
        }
    },
    /**
     * 导航到新的地址
     * @param  {Object|String} pn path或参数字符串或参数对象
     * @param {String|Object} [params] 参数对象
     * @param {Boolean} [replace] 是否替换当前历史记录
     * @example
     * Magix.use('magix/router',function(S,R){
     *      R.navigate('/list?page=2&rows=20');//改变path和相关的参数，地址栏上的其它参数会进行丢弃，不会保留
     *      R.navigate('page=2&rows=20');//只修改参数，地址栏上的其它参数会保留
     *      R.navigate({//通过对象修改参数，地址栏上的其它参数会保留
     *          page:2,
     *          rows:20
     *      });
     *      R.navigate('/list',{//改变path和相关参数，丢弃地址栏上原有的其它参数
     *          page:2,
     *          rows:20
     *      });
     *
     *      //凡是带path的修改地址栏，都会把原来地址栏中的参数丢弃
     *
     * });
     */
    navigate: function(pn, params, replace) {

        if (!params && Magix._o(pn)) {
            params = pn;
            pn = EMPTY;
        }
        if (params) {
            pn = Magix.objectToPath({
                params: params,
                path: pn
            }, Coded);
        }
        //TLoc引用
        //pathObj引用
        //
        //temp={params:{},path:{}}
        //
        //Mix(temp,TLoc,temp);
        //
        //

        if (pn) {

            var pathObj = Path(pn);
            var temp = {};
            temp[PARAMS] = Mix({}, pathObj[PARAMS]);
            temp[PATH] = pathObj[PATH];

            if (temp[PATH]) {
                if (HashAsNativeHistory) { //指定使用history state但浏览器不支持，需要把query中的存在的参数以空格替换掉
                    var query = TLoc.query[PARAMS];
                    for (var p in query) {
                        if (Has(query, p) && !Has(temp[PARAMS], p)) {
                            temp[PARAMS][p] = EMPTY;
                        }
                    }
                }
            } else {
                var ps = Mix({}, TLoc[PARAMS]);
                temp[PARAMS] = Mix(ps, temp[PARAMS]);
                temp[PATH] = TLoc[PATH];
            }
            var tempPath = Magix.objectToPath(temp, Coded, TLoc.query[PARAMS]);
            var navigate;

            navigate = tempPath != TLoc[SupportState ? 'srcQuery' : 'srcHash'];

            if (navigate) {

                if (SupportState) { //如果使用pushState
                    Router.poped = 1;
                    history[replace ? 'replaceState' : 'pushState'](EMPTY, EMPTY, tempPath);
                    Router.route();
                } else {
                    Mix(temp, TLoc, temp);
                    temp.srcHash = tempPath;
                    temp.hash = {
                        params: temp[PARAMS],
                        path: temp[PATH]
                    };
                    /*
                        WINDOW.onhashchange=function(e){
                        };
                        (function(){
                            location.hash='a';
                            location.hash='b';
                            location.hash='c';
                        }());


                     */
                    Router.fire('!ul', {
                        loc: TLoc = temp
                    }); //hack 更新view的location属性
                    tempPath = '#!' + tempPath;
                    if (replace) {
                        location.replace(tempPath);
                    } else {
                        location.hash = tempPath;
                    }
                }
            }
        }
    }

    /**
     * 当WINDOW.location.href有改变化时触发
     * @name Router.changed
     * @event
     * @param {Object} e 事件对象
     * @param {Object} e.location 地址解析出来的对象，包括query hash 以及 query和hash合并出来的params等
     * @param {Object} e.changed 有哪些值发生改变的对象，可通过读取该对象下面的path,view或params，来识别值是从(from)什么值变成(to)什么值
     * @param {Boolean} e.force 标识是否是第一次强制触发的changed，对于首次加载完Magix，会强制触发一次changed
     */

    /**
     * 当WINDOW.location.href有改变化时触发（该事件在扩展中实现）
     * @name Router.change
     * @event
     * @param {Object} e 事件对象
     * @param {Object} e.location 地址解析出来的对象，包括query hash 以及 query和hash合并出来的params等
     * @param {Function} e.back 回退到变化前的地址上，阻止跳转
     */

}, Event);
    Router.useState = function() {
        var initialURL = location.href;
        SE.on(WINDOW, 'popstate', function(e) {
            var equal = location.href == initialURL;
            if (!Router.poped && equal) return;
            Router.poped = 1;
            Router.route();
        });
    };
    Router.useHash = function() { //extension impl change event
        SE.on(WINDOW, 'hashchange', Router.route);
    };
    return Router;
}, {
    requires: ["magix/magix", "magix/event", "event"]
});
/**
 * @fileOverview body事件代理
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.1
 **/
LIB.add('magix/body', function(S, Magix) {
    var Has = Magix.has;
//依赖类库才能支持冒泡的事件
var RootEvents = {};
var MxEvtSplit = String.fromCharCode(26);

var MxIgnore = 'mx-ei';
var MxOwner = 'mx-owner';
var RootNode = DOCUMENT.body;
var ParentNode = 'parentNode';
var TypesRegCache = {};
var IdCounter = 1 << 16;
var On = 'on';
var Comma = ',';


var GetSetAttribute = function(dom, attrKey, attrVal) {
    if (attrVal) {
        dom.setAttribute(attrKey, attrVal);
    } else {
        attrVal = dom.getAttribute(attrKey);
    }
    return attrVal;
};
var Halt = function() {
    this.prevent();
    this.stop();
};
var VOM;
var Body = {
    
    process: function(e) {
        if (e && !e[On]) {
            var target = e.target || e.srcElement || RootNode; //原生事件对象Cordova没有target对象
            e[On] = 1;
            /*
                考虑如ff浏览器支持向e设置属性，但不显示，也有可能后续版本不支持设置属性，需如下修正
                if(!e[On]){
                    var temp=Mix({},e);
                    temp.oe=e;
                    temp.stopPropagation=function(){this.oe.stopPropagation();};
                    temp.preventDefault=function(){this.oe.preventDefault();};
                    e=temp;
                }
             */
            //var cTarget = e.currentTarget; //只处理类库(比如KISSY)处理后的currentTarget
            //if (cTarget && cTarget != RootNode) target = cTarget; //类库处理后代理事件的currentTarget并不是根节点
            while (target && target.nodeType != 1) {
                target = target[ParentNode];
            }
            var current = target;
            var eventType = e.type;
            var eventReg = TypesRegCache[eventType] || (TypesRegCache[eventType] = new RegExp(Comma + eventType + '(?:,|$)'));
            //
            //if (!eventReg.test(GetSetAttribute(target, MxIgnore))) {
            var type = 'mx-' + eventType;
            var info;
            var ignore;
            var arr = [];

            while (current && current.nodeType == 1) { //找事件附近有mx-[a-z]+事件的DOM节点
                info = GetSetAttribute(current, type);
                ignore = GetSetAttribute(current, MxIgnore); //current.getAttribute(MxIgnore);
                if (info || eventReg.test(ignore)) {
                    break;
                } else {
                    arr.push(current);
                    current = current[ParentNode];
                }
            }
            if (info) { //有事件
                //找处理事件的vframe
                var vId;
                var ts = info.split(MxEvtSplit);
                if (ts.length > 1) {
                    vId = ts[0];
                    info = ts.pop();
                }
                vId = vId || GetSetAttribute(current, MxOwner);
                if (!vId) { //如果没有则找最近的vframe
                    var begin = current;
                    var vfs = VOM.all();
                    while (begin) {
                        if (Has(vfs, begin.id)) {
                            GetSetAttribute(current, MxOwner, vId = begin.id);
                            break;
                        }
                        begin = begin[ParentNode];
                    }
                }
                if (vId) { //有处理的vframe,派发事件，让对应的vframe进行处理

                    var vframe = VOM.get(vId);
                    var view = vframe && vframe.view;
                    if (view) {
                        e.currentId = IdIt(current);
                        e.targetId = IdIt(target);
                        e.prevent = e.preventDefault;
                        e.stop = e.stopPropagation;
                        e.halt = Halt;
                        view.pEvt(info, eventType, e);
                    }
                } else {
                    throw Error('bad:' + info);
                }
            } else {
                var node;
                while (arr.length) {
                    node = arr.pop();
                    ignore = GetSetAttribute(node, MxIgnore) || On;
                    if (!eventReg.test(ignore)) {
                        ignore = ignore + Comma + eventType;
                        GetSetAttribute(node, MxIgnore, ignore);
                    }
                }
                node =NULL;
            }
            current = target =NULL;
        }
        //}
    },
    act: function(type, remove, vom) {
        var counter = RootEvents[type] || 0;
        var step = counter > 0 ? 1 : 0;
        var fn = Body.process;
        counter += remove ? -step : step;
        if (!counter) {
            if (vom) {
                VOM = vom;
            }
            Body.lib(RootNode, type, fn, remove);
            if (!remove) {
                counter = 1;
            }
        }
        RootEvents[type] = counter;
    }
};
    var Delegates = {
        mouseenter: 2,
        mouseleave: 2
    };
    Body.lib = function(node, type, cb, remove, scope, direct) {
        S.use('event', function(S, SE) {
            var flag = Delegates[type];
            if (!direct && flag == 2) {
                flag = (remove ? 'un' : '') + 'delegate';
                SE[flag](node, type, '[mx-' + type + ']', cb);
            } else {
                flag = remove ? 'detach' : 'on';
                SE[flag](node, type, cb, scope);
            }
        });
    };
    return Body;
}, {
    requires: ['magix/magix']
});
/**
 * @fileOverview 多播事件对象
 * @author 行列<xinglie.lkf@taobao.com>
 * @version 1.1
 **/
LIB.add("magix/event", function(S, Magix) {
    /**
 * 根据名称生成事件数组的key
 * @param {Strig} name 事件名称
 * @return {String} 包装后的key
 */
var GenKey = function(name) {
    return '~' + name;
};

var SafeExec = Magix.safeExec;
/**
 * 多播事件对象
 * @name Event
 * @namespace
 */
var Event = {
    /**
     * @lends Event
     */
    /**
     * 触发事件
     * @param {String} name 事件名称
     * @param {Object} data 事件对象
     * @param {Boolean} remove 事件触发完成后是否移除这个事件的所有监听
     * @param {Boolean} lastToFirst 是否从后向前触发事件的监听列表
     */
    fire: function(name, data, remove, lastToFirst) {
        var key = GenKey(name),
            me = this,
            list = me[key];
        if (list) {
            if (!data) data = {};
            if (!data.type) data.type = name;
            var end = list.length,
                len = end - 1,
                idx, t;
            while (end--) {
                idx = lastToFirst ? end : len - end;
                t = list[idx];
                if (t.d || t.r) {
                    list.splice(idx, 1);
                    len--;
                }
                if (!t.d) SafeExec(t.f, data, me);
            }
            //
            remove = remove || len < 0; //如果list中没有回调函数，则删除
        }
        if (remove) {
            delete me[key];
        }
    },
    /**
     * 绑定事件
     * @param {String} name 事件名称
     * @param {Function} fn 事件回调
     * @param {Interger} insert 事件监听插入的位置
     * @example
     * var T=Magix.mix({},Event);
        T.on('done',function(e){
            alert(1);
        });
        T.on('done',function(e){
            alert(2);
            T.off('done',arguments.callee);
        });
        T.on('done',function(e){
            alert(3);
        },0);//监听插入到开始位置

        T.once('done',function(e){
            alert('once');
        });

        T.fire('done',{data:'test'});
        T.fire('done',{data:'test2'});
     */
    on: function(name, fn, insert) {
        var key = GenKey(name);
        var list = this[key] || (this[key] = []);
        var wrap = {
            f: fn
        };
        if (isNaN(insert)) {
            wrap.r = insert;
            list.push(wrap);
        } else {
            list.splice(insert | 0, 0, wrap);
        }
    },
    /**
     * 依托另外一个对象的事件自动解绑
     * @param {String} name 事件名称
     * @param {Function} fn 事件回调
     * @param {Object} relyObj 依托的对象
     * @param {String} relyName 依托的名称
     * @param {Interger} insert 事件监听插入的位置
     * @example
     * var a=Magix.mix({},Event);
     * var b=Magix.mix({},Event);
     * a.rely('test',function(e){
     *
     * },b,'destroy');
     *
     * a.fire('test');//正常
     * b.fire('destroy');
     * a.fire('test');//不再打印console.log
     */
    rely: function(name, fn, relyObj, relyName, insert) {
        var me = this;
        me.on(name, fn, insert);
        relyObj.on(relyName, function() {
            me.off(name, fn);
        }, GenKey);
    },
    /**
     * 解除事件绑定
     * @param {String} name 事件名称
     * @param {Function} fn 事件回调
     */
    off: function(name, fn) {
        var key = GenKey(name),
            list = this[key];
        if (list) {
            if (fn) {
                for (var i = list.length - 1, t; i >= 0; i--) {
                    t = list[i];
                    if (t.f == fn && !t.d) {
                        t.d = 1;
                        break;
                    }
                }
            } else {
                delete this[key];
            }
        }
    },
    /**
     * 绑定事件，触发一次后即解绑
     * @param {String} name 事件名称
     * @param {Function} fn 事件回调
     */
    once: function(name, fn) {
        this.on(name, fn, GenKey);
    }
};
Magix.mix(Magix.local, Event);
    return Event;
}, {
    requires: ["magix/magix"]
});
/**
 * @fileOverview Vframe类
 * @author 行列
 * @version 1.1
 */
LIB.add('magix/vframe', function(S, Magix, Event, BaseView) {
    var VframeIdCounter = 1 << 16;
var SafeExec = Magix.safeExec;
var EmptyArr = [];


var Mix = Magix.mix;

var MxConfig = Magix.config();

var TagName;
var TagNameChanged;
var UseQSA;
var ReadMxVframe;
var Selector;
var MxVframe = 'mx-vframe';

var Has = Magix.has;
var SupportContains;
var QSA = 'querySelectorAll';


var Alter = 'alter';
var Created = 'created';
var RootVframe;
var GlobalAlter;

var $ = function(id) {
    return typeof id == 'object' ? id : DOCUMENT.getElementById(id);
};
var $$ = function(id, node, arr) {
    node = $(id);
    if (node) {
        arr = UseQSA ? DOCUMENT[QSA]('#' + IdIt(node) + Selector) : node.getElementsByTagName(TagName);
    }
    return arr || EmptyArr;
};




var NodeIn = function(a, b, r) {
    a = $(a);
    b = $(b);
    if (a && b) {
        if (a !== b) {
            try {
                r = SupportContains ? b.contains(a) : b.compareDocumentPosition(a) & 16;
            } catch (e) {
                r = 0;
            }
        } else {
            r = 1;
        }
    }
    return r;
};
//var ScriptsReg = /<script[^>]*>[\s\S]*?<\/script>/ig;
var RefLoc, RefChged, RefVOM;
/**
 * Vframe类
 * @name Vframe
 * @class
 * @constructor
 * @borrows Event.on as #on
 * @borrows Event.fire as #fire
 * @borrows Event.off as #off
 * @borrows Event.once as #once
 * @borrows Event.rely as #rely
 * @param {String} id vframe id
 * @property {String} id vframe id
 * @property {View} view view对象
 * @property {VOM} owner VOM对象
 * @property {Boolean} viewInited view是否完成初始化，即view的inited事件有没有派发
 * @property {Boolean} viewPrimed view是否完成首次渲染，即view的primed事件有没有派发
 * @property {String} pId 父vframe的id，如果是根节点则为undefined
 */
var Vframe = function(id) {
    var me = this;
    me.id = id;
    //me.vId=id+'_v';
    me.cM = {};
    me.cC = 0;
    me.rC = 0;
    me.sign = 1 << 30;
    me.rM = {};
    me.owner = RefVOM;
    RefVOM.add(id, me);
};
/**
 * 获取根vframe
 * @param {VOM} vom vom对象
 * @param {Object} refLoc 引用的Router解析出来的location对象
 * @param {Object} refChged 引用的URL变化对象
 * @return {Vframe}
 * @private
 */
Vframe.root = function(owner, refLoc, refChged) {
    if (!RootVframe) {
        /*
            尽可能的延迟配置，防止被依赖时，配置信息不正确
        */
        TagName = MxConfig.tagName;
        TagNameChanged = MxConfig['!tnc'];
        UseQSA = TagNameChanged && DOCUMENT[QSA];
        Selector = ' ' + TagName + '[' + MxVframe + '=true]';
        ReadMxVframe = TagNameChanged && !UseQSA;

        var body = DOCUMENT.body;
        SupportContains = body.contains;

        RefLoc = refLoc;
        RefChged = refChged;
        RefVOM = owner;

        var rootId = MxConfig.rootId;
        var e = $(rootId);
        if (!e) {
            e = DOCUMENT.createElement(TagName);
            e.id = rootId;
            body.appendChild(e);
            e =NULL;
        }
        RootVframe = new Vframe(rootId);
    }
    return RootVframe;
};

Mix(Mix(Vframe.prototype, Event), {
    /**
     * @lends Vframe#
     */
    /**
     * 是否启用场景转场动画，相关的动画并未在该类中实现，如需动画，需要mxext/vfanim扩展来实现，设计为方法而不是属性可方便针对某些vframe使用动画
     * @return {Boolean}
     * @default false
     * @function
     */
    //useAnimUpdate:Magix.noop,
    /**
     * 转场动画时或当view启用刷新动画时，旧的view销毁时调用
     * @function
     */
    //oldViewDestroy:Magix.noop,
    /**
     * 转场动画时或当view启用刷新动画时，为新view准备好填充的容器
     * @function
     */
    //prepareNextView:Magix.noop,
    /**
     * 转场动画时或当view启用刷新动画时，新的view创建完成时调用
     * @function
     */
    //newViewCreated:Magix.noop,
    /**
     * 加载对应的view
     * @param {String} viewPath 形如:app/views/home?type=1&page=2 这样的view路径
     * @param {Object|Null} viewInitParams 调用view的init方法时传递的参数
     */
    mountView: function(viewPath, viewInitParams) {
        var me = this;
        var node = $(me.id);
        if (!me._a) {
            me._a = 1;
            me._t = node.innerHTML; //.replace(ScriptsReg, '');
        }
        //var useTurnaround=me.viewInited&&me.useAnimUpdate();
        me.unmountView();
        if (viewPath) {
            var po = Magix.pathToObject(viewPath, MxConfig.coded);
            var vn = po.path;
            var sign = --me.sign;
            Magix.use(vn, function(View) {
                if (sign == me.sign) { //有可能在view载入后，vframe已经卸载了

                    BaseView.prepare(View);

                    var view = new View({
                        owner: me,
                        id: me.id,
                        $: $,
                        $c: NodeIn,
                        path: vn,
                        vom: RefVOM,
                        location: RefLoc
                    });
                    me.view = view;
                    var mountZoneVframes = function(e) {
                        me.mountZoneVframes(e.id);
                    };
                    view.on('interact', function(e) { //view准备好后触发
                        if (!e.tmpl) {
                            node.innerHTML = me._t;
                            mountZoneVframes($);
                        }
                        view.on('primed', function() {
                            me.viewPrimed = 1;
                            me.fire('viewMounted');
                        });
                        view.on('rendered', mountZoneVframes);
                        view.on('prerender', function(e) {
                            if (!me.unmountZoneVframes(e.id, 1)) {
                                me.cAlter();
                            }
                        });
                    }, 0);
                    viewInitParams = viewInitParams || {};
                    view.load(Mix(viewInitParams, po.params, viewInitParams), RefChged);
                }
            });
        }
    },
    /**
     * 销毁对应的view
     */
    unmountView: function() {
        var me = this;
        var view = me.view;
        if (view) {
            if (!GlobalAlter) {
                GlobalAlter = {};
            }
            me.unmountZoneVframes(0, 1);
            me.cAlter(GlobalAlter);

            me.view = 0; //unmountView时，尽可能早的删除vframe上的view对象，防止view销毁时，再调用该 vfrmae的类似unmountZoneVframes方法引起的多次created
            view.oust();

            var node = $(me.id);
            if (node && me._a) {
                node.innerHTML = me._t;
            }

            me.viewInited = 0;
            if (me.viewPrimed) { //viewMounted与viewUnmounted成对出现
                me.viewPrimed = 0;
                me.fire('viewUnmounted');
            }
            GlobalAlter = 0;
        }
        me.sign--;
    },
    /**
     * 加载vframe
     * @param  {String} id             节点id
     * @param  {String} viewPath       view路径
     * @param  {Object} viewInitParams 传递给view init方法的参数
     * @return {Vframe} vframe对象
     * @example
     * //html
     * &lt;div id="magix_vf_defer"&gt;&lt;/div&gt;
     *
     *
     * //js
     * view.owner.mountVframe('magix_vf_defer','app/views/list',{page:2})
     * //注意：动态向某个节点渲染view时，该节点无须是vframe标签
     */
    mountVframe: function(id, viewPath, viewInitParams) {
        var me = this;
        if (me.fcc) me.cAlter(); //如果在就绪的vframe上渲染新的vframe，则通知有变化
        //var vom = me.owner;
        var vf = RefVOM.get(id);
        if (!vf) {
            vf = new Vframe(id);

            vf.pId = me.id;

            if (!Has(me.cM, id)) {
                me.cC++;
            }
            me.cM[id] = 1;
        }
        vf.mountView(viewPath, viewInitParams);
        return vf;
    },
    /**
     * 加载当前view下面的子view，因为view的持有对象是vframe，所以是加载vframes
     * @param {HTMLElement|String} zoneId 节点对象或id
     * @param {Object} viewInitParams 传递给view init方法的参数
     */
    mountZoneVframes: function(zoneId, viewInitParams) {
        var me = this;
        zoneId = zoneId || me.id;
        me.unmountZoneVframes(zoneId, 1);

        var vframes = $$(zoneId);
        var count = vframes.length;
        var subs = {};

        if (count) {
            for (var i = 0, vframe, key, mxView, mxBuild; i < count; i++) {
                vframe = vframes[i];

                key = IdIt(vframe);
                if (!Has(subs, key)) {
                    mxView = vframe.getAttribute('mx-view');
                    mxBuild = ReadMxVframe ? vframe.getAttribute(MxVframe) : 1;

                    if (mxBuild || mxView) {
                        me.mountVframe(key, mxView, viewInitParams);
                        var svs = $$(vframe);
                        for (var j = 0, c = svs.length, temp; j < c; j++) {
                            temp = svs[j];
                            subs[IdIt(temp)] = 1;
                        }
                    }
                }
            }
        }
        //if (me.cC == me.rC) { //有可能在渲染某个vframe时，里面有n个vframes，但立即调用了mountZoneVframes，这个下面没有vframes，所以要等待
        me.cCreated();
        //}
    },
    /**
     * 销毁vframe
     * @param  {String} [id]      节点id
     * @param {Boolean} [inner] 内部调用时传递
     */
    unmountVframe: function(id, inner) { //inner 标识是否是由内部调用，外部不应该传递该参数
        var me = this;
        id = id || me.id;
        //var vom = me.owner;
        var vf = RefVOM.get(id);
        if (vf) {
            var fcc = vf.fcc;
            vf.unmountView();
            RefVOM.remove(id, fcc);
            var p = RefVOM.get(vf.pId);
            if (p && Has(p.cM, id)) {
                delete p.cM[id];
                p.cC--;
                if (!inner) {
                    p.cCreated();
                }
            }
        }
    },
    /**
     * 销毁某个区域下面的所有子vframes
     * @param {HTMLElement|String} [zoneId]节点对象或id
     * @param {Boolean} [inner] 内部调用时传递，用于判断在这个区域内稍后是否还有vframes渲染，如果有，则为true，否则为false
     */
    unmountZoneVframes: function(zoneId, inner) {
        var me = this;
        var hasVframe;
        var p;
        var cm = me.cM;
        for (p in cm) {
            if (!zoneId || NodeIn(p, zoneId)) {
                me.unmountVframe(p, hasVframe = 1);
            }
        }
        if (!inner) {
            me.cCreated();
        }
        return hasVframe;
    },
    /**
     * 调用view的方法
     * @param  {String} name 方法名
     * @param  {Array} args 参数
     * @return {Object}
     */
    invokeView: function(name, args) {
        var result;
        var vf = this;
        if (vf.viewInited) {
            var view = vf.view;
            var fn = view && view[name];
            if (fn) {
                result = SafeExec(fn, args || EmptyArr, view);
            }
        }
        return result;
    },
    /**
     * 通知所有的子view创建完成
     * @private
     */
    cCreated: function(e) {
        var me = this;
        if (me.cC == me.rC) {
            var view = me.view;
            if (view && !me.fcc) {
                me.fcc = 1;
                me.fca = 0;
                view.fire(Created, e);
                me.fire(Created, e);
            }
            var mId = me.id;
            var p = RefVOM.get(me.pId);
            if (p && !Has(p.rM, mId)) {

                p.rM[mId] = p.cM[mId];
                p.rC++;
                p.cCreated(e);

            }
        }
    },
    /**
     * 通知子vframe有变化
     * @private
     */
    cAlter: function(e) {
        var me = this;
        if (!e) e = {};
        var fcc = me.fcc;
        me.fcc = 0;
        if (!me.fca && fcc) { //当前vframe触发过created才可以触发alter事件
            var view = me.view;
            var mId = me.id;
            if (view) {
                me.fca = 1;
                view.fire(Alter, e);
                me.fire(Alter, e);
            }
            //var vom = me.owner;
            var p = RefVOM.get(me.pId);

            if (p && Has(p.rM, mId)) {
                p.rC--;
                delete p.rM[mId];
                p.cAlter(e);
            }
        }
    },
    /**
     * 通知当前vframe，地址栏发生变化
     * @private
     */
    locChged: function() {
        var me = this;
        var view = me.view;
        if (me.viewInited && view && view.sign > 0) { //存在view时才进行广播，对于加载中的可在加载完成后通过调用view.location拿到对应的WINDOW.location.href对象，对于销毁的也不需要广播

            var isChanged = view.olChg(RefChged);
            /**
             * 事件对象
             * @type {Object}
             * @ignore
             */
            var args = {
                location: RefLoc,
                changed: RefChged,
                /**
                 * 阻止向所有的子view传递
                 * @ignore
                 */
                prevent: function() {
                    this.cs = EmptyArr;
                },
                /**
                 * 向特定的子view传递
                 * @param  {Array} c 子view数组
                 * @ignore
                 */
                to: function(c) {
                    //c = c || EmptyArr;
                    if (Magix._s(c)) {
                        c = c.split(',');
                    }
                    this.cs = c || EmptyArr;
                }
            };
            if (isChanged) { //检测view所关注的相应的参数是否发生了变化
                view.render(args);
            }
            var cs = args.cs || Magix.keys(me.cM);
            //
            for (var i = 0, j = cs.length, vf; i < j; i++) {
                vf = RefVOM.get(cs[i]);
                if (vf) {
                    vf.locChged();
                }
            }
        }
    }

    /**
     * 子孙view修改时触发
     * @name Vframe#alter
     * @event
     * @param {Object} e
     */

    /**
     * 子孙view创建完成时触发
     * @name Vframe#created
     * @event
     * @param {Object} e
     */

    /**
     * view完成首次渲染(即primed事件触发)后触发
     * @name Vframe#viewMounted
     * @event
     * @param {Object} e
     */

    /**
     * view销毁时触发
     * @name Vframe#viewUnmounted
     * @event
     * @param {Object} e
     */
});

/**
 * Vframe 中的2条线
 * 一：
 *     渲染
 *     每个Vframe有cC(childrenCount)属性和cM(childrenItems)属性
 *
 * 二：
 *     修改与创建完成
 *     每个Vframe有rC(readyCount)属性和rM(readyMap)属性
 *
 *      fca firstChildrenAlter  fcc firstChildrenCreated
 */
    return Vframe;
}, {
    requires: ["magix/magix", "magix/event", "magix/view"]
});
/**
 * @fileOverview view类
 * @author 行列
 * @version 1.1
 */
LIB.add('magix/view', function(S, Magix, Event, Body, Router, IO) {

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

var MxEvt = /\smx-(?!view|owner|vframe)[a-z]+\s*=\s*"/g;
var MxEvtSplit = String.fromCharCode(26);


var EvtInfoReg = /(\w+)(?:<(\w+)>)?(?:\(?{([\s\S]*)}\)?)?/;
var EvtParamsReg = /(\w+):(['"]?)([^,]+)\2/g;
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
 * @property {Object} location WINDOW.locaiton.href解析出来的对象
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
    $host: WINDOW,
    $root: DOCUMENT
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
 * LIB.add('app/tview',function(S,View){
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
    
    /**
     * 渲染view，供最终view开发者覆盖
     * @function
     */
    render: Noop,
    /**
     * 当WINDOW.location.href有变化时调用该方法（如果您通过observeLocation指定了相关参数，则这些相关参数有变化时才调用locationChange，否则不会调用），供最终的view开发人员进行覆盖
     * @function
     * @param {Object} e 事件对象
     * @param {Object} e.location WINDOW.location.href解析出来的对象
     * @param {Object} e.changed 包含有哪些变化的对象
     * @param {Function} e.prevent 阻止向所有子view传递locationChange的消息
     * @param {Function} e.toChildren 向特定的子view传递locationChange的消息
     * @example
     * //example1
     * locationChange:function(e){
     *     if(e.changed.isPath()){//path的改变
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
     * @param {Object} locChanged 地址栏变化的相关信息，比如从某个path过来的
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
     * 监视地址栏中的参数或path，有变动时，才调用当前view的locationChange方法。通常情况下location有变化就会引起当前view的locationChange被调用，但这会带来一些不必要的麻烦，所以你可以指定地址栏中哪些参数有变化时才引起locationChange调用，使得view只关注与自已需要刷新有关的参数
     * @param {Array|String|Object} args  数组字符串或对象
     * @example
     * return View.extend({
     *      init:function(){
     *          this.observeLocation('page,rows');//关注地址栏中的page rows2个参数的变化，当其中的任意一个改变时，才引起当前view的locationChange被调用
     *          this.observeLocation({
     *              path:true//关注path的变化
     *          });
     *          //也可以写成下面的形式
     *          //this.observeLocation({
     *          //    keys:['page','rows'],
     *          //    path:true
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
            loc.pn = args.path;
            args = args.keys;
        }
        if (args) {
            loc.ks = keys.concat((args + '').split(COMMA));
        }
    },
    /**
     * 指定监控地址栏中path的改变
     * @example
     * return View.extend({
     *      init:function(){
     *          this.observePathname();//关注地址栏中path的改变，path改变才引起当前view的locationChange被调用
     *      },
     *      locationChange:function(e){
     *          if(e.changed.isPath()){};//是否是path发生的改变
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
     * @param {Boolean} observePathname 是否监视path
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
                res = changed.path;
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
            r =NULL;
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
                    m.i.replace(EvtParamsReg, function(x, a, q, b) {
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
        var res =NULL;
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
     * LIB.add("app/views/list",function(S,MxView){
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
    var Suffix = '?t=' + S.now();
    var Mods = S.Env.mods;

    /*var ProcessObject = function(props, proto, enterObject) {
        for (var p in proto) {
            if (S.isObject(proto[p])) {
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
                var info = Mods[path];
                var url;
                if (info) {
                    url = info.uri || info.fullpath;
                    url = url.slice(0, url.indexOf(path) + path.length);
                }
                var file = url + '.html';
                var l = Locker[file];
                var onload = function(tmpl) {
                    fn(Tmpls[path] = tmpl);
                };
                if (l) {
                    l.push(onload);
                } else {
                    l = Locker[file] = [onload];
                    IO({
                        url: file + Suffix,
                        complete: function(data, status) {
                            SafeExec(l, data || status);
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
        };
        BaseView.extend = me.extend;
        return S.extend(BaseView, me, props, statics);
    };

    return View;
}, {
    requires: ['magix/magix', 'magix/event', 'magix/body', 'magix/router', 'ajax']
});
/**
 * @fileOverview VOM
 * @author 行列
 * @version 1.1
 */
LIB.add("magix/vom", function(S, Vframe, Magix, Event) {
    var Has = Magix.has;
var Mix = Magix.mix;

var Vframes = {};
var Loc = {};
var Chged = {};
/**
 * VOM对象
 * @name VOM
 * @namespace
 * @borrows Event.on as on
 * @borrows Event.fire as fire
 * @borrows Event.off as off
 * @borrows Event.once as once
 * @borrows Event.rely as rely
 */
var VOM = Magix.mix({
    /**
     * @lends VOM
     */
    /**
     * 获取所有的vframe对象
     * @return {Object}
     */
    all: function() {
        return Vframes;
    },
    /**
     * 注册vframe对象
     * @param {Vframe} vf Vframe对象
     */
    add: function(id, vf) {
        if (!Has(Vframes, id)) {
            Vframes[id] = vf;
            VOM.fire('add', {
                vframe: vf
            });
        }
    },
    /**
     * 根据vframe的id获取vframe对象
     * @param {String} id vframe的id
     * @return {Vframe|Null} vframe对象
     */
    get: function(id) {
        return Vframes[id];
    },
    /**
     * 删除已注册的vframe对象
     * @param {String} id vframe对象的id
     * @param {Boolean} fcc 内部使用
     */
    remove: function(id, fcc) {
        var vf = Vframes[id];
        if (vf) {
            delete Vframes[id];
            VOM.fire('remove', {
                vframe: vf,
                fcc: fcc
            });
        }
    },
    /**
     * 向vframe通知地址栏发生变化
     * @param {Object} e 事件对象
     * @param {Object} e.location WINDOW.location.href解析出来的对象
     * @param {Object} e.changed 包含有哪些变化的对象
     * @private
     */
    locChged: function(e) {
        var loc = e.loc;
        var hack;
        if (loc) {
            hack = 1;
        } else {
            loc = e.location;
        }
        Mix(Loc, loc);
        if (!hack) {
            Mix(Chged, e.changed);
            var vf = Vframe.root(VOM, Loc, Chged);
            if (Chged.view) {
                vf.mountView(loc.view);
            } else {
                vf.locChged();
            }
        }
    }
    /**
     * 注册vframe对象时触发
     * @name VOM.add
     * @event
     * @param {Object} e
     * @param {Vframe} e.vframe
     */
    /**
     * 删除vframe对象时触发
     * @name VOM.remove
     * @event
     * @param {Object} e
     * @param {Vframe} e.vframe
     * @param {Boolean} e.fcc 是否派发过created事件
     */
}, Event);
    return VOM;
}, {
    requires: ["magix/vframe", "magix/magix", "magix/event"]
});
/**
 * @fileOverview model管理工厂，可方便的对Model进行缓存和更新
 * @author 行列
 * @version 1.1
 **/
LIB.add("magix/mmanager", function(S, Magix, Event) {
    /*
        #begin mm_fetchall_1#
        LIB.add('testMM',function(S,MM,Model){
        #end#

        #begin mm_fetchall_2#
        },{
            requires:["magix/mmanager","magix/model"]
        });
        #end#

        #begin mm_fetchall_3#
        LIB.use('testMM',function(S,TM){
        #end#
     */
    var Has = Magix.has;
var SafeExec = Magix.safeExec;
var IsArray = Magix._a;
var IsFunction = Magix._f;
var IsObject = Magix._o;

var FetchFlags_ONE = 1;
var FetchFlags_ORDER = 2;
var FetchFlags_ALL = 4;

var Now = Date.now || function() {
        return +new Date();
    };
var Guid = Now();
var WJSON = WINDOW.JSON;
var Mix = Magix.mix;
var Prefix = 'mr';
var Split = String.fromCharCode(26);
var DefaultCacheTime = 20 * 60 * 1000;
var Ser = function(o, f, a, p) {
    if (IsFunction(o)) { //一定要先判断
        if (f) a = Ser(SafeExec(o));
    } else if (WJSON) {
        a = WJSON.stringify(o);
    } else if (IsObject(o) || IsArray(o)) {
        a = [];
        for (p in o) {
            if (Has(o, p)) {
                a.push(p, Prefix, Ser(o[p]));
            }
        }
    } else {
        a = o;
    }
    return a;
};
/*
    a=['1','2,']
    b=['1','2','']
 */
var DefaultCacheKey = function(keys, meta, attrs) {
    var arr = [meta.name, Ser(attrs)];
    var locker = {};
    for (var i = keys.length - 1, key; i > -1; i--) {
        key = keys[i];
        if (!locker[key]) {
            arr.push(locker[key] = Ser(meta[key], 1), Ser(attrs[key], 1));
        }
    }
    return arr.join(Split);
};
var ProcessCache = function(attrs) {
    var cache = attrs.cache;
    if (cache) {
        cache = cache === true ? DefaultCacheTime : cache | 0;
    }
    return cache;
};


var TError = function(e) {
    throw Error(e);
};
/**
 * Model管理对象，可方便的对Model进行缓存和更新
 * @name MManager
 * @class
 * @namespace
 * @borrows Event.on as #on
 * @borrows Event.fire as #fire
 * @borrows Event.off as #off
 * @borrows Event.once as #once
 * @borrows Event.rely as #rely
 * @param {Model} modelClass Model类
 * @param {Array} serKeys 序列化生成cacheKey时，除了使用urlParams和postParams外，额外使用的key
 */
var MManager = function(modelClass, serKeys) {
    var me = this;
    me.$mClass = modelClass;
    me.$mCache = Magix.cache();
    me.$mCacheKeys = {};
    me.$mMetas = {};
    me.$sKeys = ['postParams', 'urlParams'].concat(serKeys ? (IsArray(serKeys) ? serKeys : [serKeys]) : []);
    me.id = 'mm' + Guid--;
    SafeExec(MManager.ms, arguments, me);
};

var Slice = [].slice;


var WrapDone = function(fn, model, idx, ops) {
    return function() {
        return fn.apply(model, [idx, ops].concat(Slice.call(arguments)));
    };
};
var CacheDone = function(err, ops) {
    //
    var cacheKey = ops.b;
    var modelsCacheKeys = ops.a;
    var cached = modelsCacheKeys[cacheKey];
    if (cached) {
        var fns = cached.q;
        delete modelsCacheKeys[cacheKey];
        SafeExec(fns, err, cached.e);
    }
};
var DoneFn = function(idx, ops, err) {
    //
    var model = this;
    var request = ops.a;
    var reqs = ops.c;
    var doneArr = ops.d;
    var errorArgs = ops.g;
    var modelsCache = ops.i;
    var host = ops.j;
    var flag = ops.k;
    var doneIsArray = ops.l;
    var done = ops.m;
    var doneArgs = ops.n;
    var orderlyArr = ops.o;

    var currentError;

    //

    ops.b++; //exec count
    //
    delete reqs[model.id];
    //
    var mm = model.$mm;
    var cacheKey = mm.key;
    doneArr[idx] = model;
    if (err) {
        ops.e = 1;
        currentError = 1;
        ops.f = err;
        errorArgs.msg = err;
        errorArgs[idx] = err;
        host.fire('fail', {
            model: model,
            msg: err
        });
    } else {
        if (!cacheKey || (cacheKey && !modelsCache.has(cacheKey))) {
            if (cacheKey) {
                modelsCache.set(cacheKey, model);
            }
            mm.time = Now();
            var succ = mm.done;

            if (succ) { //有succ
                SafeExec(succ, model);
            }
            host.fire('done', {
                model: model
            });
        }
        if (mm.used > 0) {
            model.fromCache = 1;
        }
        mm.used++;
    }
    if (!request.$oust) { //销毁，啥也不做
        if (flag == FetchFlags_ONE) { //如果是其中一个成功，则每次成功回调一次
            var m = doneIsArray ? done[idx] : done;
            if (m) {
                doneArgs[idx] = SafeExec(m, [currentError ? errorArgs :NULL, model, errorArgs], request);
            }
        } else if (flag == FetchFlags_ORDER) {
            //var m=doneIsArray?done[idx]:done;
            orderlyArr[idx] = {
                m: model,
                e: currentError,
                s: err
            };
            //
            for (var i = orderlyArr.i || 0, t, d; t = orderlyArr[i]; i++) {
                d = doneIsArray ? done[i] : done;
                if (t.e) {
                    errorArgs.msg = t.s;
                    errorArgs[i] = t.s;
                }
                doneArgs[i] = SafeExec(d, [t.e ? errorArgs :NULL, t.m, errorArgs].concat(doneArgs), request);
            }
            orderlyArr.i = i;
        }
        if (ops.b == ops.h) { //ops.h total count
            if (!ops.e) {
                errorArgs =NULL;
            }
            if (flag == FetchFlags_ALL) {
                doneArr.unshift(errorArgs);
                doneArgs[0] = errorArgs;
                doneArgs[1] = SafeExec(done, doneArr, request);
            } else {
                doneArgs.unshift(errorArgs);
            }
            request.$ntId = setTimeout(function() { //前面的任务可能从缓存中来，执行很快
                request.doNext(doneArgs);
            }, 30);
        }
    }
};
var GenMRequest = function(method) {
    return function() {
        var mr = new MRequest(this);
        var args = arguments;
        var last = args[args.length - 1];
        if (last && last.manage) {
            last.manage(mr);
            args = Slice.call(args, 0, -1);
        }
        return mr[method].apply(mr, args);
    };
};
var GenRequestMethod = function(flag, save) {
    return function(models, done) {
        var cbs = Slice.call(arguments, 1);
        return this.send(models, cbs.length > 1 ? cbs : done, flag, save);
    };
};
Mix(MManager, {
    /**
     * @lends MManager
     */
    /**
     * 创建Model类管理对象
     * @param {Model} modelClass Model类
     * @param {Array} serKeys 序列化生成cacheKey时，除了使用urlParams和postParams外，额外使用的key
     */
    create: function(modelClass, serKeys) {
        return new MManager(modelClass, serKeys);
    },
    /**
     * 扩展MMamager
     * @param  {Object} props 扩展到原型上的方法
     * @param  {Function} ctor  在初始化MManager时进行调用的方法
     */
    mixin: function(props, ctor) {
        if (ctor) MManager.ms.push(ctor);
        Mix(MManager.prototype, props);
    },
    ms: []
});


/**
 * 辅助MManager
 * @name MRequest
 * @class
 * @namespace
 * @param {MManager} host
 */
var MRequest = function(host) {
    var me = this;
    me.$host = host;
    me.$reqs = {};
    me.id = Prefix + Guid--;
    me.$queue = [];
};

Mix(MRequest.prototype, {
    /**
     * @lends MRequest#
     */
    /**
     * 获取models，该用缓存的用缓存，该发起请求的请求
     * @private
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {Integer} flag   获取哪种类型的models
     * @param {Boolean} save 是否是保存的动作
     * @return {MRequest}
     */
    send: function(models, done, flag, save) {
        var me = this;
        if (me.$busy) {
            me.next(function() {
                this.send(models, done, flag, save);
            });
            return me;
        }
        me.$busy = 1;

        var host = me.$host;
        var modelsCache = host.$mCache;
        var modelsCacheKeys = host.$mCacheKeys;
        var reqs = me.$reqs;

        if (!IsArray(models)) {
            models = [models];
        }
        var total = models.length;
        var doneArgs = [];

        var doneIsArray = IsArray(done);
        if (doneIsArray) {
            doneArgs = new Array(done.length);
        }

        var options = {
            a: me,
            b: 0, //current done
            c: me.$reqs,
            d: new Array(total),
            //e hasError,
            //f lastMsg
            g: {},
            h: total,
            i: modelsCache,
            j: host,
            k: flag,
            l: doneIsArray,
            m: done,
            n: doneArgs,
            o: []
        };

        for (var i = 0, model; i < models.length; i++) {
            model = models[i];
            if (model) {
                var modelInfo = host.getModel(model, save);
                var cacheKey = modelInfo.cKey;
                var modelEntity = modelInfo.entity;
                var wrapDoneFn = WrapDone(DoneFn, modelEntity, i, options);
                wrapDoneFn.id = me.id;

                if (cacheKey && Has(modelsCacheKeys, cacheKey)) {
                    modelsCacheKeys[cacheKey].q.push(wrapDoneFn);
                } else {
                    if (modelInfo.update) {
                        reqs[modelEntity.id] = modelEntity;
                        if (cacheKey) {
                            modelsCacheKeys[cacheKey] = {
                                q: [wrapDoneFn],
                                e: modelEntity
                            };
                            wrapDoneFn = CacheDone;
                        }
                        modelEntity.request(wrapDoneFn, {
                            a: modelsCacheKeys,
                            b: cacheKey
                        });
                    } else {
                        wrapDoneFn();
                    }
                }
            } else {
                TError('empty model');
            }
        }
        return me;
    },
    /**
     * 获取models，所有请求完成回调done
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @return {MRequest}
     */
    fetchAll: function(models, done) {
        return this.send(models, done, FetchFlags_ALL);
    },
    /**
     * 保存models，所有请求完成回调done
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @return {MRequest}
     */
    saveAll: function(models, done) {
        return this.send(models, done, FetchFlags_ALL, 1);
    },
    /**
     * 获取models，按顺序执行回调done
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @return {MRequest}
     */
    fetchOrder: GenRequestMethod(FetchFlags_ORDER),
    /**
     * 保存models，按顺序执行回调done
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @return {MRequest}
     */
    saveOrder: GenRequestMethod(FetchFlags_ORDER, 1),
    /**
     * 保存models，其中任意一个成功均立即回调，回调会被调用多次
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} callback   完成时的回调
     * @return {MRequest}
     */
    saveOne: GenRequestMethod(FetchFlags_ONE, 1),
    /**
     * 获取models，其中任意一个成功均立即回调，回调会被调用多次
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} callback   完成时的回调
     * @return {MRequest}
     */
    fetchOne: GenRequestMethod(FetchFlags_ONE),
    /**
     * 中止所有model的请求
     * 注意：调用该方法后会中止请求，并调用回调传递abort异常消息
     */
    stop: function() {
        var me = this;
        clearTimeout(me.$ntId);
        var host = me.$host;
        var reqs = me.$reqs;
        var modelsCacheKeys = host.$mCacheKeys;
        for (var p in reqs) {
            var m = reqs[p];
            var cacheKey = m.$mm.key;
            if (cacheKey && Has(modelsCacheKeys, cacheKey)) {
                var cache = modelsCacheKeys[cacheKey];
                var fns = cache.q;
                var nfns = [];
                var rfns = [];
                for (var i = 0, fn; i < fns.length; i++) {
                    fn = fns[i];
                    if (fn.id != me.id) {
                        nfns.push(fn); //仍然保留
                    } else {
                        rfns.push(fn); //需要中止
                    }
                }
                //
                if (nfns.length) {
                    SafeExec(rfns, 'abort', cache.e); //model并未中止，需要手动触发
                    cache.q = nfns;
                } else {
                    m.abort();
                }
            } else {
                m.abort();
            }
        }

        me.$reqs = {};
        me.$queue = [];
        me.$busy = 0;
    },
    /**
     * 前一个fetchX或saveX任务做完后的下一个任务
     * @param  {Function} callback 当前面的任务完成后调用该回调
     * @return {MRequest}
     * @example
        var r=MM.fetchAll([
            {name:'M1'},
            {name:'M2'}
        ],function(err,m1,m2){

            return 'fetchAllReturned';
        });

        r.next(function(err,fetchAllReturned){
            alert(fetchAllReturned);
        });
     */
    next: function(callback) {
        var me = this;
        me.$queue.push(callback);
        if (!me.$busy) {
            var args = me.$args;
            me.doNext(args);
        }
        return me;
    },
    /**
     * 做下一个任务
     * @param {Object} preArgs 上次请求任务回调的返回值
     * @private
     */
    doNext: function(preArgs) {
        var me = this;
        me.$busy = 0;
        var queue = me.$queue;
        if (queue) {
            var one = queue.shift();
            if (one) {
                SafeExec(one, preArgs, me);
            }
        }
        me.$args = preArgs;
    },
    /**
     * 销毁当前请求，与stop的区别是：stop后还可以继续发起新请求，而destroy后则不可以，而且不再调用相应的回调
     */
    destroy: function() {
        var me = this;
        me.$oust = 1;
        me.stop();
    }
});

Mix(Mix(MManager.prototype, Event), {
    /**
     * @lends MManager#
     */
    /**
     * 注册APP中用到的model
     * @param {Object|Array} models 模块描述信息
     * @param {String} models.name app中model的唯一标识
     * @param {Object} models.urlParams 发起请求时，默认的get参数对象
     * @param {Object} models.postParams 发起请求时，默认的post参数对象
     * @param {Boolean|Integer} models.cache指定当前请求缓存多长时间,为true默认20分钟，可传入整数表示缓存多少毫秒
     * @param {Function} models.done model在结束请求，并且成功后回调
     */
    registerModels: function(models) {
        /*
                name:'',
                urlParams:{},
                postParams:{},
                done:function(m){

                }
             */
        var me = this;
        var metas = me.$mMetas;
        if (!IsArray(models)) {
            models = [models];
        }
        for (var i = 0, model, name; i < models.length; i++) {
            model = models[i];
            if (model) {
                name = model.name;
                if (!name) {
                    TError('miss name');
                } else if (metas[name]) {
                    TError('already exist:' + name);
                }
                model.cache = ProcessCache(model);
                metas[name] = model;
            }
        }
    },
    /**
     * 注册常用方法，或以把经常几个同时请求的model封装成一个方法以便快捷调用
     * @param {Object} methods 方法对象
     */
    registerMethods: function(methods) {
        Mix(this, methods);
    },
    /**
     * 调用当前Manager注册的多个方法
     * @param {Array} args 要调用的方法列表，形如：[{name:'x',params:['o']},{name:'y',params:['z']}]
     * @param {Function} done 成功时的回调，传入参数跟args数组中对应的成功方法的值
     * @param {Function} error 失败回调，参数同上
     * @return {Object} 返回一个带abort方法的对象，用于取消这些方法的调用
     * @example
     * var MM=MManager.create(Model);
     * MM.registerMethods({
     *     methodA:function(args,done,error){
     *
     *     },
     *     methodB:function(args,done,error){
     *
     *     }
     * });
     *
     * //...
     * //使用时：
     *
     * MM.callMethods([
     *     {name:'methodA',params:['a']},
     *     {name:'methodB',params:['b']}
     * ],function(f1Result,f2Result){
     *
     * },function(msg){
     *     alert(msg)
     * })
     */
    /*callMethods:function(args,done,error){
            var me=this,
                doneArgs=[],
                errorMsg='',
                total=args.length,
                exec= 0,
                aborted,
                doneCheck=function(args,idx,isFail){
                    if(aborted)return;
                    exec++;
                    if(isFail){
                        errorMsg=args;
                    }else{
                         doneArgs[idx]=args;
                    }
                    if(total<=exec){
                        if(!errorMsg){
                            if(S.isFunction(done)){
                                done.apply(done,doneArgs);
                            }
                        }else{
                            if(S.isFunction(error)){
                                error(errorMsg);
                            }
                        }
                    }
                },
                check=function(idx,isSucc){
                    return function(args){
                        doneCheck(args,idx,!isSucc);
                    };
                };
            for(var i=0,one;i<args.length;i++){
                one=args[i];
                var fn;
                if(S.isFunction(one.name)){
                    fn=one.name;
                }else{
                    fn=me[one.name];
                }
                if(fn){
                    if(!one.params)one.params=[];
                    if(!S.isArray(one.params))one.params=[one.params];

                    one.params.push(check(i,1),check(i));
                    fn.apply(me,one.params);
                }else{
                    doneCheck('unfound:'+one.name,i,1);
                }
            }
            return {
                abort:function(){
                    aborted=1;
                }
            }
        },*/
    /**
     * 创建model对象
     * @param {Object} modelAttrs           model描述信息对象
     * @return {Model}
     */
    createModel: function(modelAttrs) {
        var me = this;
        //modelAttrs = ProcessModelAttrs(modelAttrs);

        var meta = me.getModelMeta(modelAttrs);
        var cache = ProcessCache(modelAttrs) || meta.cache;
        var entity = new me.$mClass();
        var mm;
        entity.set(meta);
        entity.$mm = mm = {
            used: 0
        };


        var done = modelAttrs.done || meta.done;

        mm.done = done;

        if (cache) {
            mm.key = DefaultCacheKey(me.$sKeys, meta, modelAttrs);
        }


        if (modelAttrs.name) {
            entity.set(modelAttrs);
        }

        //默认设置的
        entity.setUrlParams(meta.urlParams);
        entity.setPostParams(meta.postParams);

        //临时传递的
        entity.setUrlParams(modelAttrs.urlParams);
        entity.setPostParams(modelAttrs.postParams);

        me.fire('inited', {
            model: entity
        });
        return entity;
    },
    /**
     * 获取model注册时的元信息
     * @param  {String|Object} modelAttrs 名称
     * @return {Object}
     * @throws {Error} If unfound:name
     */
    getModelMeta: function(modelAttrs) {
        var me = this;
        var metas = me.$mMetas;
        var name = modelAttrs.name || modelAttrs;
        var meta = metas[name];
        if (!meta) {
            TError('Unfound:' + name);
        }
        return meta;
    },
    /**
     * 获取model对象，优先从缓存中获取
     * @param {Object} modelAttrs           model描述信息对象
     * @param {Boolean} createNew 是否是创建新的Model对象，如果否，则尝试从缓存中获取
     * @return {Object}
     */
    getModel: function(modelAttrs, createNew) {
        var me = this;
        var entity;
        var needUpdate;
        if (!createNew) {
            entity = me.getCachedModel(modelAttrs);
        }

        if (!entity) {
            needUpdate = 1;
            entity = me.createModel(modelAttrs);
        }
        return {
            entity: entity,
            cKey: entity.$mm.key,
            update: needUpdate
        };
    },
    /**
     * 保存models，所有请求完成回调done
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     */
    saveAll: GenMRequest('saveAll'),
    /**
     * 获取models，所有请求完成回调done
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     * @example
        //定义
        
        LIB.add('testMM',function(S,MM,Model){
        
            var TestMM=MM.create(Model);
            TestMM.registerModels([{
                name:'Test1',
                url:'/api/test1.json'
            },{
                name:'Test2',
                url:'/api/test2.json',
                urlParams:{
                    type:'2'
                }
            }]);
            return TestMM;
        
        },{
            requires:["magix/mmanager","magix/model"]
        });
        
        //使用
        
        LIB.use('testMM',function(S,TM){
        
            TM.fetchAll([{
                name:'Test1'
            },{
                name:'Test2'
            }],function(err,m1,m2){

            });
        });
     */
    fetchAll: GenMRequest('fetchAll'),
    /**
     * 保存models，按顺序回调done
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home'urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     */
    saveOrder: GenMRequest('saveOrder'),
    /**
     * 获取models，按顺序回调done
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     * @example
        //代码片断：
        //1：当按顺序获取多个model，回调只有一个时
        var r=MM.fetchOrder([
            {name:'M1'},
            {name:'M2'},
            {name:'M3'}
        ],function(err,model){//回调按M1,M2,M3的顺序被调用3次
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        });

        //2:当按顺序获取多个model，回调多于一个时
        var r=MM.fetchOrder([
            {name:'M1'},
            {name:'M2'},
            {name:'M3'}
        ],function(err,model){//首先被调用
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        },function(err,model){//其次被调用
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        });
     */
    fetchOrder: GenMRequest('fetchOrder'),
    /**
     * 保存models，其中任意一个成功均立即回调，回调会被调用多次
     * @function
     * @param {Object|Array} models 保存models时的描述信息，如:{name:'Home',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} callback   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     */
    saveOne: GenMRequest('saveOne'),
    /**
     * 获取models，其中任意一个成功均立即回调，回调会被调用多次
     * @function
     * @param {Object|Array} models 获取models时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},postParams:{b:2}}
     * @param {Function} callback   完成时的回调
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest}
     * @example
        //代码片断：
        //1：获取多个model，回调只有一个时
        var r=MM.fetchOrder([
            {name:'M1'},
            {name:'M2'},
            {name:'M3'}
        ],function(err,model){//m1,m2,m3，谁快先调用谁，且被调用三次
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        });

        //2:获取多个model，回调多于一个时
        var r=MM.fetchOrder([
            {name:'M1'},
            {name:'M2'},
            {name:'M3'}
        ],function(err,model){//m1什么时间返回，该回调什么时间被调用
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        },function(err,model){//m2什么时间返回，该回调什么时间被调用
            if(err){
                alert(err.msg);
            }else{
                alert(model.get('name'));
            }
        });
     */
    fetchOne: GenMRequest('fetchOne'),
    /**
     * 创建MRequest对象
     * @param {MxView} [view] 当传递MxView对象时，自动帮你托管MRequest
     * @return {MRequest} 返回MRequest对象
     */
    createMRequest: function(view) {
        var mr = new MRequest(this);
        if (view && view.manage) {
            view.manage(mr);
        }
        return mr;
    },
    /**
     * 根据key清除缓存的models
     * @param  {String} key 字符串
     */
    clearCacheByKey: function(key) {
        var me = this;
        var modelsCache = me.$mCache;
        modelsCache.del(key);
    },
    /**
     * 根据name清除缓存的models
     * @param  {String} name 字符串
     */
    clearCacheByName: function(name) {
        var me = this;
        var modelsCache = me.$mCache;
        var list = modelsCache.list();
        for (var i = 0; i < list.length; i++) {
            var one = list[i];
            var m = one.v;
            var mm = m && m.$mm;
            if (mm) {
                var tName = mm.meta.name;
                if (tName == name) {
                    modelsCache.del(mm.key);
                }
            }
        }
    },
    /**
     * 从缓存中获取model对象
     * @param  {Object} modelAttrs
     * @return {Model}
     */
    getCachedModel: function(modelAttrs) {
        var me = this;
        var modelsCache = me.$mCache;
        var entity =NULL;
        var cacheKey;
        var meta = me.getModelMeta(modelAttrs);
        var cache = ProcessCache(modelAttrs) || meta.cache;

        if (cache) {
            cacheKey = DefaultCacheKey(me.$sKeys, meta, modelAttrs);
        }

        if (cacheKey) {
            var requestCacheKeys = me.$mCacheKeys;
            var info = requestCacheKeys[cacheKey];
            if (info) { //处于请求队列中的
                entity = info.e;
            } else { //缓存
                entity = modelsCache.get(cacheKey);
                if (entity) {
                    if (cache > 0 && Now() - entity.$mm.time > cache) {
                        me.clearCacheByKey(cacheKey);
                        entity = 0;
                    }
                }
            }
        }
        return entity;
    }
});

/**
 * 创建完成Model对象后触发
 * @name MManager#inited
 * @event
 * @param {Object} e
 * @param {Model} e.model model对象
 */

/**
 * Model对象完成请求后触发
 * @name MManager#done
 * @event
 * @param {Object} e
 * @param {Model} e.model model对象
 */

/**
 * Model对象请求处理失败后触发
 * @name MManager#fail
 * @event
 * @param {Object} e
 * @param {Model} e.msg 错误描述信息
 */
    return MManager;
}, {
    requires: ["magix/magix", "magix/event"]
});
/**
 * @fileOverview Model
 * @version 1.1
 * @author 行列
 */
LIB.add('magix/model', function(S, Magix) {
    var Extend = function(props, ctor) {
        var BaseModel = function() {
            BaseModel.superclass.constructor.apply(this, arguments);
            if (ctor) {
                Magix.safeExec(ctor, [], this);
            }
        };
        return S.extend(BaseModel, this, props);
    };
    /**
 * Model类
 * @name Model
 * @namespace
 * @class
 * @constructor
 * @param {Object} ops 初始化Model时传递的其它参数对象
 * @property {String} id model唯一标识
 * @property {Boolean} fromCache 在与ModelManager配合使用时，标识当前model对象是不是从缓存中来
 */

var GUID = +new Date();
var Encode = encodeURIComponent;
var Has = Magix.has;
var IsObject = Magix._o;
var ToString = Magix.toString;
var Model = function(ops) {
    this.set(ops);
    this.id = 'm' + GUID--;
};
var GenSetParams = function(type, iv) {
    return function(o1, o2) {
        this.setParams(o1, o2, type, iv);
    };
};
Magix.mix(Model, {
    /**
     * @lends Model
     */
    /**
     * GET枚举
     * @type {String}
     */
    GET: 'GET',
    /**
     * POST枚举
     * @type {String}
     */
    POST: 'POST',
    /**
     * 继承
     * @function
     * @param {Object} props 方法对象
     * @param {Function} ctor 继承类的构造方法
     */
    extend: Extend
});


Magix.mix(Model.prototype, {
    /**
     * @lends Model#
     */
    /**
     * url映射对象
     * @type {Object}
     */
    /*urlMap: {

    },*/
    /**
     * Model调用request方法后，与服务器同步的方法，供应用开发人员覆盖
     * @function
     * @param {Function} callback 请求完成后的回调，回调时第1个参数是错误对象，第2个是数据
     * @return {XHR} 最好返回异步请求的对象
     */
    sync: Magix.noop,
    /**
     * 处理Model.sync成功后返回的数据
     * @function
     * @param {Object|String} resp 返回的数据
     * @return {Object}
     */
    /* parse: function(r) {
        return r;
    },*/
    /**
     * 获取参数对象
     * @param  {String} [type] 参数分组的key[Model.GET,Model.POST]，默认为Model.GET
     * @return {Object}
     */
    /*getParamsObject:function(type){
            if(!type)type=Model.GET;
            return this['$'+type]||null;
        },*/
    /**
     * 获取参数对象
     * @return {Object}
     */
    /* getUrlParamsObject:function(){
            return this.getParamsObject(Model.GET);
        },*/
    /**
     * 获取Post参数对象
     * @return {Object}
     */
    /*getPostParamsObject:function(){
            return this.getParamsObject(Model.POST);
        },*/
    /**
     * 获取通过setPostParams放入的参数
     * @return {String}
     */
    getPostParams: function() {
        return this.getParams(Model.POST);
    },
    /**
     * 获取通过setUrlParams放入的参数
     * @return {String}
     */
    getUrlParams: function() {
        return this.getParams(Model.GET);
    },
    /**
     * 获取参数
     * @param {String} [type] 参数分组的key[Model.GET,Model.POST]，默认为Model.GET
     * @return {String}
     */
    getParams: function(type) {
        var me = this;
        if (!type) {
            type = Model.GET;
        }

        var k = '$' + type;
        var params = me[k];
        var arr = [];
        var v;
        for (var p in params) {
            v = params[p];
            if (v == Model.X && p.indexOf('=') > -1) { //undefined and key like a=b&c=d
                arr.push(p);
            } else {
                arr.push(p + '=' + Encode(v));
            }
            /*if (!Magix._a(v)) {
                v = [v];
            }
            for (var i = 0; i < v.length; i++) {
                arr.push(p + '=' + Encode(v[i]));
            }*/
        }
        return arr.join('&');
    },
    /**
     * 设置url参数，只有未设置过的参数才进行设置
     * @function
     * @param {Object|String} obj1 参数对象或者参数key
     * @param {String} [obj2] 参数内容
     */
    setUrlParamsIf: GenSetParams(Model.GET, 1),
    /**
     * 设置post参数，只有未设置过的参数才进行设置
     * @function
     * @param {Object|String} obj1 参数对象或者参数key
     * @param {String} [obj2] 参数内容
     */
    setPostParamsIf: GenSetParams(Model.POST, 1),
    /**
     * 设置参数
     * @param {Object|String|Function} obj1 参数对象或者参数key
     * @param {String} [obj2] 参数内容
     * @param {String}   type      参数分组的key
     * @param {Boolean}   ignoreIfExist   如果存在同名的参数则不覆盖，忽略掉这次传递的参数
     */
    setParams: function(obj1, obj2, type, ignoreIfExist) {
        var me = this;
        /*if (!me.$types) me.$types = {};
        me.$types[type] = true;*/

        var k = '$' + type;
        if (!me[k]) me[k] = {};
        var obj = me[k];
        if (Magix._f(obj1)) {
            obj1 = Magix.safeExec(obj1);
        }
        if (obj1 && !IsObject(obj1)) {
            var t = {};
            t[obj1] = obj2;
            obj1 = t;
        }
        for (var p in obj1) {
            if (!ignoreIfExist || !Has(obj, p)) {
                obj[p] = obj1[p];
            }
        }
    },
    /**
     * 设置post参数
     * @function
     * @param {Object|String} obj1 参数对象或者参数key
     * @param {String} [obj2] 参数内容
     */
    setPostParams: GenSetParams(Model.POST),
    /**
     * 设置url参数
     * @function
     * @param {Object|String} obj1 参数对象或者参数key
     * @param {String} [obj2] 参数内容
     */
    setUrlParams: GenSetParams(Model.GET),
    /**
     * @private
     */
    /*removeParamsObject:function(type){
            if(!type)type=Model.GET;
            delete this['$'+type];
        },*/
    /**
     * @private
     */
    /*removePostParamsObject:function(){
            this.removeParamsObject(Model.POST);
        },*/
    /**
     * @private
     */
    /*removeUrlParamsObject:function(){
            this.removeParamsObject(Model.GET);
        },*/
    /**
     * 重置缓存的参数对象，对于同一个model反复使用前，最好能reset一下，防止把上次请求的参数也带上
     */
    /*reset: function() {
        var me = this;
        var keysCache = me.$types;
        if (keysCache) {
            for (var p in keysCache) {
                delete me['$' + p];
            }
            delete me.$types;
        }
        var keys = me.$keys;
        var attrs = me.$attrs;
        if (keys) {
            for (var i = 0; i < keys.length; i++) {
                delete attrs[keys[i]];
            }
            delete me.$keys;
        }
    },*/
    /**
     * 获取属性
     * @param {String} [key] 要获取数据的key
     * @param {Object} [dValue] 当根据key取到的值为falsy时，使用默认值替代，防止代码出错
     * @return {Object}
     * @example
     * MM.fetchAll({
     *     name:'Test'
     * },function(e,m){
     *     var obj=m.get();//获取所有数据
     *
     *     var list=m.get('list',[]);//获取list数据，如果不存在list则使用空数组
     *
     *     var count=m.get('data.info.count',0);//获取data下面info下count的值，您无须关心data下是否有info属性
     *
     * });
     */
    get: function(key, dValue, udfd) {
        var me = this;
        var alen = arguments.length;

        var hasDValue = alen == 2;
        var attrs = me.$attrs;
        if (alen) {
            var tks = (key + '').split('.');
            while (attrs && tks[0]) {
                attrs = attrs[tks.shift()];
            }
            if (tks[0]) {
                attrs = udfd;
            }
        }
        if (hasDValue && ToString.call(dValue) != ToString.call(attrs)) {
            attrs = dValue;
        }
        return attrs;
    },
    /**
     * 设置属性
     * @param {String|Object} key 属性对象或属性key
     * @param {Object} [val] 属性值
     */
    set: function(key, val) {
        var me = this;
        if (!me.$attrs) me.$attrs = {};
        /* if (saveKeyList && !me.$keys) {
            me.$keys = [];
        }*/
        if (IsObject(key)) {
            for (var p in key) {
                //if (!Has(val, p)) {
                me.$attrs[p] = key[p];
                //}
            }
        } else if (key) {
            me.$attrs[key] = val;
        }
    },
    /**
     * 向服务器请求，加载或保存数据
     * @param {Function} callback 请求成功或失败的回调
     */
    request: function(callback, options) {
        var me = this;
        me.$abt = 0;
        var temp = function(err, data) {
            if (!me.$abt) {
                //if (err) {
                // callback(err, data, options);
                //} else {
                if (!IsObject(data)) {
                    data = {
                        data: data
                    };
                }
                me.set(data);
                //}
                callback(err, options);
            }
        };
        me.$trans = me.sync(me.$temp = temp);
    },
    /**
     * 中止请求
     */
    abort: function() {
        var me = this;
        var trans = me.$trans;
        var fn = me.$temp;
        if (fn) {
            fn('abort');
        }
        me.$abt = 1;
        if (trans && trans.abort) {
            trans.abort();
        }
        me.$trans = 0;
    },
    /**
     * 获取当前model是否已经取消了请求
     * @return {Boolean}
     */
    isAborted: function() {
        return this.$abt;
    }
});
    return Model;
}, {
    requires: ['magix/magix']
});;DOCUMENT.createElement("vframe");})(null,this,document,KISSY)