define([
  'backbone',
  'jquery',
  'underscore',
  'mustache',
  'text!templates/iframe.html',
  'text!templates/video_list.html',
  'moment'
], function(Backbone, $, _, Mustache, IframeTemplate, VideoListTemplate,
  moment) {
  "use strict";
  var VIDEO_URL, MAX_RESULTS;
  MAX_RESULTS = 25;
  VIDEO_URL = [
    'https://gdata.youtube.com/feeds/api/videos/-/',
    '%7Bhttp%3A%2F%2Fgdata.youtube.com%2Fschemas%2F2007%2Fkeywords.cat%7D',
    'nsc2013?v=2&',
    'alt=jsonc&max-results=',
    MAX_RESULTS
  ].join('');

  return Backbone.View.extend({
    initialize: function() {
      this.iframe = this.$('#yt-iframe');
      this.videoList = this.$('#yt-list');
      this.fetchVideos_();
    },
    /**
     * Only runs on page load. Fetches the list of videos.
     */
    fetchVideos_: function() {
      $.ajax({
        type: 'POST',
        url: VIDEO_URL,
        data: '{}',
        contentType: "application/json; charset=utf-8",
        dataType: "jsonp",
        success: _.bind(this.handleFetch_, this)
      });
    },
    /**
     * Loads the fetched list of videos.
     * @param  {Object} result The result object from the Youtube API.
     */
    handleFetch_: function(result) {
      var data, i, context, date;
      this.videoList.empty();
      data = result.data;
      if (!(data.items && data.items[0])) {
        return;
      }
      this.embedVideo(data.items[0].id);
      for (i = 0; i < data.items.length; i++) {
        date = moment(data.items[i].uploaded).fromNow();
        context = {
          id: data.items[i].id,
          name: data.items[i].title,
          uploaded: date,
          views: data.items[i].viewCount
        };
        this.videoList.append(Mustache.render(
          VideoListTemplate, context));
      }
    },
    embedVideo: function(id) {
      this.iframe.html(Mustache.render(IframeTemplate, {id: id}));
    },
    /**
     * Loads a new video into the embed.
     */
    loadNewVideo: function(id) {
      this.embedVideo(id);
    }
  });
});