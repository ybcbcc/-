const { request, uploadFile } = require('../../../utils/request.js');

Page({
  data: {
    avatarUrl: '',
    nickName: ''
  },

  onLoad() {
    this.fetchUserInfo();
  },

  fetchUserInfo() {
    request('/api/user/info')
      .then(res => {
        this.setData({
          avatarUrl: res.avatarUrl || '', // 可能是空或者默认图
          nickName: res.nickname || ''
        });
      })
      .catch(err => {
        console.error(err);
      });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    // 立即上传
    wx.showLoading({ title: '上传中...' });
    uploadFile(avatarUrl)
      .then(fileID => {
        wx.hideLoading();
        this.setData({ avatarUrl: fileID });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      });
  },

  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },
  
  onNicknameChange(e) {
    this.setData({ nickName: e.detail.value });
  },

  handleSave() {
    if (!this.data.nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    request('/api/user/update', 'POST', {
      nickName: this.data.nickName,
      avatarUrl: this.data.avatarUrl
    })
      .then(res => {
        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  }
})
