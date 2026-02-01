const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      avatarUrl: '',
      nickName: '点击登录',
      integral: 0, // Changed from points
      memberType: 'free'
    },
    menuList: [
      { id: 'integral', title: '我的积分', icon: '' },
      { id: 'lottery', title: '我的抽奖', icon: '' },
      { id: 'publish', title: '我的发布', icon: '' },
      { id: 'member', title: '我的会员', icon: '' },
      { id: 'contact', title: '我的客服', icon: '' }
    ]
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.setData({ isLoggedIn: true });
      this.fetchUserInfo();
    } else {
      this.setData({ 
        isLoggedIn: false,
        'userInfo.nickName': '点击登录',
        'userInfo.integral': 0
      });
    }
  },

  fetchUserInfo() {
    request('/api/user/info')
      .then(res => {
        this.setData({
          'userInfo.integral': res.integral || 0,
          'userInfo.nickName': res.nickname || '微信用户',
          'userInfo.avatarUrl': res.avatarUrl || '',
          'userInfo.memberType': res.memberType
        });
      })
      .catch(err => {
        console.error('Fetch user info failed', err);
        if (err.message === 'Unauthorized') {
          this.setData({ isLoggedIn: false });
          wx.removeStorageSync('token');
        }
      });
  },

  handleLogin() {
    if (this.data.isLoggedIn) {
      this.updateUserProfile();
    } else {
      wx.showLoading({ title: '登录中...' });
      app.login()
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          this.fetchUserInfo();
          
          wx.showModal({
            title: '提示',
            content: '登录成功，是否同步微信头像和昵称？',
            success: (res) => {
              if (res.confirm) {
                this.updateUserProfile();
              }
            }
          });
        })
        .catch(err => {
          wx.hideLoading();
          wx.showToast({ title: '登录失败', icon: 'none' });
        });
    }
  },

  updateUserProfile() {
    wx.getUserProfile({
      desc: '完善会员资料', 
      success: (res) => {
        const { avatarUrl, nickName } = res.userInfo;
        
        this.setData({
          'userInfo.avatarUrl': avatarUrl,
          'userInfo.nickName': nickName
        });
        
        request('/api/user/update', 'POST', {
          nickName: nickName,
          avatarUrl: avatarUrl
        }).then(res => {
          wx.showToast({ title: '资料已更新', icon: 'success' });
        }).catch(err => {
          wx.showToast({ title: '同步失败', icon: 'none' });
        });
      },
      fail: (err) => {
        console.log('User denied profile access');
      }
    });
  },

  handleMenuClick(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const item = e.currentTarget.dataset.item;
    
    if (item.id === 'integral') return; // Do nothing for now

    if (item.id === 'contact') {
      wx.showToast({ title: '即将打开客服会话', icon: 'none' });
    } else {
      const routes = {
        'lottery': '/pages/my-lottery/my-lottery',
        'publish': '/pages/my-publish/my-publish',
        'member': '/pages/my-member/my-member'
      };

      const url = routes[item.id];
      if (url) {
        wx.navigateTo({ url });
      }
    }
  }
})
