const { request } = require('../../utils/request.js');

Page({
  data: {
    publishList: [],
    filteredList: [],
    selectedKey: 'all',
    filterOptions: [
      { key: 'all', text: '全部' },
      { key: 'pending', text: '待审核' },
      { key: 'approved', text: '已通过' },
      { key: 'rejected', text: '已拒绝' }
    ]
  },

  onLoad(options) {
    // 页面首次加载
  },

  onShow() {
    this.fetchData();
  },

  fetchData() {
    request('/api/user/publish-history')
      .then(res => {
        // 后端返回 []Lottery
        const list = (res || []).map(item => ({
          id: item.id,
          title: item.title,
          time: item.createdAt ? item.createdAt.substring(0, 10) : '',
          extra: `状态:${item.status} 审核:${item.auditStatus}`,
          // Keep raw data
          ...item
        }));

        this.setData({ publishList: list });
        this.applyFilter();
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleItemClick(e) {
    const item = e.detail.item || e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/publish/manage/manage?id=${item.id}`
    });
  },
  onFilterChange(e) {
    const key = e.detail.key;
    this.setData({ selectedKey: key });
    this.applyFilter();
  },
  applyFilter() {
    const key = this.data.selectedKey;
    const src = this.data.publishList || [];
    if (key === 'all') {
      this.setData({ filteredList: src });
    } else {
      const list = src.filter(i => (i.auditStatus === key));
      this.setData({ filteredList: list });
    }
  }
})
