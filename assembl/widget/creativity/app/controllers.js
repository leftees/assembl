"use strict";

creativityApp.controller('videosCtl',
  ['$scope', '$http', '$routeParams', '$log', '$resource', 'localConfig', 'JukeTubeVideosService', 'DiscussionService', 'sendIdeaService', 'WidgetConfigService', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $resource, localConfig, JukeTubeVideosService, DiscussionService, sendIdeaService, WidgetConfigService, AssemblToolsService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("videosCtl::init()");
      console.log("WidgetConfigService:");
      console.log(WidgetConfigService);


      // set default model fields

      $scope.youtube = JukeTubeVideosService.getYoutube();
      $scope.results = JukeTubeVideosService.getResults();
      $scope.pageInfo = JukeTubeVideosService.getPageInfo();
      $scope.playlist = true;
      $scope.currentVideoId = null;
      $scope.currentVideoTitle = null;
      $scope.idea = {
        shortTitle: "Idea short title",
        longTitle: "Idea long title"
      };
      $scope.discussion = {
        topic: "Discussion topic"
      };

      $scope.inspiration_keywords = [
          "modèle commercial",
          "freemium",
          "modèle d'affaires",
          "entreprise",
          "stratégie"
      ];

      $scope.inspiration_keywords_related = [
          "modèle économique",
          "low cost",
          "avantage compétitif",
          "établissement",
          "tactique"
      ];

      $scope.inspiration_keywords_used = {};


      // get inspiration keywords from the idea URL given in the configuration JSON

      $scope.idea_api_url = AssemblToolsService.resourceToUrl(WidgetConfigService.settings.idea) + '?view=creativity_widget';
      console.log("idea_api_url: " + $scope.idea_api_url);
      $scope.discussion_api_url = 'discussion api url';

      var
          Idea = $resource($scope.idea_api_url),
          Discussion = null,
          discussionId = WidgetConfigService.discussion.split('/')[1];

      $scope.idea = Idea.get({}, function(){ // this function is executed once the AJAX request is received and the variable is assigned
        console.log("idea:");
        console.log($scope.idea);
        $scope.inspiration_keywords = $scope.idea.most_common_words;
        $scope.inspiration_keywords_used = {};

        // get discussion from the idea
        $scope.discussion_api_url = AssemblToolsService.resourceToUrl($scope.idea.discussion);
        console.log("discussion_api_url: " + $scope.discussion_api_url);
        Discussion = $resource($scope.discussion_api_url);

        $scope.discussion = DiscussionService.get({discussionId:discussionId}, function(){
          console.log("discussion:");
          console.log($scope.discussion);
        });


        // fill the search bar with the 2 first keywords and submit the search

        setFirstKeywordsAsQuery();
        $scope.search();

      });


      // get config file URL given as parameter of the current URL

      $scope.configFile = $routeParams.config;


      // data mock

      localConfig.fetch().success(function(data){
          $scope.globalVideoConfig = data;
      });

      /*
      $scope.discussion = Discussion.get({discussionId: 1}, function(discussion) {
          console.log(discussion);
      });
      */


      // hide right panel

      $("#player").css("visibility","hidden");


      // initialize the Select2 textfield

      $("#query").select2({
          tags: [], //$scope.inspiration_keywords, // not used anymore, because the dropdown is now hidden
          tokenSeparators: [",", " "],
          formatNoMatches: function(term){return '';},
          //minimumResultsForSearch: -1
          selectOnBlur: true,
          minimumInputLength: 1,
          width: '70%'
      });
      setFirstKeywordsAsQuery();


      // make recommended keywords re-appear on top when they are removed from the search field

      $("#query").on("change", function(e){
        $scope.$apply(function(){
          if ( e.removed )
          {
            /* now handled by ng-show of Angluar in the HTML template
            if ( $scope.inspiration_keywords.indexOf(e.removed.text) >= 0 || $scope.inspiration_keywords_related.indexOf(e.removed.text) >= 0 )
            {
              $("#results .keywords .keyword:contains(\""+e.removed.text.replace(/"/g, '\\"')+"\")").show();
            }
            */

            if ( $scope.inspiration_keywords_used[e.removed.text] != undefined )
            {
              delete $scope.inspiration_keywords_used[e.removed.text];
            }
            
          }
          else if ( e.added )
          {
            $scope.inspiration_keywords_used[e.added.text] = true;
          }
        });
      });


      // activate the right tab

      $("ul.nav li").removeClass("active");
      $("ul.nav li a[href=\"#videos\"]").closest("li").addClass("active");


      // load youtube script

      if ( JukeTubeVideosService.getYoutube().ready === true )
        JukeTubeVideosService.onYouTubeIframeAPIReady();

    };

    $scope.keywordClick = function($event){
        var keyword_value = $($event.target).html();
        var values = $("#query").select2("val");
        var alreadyThere = false;
        for ( var i = 0; i < values.length; ++i )
        {
          if ( values[i] == keyword_value )
          {
            alreadyThere = true;
            break;
          }
        }
        if ( false == alreadyThere )
        {
          $scope.inspiration_keywords_used[keyword_value] = true;
          values.push( keyword_value );
          $("#query").select2("val", values );
          //$($event.target).hide(); // now handled by ng-show of Angluar in the HTML template
          //$(el.target).css('background', '#000');
        }
    };

    var setFirstKeywordsAsQuery = function(){
      console.log("setFirstKeywordsAsQuery()");
      var values = [];
      if ($scope.inspiration_keywords.length > 0)
      {
        values.push($scope.inspiration_keywords[0]);
        $scope.inspiration_keywords_used[$scope.inspiration_keywords[0]] = true;
      }
      if ($scope.inspiration_keywords.length > 1)
      {
        values.push($scope.inspiration_keywords[1]);
        $scope.inspiration_keywords_used[$scope.inspiration_keywords[1]] = true;
      }
      console.log("prefill:" + values[0] + " " + values[1]);
      $("#query").select2("val", values);
    };

    $scope.scrollToPlayerAndLaunch = function (id, title) {
      // show right panel
      $("#player").css("visibility","visible");

      $("html, body").animate({scrollTop: $("#player").offset().top - 10}, "slow");
      $scope.launch(id, title);
    };

    $scope.launch = function (id, title) {
      $log.info('lanuch(): Launched video id: ' + id + ' and title: ' + title);
      $scope.currentVideoId = id;
      $scope.currentVideoTitle = title;
      JukeTubeVideosService.launchPlayer(id, title);
    };

    $scope.search = function (pageToken) {
      var q = $('#query').val();
      var params = {
        key: 'AIzaSyC8lCVIHWdtBwnTtKzKl4dy8k5C_raqyK4', // quentin
        type: 'video',
        maxResults: '10',
        part: 'id,snippet',
        fields: 'items/id,items/snippet/publishedAt,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken,prevPageToken,pageInfo',
        q: q
      };
      if ( pageToken )
        params.pageToken = pageToken;

      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: params
      })
      .success( function (data) {
        JukeTubeVideosService.processResults(data);
        $scope.results = JukeTubeVideosService.getResults();
        $scope.pageInfo = JukeTubeVideosService.getPageInfo();
        $log.info(data);
      })
      .error( function () {
        $log.info('Search error');
      });
    };

    $scope.sendIdea = function(){
      var messageSubject = $("#messageTitle").val();
      var messageContent = $("#messageContent").val();
      var videoUrl = "http://www.youtube.com/watch?v=" + $scope.currentVideoId;
      var videoTitle = $scope.currentVideoTitle; // TODO: use these last 2 pieces of info

      /*
      // initial way of posting: do not use any posting URL given in the config, use instead the general Discussion API
      // so here we post a message in the discussion, linked with the idea which is linked with the current instance of the widget
      var send =  new sendIdeaService();
      send.idea_id = $scope.idea["@id"];
      send.subject = messageSubject;
      send.message = messageContent;
      //TODO : better way of determining discussionId. here we use $scope.discussion.@id which is "local:Discussion/6"
      send.$save({discussionId: parseInt($scope.discussion["@id"].split("/").pop())}, function sucess(){
        alert("Your message has been successfully posted.");
      }, function error(){
        alert("Error: your message has not been posted.");
      });
      */
      


      /*
      // send an Idea, which should display in Assembl's Table of ideas as a sub-idea of the idea linked to the widget
      var EntityApiEndpoint = $resource(AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_uri), {}, {'Content-Type': 'application/x-www-form-urlencoded'});
      var message = new EntityApiEndpoint();
      message.type = "Idea";
      message.short_title = messageSubject;
      //message.long_title = messageContent;
      message.$save(function(u, putResponseHeaders) {
        //u => saved user object
        //putResponseHeaders => $http header getter
        alert("Your message has been successfully posted.");
      });
      // The response I get is:
      // 404 Not Found
      // The resource could not be found.
      */


      /*
      // does not work because even if we tell the right content type, the parameters are still sent as JSON
      var EntityApiEndpoint = $resource(AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_uri), {}, {
          post:{
              method:"POST",
              isArray:false,
              headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'} 
          },
      });
      var message = {
        type: "Idea",
        short_title: messageSubject
      };
      EntityApiEndpoint.post(message);
      */


      // this one works, but once posted, the discussion is broken ("Internal Server Error / The server encountered an unexpected internal server error / (generated by waitress)")
      var message = {
        type: "Idea",
        short_title: messageSubject,
        definition: messageContent
      };
      $http({
        method: 'POST',
        url: AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_uri),
        data: $.param(message),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function (data, status, headers, config) {
        // save the association between the video and the comment in the widget instance's memory
        var created_idea = headers("Location"); // "local:Idea/66"
        $scope.associateVideoToIdea(created_idea, videoUrl, videoTitle);

        // tell the user that the message has been successfully posted
        alert("Your message has been successfully posted.");
      });



      /*
      // send an Idea, which should display in Assembl's Table of ideas as a sub-idea of the idea linked to the widget
      var data = {
        "type": "Idea",
        "short_title": messageSubject
      };
      $http.post( AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_uri), data)
      //$http.post( AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_uri), data, { params: data })
        .success(function(data, status, headers){
          alert("Your message has been successfully posted.");
        });
      // The response I get is:
      // 400 Bad Request
      // The server could not comply with the request since it is either malformed or otherwise incorrect
      */



      /*
      // send a Message, which should display in Assembl's Messages panel when the idea linked to the widget is selected
      var EntityApiEndpoint = $resource(WidgetConfigService.messages_uri);
      var message = new EntityApiEndpoint();
      message.idea_id = $scope.idea["@id"];
      message.message = messageSubject + " \n " + messageContent;
      message.$save();
      // The response I get is:
      // 404 Not Found
      // The resource could not be found.
      */

    };

    /*
    Save the association between the video and the comment in the widget instance's memory (using API endpoint `user_state_url`)
    So then in Assembl's Messages panel, it will be possible to find that a given message ("idea") has been inspired by a given item (video or card)
    */
    $scope.associateVideoToIdea = function(idea_id, video_url, video_title){

      // declare a function which adds an item to the initial_data JSON (previously received by a GET from the `user_state_url` API endpoint), and PUTs it back to the endpoint
      var addData = function(initial_data, original_idea, idea_id, video_url, video_title)
      {
        console.log("associateVideoToIdea()::addData()");
        if ( !initial_data || !initial_data["inspire_me_posts_by_original_idea"] )
        {
          initial_data = {
            "inspire_me_posts_by_original_idea": {}
          };
        }


        var obj = {
          "idea_id": idea_id,
          "inspiration_type": "video",
          "inspiration_url": video_url
        };

        if ( video_title )
          obj["video_title"] = video_title;

        if ( !initial_data["inspire_me_posts_by_original_idea"][original_idea] )
        {
          initial_data["inspire_me_posts_by_original_idea"][original_idea] = [];
        }

        initial_data["inspire_me_posts_by_original_idea"][original_idea].push(obj);

        // user_state_url accepts only GET and PUT actions, and accepts only headers: {'Content-Type': 'application/json'}
        $http({
            method: 'PUT',
            url: AssemblToolsService.resourceToUrl(WidgetConfigService.user_state_url),
            data: initial_data,
            async: true,
            headers: {'Content-Type': 'application/json'}
        }).success(function(data, status, headers){
            console.log("PUT success");
        }).error(function(status, headers){
            console.log("PUT error");
        });
      };


      // first, get the content of user_state_url, then add our item to it, and then only we can PUT to the endpoint (because otherwise previous information will be lost)

      $http({
          method: 'GET',
          url: AssemblToolsService.resourceToUrl(WidgetConfigService.user_state_url),
          //data: obj,
          async: true,
          headers: {'Content-Type': 'application/json'}
      }).success(function(data, status, headers){
          console.log("GET success");
          console.log("data:");
          console.log(data);
          addData(data, $scope.idea["@id"], idea_id, video_url, video_title);
      }).error(function(status, headers){
          console.log("GET error");
      });


      

    };
}]);

creativityApp.controller('cardsCtl',
    ['$scope','$http','$sce','localConfig','sendIdeaService','$location', function($scope, $http, $sce, localConfig, sendIdeaService){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#cards\"]").closest("li").addClass("active");

    $scope.formData = {};

    // initialize empty stack (LIFO) of already displayed cards, so that the user can browse previously generated cards
    $scope.displayed_cards = [];
    $scope.displayed_card_index = 0;

    //data mock
    localConfig.fetch().success(function(data){
        $scope.cards = data.card_game[0]; // we get only the first deck of cards
        $scope.shuffle();
    });

    // show previous and next card buttons when the mouse cursor is in the card zone
    $("#cards-container").hover(
      function(){
        $("#previousCardButton").show();
        $("#nextCardButton").show();
      },
      function(){
        $("#previousCardButton").hide();
        $("#nextCardButton").hide();
      }
    );
    $("#previousCardButton").hide();
    $("#nextCardButton").hide();

    $scope.shuffle = function(){
        var n_cards = $scope.cards.length;
        if ( n_cards > 0 )
        {
            var random_index = Math.floor((Math.random()*n_cards));
            $scope.displayed_cards.push($scope.cards[random_index]);
            $scope.displayed_card_index = $scope.displayed_cards.length-1;
            $scope.displayed_cards[$scope.displayed_card_index].html_content = $sce.trustAsHtml($scope.cards[random_index].html_content);
            $scope.cards.splice(random_index,1);
        }
    }

    $scope.previousCard = function(){
        $scope.displayed_card_index = Math.max(0, $scope.displayed_card_index-1);
    }

    $scope.nextCard = function(){
        $scope.displayed_card_index = Math.min($scope.displayed_cards.length-1, $scope.displayed_card_index+1);
    }

    /*
     * Comment an idea from inspire me
     * TODO:  add rest api
    */
    $scope.sendIdea = function(){
       var send =  new sendIdeaService();
       //var url = $location.protocol()+'://'+$location.host()+':'+$location.port()

       send.subject = $scope.formData.title;
       send.message = $scope.formData.description;

       //TODO : {discussionId} need to be dynamic
       send.$save({discussionId:3}, function sucess(){

       }, function error(){

       })
    }

}]);

creativityApp.controller('sessionCtl',
    ['$scope','cardGameService','$rootScope', '$timeout','$http','growl', 'WidgetConfigService','$sce','utils',
        function($scope, cardGameService, $rootScope, $timeout, $http, growl, WidgetConfigService, $sce, utils){

    // activate the right tab
    $("ul.nav li").removeClass("active");
    $("ul.nav li a[href=\"#session\"]").closest("li").addClass("active");

    $scope.formData = {};
    $scope.widget = WidgetConfigService;

    /**
     * Due to the latency to init $rootScope we need a delay
     * */
    $timeout(function(){

        $scope.getSubIdeaFromIdea();

    },1000);

    $scope.$watch("message", function(value){

        switch(value){
            case 'sendNewIdea:success':
                $scope.getSubIdeaFromIdea();
                break;
            case 'sendNewIdea:error':
                break;

        }
    }, true);

    /**
     * Fetch all ideas newly added
     */
    $scope.getSubIdeaFromIdea = function(){

        var
            rootUrl = utils.urlApi($rootScope.widgetConfig.ideas_uri),
            ideas = [];

        $scope.parentIdeaTitle = $rootScope.widgetConfig.base_idea.shortTitle;

        $http.get(rootUrl).then(function(response){

            angular.forEach(response.data, function(item){

                if(item.widget_add_post_endpoint){

                    item.widget_add_post_endpoint = _.values(item.widget_add_post_endpoint).toString().split(':')[1];
                    item.widget_add_post_endpoint = '/data/'+item.widget_add_post_endpoint;
                    item.creationDate = moment(item.creationDate).fromNow();

                    ideas.push(item);
                }
            });

            return ideas;

        }).then(function(ideas){

            angular.forEach(ideas, function(idea){

                var urlRoot = utils.urlApi(idea.proposed_in_post.idCreator);

                $http.get(urlRoot).then(function(response){

                    idea.username = response.data.name;
                    idea.avatar = response.data.avatar_url_base+'30';
                });

            });

            $scope.ideas = ideas.reverse();
        });
    }

    /**
    * @params type {string}
    * @params short_title {string}
    * @params definition {string}
    * */
    $scope.sendSubIdea = function(){
        if($scope.formData) {

            var rootUrl = utils.urlApi($rootScope.widgetConfig.ideas_uri);

            $scope.formData.type = 'Idea';

            $http({
                method:'POST',
                url:rootUrl,
                data:$.param($scope.formData),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                growl.success('New sub idea posted');

                $scope.message = "sendNewIdea:success";

                $scope.formData.short_title = null;
                $scope.formData.definition = null;

            }).error(function(status, headers){

                growl.error('Something wrong');

                $scope.message = "sendNewIdea:error";

            });
        }
    }

    $scope.displayed_cards = [];
    $scope.displayed_card_index = 0;
    /**
     * Load config card
     * params {int} which is the id of the card game config/game_{int}.json
     */
    cardGameService.getCards(1).success(function(data){
        $scope.game = data.game;
        $scope.shuffle();
    });

    /**
     * Card random
     * */
    $scope.shuffle = function(){

        var n_cards = $scope.game.length;
        if ( n_cards > 0 )
        {
            var random_index = Math.floor((Math.random()*n_cards));
            $scope.displayed_cards.push($scope.game[random_index]);
            $scope.displayed_card_index = $scope.displayed_cards.length-1;
            $scope.displayed_cards[$scope.displayed_card_index].body = $sce.trustAsHtml($scope.game[random_index].body);
            $scope.game.splice(random_index,1);
        }

    }

}]);

creativityApp.controller('ratingCtl',
    ['$scope','$rootScope','$timeout','$http','growl','utils',
        function($scope, $rootScope, $timeout, $http, growl, utils){

    /**
     * Due to the latency to init $rootScope we need a delay
     * */
    $timeout(function(){

        $scope.getSubIdeaForVote();

    },800);

    /**
     * Fetch all ideas newly added
     */
    $scope.getSubIdeaForVote = function(){

        var
            rootUrl = utils.urlApi($rootScope.widgetConfig.ideas_uri),
            ideas = [];

        $http.get(rootUrl).then(function(response){
            angular.forEach(response.data, function(item){

                if(item.widget_add_post_endpoint){

                    ideas.push(item);
                }
            })

            return ideas;

        }).then(function(ideas){

            var urlRoot = utils.urlApi($rootScope.widgetConfig.user_states_uri);

            $http.get(urlRoot).then(function(response){

               var rate = JSON.parse(response.data[0].session_user_vote);

               angular.forEach(ideas, function(idea){

                   var id_idea = idea['@id'].split('/')[1],
                       id_idea = parseInt(id_idea, 10);

                   angular.forEach(rate, function(r){
                      var id_rate = parseInt(_.keys(r), 10),
                          rate_value = _.values(r);

                       if(id_idea === id_rate){

                          idea.rate = parseInt(rate_value, 10);
                       }
                   });
               });
            });

            $scope.ideas = ideas;

        });
    }

    /**
     * Valid votes and send to the server separetely
     * */
    $scope.validVote = function(){

        var
            subIdeaSelected = [],
            commentSelected = [],
            subIdea = angular.element('#postVote .sub-idea'),
            commentSubIdea = angular.element('#postVote .comment-to-sub-idea'),
            rootUrlSubIdea = utils.urlApi($rootScope.widgetConfig.confirm_ideas_uri),
            rootUrlMessage = utils.urlApi($rootScope.widgetConfig.confirm_messages_uri);

        $scope.$watch('message', function(value){
            //TODO: find a good translation for confirm that the catching sub idea is valid
            switch(value){
                case 'validVote:success':
                    growl.success('validVoteCatcher');
                    break;
                case 'validVote:error':
                    growl.error('errorVoteCatcher');
                    break;
                default:
                    break;
            }
        })

        angular.forEach(subIdea, function(idea){

            if($(idea).is(':checked')){

                subIdeaSelected.push($(idea).val());
            }
        })

        angular.forEach(commentSubIdea, function(comment){

            if($(comment).is(':checked')){

                commentSelected.push($(comment).val());
            }
        })

        if(commentSelected.length > 0){

            var obj = {};
                obj.ids = JSON.stringify(commentSelected);

            $http({
                method:'POST',
                url:rootUrlMessage,
                data:$.param(obj),
                async:true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                $scope.message = 'validVote:success';

            }).error(function(status, headers){

                $scope.message = 'validVote:error';
            });

        }

        if(subIdeaSelected.length > 0){

            var obj = {};
                obj.ids = JSON.stringify(subIdeaSelected);

            $http({
                method:'POST',
                url:rootUrlSubIdea,
                data:$.param(obj),
                async:true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers){

                $scope.message = 'validVote:success';

            }).error(function(status, headers){

                $scope.message = 'validVote:error';
            });
        }

    }

    /**
     * Toggle on checkbox
     * */
    $scope.isChecked = function(){
        var rootUrlSubIdea = utils.urlApi($rootScope.widgetConfig.confirm_ideas_uri),
            rootUrlMessage = utils.urlApi($rootScope.widgetConfig.confirm_messages_uri);

    }

}]);

creativityApp.controller('editCtl',
    ['$scope','$http', function($scope, $http){

    $scope.welcome = "Welcome to the configuration widget";

    $http.get('/data/Widget').then(function(session){

        $scope.widgetInstance = session.data;

    });

    // improve this function to create a widget
    $scope.createWidget = function(){

        var rootUrl = '/data/Discussion/1/widgets';

        $http({
            method:'POST',
            url:rootUrl,
            data:$.param(obj),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(function(data, status, headers){

            var header = headers().location;
            header = header.split(':')[1];

            return header;

        }).then(function(header){

            var rootUrl = '/data/:widgetId'

            $http.get(rootUrl, function(data){


            });

        })
    }


}]);