// app.js
const { request } = require('./utils/request.js');

App({
  onLaunch() {
    // 启动时清除发布草稿（实现关闭小程序后草稿失效）
    wx.removeStorageSync('publish_draft');

    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'prod-4gvarcgoa255cecb', // 您的云开发环境 ID
        traceUser: true,
      });
    }

    // 自动尝试静默登录
    this.login().catch(err => {
      console.log('自动登录失败，等待用户手动登录', err);
    });
  },

  // 将登录逻辑暴露给页面按需调用
  login() {
    return new Promise((resolve, reject) => {
      // 检查是否有 Token
      const token = wx.getStorageSync('token');
      if (token) {
        this.globalData.isLoggedIn = true;
        resolve(token);
        return;
      }

      wx.login({
        success: res => {
          if (res.code) {
            // 发起网络请求
            request('/api/auth/login', 'POST', { code: res.code })
              .then(data => {
                if (data.token) {
                  wx.setStorageSync('token', data.token);
                  this.globalData.isLoggedIn = true;
                  resolve(data.token);
                } else {
                  reject(new Error('No token received'));
                }
              })
              .catch(err => {
                console.error('Login failed:', err);
                reject(err);
              });
          } else {
            console.log('登录失败！' + res.errMsg);
            reject(new Error(res.errMsg));
          }
        },
        fail: err => reject(err)
      });
    });
  },

  // 确保用户已登录，未登录则弹窗提示
  ensureLogin(callback) {
    if (this.globalData.isLoggedIn || wx.getStorageSync('token')) {
      if (callback) callback();
      return;
    }

    wx.showModal({
      title: '提示',
      content: '该功能需要登录后使用，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '登录中' });
          this.login().then(() => {
            wx.hideLoading();
            wx.showToast({ title: '登录成功' });
            if (callback) callback();
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '登录失败', icon: 'none' });
          });
        }
      }
    });
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    lotteryList: [] // 实际应由首页自行加载，这里仅作兼容
  }
})
