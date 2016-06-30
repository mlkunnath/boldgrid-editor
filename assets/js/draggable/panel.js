var BOLDGRID = BOLDGRID || {};
BOLDGRID.EDITOR = BOLDGRID.EDITOR || {};

( function ( $ ) {
	var self;

	BOLDGRID.EDITOR.Panel = {

		$element : null,

		/**
		 * Initialize the panel.
		 */
		init : function () {

			this.create();
			this.onPanelClose();
			this.setupPanelDrag();
			//this.setupPanelResize();

			return this.$element;
		},
		create : function () {
			this.$element = $( BoldgridEditor.instancePanel );
			$( 'body' ).append( this.$element );
		},

		setupPanelDrag : function() {
			this.$element.draggable( {
				containment: '#wpwrap',
				handle: '.panel-title',
				scroll : false
			} );
		},
		
		clearSelected : function () {
			BOLDGRID.EDITOR.Panel.$element.find( '.selected' ).removeClass( 'selected' );
		},

		setupPanelResize : function() {
			this.$element.resizable();
		},

		onPanelClose : function() {
			this.$element.on( 'click', '.close-icon', function () {
				self.closePanel();
			} );
		},

		closePanel : function () {
			self.$element.hide();
			BOLDGRID.EDITOR.Menu.deactivateControl();
		},

		_scrollToSelected : function () {
			//$selected[0].scrollIntoView();
			console.log( $selected[0].getBoundingClientRect() );
			console.log( $selected.offset().top );
			console.log( $selected.scrollTop() );
			$panel.find( '.panel-body' )[0].scrollTop = $selected.offset().top - 900;
			/*
			$panel.find( '.editor-panel-body' ).animate({
	            scrollTop: $selected.offset().top + 'px'
	        }, 'fast');
			*/
		},

		clear : function () {
			this.$element.find( '.panel-title .name' ).empty();
			this.$element.find( '.panel-body' ).empty();
		},

		/**
		 * Open a panel for a control
		 */
		open : function ( control ) {

			//this._scrollToSelected();
			BOLDGRID.EDITOR.Menu.activateControl( control );

			this.$element.height( control.panel.height );
			this.$element.width( control.panel.width );
			this.$element.find( '.panel-title .name' ).html( control.panel.title );
			this.$element.attr( 'data-type', control.name );
			this.$element.show();
		}

	};

	self = BOLDGRID.EDITOR.Panel;

} )( jQuery );