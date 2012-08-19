var IKMQuizApp = (function(Backbone, $) {
    "use strict";

    Backbone.emulateHTTP = true;

    /* models & collections */
    var IKMRun = Backbone.Model.extend({
        initialize: function() {}
    });

    var IKMRunList = Backbone.Collection.extend({
        model: IKMRun,
        url: '/flashcards/api/ikmruns/'
    });


    /* views */

    var IKMRunView = Backbone.View.extend({
        // tagName: "div",
        events: {
            "click button.deleteRun": "deleteRun",
            "click button.continueRun": "continueRun",
        },

        initialize: function() {
            this.model.on('change', this.render, this);
            this.model.on('destroy', this.remove, this);
        },

        render: function() {
            var json = this.model.toJSON();
            this.$el.html(ich.runTemplate(json));
            return this;
        },

        deleteRun: function() {
            var agree = confirm("Are you sure you wish to delete this run? You will not " +
                                "be able to get it back!");
            if (agree) {
                this.$("button.deleteUser").attr("disabled", "disabled");
                this.model.destroy({
                    wait: true,
                    error: function(model, error) {
                        $("#errorMsg").text(error.responseText).show();
                        self.$("button.deleteRun").removeAttr("disabled");
                    },
                    success: function() {
                        // nothin, just delete
                    }
                });
            }
        },

        continueRun: function() {
            this.trigger('continueRunEvent', this.model);
        }
    });

    var RunsView = Backbone.View.extend({
        events: {
            "click #listStart": "createRun"
        },
        initialize: function() {
            // bind to relevant events in collections
            this.collection.on('add', this.addOneRun, this);
            this.collection.on('reset', this.addAllRuns, this);
            this.collection.on('all', this.render, this);   // for all other events
        },

        createRun: function() {
            var self = this;
            this.collection.create({list: $("#wordList").val()}, {
                success: function() {
                    self.$("#errorMsg").text("").hide();
                },

                error: function(model, error) {
                    if (error.responseText) {
                        self.$("#errorMsg").text(error.responseText).show();
                    } else {
                        self.$("#errorMsg").text(error).show();
                    }
                }
            });
        },

        addOneRun: function(run) {
            var view = new IKMRunView({model: run});
            view.on('continueRunEvent', this.continueRun, this);
            this.$("#runList").append(view.render().$el);
        },

        addAllRuns: function() {
            this.collection.each(this.addOneRun, this);
        },

        render: function() {

        },

        continueRun: function() {
            this.$el.hide();
            CardApp
        }
    });

    var CardView = Backbone.View.extend({
        events: {
            "click .goBack": "backOneQuestion",
            "click .answerButton": "clickedAnswer"
        },
        initialize: function() {

        },
        backOneQuestion: function() {

        },
        clickedAnswer: function() {

        }
    });

    var CardApp = new CardView({el: $("#quizDiv")})

    /* handle CSRF */
    $('html').ajaxSend(function (event, xhr, settings) {
        function getCookie(name) {
            var cookieValue = null,
                cookies,
                cookie,
                i;
            if (document.cookie && document.cookie !== '') {
                cookies = document.cookie.split(';');
                for (i = 0; i < cookies.length; i += 1) {
                    cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            // Only send the token to relative URLs i.e. locally.
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    });



    return {
        init: function(ikmRunList) {
            var RunList = new IKMRunList();
            var RunsApp = new RunsView({collection: RunList, el: $("#mainDiv")});
            RunList.reset(ikmRunList);
        }
    }

}(Backbone, jQuery));