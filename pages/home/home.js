const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryList: []
  },
  onShow() {
    this.fetchHomeData();
  },
  
  fetchHomeData() {
    request('/api/home/list')
      .then(res => {
        // 后端现在只返回 []Lottery
        const list = (res || []).map(item => {
          return {
            id: item.id,
            title: item.title,
            desc: item.description,
            status: item.status === 'active' ? '进行中' : '已结束',
            prizeName: item.prizeName,
            cost: item.costPerEntry,
            imageUrl: item.imageUrl || '' 
          };
        });

        this.setData({
          lotteryList: list
        });
      })
      .catch(err => {
        console.error('Fetch home data failed', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  goToDetail(e) {
    const id = e.detail.id || e.currentTarget.dataset.id;
    // 直接跳转到 Lottery 详情页，不再区分 Post
    wx.navigateTo({
      url: `/pages/lottery/detail?id=${id}`
    });
  }
})
