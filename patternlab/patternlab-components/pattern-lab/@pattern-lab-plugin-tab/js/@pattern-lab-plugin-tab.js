// workaround to `PluginTab undefined` error in Safari
window.PluginTab = {
  /**
   * The function defined as the onready callback within the plugin configuration.
   */
  init: function() {
    //placeholder that will be replaced during configuation
    //most plugins could probably just implement logic here instead.
    function addPanels() {
      window.patternlab.panels.add({
  id: 'sg-panel-json',
  name: 'JSON',
  default:
    window.config.defaultPatternInfoPanelCode &&
    window.config.defaultPatternInfoPanelCode === 'json',
  templateID: 'pl-panel-template-code',
  httpRequest: true,
  httpRequestReplace: '.json',
  httpRequestCompleted: false,
  prismHighlight: true,
  language: 'json', //,
  /* TODO: We would need to find a way to enable keyCombo for multiple panels
  keyCombo: 'ctrl+shift+z',*/
});


    }

    // workaround to try recovering from load order race conditions
    if (window.patternlab && window.patternlab.panels) {
      addPanels();
    } else {
      document.addEventListener('patternLab.pageLoad', addPanels);
    }
  },
};
