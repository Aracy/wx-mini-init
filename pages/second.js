// pages/second.js
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
        this.setData(options.pageParam)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    onResultTap() {
        this.navigateBackForResult(101, this.data.transNum - 1)
        
    }
})