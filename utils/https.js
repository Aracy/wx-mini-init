/**
 * 封装网络请求
 * 
 * @param url 地址
 * @param method 请求方式
 * @param data 请求的数据
 * @param header  请求头部
 * @param context 运行环境
 */
function netWork(url, data, method, header, context) {
    context.requestCount += 1;
    const count = context.requestCount;
    if (!context.requestMap) {
        context.requestMap = new Map()
    }
    return new Promise((resolve, reject) => {
        const task = wx.request({
            url: url,
            data: data,
            header: Object.assign(header, {
                "Authorization": `Bearer ${wx.getStorageSync('token') || ''}`
            }),
            method,
            success: res => {
                resolve(res)

            },
            fail: res => {
                reject(res)
            },
            complete: res => {
                context.requestMap.delete(count)
            }
        })
        context.requestMap.set(count, task)
    })
}


/**
 * 封装https方法
 * 
 * @param url
 * @param data
 */
function https(url, data = {}, method = 'GET', header = {}) {
    return new Promise((resolve, reject) => {

        netWork(url, data, method, header, this).then(res => {
            //超时情况，重新微信登录
            if (res.statusCode == 401 || res.statusCode == 403) {
                return getApp().toPromise(wx.login)();
            }
            //正常返回
            if (res.statusCode == 200) {
                resolve(res)
                return Promise.reject(0)
            }
            //其他情况
            reject(res)
            return Promise.reject(0)
        }).then(res => {
            return getApp().https(getApp().api.accountWxLogin, {
                code: res.code
            }, 'POST')
        }).then(res => {
            if (!res.data.success) {
                reject(res)
            }
            //还没有绑定账号
            if (!res.data.data.token) {
                reject(false)
            }
            getApp().handleLoginData(res.data.data)
            //获取到正常的数据后，重新进行网络请求
            return netWork(url, data, method, header, this)
        }).then(res => {
            if (res.statusCode == 200) {
                resolve(res)
            }
            reject(res)
        }).catch(res => {
            if (res == 0) {
                return
            }
            reject(res)
        })
    })
}

export default https