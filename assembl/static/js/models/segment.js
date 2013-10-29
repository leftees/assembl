define(['backbone', 'app', 'moment', 'models/user'],
function(Backbone, app, moment, User){
    'use strict';

    /**
     * @class SegmentModel
     */
    var SegmentModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            this.on('change:idIdea', this.onAttrChange, this);
            //this.on('invalid', function(model, error){ alert( error ); }, this);

            if( this.attributes.quote ){
                this.attributes.text = this.attributes.quote;
            }

            if( this.attributes.created ){
                this.attributes.creationDate = this.attributes.created;
            }

            if( ! this.get('creationDate') ){
                this.set( 'creationDate', app.getCurrentTime() );
            }
        },

        /**
         * @type {String}
         */
        urlRoot: app.getApiUrl("extracts"),

        /**
         * @type {Object}
         */
        defaults: {
            text: '',
            idPost: null,
            idIdea: null,
            creationDate: null,
            creator: {},
            source_creator: {},
            ranges: []
        },

        /**
         * Validation
         */
        validate: function(attrs, options){
            var currentUser = app.getCurrentUser();
            if( ! currentUser.id ){
                return i18n.gettext('You must be logged in to create segments');
            }
        },

        /**
         * Returns a fancy date (ex: a few seconds ago) 
         * @return {String}
         */
        getCreationDateFormated: function(){
            return moment( this.get('creationDate') ).fromNow();
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        }
    });

    /**
     * @class SegmentColleciton
     */
    var SegmentCollection = Backbone.Collection.extend({
        /**
         * @type {String}
         */
        url: app.getApiUrl("extracts"),

        /**
         * @type {IdeaModel}
         */
        model: SegmentModel,

        /**
         * Return the segments to compose the clipboard
         * @return {Array<Segment>}
         */
        getClipboard: function(){
            var currentUser = app.getCurrentUser(),
                segments;

            return this.filter(function(item){
                var creator = item.get('creator');

                if( item.get('idIdea') !== null ){
                    return false;
                }

                if( creator ){
                    return creator.id == currentUser.id;
                }
                return false;
            });
        }
    });

    return {
        Model: SegmentModel,
        Collection: SegmentCollection
    };

});
