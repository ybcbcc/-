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
        // 格式化日期
        if (res.expireAt) {
             res.expireAtFormat = res.expireAt.replace('T', ' ').substring(0, 10);
         } else {
             res.expireAtFormat = '--';
         }
         
         if (res.memberSince) {
             res.memberSinceFormat = res.memberSince.replace('T', ' ').substring(0, 10);
         } else {
             res.memberSinceFormat = '--';
         }
         
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
