const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryList: [],
    filteredList: [],
    selectedKey: 'active',
    filterOptions: [
      { key: 'all', text: '全部' },
      { key: 'active', text: '进行中' },
      { key: 'finished', text: '已结束' }
    ],
    showAdModal: false,
    adData: null,
    lastAdData: null
  },
  parseBJMillis(str) {
    if (!str) return 0;
    if (typeof str === 'string' && str.includes('T') && (str.includes('Z') || /[+-]\d{2}:\d{2}/.test(str))) {
      return new Date(str).getTime();
    }
    const iso = String(str).replace(' ', 'T');
    return new Date(iso + '+08:00').getTime();
  },
  onShow() {
    this.fetchHomeData();
    this.fetchAd();
  },
  
  fetchHomeData() {
    request('/api/home/list')
      .then(res => {
        const nowMs = Date.now();
        const bjNowStr = new Date(nowMs + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        console.log('[TimeDiag][home][BJ] now=', bjNowStr, 'count=', (res || []).length);
        const list = (res || []).map(item => {
          const startMs = this.parseBJMillis(item.startTime);
          const endMs = this.parseBJMillis(item.endTime);
          const adjStart = startMs ? startMs - 8 * 3600 * 1000 : 0;
          const adjEnd = endMs ? endMs - 8 * 3600 * 1000 : 0;
          const startBJStr = new Date(startMs + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
          const endBJStr = new Date(endMs + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
          console.log('[TimeDiag][home][BJ] item=', item.id, 'startBJ=', startBJStr, 'endBJ=', endBJStr, 'adjStartMs=', adjStart, 'adjEndMs=', adjEnd);
          let statusText = '进行中';
          if (adjStart && nowMs < adjStart) {
            statusText = '未开始';
          } else if (adjEnd && nowMs > adjEnd) {
            statusText = '已结束';
          }
          return {
            id: item.id,
            title: item.title,
            desc: item.description,
            status: statusText,
            prizeName: item.prizeName,
            cost: item.costPerEntry,
            imageUrl: item.imageUrl || '' 
          };
        });

        this.setData({
          lotteryList: list
        });
        this.applyFilter();
      })
      .catch(err => {
        console.error('Fetch home data failed', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },
  fetchAd() {
    request('/api/activity/ad/latest')
      .then(res => {
        if (res) {
          this.setData({ adData: res, lastAdData: res, showAdModal: true });
        }
      })
      .catch(() => {
        // 无活动时不提示
      });
  },

  goToDetail(e) {
    const id = e.detail.id || e.currentTarget.dataset.id;
    // 直接跳转到 Lottery 详情页，不再区分 Post
    wx.navigateTo({
      url: `/pages/lottery/detail?id=${id}`
    });
  },
  onFilterChange(e) {
    const key = e.detail.key;
    this.setData({ selectedKey: key });
    this.applyFilter();
  },
  applyFilter() {
    const key = this.data.selectedKey;
    const src = this.data.lotteryList || [];
    if (key === 'all') {
      this.setData({ filteredList: src });
    } else {
      const list = src.filter(i => {
        if (key === 'active') return i.status === '进行中';
        if (key === 'finished') return i.status === '已结束';
        return true;
      });
      this.setData({ filteredList: list });
    }
  },
  closeAd() {
    this.setData({ showAdModal: false });
  },
  reopenAnnouncement() {
    request('/api/activity/announcements?limit=1')
      .then(list => {
        const item = (list || [])[0];
        if (item) {
          this.setData({ adData: item, lastAdData: item, showAdModal: true });
        } else {
          wx.showToast({ title: '暂无公告', icon: 'none' });
        }
      })
      .catch(() => {
        wx.showToast({ title: '暂无公告', icon: 'none' });
      });
  }
})
