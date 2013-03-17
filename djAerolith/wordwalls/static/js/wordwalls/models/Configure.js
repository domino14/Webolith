WW.Configure.Model = Backbone.Model.extend({
  defaults: function() {
    return {
      tilesOn: true,
      tileSelection: '1',
      font: 'mono',
      bold: false,
      showTable: true,
      showCanvas: true,
      showBorders: false
    }
  },
  setConfig: function(params) {
    var styleObj;
    styleObj = $.parseJSON(params);
    if (styleObj) {
      this.set({
        tilesOn: styleObj.tc.on,
        tileSelection: styleObj.tc.selection,
        font: styleObj.tc.font,
        bold: styleObj.tc.bold,
        showTable: styleObj.bc.showTable,
        showCanvas: styleObj.bc.showCanvas,
        showBorders: styleObj.bc.showBorders
      });
    }
  },
  url: '/wordwalls/api/configure/'
});