Component({
  properties: {
    options: {
      type: Array,
      value: []
    },
    selectedKey: {
      type: String,
      value: ''
    }
  },
  methods: {
    onTap(e) {
      const key = e.currentTarget.dataset.key;
      this.setData({ selectedKey: key });
      this.triggerEvent('change', { key });
    }
  }
})
