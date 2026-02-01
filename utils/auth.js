const app = getApp();

// 统一鉴权守卫
// 用法: authGuard().then(() => { ...执行业务... })
const authGuard = () => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    if (token) {
      resolve(token);
      return;
    }

    // 提示用户登录
    wx.showModal({
      title: '提示',
      content: '需要登录才能继续操作',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          // 跳转到个人中心去登录，或者直接触发登录逻辑
          // 这里简单处理：直接调用 App 登录，实际最好引导用户去 Profile 页点击授权
          wx.navigateTo({
            url: '/pages/profile/profile'
          });
          reject(new Error('Redirect to login'));
        } else {
          reject(new Error('User cancelled'));
        }
      }
    });
  });
};

module.exports = {
  authGuard
};
