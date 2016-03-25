/* global requirejs,define, JSON*/
requirejs.config({
  baseUrl: '/static/js/wordwalls',
  waitSeconds: 20,
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.11.0',
    jquery_ui: '../../../../static/js/aerolith/jquery-ui-1.10.2.custom.min',
    underscore: '../../../../static/lib/underscore-1.4.4',
    backbone: '../../../../static/lib/backbone-1.0.0',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    json2: '../../../../static/js/aerolith/json2',
    moment: '../../../../static/lib/moment'
  },
  shim: {
    underscore: {
      exports: '_'  // ^_^
    },
    backbone: {
      deps: ['underscore', 'jquery', 'json2'],
      exports: 'Backbone'
    },
    'jquery_ui': ['jquery'],
    'json2': {
      exports: 'JSON'
    }
  }
});


define([
  'module',
  'jquery',
  'underscore',
  'models/Configure',
  'views/ConfigureView',
  'views/AppView',
  'backbone',
  'socket',
  'chat',
  'csrfAjax'
], function (module, $, _, Configure, ConfigureView, AppView, Backbone,
  Socket, Chat) {
  "use strict";
  $(function() {
    var Dispatcher, configuration, configurationView, appView, saveName, rx,
      conn, chat, style;
    if (!window["WebSocket"]) {
      window.alert([
        'Your browser does not support WebSockets. Please upgrade to ',
        'a new browser. If you are using Internet Explorer, you must ',
        'upgrade to version 10 or higher.'].join(''));
      return;
    }
    conn = new Socket(module.config().tablenum);
    conn.setUrl(module.config().socketConnUrl);
    conn.setToken(module.config().socketConnToken);
    conn.connect();

    chat = new Chat({
      socket: conn,
      el: $('#bottomBar')
    });

    saveName = module.config().savename;

    style = module.config().style;
    configuration = new Configure();
    configurationView = new ConfigureView({
      model: configuration,
      el: $("#customize_popup")
    });
    appView = new AppView({
      lexicon: module.config().lexicon,
      socket: conn
    });
    appView.setTablenum(module.config().tablenum);
    Dispatcher = _.clone(Backbone.Events);
    // Scope of 'this' is going to drive me nuts.
    Dispatcher.listenTo(configuration, 'change', _.bind(
      appView.configChange, appView));
    Dispatcher.listenTo(conn, 'message', _.bind(
      appView.messageHandler, appView));
    Dispatcher.listenTo(conn, 'message', _.bind(chat.messageHandler, chat));
    /* Add the configuration to appView. */
    appView.configChange(configuration);
    /*
     * Catch beforeunload events. I can't figure out how to put this in
     * the appView.
     */
    window.onbeforeunload = _.bind(appView.beforeUnloadEventHandler, appView);

    configuration.setConfig(style);
    /* Load addlParams into app. */
    if (saveName) {
      appView.setSaveName(saveName);
    }
    if (window.mixpanel) {
      window.mixpanel.track('Entered table');
    }
    // Disallow backspace to go back.
    rx = /INPUT|SELECT|TEXTAREA/i;
    $(document).bind("keydown keypress", function(e) {
      if (e.which === 8 ) {
        // 8 == backspace
        if (!rx.test(e.target.tagName) ||
           e.target.disabled || e.target.readOnly) {
          e.preventDefault();
        }
      }
    });
  });
});
