const { request } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    item: {}
  },
  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.fetchDetail(options.id);
    }
  },
  fetchDetail(id) {
    request(`/api/admin/lottery/detail?id=${id}`)
      .then(res => {
        this.setData({ item: res });
      })
      .catch(err => {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      });
  },
  handleApprove() {
    wx.showModal({
      title: '确认审核',
      content: '确认以管理员身份通过该抽奖？',
      success: (rs) => {
        if (rs.confirm) {
          this.submitAudit('approved');
        }
      }
    });
  },
  handleReject() {
    wx.showModal({
      title: '确认拒绝',
      content: '确认以管理员身份拒绝该抽奖？',
      success: (rs) => {
        if (rs.confirm) {
          this.submitAudit('rejected');
        }
      }
    });
  },
  submitAudit(action) {
    request('/api/admin/lottery/audit', 'POST', { id: this.data.id, action })
      .then(() => {
        wx.showToast({ title: '操作成功', icon: 'success' });
        this.fetchDetail(this.data.id);
      })
      .catch(err => {
        wx.showToast({ title: err.message || '提交失败', icon: 'none' });
      });
  }
})
