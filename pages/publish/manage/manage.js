const { request } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    lottery: {},
    updatedAt: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.fetchDetail(options.id);
    }
  },
  
  onShow() {
    if (this.data.id) {
        this.fetchDetail(this.data.id);
    }
  },

  fetchDetail(id) {
    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        this.setData({
          lottery: res,
          updatedAt: res.updatedAt ? res.updatedAt.replace('T', ' ').substring(0, 19) : ''
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleEdit() {
    wx.navigateTo({
      url: `/pages/publish/edit/edit?id=${this.data.id}`
    });
  },

  handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteLottery();
        }
      }
    });
  },

  deleteLottery() {
    wx.showLoading({ title: '删除中' });
    request(`/api/post/delete?id=${this.data.id}`, 'POST')
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '删除成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '删除失败', icon: 'none' });
      });
  }
})
