const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryList: []
  },

  onLoad(options) {
    this.fetchData();
  },

  fetchData() {
    request('/api/user/lottery-history')
      .then(res => {
        this.setData({
          lotteryList: res
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleItemClick(e) {
    console.log('点击了抽奖记录', e.detail.item);
    wx.showToast({
      title: '查看详情',
      icon: 'none'
    });
  }
})
