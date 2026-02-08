const { request } = require('../../../utils/request.js');

Page({
  data: {
    list: [],
    selectedKey: 'all',
    filterOptions: [
      { key: 'all', text: '全部' },
      { key: 'pending', text: '待审核' },
      { key: 'approved', text: '已通过' },
      { key: 'rejected', text: '已拒绝' }
    ]
  },
  onShow() {
    this.fetchData();
  },
  fetchData() {
    const key = this.data.selectedKey || 'all';
    const qs = key === 'all' ? 'all' : key;
    request(`/api/admin/lotteries?auditStatus=${qs}`)
      .then(res => {
        const list = (res || []).map(item => ({
          id: item.id,
          title: item.title,
          desc: `状态: ${item.status}  审核: ${item.auditStatus}`,
          time: item.createdAt ? item.createdAt.substring(0, 16).replace('T',' ') : ''
        }));
        this.setData({ list });
      })
      .catch(err => {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      });
  },
  onFilterChange(e) {
    const key = e.detail.key;
    this.setData({ selectedKey: key });
    this.fetchData();
  },
  handleItemClick(e) {
    const item = e.detail.item;
    wx.navigateTo({ url: `/pages/admin/audit-detail/audit-detail?id=${item.id}` });
  }
})
