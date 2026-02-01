Component({
  properties: {
    list: {
      type: Array,
      value: []
    },
    // 是否显示右侧箭头，默认显示
    showArrow: {
      type: Boolean,
      value: true
    },
    // 空状态提示文案
    emptyText: {
      type: String,
      value: '暂无记录'
    }
  },
  methods: {
    onItemTap(e) {
      const item = e.currentTarget.dataset.item;
      this.triggerEvent('click', { item });
    }
  }
})
