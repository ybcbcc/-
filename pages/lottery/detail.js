const app = getApp();
const { request } = require('../../utils/request.js');

// 统一时间解析：后端可能返回不带时区的字符串，这里按北京时间处理
function parseBJMillis(str) {
  if (!str) return 0;
  if (str.includes('T') && (str.includes('Z') || /[+-]\d{2}:\d{2}/.test(str))) {
    return new Date(str).getTime();
  }
  const iso = str.replace(' ', 'T');
  return new Date(iso + '+08:00').getTime();
}

function isUnauthorizedError(err) {
  return err && err.message === 'Unauthorized';
}

Page({
  data: {
    lotteryId: null,
    lotteryInfo: {},
    result: null,
    isDrawing: false,
    autoCheckedResult: false,
    shareButtonTop: 96,
    shareCode: '',
    shareSource: 'top_button',
    currentUserId: '',
    shareReady: false,
    sharePreparing: false,
    pendingShareRewardCheck: false,
    incomingShareUserId: '',
    incomingShareCode: '',
    shareRewardChecked: false
  },

  onLoad(options) {
    this.initShareButtonPosition();
    // 默认隐藏原生右上角分享菜单，只保留页面自定义分享入口。
    if (wx.hideShareMenu) {
      wx.hideShareMenu();
    }
    if (options.id) {
      const incomingShareUserId = options.shareUserId || '';
      const incomingShareCode = options.shareCode || '';
      this.setData({
        lotteryId: options.id,
        incomingShareUserId,
        incomingShareCode,
        pendingShareRewardCheck: !!(incomingShareUserId && incomingShareCode)
      });
      this.fetchLotteryDetail(options.id);
    }
    this.prepareShareEnv();
  },

  onShow() {
    this.tryRewardShareBackflow();
  },

  initShareButtonPosition() {
    const defaultTop = 96;
    try {
      const rect = wx.getMenuButtonBoundingClientRect();
      if (rect && rect.bottom) {
        this.setData({
          shareButtonTop: rect.bottom + 12
        });
        return;
      }
    } catch (err) {
      console.warn('Get menu button rect failed', err);
    }
    this.setData({ shareButtonTop: defaultTop });
  },

  fetchLotteryDetail(id) {
    this.setData({
      lotteryInfo: { title: '加载中...' }
    });

    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        // 格式化时间
        if (res.endTime) {
            res.endTimeFormat = res.endTime.replace('T', ' ').substring(0, 19);
        }
        if (res.startTime) {
            res.startTimeFormat = res.startTime.replace('T', ' ').substring(0, 19);
        }
        const nowMs = Date.now();
        const start = parseBJMillis(res.startTime);
        const deadline = parseBJMillis(res.endTime);
        let statusText = '';
        if (start && nowMs < start) {
          statusText = '报名未开始';
        } else if (deadline && nowMs > deadline) {
          statusText = '活动已结束';
        } else if (res.maxParticipants && res.currentParticipants >= res.maxParticipants) {
          statusText = '人数已满';
        } else {
          statusText = '立即报名';
        }
        this.setData({
          lotteryInfo: res,
          statusText,
          statusActive: statusText === '立即报名'
        });
        if (statusText === '活动已结束' && !this.data.autoCheckedResult) {
          this.setData({ autoCheckedResult: true });
          this.viewResult();
        }
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  onShareAppMessage() {
    const info = this.data.lotteryInfo || {};
    const title = info.title || '分享活动';
    const imageUrl = info.imageUrl || '';

    if (!this.data.lotteryId || !this.data.shareReady || !this.data.currentUserId || !this.data.shareCode) {
      const fallbackPath = this.data.lotteryId ? `/pages/lottery/detail?id=${this.data.lotteryId}` : '/pages/home/home';
      return {
        title,
        path: fallbackPath,
        imageUrl
      };
    }

    const shareCode = this.data.shareCode;
    const finalPath = `/pages/lottery/detail?id=${this.data.lotteryId}&shareUserId=${encodeURIComponent(this.data.currentUserId || '')}&shareCode=${encodeURIComponent(shareCode)}&shareSource=${this.data.shareSource}`;

    return {
      title,
      path: finalPath,
      imageUrl,
      success: () => {
        wx.showToast({
          title: '分享成功，好友打开后可获得奖励',
          icon: 'none'
        });
        this.confirmShareTicket(shareCode)
          .catch(err => {
            console.error('Confirm share ticket failed', err);
          })
          .finally(() => {
            this.refreshShareTicket();
          });
      }
    };
  },

  prepareShareEnv() {
    this.loadCurrentUserIdWithRetry()
      .then(currentUserId => {
        this.setData({
          currentUserId,
          shareCode: '',
          shareReady: false
        });
        return this.ensureShareTicket(true);
      })
      .catch(err => {
        console.error('Prepare share env failed', err);
        this.setData({
          shareReady: false,
          sharePreparing: false
        });
      });
  },

  loadCurrentUserIdWithRetry(retry = true) {
    if (this.data.currentUserId) {
      return Promise.resolve(this.data.currentUserId);
    }
    return app.login()
      .then(() => this.requestWithRelogin('/api/user/info'))
      .then(res => {
        const currentUserId = res.id || '';
        this.setData({ currentUserId });
        return currentUserId;
      })
      .catch(err => {
        if (retry && isUnauthorizedError(err)) {
          return app.login(true).then(() => this.loadCurrentUserIdWithRetry(false));
        }
        throw err;
      });
  },

  requestWithRelogin(url, method = 'GET', data = {}, retry = true) {
    return request(url, method, data).catch(err => {
      if (retry && isUnauthorizedError(err)) {
        return app.login(true).then(() => request(url, method, data));
      }
      throw err;
    });
  },

  ensureShareTicket(forceRefresh = false) {
    if (!this.data.lotteryId) {
      return Promise.resolve('');
    }
    if (!forceRefresh && this.data.shareCode) {
      this.setData({ shareReady: true });
      return Promise.resolve(this.data.shareCode);
    }
    if (this.shareTicketPromise) {
      return this.shareTicketPromise;
    }

    this.setData({
      shareReady: false,
      sharePreparing: true
    });

    this.shareTicketPromise = this.loadCurrentUserIdWithRetry()
      .then(() => this.requestWithRelogin('/api/lottery/share/create', 'POST', {
        lotteryId: this.data.lotteryId,
        shareSource: this.data.shareSource,
        shareChannel: 'wechat_friend'
      }))
      .then(res => {
        const shareCode = res && res.shareCode ? res.shareCode : '';
        this.setData({
          shareCode,
          shareReady: !!shareCode,
          sharePreparing: false
        });
        return shareCode;
      })
      .catch(err => {
        console.error('Create share record failed', err);
        this.setData({
          shareCode: '',
          shareReady: false,
          sharePreparing: false
        });
        throw err;
      })
      .finally(() => {
        this.shareTicketPromise = null;
      });

    return this.shareTicketPromise;
  },

  confirmShareTicket(shareCode) {
    if (!shareCode || !this.data.lotteryId) {
      return Promise.resolve();
    }
    return this.requestWithRelogin('/api/lottery/share/confirm', 'POST', {
      lotteryId: this.data.lotteryId,
      shareCode,
      shareSource: this.data.shareSource
    });
  },

  refreshShareTicket() {
    this.setData({
      shareCode: '',
      shareReady: false
    });
    this.ensureShareTicket(true).catch(err => {
      console.error('Refresh share ticket failed', err);
    });
  },

  tryRewardShareBackflow() {
    if (!this.data.pendingShareRewardCheck || this.data.shareRewardChecked) {
      return;
    }
    this.loadCurrentUserIdWithRetry()
      .then(currentUserId => {
        if (!currentUserId || currentUserId === this.data.incomingShareUserId) {
          this.setData({ shareRewardChecked: true });
          return null;
        }
        return this.requestWithRelogin('/api/lottery/share/reward', 'POST', {
          lotteryId: this.data.lotteryId,
          shareUserId: this.data.incomingShareUserId,
          shareCode: this.data.incomingShareCode
        }).then(res => {
          this.setData({ shareRewardChecked: true });
          return res;
        });
      })
      .catch(err => {
        console.error('Reward share backflow failed', err);
      });
  },

  handleDraw() {
    if (this.data.isDrawing) return;
    const info = this.data.lotteryInfo || {};
    const nowMs = Date.now();
    const start = parseBJMillis(info.startTime);
    const deadline = parseBJMillis(info.endTime);
    if (start && nowMs < start) {
      wx.showToast({ title: '报名未开始', icon: 'none' });
      return;
    }
    if (deadline && nowMs > deadline) {
      this.viewResult();
      return;
    }
    if (info.maxParticipants && info.currentParticipants >= info.maxParticipants) {
      wx.showToast({ title: '人数已满', icon: 'none' });
      return;
    }
    this.setData({ isDrawing: true });
    request('/api/lottery/draw', 'POST', { lotteryId: this.data.lotteryId, clientNow: new Date().toISOString() })
      .then(res => {
        this.setData({ isDrawing: false });
        wx.showToast({ title: '报名成功', icon: 'none' });
        this.fetchLotteryDetail(this.data.lotteryId);
      })
      .catch(err => {
        this.setData({ isDrawing: false });
        console.error("Draw error:", err);
        let content = '抽奖失败';
        if (err.message && err.message.includes('Already participated')) {
            content = '您已经报名过了';
        } else if (err.message && err.message.includes('Insufficient integral')) {
            content = '您当前积分不足';
        } else if (err.message && err.message.includes('Participants limit reached')) {
            content = '参与人数已满';
        } else {
            content = err.message || '未知错误';
        }
        wx.showModal({
            title: '提示',
            content,
            showCancel: false
        });
      });
  }
,
  viewResult() {
    request('/api/lottery/draw', 'POST', { lotteryId: this.data.lotteryId, clientNow: new Date().toISOString() })
      .then(res => {
        if (res && typeof res.isWon !== 'undefined') {
          const msg = res.isWon ? `恭喜中奖！奖品：${res.prizeName}` : '很遗憾，未中奖';
          this.setData({ result: msg });
          wx.showModal({
            title: res.isWon ? '🎉 中奖啦' : '再接再厉',
            content: msg,
            showCancel: false
          });
        } else {
          wx.showToast({ title: '您尚未报名', icon: 'none' });
        }
      })
      .catch(err => {
        const msg = err.message && err.message.includes('Not participated') ? '您尚未报名' : (err.message || '查询失败');
        wx.showToast({ title: msg, icon: 'none' });
      });
  }
})
