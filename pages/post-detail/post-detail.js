// pages/post-detail/post-detail.js
Page({
  data: {
    post: {}
  },

  onLoad(options) {
    // 接收上个页面传递的 JSON 字符串数据
    if (options.postData) {
      try {
        const post = JSON.parse(decodeURIComponent(options.postData));
        
        // 格式化时间
        if (post.createdAt) {
          post.createdAtFormat = post.createdAt.substring(0, 19).replace('T', ' ');
        }
        
        // 兼容后端字段 imageUrl (前端有时习惯用 image, 这里统一一下)
        // 确保 wxml 里用的是 post.imageUrl
        if (!post.imageUrl && post.image) {
          post.imageUrl = post.image;
        }

        console.log('Post Detail Data:', post); // Debug log
        
        this.setData({ post });
      } catch (e) {
        console.error('解析数据失败', e);
        wx.showToast({ title: '数据加载错误', icon: 'none' });
      }
    }
  },

  // 图片预览
  previewImage() {
    const url = this.data.post.imageUrl;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  }
})
