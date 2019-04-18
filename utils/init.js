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



import httpsModule from './https.js'



//通用配置
const generalConfig = {
    https: httpsModule,
    toPromise,
    requestCount: 0
}

const pageConfig = {
    ...generalConfig,
    setResult: (code, data) => {
        const prevPage = getCurrentPages().length > 1 ? getCurrentPages()[getCurrentPages().length - 2] : undefined
        if (!prevPage) {
            return;
        }
        if (!prevPage.resultMap) {
            prevPage.resultMap = new Map();
        }
        prevPage.resultMap.set(code, data)
    },
    navigateBackForResult: (code, data) => {
        getCurrentPages()[getCurrentPages().length - 1].setResult(code, data)
        wx.navigateBack()
    }
}


const originalApp = App;
App = function(config) {
    return originalApp(Object.assign(config, generalConfig))
}

const originalPage = Page
Page = function(config) {
    const {
        onLoad,
        onShow,
        onUnload
    } = config;

    config.onLoad = function(options) {
        const pages = getCurrentPages();
        this.prevPage = pages.length > 1 ? pages[pages.length - 2] : undefined
        if (this.prevPage && this.prevPage.nextParam) {
            options.pageParam = this.prevPage.nextParam
            delete pages[pages.length - 2].nextParam
        }
        if (typeof onLoad === 'function') {
            onLoad.call(this, options)
        }
    }

    config.onShow = function() {
        if (typeof onShow === 'function') {
            onShow.call(this)
        }
        if (!this.resultMap || this.resultMap.length == 0 || !this.onPageForResult) {
            return;
        }
        for (var [key, value] of this.resultMap) {
            this.onPageForResult(key, value)
        }
        this.resultMap.clear();
    }

    config.onUnload = function() {
        if (this.requestMap && this.requestMap.length > 0) {
            for (var [key, value] of this.requestMap) {
                value.abort();
            }
        }
        if (typeof onUnload === 'function') {
            onUnload.call(this)
        }
    }

    return originalPage(Object.assign(config, pageConfig))
}