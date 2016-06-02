window.Scroller = (function(){
		// usage:
		// new Scroller( $jquery_container, function(page){ return path_to_page });
		//
		var Scroller = function($container, options){
			var self = this;
			this.$el = $container;
			this.options = options;
			this.scroll_el = options.scroll_el || window;
			this.spinner_url = options.spinner_url || g.constants.LOADER_PATH;
			this.chunk = 1;
			this.last_chunk = false;
			this.dataPath = options.dataPath
			this.entry_c = 1;
			this.entry_i = 0;
			this.column_c = parseInt($container.width() / options.itemWidth);
			this.column_i = 0;
			this.current_row = null;
			this.fetching = false;
			this.loader_threshold = 800;
			this.listView = new infinity.ListView(this.$el, {
				lazy: this.lazyLoader
			});
			this.renderChunk();
			this.listen();

		};

		Scroller.prototype.listen = function(){
			this.updateScheduled = false;
			this.$loader = $(g.tmpl('spinner')(this)).insertAfter(this.$el);
			var self = this;
			$(this.scroll_el).on( 'scroll', function(){
				if(!self.updateScheduled){
					setTimeout(function(){
						if(self.onScreen(self.$loader)) {
							self.renderChunk();
						}
						self.updateScheduled = false;
					}, 500);
					self.updateScheduled = true;
				}
			});
		};
		// lots of this copied from
		// http://airbnb.github.io/infinity/demo-on.html
		Scroller.prototype.lazyLoader = function(){
			var self = this;
			_.defer(function(){
				$(self).find('.banklogo').each(function(){
					var $ref = $(this);
					$ref.attr('src', $ref.attr('data-original'));
					$ref.removeClass('lazy');
				});
			});
		};

		Scroller.prototype.onScreen = function($item){
			var viewportBottom = $(this.scroll_el).scrollTop() + 
														$(this.scroll_el).height();
			var diff = $item.offset().top - viewportBottom;
			return diff < this.loader_threshold;
		};

		Scroller.prototype.renderChunk = function(data){
			var self = this;
			this.withNextCollection( function(){
				_.each(self.collection, _.bind(self.renderEntry, self));
			});
		};
		Scroller.prototype.renderEntry = function(entry){
			if( this.column_i++ === 0) {
				this.current_row = $('<div class="row">');
			}
			this.current_row.append( $(g.tmpl(this.options.template)(entry)) );
			if( this.column_i === this.column_c ){
				this.listView.append(this.current_row);
				this.column_i = 0;
			}
		};
		Scroller.prototype.withNextCollection = function(cb){
			this.getNextCollection(cb);
		}
		Scroller.prototype.getNextEntry = function(){
			var e = this.collection[this.entry_i++];
			return e;
		};

		Scroller.prototype.destroy = function(){
			this.listView.remove();
			this.clearLoader();
		};

		Scroller.prototype.clearLoader = function(){
			this.$loader.remove();
		};
		Scroller.prototype.onEndReached = function(){
			this.clearLoader();
		};

		Scroller.prototype.getNextCollection = function(cb){
			var self = this;
			this.fetching = true;
			if(this.last_chunk){
				return false;
			}
			$.ajax({
				url: this.dataPath(this.chunk++),
				success: function(data){
					self.fetching = false;
					self.collection = data;
					self.entry_c = data.length;
					self.entry_i = 0;
					cb();
				},
				error: function(){
					self.last_chunk = true;
					self.onEndReached();
				}
			});
		};
		return Scroller;
})()

