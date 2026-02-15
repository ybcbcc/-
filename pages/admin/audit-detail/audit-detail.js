const { request } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    item: {},
    canAudit: true
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
  fetchDetail(id) {
    request(`/api/admin/lottery/detail?id=${id}`)
      .then(res => {
        const now = Date.now();
        const startMs = this.parseBJMillis(res.startTime);
        const adjStart = startMs ? startMs - 8 * 3600 * 1000 : 0;
        const canAudit = !(adjStart && now > adjStart);
        this.setData({ item: res, canAudit });
      })
      .catch(err => {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      });
  },
  handleApprove() {
    if (!this.data.canAudit) {
      wx.showToast({ title: '已开始，无法审核', icon: 'none' });
      return;
    }
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
    if (!this.data.canAudit) {
      wx.showToast({ title: '已开始，无法审核', icon: 'none' });
      return;
    }
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
  },
  handleForceRemove() {
    wx.showModal({
      title: '强制下架',
      content: '确认强制下架并删除该抽奖？',
      success: (rs) => {
        if (rs.confirm) {
          request('/api/admin/lottery/delete', 'POST', { id: this.data.id })
            .then(() => {
              wx.showToast({ title: '已下架', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1200);
            })
            .catch(err => {
              wx.showToast({ title: err.message || '下架失败', icon: 'none' });
            });
        }
      }
    });
  }
})
