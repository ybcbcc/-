const { request } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    lottery: {},
    updatedAt: '',
    canEdit: true
  },

  parseBJMillis(str) {
    if (!str) return 0;
    if (typeof str === 'string' && str.includes('T') && (str.includes('Z') || /[+-]\d{2}:\d{2}/.test(str))) {
      return new Date(str).getTime();
    }
    const iso = String(str).replace(' ', 'T');
    return new Date(iso + '+08:00').getTime();
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
        const now = Date.now();
        const startMs = this.parseBJMillis(res.startTime);
        const adjStart = startMs ? startMs - 8 * 3600 * 1000 : 0;
        const canEdit = !(res.auditStatus === 'approved' && adjStart && now > adjStart);
        this.setData({
          lottery: res,
          updatedAt: res.updatedAt ? res.updatedAt.replace('T', ' ').substring(0, 19) : '',
          canEdit
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleEdit() {
    if (!this.data.canEdit) {
      wx.showToast({ title: '已开始且审核通过，无法修改', icon: 'none' });
      return;
    }
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
