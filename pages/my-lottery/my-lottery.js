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
        // 后端返回的是 [{id, lotteryId, lotteryTitle, isWinner, prizeName, participatedAt}, ...]
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
    const item = e.detail.item || e.currentTarget.dataset.item;
    // 跳转到详情
    wx.navigateTo({
        url: `/pages/lottery/detail?id=${item.lotteryId}`
    });
  }
})
