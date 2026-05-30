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

  parseBJMillis(str) {
    if (!str) return 0;
    if (typeof str === 'string' && str.includes('T') && (str.includes('Z') || /[+-]\d{2}:\d{2}/.test(str))) {
      return new Date(str).getTime();
    }
    const iso = String(str).replace(' ', 'T');
    return new Date(iso + '+08:00').getTime();
  },
  fetchData() {
    request('/api/activity/list')
      .then(res => {
        const list = (res || []).map(item => {
          const startMs = this.parseBJMillis(item.startTime);
          const startStr = startMs ? this.formatDisplayTime(startMs) : '';
          return {
            id: item.id,
            title: item.name,
            time: startStr,
            extra: `持续:${item.durationMinutes}分钟 弹出:${item.appearanceCount}`,
            ...item
          };
        });
        this.setData({ activityList: list });
        this.applyFilter();
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 中文注释：使用本地时间字段拼接，避免 toISOString 再次转成 UTC 展示
  formatDisplayTime(ms) {
    const dt = new Date(ms);
    const year = dt.getFullYear();
    const month = `0${dt.getMonth() + 1}`.slice(-2);
    const day = `0${dt.getDate()}`.slice(-2);
    const hour = `0${dt.getHours()}`.slice(-2);
    const minute = `0${dt.getMinutes()}`.slice(-2);
    return `${year}-${month}-${day} ${hour}:${minute}`;
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
      const startMs = this.parseBJMillis(i.startTime);
      const endMs = startMs + (i.durationMinutes || 0) * 60000;
      if (key === 'active') return startMs <= now && endMs >= now;
      if (key === 'upcoming') return startMs > now;
      if (key === 'ended') return endMs < now;
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
