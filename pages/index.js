// pages/index.js
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log(getApp())
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        console.log(this)
    },

    onNextTap() {
        this.nextParam = {
            transNum: 10
        }
        wx.navigateTo({
            url: '/pages/second',
        })
    },

    onPageForResult(code, data) {
        if (code != 101) {
            return;
        }
        console.log('传递回来的数字是：',data)
    }

})