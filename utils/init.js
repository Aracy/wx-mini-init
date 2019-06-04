//为Promise扩展出finally方法
Promise.prototype.finally = function(callback) {
    let P = this.constructor;
    return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => {
            throw reason
        })
    );
}


/**
 * 格式化时间
 */
Date.prototype.format = function(format) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds()
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format
};


var toPromise = fn => {
    return function(obj = {}) {
        return new Promise((resolve, reject) => {
            obj.success = function(res) {
                resolve(res)
            }

            obj.fail = function(res) {
                reject(res)
            }
            fn(obj)
        })
    }
}



import apiModule from './api.js'
import httpsModule from './https.js'

require('./stateManage.js')



//通用配置
const generalConfig = {
    https: httpsModule.https,
    toPromise,
    requestCount: 0
}


const appConfig = {
    ...generalConfig,
    noteLoadState: false,
    api: apiModule,
}


const pageConfig = function(config) {

    const m = {
        ...generalConfig,
        noteLoadState: true,
        stateHttps: httpsModule.httpState,
    }

    /**
     * setData的列表数据，优化一次加载大量数据的问题
     * 
     * @param label 列表的在data中的标签
     * @param array 要增加的数据
     * @param handFunc 对Item的处理函数，函数请放在当前Page中
     * 
     * @return 要添加的数据
     */
    config.arrayData = function(label, array, handFunc = this.formatItem) {
        const data = {};
        if (!array || array.length == 0) {
            return;
        }
        const len = (this.data[label] || []).length
        for (let index = 0; index < array.length; index++) {
            let item = array[index];
            if (handFunc && 'function' == typeof handFunc) {
                item = handFunc(item)
            }
            data[`${label}[${index + len}]`] = item
        }
        return data;
    }

    /**
     * 设置结果
     * 
     * @param code 结果请求编号
     * @param data 返回数据
     */
    config.setResult = function(code, data) {
        if (!this.prevPage) {
            return;
        }
        if (!this.prevPage.resultMap) {
            this.prevPage.resultMap = new Map();
        }
        this.prevPage.resultMap.set(code, data)
    }

    /**
     * 携带结果返回上一页
     * 
     * @param code 结果请求编号
     * @param data 返回数据
     */
    config.navigateBackForResult = function(code, data) {
        this.setResult(code, data)
        wx.navigateBack()
    }

    return Object.assign(m, config)
}



const originalApp = App;
App = function(config) {
    return originalApp(Object.assign(config, appConfig))
}

const originalPage = Page
Page = function(config) {
    const {
        onLoad,
        onShow,
        onUnload,
    } = config;

    config.onLoad = function(options) {
        if (typeof onLoad === 'function') {
            onLoad.call(this, options)
        }
        //获取上一个页面的对象引用
        const pages = getCurrentPages();
        this.prevPage = pages.length > 1 ? pages[pages.length - 2] : undefined
        if (this.prevPage && this.prevPage.nextParam) {
            options.pageParam = this.prevPage.nextParam
            delete pages[pages.length - 2].nextParam
        }
    }

    config.onShow = function() {
        if (typeof onShow === 'function') {
            onShow.call(this)
        }
        if (!this.resultMap || this.resultMap.length == 0) {
            return;
        }
        if (this.onPageForResult) {
            for (var [key, value] of this.resultMap) {
                this.onPageForResult(key, value)
            }
        }
        this.resultMap.clear();
    }

    config.onUnload = function() {
        if (typeof onUnload === 'function') {
            onUnload.call(this)
        }
        if (this.requestMap && this.requestMap.length > 0) {
            for (var [key, value] of this.requestMap) {
                value.abort();
            }
        }
    }

    return originalPage(pageConfig(config))
}