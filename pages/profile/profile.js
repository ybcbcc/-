const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    isLoggedIn: false, // 登录状态
    userInfo: {
      avatarUrl: '', // 默认头像留空或使用默认图
      nickName: '点击登录',
      points: 0
    },
    menuList: [
      { id: 'points', title: '我的积分', icon: '' },
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
        'userInfo.avatarUrl': '',
        'userInfo.points': 0
      });
    }
  },

  fetchUserInfo() {
    request('/api/user/info')
      .then(res => {
        this.setData({
          'userInfo.points': res.points || 0,
          // 如果后端有昵称，显示后端昵称；否则显示默认
          'userInfo.nickName': res.nickname || '微信用户',
          'userInfo.avatarUrl': res.avatarUrl || ''
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

  // 用户点击头像登录/授权
  handleLogin() {
    if (this.data.isLoggedIn) {
      // 已登录状态下，点击头像更新资料
      this.updateUserProfile();
    } else {
      // 未登录，先执行登录
      wx.showLoading({ title: '登录中...' });
      app.login()
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          this.fetchUserInfo(); // 获取初始信息
          
          // 登录成功后，询问是否同步微信资料
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

  // 调用微信接口获取并更新资料
  updateUserProfile() {
    wx.getUserProfile({
      desc: '完善会员资料', 
      success: (res) => {
        const { avatarUrl, nickName } = res.userInfo;
        
        // 1. 更新本地展示
        this.setData({
          'userInfo.avatarUrl': avatarUrl,
          'userInfo.nickName': nickName
        });
        
        // 2. 同步到后端数据库
        request('/api/user/update', 'POST', {
          nickName: nickName,
          avatarUrl: avatarUrl
        }).then(res => {
          wx.showToast({ title: '资料已更新', icon: 'success' });
        }).catch(err => {
          console.error('Update profile failed', err);
          wx.showToast({ title: '同步失败', icon: 'none' });
        });
      },
      fail: (err) => {
        console.log('User denied profile access');
      }
    });
  },

  handleMenuClick(e) {
    // 未登录拦截
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const item = e.currentTarget.dataset.item;
    
    if (item.id === 'points') return;

    if (item.id === 'contact') {
      wx.showToast({
        title: '即将打开客服会话',
        icon: 'none'
      });
    } else {
      const routes = {
        'lottery': '/pages/my-lottery/my-lottery',
        'publish': '/pages/my-publish/my-publish',
        'member': '/pages/my-member/my-member'
      };

      const url = routes[item.id];
      if (url) {
        wx.navigateTo({ url });
      } else {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      }
    }
  }
})
