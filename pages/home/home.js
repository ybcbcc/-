const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryList: []
  },
  onLoad(options) {
    // 页面加载逻辑
  },
  onShow() {
    this.fetchHomeData();
  },
  
  fetchHomeData() {
    request('/api/home/list')
      .then(res => {
        // 直接使用后端返回的数据
        // 后端返回的数据结构是 [{type: "lottery", data: {...}}, {type: "post", data: {...}}]
        // 我们需要适配一下前端展示所需的字段 (title, image, status等)
        
        // 增加兜底逻辑：如果 res 为 null/undefined，默认为空数组 []
        const list = (res || []).map(item => {
          if (item.type === 'lottery') {
            return {
              id: item.data.id,
              title: item.data.title,
              status: item.data.status === 1 ? '进行中' : '已结束',
              image: '', // 活动暂无图片字段，可加默认图
              isPost: false
            };
          } else {
            return {
              id: item.data.id,
              title: item.data.content, // 帖子内容作为标题
              status: item.data.status === 1 ? '已发布' : '审核中',
              image: item.data.imageUrl,
              isPost: true
            };
          }
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
    // 兼容组件事件传参 (e.detail.id) 和原生dataset (e.currentTarget.dataset.id)
    // 还需要获取 item 对象来判断类型
    const id = e.detail.id || e.currentTarget.dataset.id;
    
    // 查找当前点击的项，判断类型
    const item = this.data.lotteryList.find(i => i.id === id);
    
    if (item && item.isPost) {
      // 如果是发布的帖子，跳转到帖子详情页
      // 构造一个简单对象传过去，避免 fetchDetail 再次请求失败
      const postData = encodeURIComponent(JSON.stringify({
        id: item.id,
        content: item.title, // 列表页 title 存的是 content
        imageUrl: item.image,
        status: item.status === '已发布' ? 1 : 0,
        createdAt: new Date().toISOString() // 列表页没存时间，暂时 mock 一个，或者去详情页再查
      }));
      
      wx.navigateTo({
        url: `/pages/post-detail/post-detail?postData=${postData}`
      });
    } else {
      // 如果是抽奖活动，跳转到抽奖页
      wx.navigateTo({
        url: `/pages/lottery/detail?id=${id}`
      });
    }
  }
})
