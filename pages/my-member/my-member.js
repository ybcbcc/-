const { request } = require('../../utils/request.js');

Page({
  data: {
    memberInfo: {
      isMember: false,
      memberType: 'free',
      daysRemaining: 0,
      expireAt: '--'
    }
  },

  onLoad(options) {
    this.fetchMemberInfo();
  },

  fetchMemberInfo() {
    request('/api/member/info')
      .then(res => {
        this.setData({
          memberInfo: res
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleRenew() {
    wx.showToast({
      title: '前往充值页面',
      icon: 'none'
    });
  }
})
