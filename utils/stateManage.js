//store的核心逻辑类
const storeCore = {

    stateMap: new Map(),
    pageMap: new Map(),

    /**
     * 注册计数器
     * 
     * @retrun Number 新的计数器
     */
    getRegisterIndex: function() {
        this.registerIndex = (this.registerIndex || 0) + 1
        return this.registerIndex
    },

    /**
     * 提交数据改变
     * 
     * @param attr 要改变的属性名
     * @param value 新的属性值
     */
    commit: function(attr, value) {
        if (this.state[attr] == value) {
            return
        }
        this.state[attr] = value
        const indexArray = this.stateMap.get(attr)
        if (!indexArray || indexArray.length == 0) {
            return;
        }
        for (var index of indexArray) {
            const context = this.pageMap.get(index)
            if (!context) {
                continue
            }
            context.setData({
                [`state.${attr}`]: value
            })
        }
    },

    /**
     * 注册状态
     * 
     * @param context 上下文环境
     * @param state 要监控的状态属性名列表
     */
    register: function(context, state) {
        if (!context || !state || state.length == 0) {
            return;
        }
        const index = this.getRegisterIndex();
        this.pageMap.set(index, context)
        const changeData = {}
        for (var attr of state) {
            let indexArray = this.stateMap.get(attr)
            if (!indexArray) {
                indexArray = []
                this.stateMap.set(attr, indexArray)
            }
            indexArray.push(index)
            changeData[`state.${attr}`] = this.state[attr]
        }

        context.setData(changeData)
        return index
    },
    /**
     * 注销状态
     * 
     * @param index 注册器的计数
     * @param state 注销的状态列表
     */
    unregister: function(index, state) {
        if (!state || state.length == 0) {
            return;
        }
        this.pageMap.delete(index)
        for (var attr of state) {
            const indexArray = this.stateMap.get(attr)
            const index = indexArray.indexOf(index)
            if (index == -1) {
                continue;
            }
            indexArray.splice(index, 1)
        }
    }
}


const originalApp = App;
App = function(config) {

    const {
        onLaunch
    } = config

    config.onLaunch = function(options) {
        if (typeof onLaunch === 'function') {
            onLaunch.call(this, options)
        }
        if (!this.store) {
            return;
        }
        this.store = Object.assign(this.store, storeCore)
        console.log(this.store)
    }
    return originalApp(config)
}


//页面的注册与注销
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
        if (!getApp().store || !this.states || this.states.length == 0) {
            return;
        }
        this.$StoreIndex = getApp().store.register(this, this.states)
    }


    config.onUnload = function() {
        if (typeof onUnload === 'function') {
            onUnload.call(this)
        }
        if (!this.$StoreIndex || !getApp().store || !this.states || this.states.length == 0) {
            return;
        }
        getApp().store.unregister(this.$StoreIndex, this.states)
    }

    return originalPage(config)
}


//组件的注册与注销
const originalComponent = Component
Component = function(config) {
    console.log(config.lifetimes || config)

    const lifetimes = config.lifetimes || config

    const {
        attached,
        detached
    } = lifetimes

    lifetimes.attached = function() {
        if (typeof attached === 'function') {
            attached.call(this)
        }
        if (!getApp().store || !config.states || config.states.length == 0) {
            return;
        }
        this.$StoreIndex = getApp().store.register(this, config.states)
    }

    lifetimes.detached = function() {
        if (typeof detached === 'function') {
            detached.call(this)
        }
        if (!this.$StoreIndex || !getApp().store || !config.states || config.states.length == 0) {
            return;
        }
        getApp().store.unregister(this.$StoreIndex, config.states)
    }

    return originalComponent(config)
}