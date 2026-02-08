const { request } = require('../../../utils/request.js');

Page({
  data: {
    activityList: [],
    filteredList: [],
    selectedKey: 'active',
    filterOptions: [
      { key: 'ended', text: '已结束' },
      { key: 'upcoming', text: '未开始' },
      { key: 'active', text: '进行中' },
      { key: 'all', text: '全部' }
    ]
  },

  onShow() {
    this.fetchData();
  },

  fetchData() {
    request('/api/activity/list')
      .then(res => {
        const list = (res || []).map(item => ({
          id: item.id,
          title: item.name,
          time: item.startTime ? item.startTime.substring(0, 16) : '',
          extra: `持续:${item.durationMinutes}分钟 弹出:${item.appearanceCount}`,
          ...item
        }));
        this.setData({ activityList: list });
        this.applyFilter();
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onFilterChange(e) {
    const key = e.detail.key;
    this.setData({ selectedKey: key });
    this.applyFilter();
  },

  applyFilter() {
    const key = this.data.selectedKey;
    const src = this.data.activityList || [];
    const now = Date.now();
    if (key === 'all') {
      this.setData({ filteredList: src });
      return;
    }
    const list = src.filter(i => {
      if (!i.startTime) return false;
      const start = new Date(i.startTime).getTime();
      const end = start + (i.durationMinutes || 0) * 60000;
      if (key === 'active') return start <= now && end >= now;
      if (key === 'upcoming') return start > now;
      if (key === 'ended') return end < now;
      return true;
    });
    this.setData({ filteredList: list });
  },

  handleItemClick(e) {
    const item = e.detail.item || e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/activity/publish/publish?id=${item.id}`
    });
  },

  handlePublishClick() {
    wx.navigateTo({
      url: '/pages/activity/publish/publish'
    });
  }
})
