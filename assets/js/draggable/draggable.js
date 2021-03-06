/**
 * @formatter:off
 * BoldGrid Source Code
 * @copyright Copyright (c) BoldGrid
 * @version $Id$
 * @author BoldGrid <wpb@boldgrid.com>
 */

/**
 * DO NOT AUTO FORMAT
 * Allows a user to drag columns, content and rows in a grid
 */
jQuery.fn.IMHWPB_Draggable = function( settings, $ ) {
	var self = this;
	var most_recent_enter = [];
	var most_recent_row_enter = [];

	self.ie_version;
	self.isSafari;

	/**
	 * The jQuery object that the user indicated was draggable
	 */
	self.$master_container = this;

	//Some Jquery Selectors to be reused
	self.$window = $( window );
	self.$body = self.$master_container.find('body');
	self.$resize_overlay = $('<div id="boldgrid-draggable-resizing-overlay"></div>');
	self.$master_container.find('html').append(self.$resize_overlay);
	self.original_selector_strings = {};

	//Tinymce elements used for auto scrolling
	//This may be just as unreliable
	//tinymce.activeEditor.theme.panel._items[0]._id //32
	//tinymce.activeEditor.theme.panel._items[2]._id //38
	self.$mce_32 = $( '#mceu_34' );
	self.$mce_38 = $( '#mceu_40' );
	self.$post_status_info = $( '#post-status-info' );

	/** Popover Menu Items to be added **/
	var additional_menu_items = settings.menu_items || [];

	/** Testing and debug flag that prevents popovers from being removed. Useful for testing placements **/
	this.popover_placement_testing = settings.popover_placement_testing || false;

	/** How long should we wait before removing or displaying a new popover **/
	this.hover_timout = settings.hover_timout || 175;

	/** Should popovers be removed while the user is typing **/
	this.type_popover_removal = settings.type_popover_removal || true;

	/**
	 * The interaction container refers to the wrapper that holds all the draggable items
	 */
	this.$interaction_container;

	//BoldGrid menu item clicked
	this.$boldgrid_menu_action_clicked;

	//Last occurrence of an auto scroll
	this.last_auto_scroll_event = null;

	//Is the user editing anested row
	this.editting_as_row = false;

	//These Setting is used to manage the states of the visible popovers
	this.hover_elements = {
		'content' : {
			add_element : null
		},
		'column' : {
			add_element : null
		},
		'row' : {
			add_element : null
		}
	};

	/**
	 * These color alias' help to make sure that the text and background color have enough contrast
	 */
	this.color_alias = {
		'white' : [
			'rgb(255, 255, 255)',
			'white'
		],
		'transparent' : [
			'rgba(0, 0, 0, 0)',
			'transparent'
		]
	};

	/**
	 * A value indicating how fast the auto scroll will move per element.
	 */
	this.scroll_speeds = settings.scroll_speeds || {
		'content' : 15,
		'column' : 15,
		'row' : 25,
	};

	// this.master_container_id = '#' + .uniqueId().attr('id');
	this.master_container_id = ''; // Temp because document cant have ID

	/**
	 * Event that indicates that dragging has finished and started
	 */
	this.resize_finish_event = $.Event( 'resize_done_dwpb' );
	this.resize_start_event = $.Event( 'resize_start_dwpb' );
	this.boldgrid_modify_event = $.Event( 'boldgrid_modify_content' );

	/** Event fire once row has been added **/
	this.add_row_event = $.Event( 'add_row_event_dwpb' );

	/** Triggered once an element is deleted **/
	this.delete_event = $.Event( 'delete_dwpb' );

	/** Triggered once an elements contents are cleared **/
	this.clear_event = $.Event( 'clear_dwpb' );

	/**
	 * An event that indicates that a column has been added
	 */
	this.add_column_event = $.Event( 'add_column_dwpb' );

	/**
	 * An event that indicates the dragging has started
	 */
	this.drag_start_event = $.Event( 'drag_start_dwpb' );

	/**
	 * An event that indicates the dragging has started
	 */
	this.boldgrid_edit_row = $.Event( 'boldgrid_edit_row' );

	/**
	 * An Event that indicates that dragging has finished
	 */
	this.drag_end_event = $.Event( 'drag_end_dwpb' );

	/**
	 * A Boolean indicating whether or not we have disbabled popovers
	 */
	this.popovers_disabled = false;

	/**
	 * How many pixels of the right side border before we cause the row to stack
	 */
	this.right_resize_buffer = 10;

	/**
	 * A boolean indication to ensure that every dragstart has a drag finish and
	 * or drag drop A big that frequently occurs in internet explorer.
	 */
	this.drag_end_event = $.Event( 'drag_end_dwpb' );

	/**
	 * Has the user recently clicked on nesting a row
	 */
	this.nest_row = false;

	/**
	 * Boolean: are popovers disabled
	 */
	this.popovers_disabled = false;

	/**
	 * How many pixels away from the drag border
	 */
	this.right_resize_buffer = 10;

	/**
	 * A booleaan that helps us force drag drop event on safarii and ie
	 */
	this.drag_drop_triggered = false;

	/**
	 * A boolean flag passed in to allow console.log's
	 */
	this.debug = settings.debug;

	/**
	 * A string that represents all draggable selectors
	 */
	this.draggable_selectors_string;

	/**
	 * A string that represents all row selectors
	 */
	this.row_selectors_string;

	/**
	 * A string of the formated content selectors
	 */
	this.content_selectors_string;

	/**
	 * The selectors that represent draggable columns Essentially all columns
	 * that are not within a nested row
	 */
	this.column_selectors_string;

	/**
	 * The class name used for dragging selectors
	 */
	this.dragging_selector_class_name = 'dragging-imhwpb';

	/**
	 * The dragging class as a $ selector
	 */
	this.dragging_selector = '.' + this.dragging_selector_class_name;

	/**
	 * The currently dragged object is stored here. When starts dragging this
	 * element is hidden. When the user finishes the drag, this element is
	 * removed()
	 */
	this.$current_drag = null;

	/**
	 * Boolean Whether or not the user is currently in the resizing process
	 */
	this.resize = false;

	/**
	 * Boolean Has the user clicked on an item that is draggable
	 */
	this.valid_drag;

	/**
	 * The buffer in pixels of how close the user needs to be to a border in
	 * order to activate the drag handle
	 */
	this.border_hover_buffer = 15;

	/**
	 * How far the user can be from the resize position before it automatically
	 * snaps to that location
	 */
	this.resize_buffer = .0213;

	/**
	 * The maximum number of columns that can be in a row
	 */
	this.max_row_size = 12;

	/**
	 * The most recently added added element to a row
	 */
	this.$most_recent_row_enter_add = null;

	/**
	 * Current Window Width
	 */
	this.window_width;

	/**
	 * Current window height
	 */
	this.window_height;

	/**
	 * The current column class being used by bootstrap in relation to the
	 * current size of the screen
	 */
	this.active_resize_class;

	/**
	 * Temporarily transformed row that must be changed back
	 */
	this.restore_row = null;

	/**
	 * When an element is dragged it creates a new object, hides the old object
	 * and saves the new object to this variable. That object is deleted
	 * whenever the user drags onwards.
	 */
	this.$temp_insertion = null;

	/**
	 * This element is created for the drag image and then deleted when dragging
	 * is complete
	 */
	this.$cloned_drag_image = null;

	/**
	 * Default selectors for rows
	 */
	this.row_selector = settings.row_selector || [
		'.row:not(' + self.master_container_id + ' .row .row)'
	];

	/**
	 * Add media event handler
	 */
	this.add_media_event_handler = settings.add_media_event_handler || function() {
	};

	/**
	 * Insert layout
	 */
	this.insert_layout_event_handler = settings.insert_layout_event_handler || function() {
	};

	/**
	 * An array of the column selectors
	 */
	this.general_column_selectors = settings.general_column_selectors || [
		'[class*="col-xs"]', '[class*="col-sm"]', '[class*="col-md"]', '[class*="col-lg"]',
	];
	/**
	 * nested row selector
	 */
	this.nested_row_selector_string = '.row .row:not(.row .row .row)';

	/**
	 * These are the selectors that are defined as content elements
	 * TODO: use this array to create content_selectors & nested_mode_content_selectors
	 */
	this.general_content_selectors = [
		//General Content Selectors
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'h7',
		'a:not(p a)',
		'img:not(p img):not(a img)',
		'p',
		'button:not(p button):not(a button)',
		'ul',
		'ol',
		'dl',
		'form',
		'table',
		'.row .row',
		'[data-imhwpb-draggable="true"]',
		'.wpview-wrap',
		'.wpview',
		'blockquote',
		'code',
		'abbr',
	];

	/**
	 * A string containing the eligible content selectors A "content element" is
	 * an element that can.. - be placed into a column - be placed outside of a
	 * row - be sorted in a container Initialized at page load.
	 */
	this.content_selectors = settings.content_selectors || [

		// Headings
		'h1:not(' + self.master_container_id + ' .row .row h1)',
		'h2:not(' + self.master_container_id + ' .row .row h2)',
		'h3:not(' + self.master_container_id + ' .row .row h3)',
		'h4:not(' + self.master_container_id + ' .row .row h4)',
		'h5:not(' + self.master_container_id + ' .row .row h5)',
		'h6:not(' + self.master_container_id + ' .row .row h6)',
		'h7:not(' + self.master_container_id + ' .row .row h7)',

		'a:not(' + self.master_container_id + '.row .row a):not(p a)',

		// Common Drag Content
		/*******************************************************************
		 * Specifying that nested content is not draggable, is not
		 * necessary, but improves performance I've defined common cases so
		 * that the selector is not made any larger than it already is
		 ******************************************************************/
		'img:not(' + self.master_container_id + ' .row .row img):not(p img):not(a img)',
		'p:not(' + self.master_container_id + ' .row .row p)',
		'button:not(' + self.master_container_id
			+ ' .row .row button):not(p button):not(a button)',

		// Lists
		'ul:not(' + self.master_container_id + ' .row .row ul)',
		'ol:not(' + self.master_container_id + ' .row .row ol)',
		'dl:not(' + self.master_container_id + ' .row .row dl)',

		// Additional Content
		'form:not(' + self.master_container_id + ' .row .row form)',
		'table:not(' + self.master_container_id + ' .row .row table)',

		// Nested Rows - Not rows nested out of master container
		'.row .row:not(:not(' + self.master_container_id + ' .row .row))',

		// Custom definitions
		'[data-imhwpb-draggable="true"]:not(' + self.master_container_id
			+ ' .row .row [data-imhwpb-draggable="true"])',

		// WP specific wrapper
		'.wpview-wrap:not(' + self.master_container_id + ' .row .row .wpview-wrap)',
		'.wpview:not(' + self.master_container_id + ' .row .row .wpview)',

		'blockquote:not(.row .row blockquote)',
		'code:not(.row .row code)',
		'abbr:not(.row .row abbr)',
	];

	/**
	 * A string containing the eligible content selectors A "content element" is
	 * an element that can.. - be placed into a column - be placed outside of a
	 * row - be sorted in a container Initialized at page load.
	 */
	var nested_mode_content_selectors = [

		// Headings
		'.row .row h1',
		'.row .row h2',
		'.row .row h3',
		'.row .row h4',
		'.row .row h5',
		'.row .row h6',
		'.row .row h7',

		'.row .row a',

		// Common Drag Content
		'.row .row img:not(p img):not(a img)',
		'.row .row p',
		'.row .row button:not(p button):not(a button)',

		// Lists
		'.row .row ul',
		'.row .row ol',
		'.row .row dl',

		// Additional Content
		'.row .row form',
		'.row .row table',

		// Nested Rows - Not rows nested out of master container
		'.row .row .row',

		// Custom definitions
		'.row .row [data-imhwpb-draggable="true"]',

		// WP specific wrapper
		'.row .row .wpview-wrap',
		'.row .row .wpview',
		'.row .row code',
		'.row .row blockquote',
		'.row .row abbr',
	];

	/**
	 * These are the selectors that will interact with a row when dragging it
	 */
	var immediate_row_siblings = [
		'> h1',
		'> h2',
		'> h3',
		'> h4',
		'> h5',
		'> h6',
		'> h7',
		'> a',
		'> img',
		'> p',
		'> button',
		'> ul',
		'> ol',
		'> dl',
		'> form',
		'> table',
		'> .row',
		'> dl',
		'> form',
		'> table',
		'.row:not(.row .row)',
		'> [data-imhwpb-draggable="true"]',
		'> .wpview-wrap',
		'> .wpview',
		'> code',
		'> blockquote',
		'> abbr'
	];

	/**
	 * An outline of the sizes (Percentage) that corresponds to a column class.
	 * For example a col-2 should be .167% of the row size
	 */
	this.column_sizes = {
		'0' : 0,
		'1' : .083,
		'2' : .167,
		'3' : .25,
		'4' : .333,
		'5' : .416,
		'6' : .5,
		'7' : .583,
		'8' : .667,
		'9' : .75,
		'10' : .833,
		'11' : .917,
		'12' : 1,
		'13' : 0,
	};

	/**
	 * When dragging content, should we use the browsers image or actually move
	 * the element Actually moving the element is more resource intensive but is
	 * more aesthetically pleasing Available Options - browserImage - actual
	 */
	this.dragImageSetting = settings.dragImage || 'browserImage';

	/**
	 * The drag type determines chooses between two drag methods Default -
	 * dragEnter. Drag enter will append/insert before when you drag into an
	 * element. Option 1 - proximity. Calculations are done every time the user
	 * moves their mouse (while dragging). The benefit if this that their mouse
	 * does not need to be in the drag destination to be placed their -
	 * dragEnter - proximity
	 */
	this.dragTypeSetting = settings.dragType || 'dragEnter';

	/**
	 * Scenarios that outline how a specific layout should transform into
	 * another
	 */
	this.layout_translation = {
		'[12]' : {
			'12' : '6', // All 12's should become this size/
			'new' : '6' // The new column should become this size
		},
		'[6,6]' : {
			'6' : '4',
			'new' : '4'
		},
		'[4,4,4]' : {
			'4' : '3',
			'new' : '3'
		},
		// These transforms depend on a current column being passed in.
		// Its used in cases of duplication only.
		'[3,3,3,3]' : {
			'current' : '3', // If the column that is being duplicated is a
								// 3...
			'current_transform' : '2', // Change the duplicated column to a 2
			'new' : '2', // Add a new column that is also a 2

			// This array indicates how many additional items need to be
			// transformed
			// And what their previous values should be and what their new
			// values should be
			'additional_transform' : [
				// In this example, change 1, col-3 to a col-2
				{
					'count' : '1',
					'from' : '3',
					'to' : '2'
				}
			]
		},
		'[6,3,3]' : {
			'current' : '3',
			'current_transform' : '2',
			'new' : '2',
			'additional_transform' : [
				{
					'count' : '1',
					'from' : '3',
					'to' : '2'
				}
			]
		},
	};

	/**
	 * A list of the menu items that are added by default
	 */
	var native_menu_options = [
		'duplicate', 'add-row', 'add-column', 'nest-row', 'clear', 'delete', 'clone-as-row',
	];

	/**
	 * The options needed for the popover drop downs The key is the value is the
	 * display name
	 */
	var menu_options = {
		'column' : {
			'' : "Edit Column",
			'duplicate' : "Clone",
			'delete' : "Delete",
			'clear' : "Clear Contents",
			'add-media' : "Insert Media",
		},
		'row' : {
			'' : "Edit Row",
			'duplicate' : "Clone",
			'delete' : "Delete",
			'clear' : "Clear Contents",
			'insert-layout' : "Insert GridBlock",
			'add-column' : "Add Column",
			'add-row' : "Add Empty Row",
			'nest-row' : "",
		},
		'content' : {
			'' : "Edit Content",
			'duplicate' : "Clone",
			'delete' : "Delete",
		},
		'nested-row' : {
			'' : "Edit Content",
			'duplicate' : "Clone",
			'delete' : "Delete",
			'clone-as-row' : "Clone as Row",
		}
	};

	/**
	 * The classes that are added to a popover depending on the type of the
	 * element
	 */
	this.type_popover_classes = {
		'content' : 'content-popover-imhwpb left-popover-imhwpb',
		'nested-row' : 'content-popover-imhwpb nested-row-popover-imhwpb left-popover-imhwpb',
		'row' : 'row-popover-imhwpb right-popover-imhwpb',
		'column' : 'top-popover-imhwpb column-popover-imhwpb'
	};

	/**
	 * Markup needed to display a popover.
	 */
	this.toolkit_markup = function( type ) {

		var popover = '<div spellcheck="false" data-mce-bogus="all" contenteditable="false"'
			+ 'unselectable="on" class="draggable-tools-imhwpb">'
			+ '<span class="popover-imhwpb '
			+ self.type_popover_classes[ type ]
			+ '">'
			+ '<div title="Move" contenteditable="false" draggable="true" class="no-select-imhwpb drag-handle-imhwpb draggable-button"> '
			+ '<span  class="genericon genericon-move" aria-hidden="true"> </span>'
			+ '</div>';

			popover +=  "<div class='popover-menu-imhwpb hidden'><ul>";
			$.each( menu_options[ type ], function( key, value ) {
				var draggable = '';
				if ( key == 'nest-row' ) {
					draggable = 'draggable="true"';
				}

				popover += "<li class='no-select-imhwpb action-list' " + draggable + " data-action='" + key + "'>" + value + "</li>";
			} );

			popover += '</ul></div>';

			popover += '<div title="Modify" class="context-menu-imhwpb draggable-button"> '
				+ '<span  class="genericon genericon-menu" aria-hidden="true"></span>'
				+ '</div>';

			if ( type == 'nested-row' ) {
				popover += '<div title="Edit As Row" class="edit-as-row draggable-button">'
				+ '<span class="genericon genericon-expand"  aria-hidden="true"></span></div>';
			}




		return popover + '</span></div>';
	};

	/**
	 * Initialization Process
	 */
	this.init = function() {
		self.$interaction_container = self.determine_interaction_container();

		//Init fourpan
		self.$master_container.fourpan({
			element_padding : 0,
			transition_speed: 0,
			activate: activate_edit_as_row,
			deactivate: disable_edit_as_row,
		});
		self.ie_version = self.get_ie_version();
		self.isSafari = self.checkIsSafari();
		self.create_selector_strings();
		save_original_selector_strings();
		self.bind_events();
		self.setup_additional_plugins();
		self.validate_markup();
		self.track_window_size();
		self.merge_additional_menu_options();

		return self;
	};

	/**
	 * Store the original of the selector strings
	 * If they get modified during the process of the editor processing,
	 * These should be used for validation
	 */
	var save_original_selector_strings = function () {
		self.original_selector_strings = {
			general_content_selector_string : self.general_content_selector_string,
			unformatted_content_selectors_string : self.unformatted_content_selectors_string,
			content_selectors_string : self.content_selectors_string,
			immediate_row_siblings_string : self.immediate_row_siblings_string,
			row_selectors_string : self.row_selectors_string,
			column_selectors_string : self.column_selectors_string,
			unformatted_column_selectors_string : self.unformatted_column_selectors_string,
			general_column_selectors_string : self.general_column_selectors_string,
			immediate_column_selectors_string : self.immediate_column_selectors_string,
			draggable_selectors_string : self.draggable_selectors_string,
		};
	};

	/**
	 * Create all selector strings from configuration arrays
	 */
	this.create_selector_strings = function () {
		//An unformatted string simply specifies that the elements to not have the :visible qualifier
		/**
		 * Content Selectors
		 */
		self.general_content_selector_string = self.general_content_selectors.join();
		self.unformatted_content_selectors_string = self.content_selectors.join();
		self.content_selectors_string = self.format_selectors( self.content_selectors ).join();
		self.immediate_row_siblings_string = immediate_row_siblings.join();

		/**
		 * Row Selectors
		 */
		self.row_selectors_string = self.row_selector.join();

		/**
		 * Column Selectors
		 */
		//This should be the column selector string without the visible keyword but may not be working as intended
		self.column_selectors_string = self.format_column_selectors( self.general_column_selectors, true ).join();
		self.unformatted_column_selectors_string = self.column_selectors_string.replace(/:visible/, '');

		self.general_column_selectors_string = self.general_column_selectors.join();
		self.immediate_column_selectors_string = self.format_immediate_column_selectors( self.general_column_selectors ).join();


		/**
		 * Combination of all selectors
		 */
		self.draggable_selectors_string = self.format_draggable_selectors_string();
	};

	/**
	 * Initialize the background colors of the window to facilitate editing
	 * If being used within WP_TINYMCE this should really be done from the theme.
	 */
	this.set_background_colors = function () {
		//On init set the background colors
		var background_color = self.$body.css ( 'background-color' );

		//If the background color is transparent set the background color to white
		if ( self.color_is (background_color, 'transparent') || self.color_is ( background_color, 'white' ) ) {
			self.$body.css ( 'background-color', 'white' );

			//If the background color is white and the color of the text is white,
			//set the text to black
			if ( self.color_is(self.$body.css ('color'), 'white') ) {
				self.$body.css ( 'color', 'black' );
			}
		}
	};

	/**
	 * Clean Up the markup and add any needed classes/wrappers
	 */
	this.validate_markup = function() {
		self.wrap_hr_tags();
		self.wrap_content_elements();
		self.add_redundant_classes();
	};

	/**
	 * Remove Classes that were added during drag.
	 *
	 * @since 1.1.1.3
	 */
	this.failSafeCleanup = function () {
		self.$master_container.find( '.dragging-started-imhwpb' ).remove();
		self.$master_container.find( '.cloned-div-imhwpb' ).removeClass( 'cloned-div-imhwpb' );
	};

	/**
	 * Wrap images and anchors in paragraph
	 * This is done because tinyMCE frequently does this which causes irregularities
	 * also by doing this, we make it easier to drag items
	 */
	this.wrap_content_elements = function() {
		// this needs to occur everytime something is added to page
		self.$master_container.find( 'img, a' ).each( function() {
			// Find out its already draggable
			var $this = $( this );

			if ( !$this.parent().closest_context( self.original_selector_strings.content_selectors_string, self.$master_container ).length ) {
				// This HR is not already draggable
				$this.wrap( "<p class='mod-reset'></p>" );
			}
		} );
	};

	/**
	 * Wrap all hr tags in a draggable div This should be called everytime dom
	 * content is inserted
	 */
	this.wrap_hr_tags = function() {
		// this needs to occur everytime something is added to page
		self.$master_container.find( 'hr' ).each( function() {
			// Find out its already draggable
			var $this = $( this );

			if ( !$this.closest_context( self.original_selector_strings.content_selectors_string, self.$master_container ).length ) {
				var $closest_receptor = $this.closest_context(self.original_selector_strings.row_selectors_string
					+ ', '+ self.original_selector_strings.general_column_selectors_string, self.$master_container );
				if ( $closest_receptor.is( self.original_selector_strings.row_selectors_string ) ) {
					$this.wrap( "<div class='col-md-12'><div class='row'><div class='col-md-12'></div></div></div>" );
				} else {
					// This HR is not already draggable
					$this.wrap( "<div class='row'><div class='col-md-12'></div></div>" );
				}
			}
		} );
	};

	/**
	 * Merge the menu items that have been added through configurations into the default settings
	 */
	this.merge_additional_menu_options = function() {
		$.each( additional_menu_items, function( key, menu_item ) {
			var current_element_selection = menu_options[ menu_item['element_type'] ];
			var addition_item = {};
			addition_item[ menu_item['title'] ] = menu_item['title'];
			$.extend( current_element_selection, addition_item );
		} );
	};

	/**
	 * Find the interaction conatiner.
	 * See the interaction conatiner definition above for an explination
	 */
	this.determine_interaction_container = function() {
		var $interaction_container = null;
		var $body = self.$master_container.find( 'body' );
		if ( $body.length ) {
			$interaction_container = self.$master_container;
		} else {
			$interaction_container = self.$master_container.closest( 'html' );
		}

		return $interaction_container;
	};

	/**
	 * Bind all events
	 */
	this.bind_events = function() {
		// Bind Event Handlers to container
		self.bind_drag_listeners();
		self.bind_container_events();
		self.bind_menu_items();
		self.bind_additional_menu_items();
		self.bind_edit_row();

		//This event should be bound to another mce event
		setTimeout( function () {
			self.set_background_colors();
		}, 1000);
	};

	var disable_edit_as_row = function () {
		if ( self.editting_as_row ) {
			//Restore Content Selectors
			self.content_selectors = self.original_selectors.content;
			self.row_selector = self.original_selectors.row;

			self.create_selector_strings();

			self.$master_container.off( '.draggable' );
			self.bind_events();


			$.fourpan.$recent_highlight.removeClass('current-edit-as-row');
			self.editting_as_row = false;

			self.$body.removeClass('editing-as-row');
			self.window_mouse_leave();
		}
	};

	var activate_edit_as_row = function () {
		//Save Content Selectors
		self.original_selectors = {};
		self.original_selectors.content = self.content_selectors;
		self.original_selectors.row = self.row_selector;

		self.content_selectors = nested_mode_content_selectors;
		self.row_selector = [self.nested_row_selector_string];

		self.create_selector_strings();

		self.$master_container.off( '.draggable' );
		self.bind_events();

		self.$master_container.find('.current-edit-as-row').removeClass('current-edit-as-row');
		$.fourpan.$recent_highlight.addClass('current-edit-as-row');

		self.editting_as_row = $.fourpan.$recent_highlight;
		self.$body.addClass('editing-as-row');
		self.window_mouse_leave();
	};

	/**
	 * When the user clicks edit as row
	 */
	this.bind_edit_row = function () {
		self.$master_container.on('click.draggable', '.edit-as-row', function () {
			var $this = $(this);
			var $element = $this.closest( '.draggable-tools-imhwpb' ).next();
			self.$master_container.trigger( self.boldgrid_edit_row, $element );

			if ( self.editting_as_row ) {
				$.fourpan.dismiss( );
			} else {
				$.fourpan.highlight($element);
			}

		});
	};

	/**
	 * Unbinds the event namespace ".draggable". This is used when the user
	 * disables our plugin
	 */
	this.unbind_all_events = function() {
		self.$master_container.off( '.draggable' );
		self.$master_container.off( '.draggable_mce' );
		self.$body.attr('style', '');
	};

	/**
	 * Hide all popover menus
	 */
	this.hide_menus = function( e ) {
		var menu_clicked = false;
		if ( e && e.target ) {
			var $this = $( e.target );
			if ( $this.closest( '.popover-menu-imhwpb' ).length ) {
				menu_clicked = true;
			} else if ( $this.closest( '.context-menu-imhwpb' ).siblings('.popover-menu-imhwpb:visible').length ) {
				menu_clicked = true;
			}
		}

		if ( menu_clicked == false ) {
			var $popovers = self.$master_container.find( '.popover-menu-imhwpb' );

			if ( $this ) {
				$popovers.not($this.closest('.popover-menu-imhwpb')).addClass('hidden');
			}
		}
	};

	/**
	 * Setup the Is Typing Plugin
	 */
	this.setup_additional_plugins = function () {
		if (  $.fn.is_typing_boldgrid ) {
			self.$master_container.is_typing_boldgrid();
		}
	};

	/**
	 * Bind all general events to the container
	 */
	this.bind_container_events = function() {
		self.$master_container
			.on( 'click.draggable', '.drag-handle-imhwpb, .draggable-tools-imhwpb', self.prevent_default_draghandle )
			.on( 'mousedown.draggable', '.drag-handle-imhwpb', self.drag_handle_mousedown )
			.on( 'mouseup.draggable', '.drag-handle-imhwpb', self.drag_handle_mouseup )
			.on( 'click.draggable', self.hide_menus )
			.on( 'click.draggable', self.failSafeCleanup )
			.on( 'click.draggable', '.context-menu-imhwpb', self.setup_context_menu )
			.on( 'boldgrid_modify_content.draggable', self.refresh_fourpan );

		if ( self.type_popover_removal ) {
			self.$master_container
				.on( 'start_typing_boldgrid.draggable', self.typing_events.start )
				.on( 'end_typing_boldgrid.draggable', self.typing_events.end );
		}

		//Manage drag handles show/hide
		self.$master_container
			.on( 'mouseenter.draggable', self.draggable_selectors_string + ', .draggable-tools-imhwpb', self.insert_drag_handles )
			.on( 'mouseleave.draggable', self.draggable_selectors_string + ', .draggable-tools-imhwpb', self.remove_drag_handles );

		self.$interaction_container
			.on( 'mouseleave.draggable', self.window_mouse_leave )
			.on( 'mouseup.draggable', self.master_container_mouse_up )
			.on( 'mousemove.draggable', self.mousemove_container );

		if ( self.ie_version > 11 || !self.ie_version ) {
			self.$interaction_container.on( self.resize_event_map, self.column_selectors_string );
		}
	};

	/**
	 * Initializes event binds for drop down menu clicks
	 */
	this.bind_menu_items = function() {

		self.$master_container
			.on( 'click.draggable', 'li[data-action="delete"]', self.menu_actions.delete_element )
			.on( 'click.draggable','li[data-action="add-column"]', self.menu_actions.add_column )
			.on( 'click.draggable','li[data-action="duplicate"]', self.menu_actions.duplicate )
			.on( 'click.draggable','li[data-action="clear"]', self.menu_actions.clear )
			.on( 'click.draggable','li[data-action="insert-layout"]', self.menu_actions.insert_layout )
			.on( 'click.draggable', 'li[data-action="nest-row"]', self.menu_actions.nest_row )
			.on( 'click.draggable', 'li[data-action="add-row"]', self.menu_actions.add_row )
			.on( 'click.draggable', 'li[data-action="clone-as-row"]', self.menu_actions.unnest_row )
			.on( 'click.draggable', 'li[data-action]',self.menu_actions.trigger_action_click )
			.on( 'click.draggable', 'li[data-action="add-media"]', self.menu_actions.add_media )
		;
	};

	/**
	 * Initializes event binds for drop down menu clicks: for menu items passed
	 * in at initialization
	 */
	this.bind_additional_menu_items = function() {
		$.each( additional_menu_items, function( key, menu_item ) {
			self.$master_container
				.on( 'click.draggable', 'li[data-action="' + menu_item.title+ '"]', menu_item.callback );
		} );
	};

	/**
	 * Sets up dragging for all elements defined
	 */
	this.bind_drag_listeners = function() {

		self.$window.on( 'dragover.draggable', self.drag_handlers.over );

		self.$interaction_container.on( 'dragleave.draggable', function () {
			if ( !self.$body.find(self.$current_drag).length && self.$current_drag ) {
				self.$current_drag.hide();
				self.$body.append(self.$current_drag);
			}
		} );

		self.$interaction_container
			.on( 'dragstart.draggable', '.drag-handle-imhwpb, [data-action="nest-row"]', self.drag_handlers.start )
			.on( 'dragstart.draggable', 'img, a', self.drag_handlers.hide_tooltips )
			.on( 'dragover.draggable', self.drag_handlers.iframe_over )
			.on( 'drop.draggable', self.drag_handlers.drop )
			.on( 'dragend.draggable', self.drag_handlers.end )
			.on( 'dragleave.draggable', self.drag_handlers.leave_dragging )
			.on( 'dragenter.draggable', self.drag_handlers.record_drag_enter )
			;
	};

	this.refresh_fourpan = function () {
		//If editing as row update the overlay
		if ( self.editting_as_row ) {
			$.fourpan.refresh();
		}
	};

	/** * Start jQuery Helpers** */
	/**
	 * Reverses a collection
	 */
	$.fn.reverse = [].reverse;

	/**
	 * Removes a popover
	 */
	$.fn.remove_popover_imhwpb = function() {
		$( this ).remove();
	};

	/**
	 * Checks if the passed element comes after the current element
	 */
	$.fn.is_after = function( sel ) {
		return this.prevAll().filter( sel ).length !== 0;
	};

	/**
	 * Checks if the passed element comes before the current element
	 */
	$.fn.is_before = function( sel ) {
		return this.nextAll().filter( sel ).length !== 0;
	};

	/**
	 * Closest Context
	 */
	$.fn.closest_context = function( sel, context ) {
		var $closest;
		if ( this.is( sel ) ) {
			$closest = this;
		} else {
			$closest = this.parentsUntil( context ).filter( sel ).eq( 0 );
		}

		return $closest;
	};

	/** * End jQuery Helpers** */

	/**
	 * Finds all column selectors and add additional column classes.
	 */
	this.add_redundant_classes = function() {
		self.$master_container.find( self.original_selector_strings.general_column_selectors_string ).each( function() {
			$current_element = $( this );
			$current_element.addClass( self.find_column_sizes( $current_element ) );
		} );
	};

	/**
	 * Each time the window changes sizes record the class that the user should
	 * be modifying.
	 */
	this.track_window_size = function() {
		self.active_resize_class = self.determine_class_sizes();
		self.$window.on( 'load resize', function() {
			setTimeout( function() {
				self.active_resize_class = self.determine_class_sizes();
			}, 300 );
		} );
	};

	/**
	 * Prevent default if exists
	 */
	this.prevent_default = function( event ) {
		if ( event.preventDefault ) {
			event.preventDefault();
		}
	};

	/**
	 * Create a string that holds a list of comma separated draggable selectors.
	 */
	this.format_draggable_selectors_string = function() {
		var selectors = [];

		selectors.push( self.content_selectors_string );
		selectors.push( self.column_selectors_string );
		selectors.push( self.row_selectors_string );

		return selectors.join();
	};

	/**
	 * Create a string of the column selectors
	 */
	this.format_immediate_column_selectors = function( selectors ) {
		var column_selectors = self.format_selectors( selectors ).slice();
		$.each( column_selectors, function( key, value ) {
			value = "> " + value;
			column_selectors[ key ] = value;
		} );
		return column_selectors;
	};

	/**
	 * Finds all of the redundant classes for an element. Example: If a class
	 * currently has col-md-3 then it should have the classes col-sm-12 and
	 * col-xs-12 added to it.
	 */
	this.find_column_sizes = function( $column ) {
		var classes = $column.attr( 'class' );
		var added_classes = [];

		// Find the sizes for each type
		var xs_size = classes.match( /col-xs-([\d]+)/i );
		var sm_size = classes.match( /col-sm-([\d]+)/i );
		var md_size = classes.match( /col-md-([\d]+)/i );

		// If an element does not have the class then add it
		var design_size = 12;
		if ( !xs_size ) {
			added_classes.push( 'col-xs-' + design_size );
		} else {
			design_size = xs_size[1];
		}

		if ( !sm_size ) {
			added_classes.push( 'col-sm-' + design_size );
		} else {
			design_size = sm_size[1];
		}

		if ( !md_size ) {
			added_classes.push( 'col-md-' + design_size );
		}

		return added_classes.join( ' ' );
	};

	/**
	 * Create a string of the column selectors
	 */
	this.format_column_selectors = function( selectors, format_visibility ) {
		var column_selectors = selectors;
		if ( format_visibility ) {
			column_selectors = self.format_selectors( selectors ).slice();
		}

		$.each( column_selectors, function( key, value ) {
			value = self.row_selectors_string + ' > ' + value;
			column_selectors[ key ] = value;
		} );

		return column_selectors;
	};

	/**
	 * Appends :not(:hidden) to each element
	 */
	this.format_selectors = function( selectors ) {
		var array_copy = selectors.slice();
		$.each( array_copy, function( key, value ) {
			value += ":visible";
			array_copy[ key ] = value;
		} );

		return array_copy;
	};

	/**
	 * Determines if a dragged element should be placed before or after the
	 * passed element. If we are placing an element within another element,
	 * before and after results in append or prepend
	 */
	this.before_or_after_drop = function( $element, pos_obj ) {
		var bounding_rect = $element.get( 0 ).getBoundingClientRect();
		var slope = -(bounding_rect.height / bounding_rect.width);
		var y_intercept = Math.floor( bounding_rect.bottom ) - (slope) * bounding_rect.left;
		var position_y_on_slope = (slope * pos_obj.x) + y_intercept;

		if ( position_y_on_slope <= pos_obj.y ) {
			drop_point = 'after';
		} else {
			drop_point = 'before';
		}

		return drop_point;
	};

	/**
	 * Remove the class .receptor-containers-imhwpb
	 */
	this.remove_receptor_containers = function() {
		self.$master_container.find( '.receptor-containers-imhwpb' ).removeClass(
			'receptor-containers-imhwpb' );
	};

	/**
	 * Once we finish dragging an element, we need to remove the hidden element
	 */
	this.finish_dragging = function() {

		if ( self.$cloned_drag_image && self.$cloned_drag_image.remove ) {
			self.$cloned_drag_image.remove();
		}
		if ( self.$temp_insertion ) {
			self.$temp_insertion.removeClass( 'cloned-div-imhwpb' );
		}

		// Fail safe to remove all activated classes
		self.$master_container.find( self.dragging_selector ).removeClass(
			self.dragging_selector_class_name );

		self.valid_drag = false;
		self.remove_receptor_containers();

		//We have just modified the DOM
		self.$master_container.trigger( self.boldgrid_modify_event );
	};

	/**
	 * Check if 2 arrays are equal
	 */
	this.array_equal = function( a, b ) {
		if ( a === b ) {
			return true;
		}

		if ( a == null || b == null ) {
			return false;
		}

		if ( a.length != b.length ) {
			return false;
		}

		for ( var i = 0; i < a.length; ++i ) {
			if ( a[ i ] !== b[ i ] ) {
				return false;
			}
		}

		return true;
	};

	/**
	 * Drags the an absolutely position element over another then deletes it
	 */
	this.slide_in_place = function( $draged_element, $new_element ) {
		var newOffset = $new_element.offset();
		var dragOffset = $draged_element.offset();

		$draged_element.animate( {
			'top' : parseInt( $draged_element.css( 'top' ) ) + (newOffset.top - dragOffset.top),
			'left' : parseInt( $draged_element.css( 'left' ) ) + (newOffset.left - dragOffset.left)
		}, '600', self.drag_cleanup );
	};

	/**
	 * Reset the drag operation, deleting any temp data
	 */
	this.drag_cleanup = function () {

		//This is just a failsafe, but performing this on IE causes resource spike
		if ( !self.ie_version ){
			//Make sure that the transformed layout has the correct elements wrapped
			self.validate_markup();
		}

		self.$current_drag.remove();
		self.finish_dragging();
		self.$master_container.trigger( self.drag_end_event, self.$temp_insertion );
		self.refresh_handle_location();
		self.$current_drag = null;
		self.$master_container.removeClass( 'drag-progress' );
	};

	/**
	 * Remove all popovers and then re-add them used for positioning
	 */
	this.refresh_handle_location  = function () {
		// Remove popovers so that they don't reappear in the old location
		self.remove_all_popovers();
		//Refresh the location of handlers
		self.update_handles(self.last_hover);
	};

	/**
	 * This function defines the restrictions of the dragged item.
	 */
	this.determine_current_drag_properties = function() {
		var sibling = '';
		var parent = '';

		// Rows
		if ( self.$current_drag.IMHWPB.is_row ) {
			sibling = self.row_selectors_string;

			// Columns can only be dragged into current row
		} else if ( self.$current_drag.IMHWPB.is_column ) {

			parent = self.row_selectors_string;
			sibling = self.general_column_selectors_string;

			// Paragraphs, Images, Headings see (self.content_selectors_string)
		} else if ( self.$current_drag.IMHWPB.is_content ) {
			parent = self.column_selectors_string;
			sibling = self.content_selectors_string;
		}

		self.$current_drag.properties = {
			'sibling' : sibling, // The element can be be placed next to
									// siblings
			'parent' : parent
		// The element can be placed within a parent.
		};
	};

	/**
	 * Check if a value is between another 2 values
	 */
	this.between = function( x, min, max ) {
		return x >= min && x <= max;
	};

	/**
	 * Remove all the popovers that have been added to the screen
	 */
	this.remove_all_popovers = function() {
		self.last_hover = null;
		self.hover_elements.type = {
			'content' : null,
			'column' : null,
			'row' : null
		};

		self.delete_popovers();
	};

	/**
	 * Delete popovers
	 */
	this.delete_popovers = function () {
		self.$master_container.find( '.draggable-tools-imhwpb' ).each( function() {
			var $element = $( this );
			var $element_next = $element.next();
			if ( $element_next.length ) {
				$element_next[0].popover = null;
			}
			// Wait for keypress events before removing element.
			setTimeout( function () {
				$element.remove();
			} );
		} );
	};

	/**
	 * The context menu action
	 */
	this.setup_context_menu = function( event ) {
		event.preventDefault();
		event.stopPropagation();
		self.hide_menus( event );
		$( this ).closest( '.draggable-tools-imhwpb' ).find( '.popover-menu-imhwpb' ).toggleClass('hidden');
	};

	/**
	 * Returns the type of the given element
	 * TODO: elimnate the use of this function when possible, consumes alot of resources on edge.
	 */
	this.get_element_type = function( $element ) {
		var type = '';

		if ( $element.is( self.content_selectors_string ) ) {
			type = 'content';
		} else if ( $element.is( self.row_selectors_string ) ) {
			type = 'row';
		} else if ( $element.is( self.column_selectors_string ) ) {
			type = 'column';
		}

		return type;
	};

	/**
	 * Event that handles remove popovers Triggered when your mouse enters
	 * another target within the the $master_container
	 */
	this.remove_drag_handles = function( event ) {

		var $current_element = $( this ); // Element you've left

		var $draggable;
		var $tools;
		if ( !event.relatedTarget ) {
			return;
		}
		self.remove_receptor_containers();

		// Related Target is the target you entered
		var $related_target = $( event.relatedTarget || event.toElement ); // Element you've entered

		if ( false == $related_target.length ) {
			return;
		}

		var $closest_draggable_tools = $related_target.closest( '.draggable-tools-imhwpb' );
		if ( $current_element.hasClass( 'draggable-tools-imhwpb' ) ) {

			// If you've entered into your child dont remove
			if ( $current_element.next().find( $related_target ).length
				|| $current_element.next()[0] == $related_target[0] ) {
				return false;
			}

			$tools = $current_element;
			$draggable = $current_element.next();

			// If you did not enter your own popover
		} else if ( $closest_draggable_tools[0] != this.popover || false == $closest_draggable_tools.length ) {

			// If you've entered into your parent, and your parent needs a popover
			// Only applies to content
			var type = self.get_element_type( $current_element );
			var nested_content = $current_element.parent().closest_context(
				self.content_selectors_string, self.$master_container ).length;

			if ( type == 'content' && nested_content ) {
				return false;
			}

			if ( $current_element.find( $related_target ).length ) {
				return false;
			}

			$tools = $current_element.prev( '.draggable-tools-imhwpb' );
			$draggable = $current_element;

		}//endif

		if ( $draggable && $draggable.length ) {
			var type = self.get_element_type( $draggable );
			// Prevent a pending addition from occuring
			if ( type && self.hover_elements[ type ]
				&& typeof self.hover_elements[ type ].add_element != "undefined"
				&& self.hover_elements[ type ].add_element != null ) {

				// In the case that the lowest child event leave does not
				// trigger,
				// Remove invalid elements
				self.hover_elements[ type ].add_element = null;
				if ( type == 'row' ) {
					self.hover_elements['column'] = { 'add_element': null };
					self.hover_elements['content'] = { 'add_element': null };
				} else if ( type == 'column' ) {
					self.hover_elements['content'] = { 'add_element': null };
				}
			}
		}

		if ( $draggable && $draggable.length && $tools && $tools.length ) {
			self.last_hover = new Date().getTime();
			self.hover_elements[ type ] = {
				'remove_element' : {
					'element' : $draggable,
					'tools' : $tools,
				}
			};
			setTimeout( self.update_handles, self.hover_timout, self.last_hover );
		}
	};

	/**
	 * Delete a popover
	 */
	this.remove_drag_handle = function( $draggable, $tools ) {
		if ( $tools ) {
			$tools.remove_popover_imhwpb();
		}
		if ( $draggable && $draggable.length ) {
			$draggable[0].popover = null;
			if ( false == self.$current_drag ) {
				$draggable.removeClass( self.dragging_selector_class_name );
			}
		}
	};

	/**
	 * Return Row, Column, Content or nested-row
	 */
	this.get_tooltip_type = function ( $current ) {
		//Even though HR's are nested they should not appear as nested
		if ( $current.is( self.nested_row_selector_string ) && $current.find('> .col-md-12 > hr:only-child').length == 0 && !self.editting_as_row ) {
			var type = 'nested-row';
		} else {
			var type = self.get_element_type( $current );
		}

		return type;
	}

	/**
	 * Adds a popover before a row, content or column element
	 */
	this.insert_popover = function( $current ) {
		if ( !self.$master_container.find( $current ) ) {
			return;
		}

		var type = self.get_tooltip_type( $current );
		if ( !type ) {
			return;
		}

		// Insert A tooltip before the current element
		$current.before( self.toolkit_markup( type ) );
		var $added_tooltip = $current.prev( '.draggable-tools-imhwpb' );
		var $offset = $current.offset();
		var $parent_offset = $current.offsetParent().offset();

		// Attach a popover object to the element so that it can be removed more
		// easily
		$current[0].popover = $added_tooltip[0];

		// Rewrite the position of the tooltip based on type
		if ( type == 'content' || type == 'nested-row' ) {
			if ( self.$content_tooltip ) {
				self.$content_tooltip.remove();
			}
			self.$content_tooltip = $added_tooltip;

			//Min Left of 25
			var current_bounding_rect = $current[0].getBoundingClientRect();
			var left = current_bounding_rect.left - 17;
			if ( left < 25 ) {
				left = 25;
			}

			$added_tooltip.css( {
				'top' : current_bounding_rect.top - 25,
				'left' : left,
			} );

		} else if ( type == 'column' ) {
			if ( self.$column_tooltip ) {
				self.$column_tooltip.remove();
			}
			self.$column_tooltip = $added_tooltip;

			var current_bounding_rect = $current[0].getBoundingClientRect();

			$added_tooltip.css( {
				'top' : current_bounding_rect.top,
				'left' : current_bounding_rect.left,
			} );
		} else if ( type == 'row' ) {
			if ( self.$row_tooltip ) {
				self.$row_tooltip.remove();
			}
			self.$row_tooltip = $added_tooltip;

			$added_tooltip.css( {
				'position' : 'relative',
			} );
		}
	};

	/**
	 * Shortcut to get all elements that are direct decendents of the body
	 */
	this.get_top_level_elements = function () {
		return self.$body.find('> *').not('.draggable-tools-imhwpb');
	};

	/**
	 * Adds the event that creates the popovers
	 */
	this.insert_drag_handles = function( event ) {
		var $current = $( this );

		if ( !self.resize && !self.popovers_disabled ) {

			//If the user only has a paragraph on the page, don't show a popover
			var $top_level_elements = self.get_top_level_elements();
			if ( $top_level_elements.length === 1 && $top_level_elements[0].tagName == 'P') {
				return;
			}

			// If you have entered a popover rewrite to the popovers element
			var $closest_draggable = $current.closest( '.draggable-tools-imhwpb' );
			if ( $closest_draggable.length ) {
				$current = $closest_draggable.next();
			}

			// If this is nested content, rewrite handle to highest parent
			var type = self.get_element_type( $current );
			if ( type == 'content'
				&& true == $current.parent().closest_context( self.content_selectors_string,
					self.$master_container ).length ) {
				$current = $current.parents( self.content_selectors_string ).last();
			}

			self.last_hover = new Date().getTime();
			self.hover_elements[ type ] = {
				'add_element' : $current
			};
			setTimeout( self.update_handles, self.hover_timout, self.last_hover );
		}
	};

	/**
	 * Set the location of the popovers based on the maintained self.hover_elements object
	 */
	this.update_handles = function( last_hover ) {
		// If the last time we hovered over an element, was this event,
		if ( last_hover == self.last_hover ) {

			//Do not show popovers while the user is typing
			if ( self.is_typing && self.is_typing == true ) {
				return false;
			}

			// Apply hover_elements
			$.each( self.hover_elements,
				function( type, properties ) {
					if ( this.add_element
						&& false == this.add_element.prev().hasClass( 'draggable-tools-imhwpb' ) ) {

						self.insert_popover( this.add_element );

					} else if ( this.remove_element ) {

						self.remove_drag_handle( this.remove_element.element, this.remove_element.tools );

					}

					// Failsafe due to poor design
					// TODO: Remove failsafe
					if ( !this.add_element ) {
						var $extra_popovers = self.$master_container.find(
							"." + type + '-popover-imhwpb' ).closest( '.draggable-tools-imhwpb' );

						$extra_popovers.each( function() {
							var $this = $( this );
							self.remove_drag_handle( $this.next(), $this );
						} );
					}
				} );
		}
	};

	/**
	 * Formats a row into an array of stacks See this.find_column_stack for an
	 * explanation as to what a stack is.
	 */
	this.find_row_layout = function( $row ) {
		var layout = [];
		var stack = [];
		var stack_size = 0;
		$row.find( self.immediate_column_selectors_string ).each( function() {
			var column = {};
			var $column = $( this );
			var column_size = self.find_column_size( $column );
			if ( column_size + stack_size <= 12 ) {
				column.size = column_size;
				column.object = $column[0];
				stack.push( column );
				stack_size += column_size;
			} else {
				layout.push( stack );
				stack = [];
				column.size = stack_size = column_size;
				column.object = $column[0];
				stack.push( column );
			}
		} );

		if ( stack.length ) {
			layout.push( stack );
		}

		return layout;
	};

	/**
	 * Finds a layout stack A layout stack is a section of 12 columns, in a row.
	 * Example: A row has 3 columns of widths 12, 8 and 4 This row has 2 stacks.
	 * The first stack has 1 column and a width of 12. The second stack has 2
	 * columns a width of 8 and a width of 4.
	 */
	this.find_column_stack = function( $row, column ) {
		var stack = [];
		var index = null;
		var layout = self.find_row_layout( $row );
		$.each( layout, function( key, current_stack ) {
			$.each( current_stack, function( column_key, current_column ) {
				if ( column == current_column.object ) {
					stack = current_stack;
					index = key;
					return false;
				}
			} );
			if ( stack.length ) {
				return false;
			}
		} );

		return {
			'stack' : stack,
			'stack_index' : index
		};
	};

	/**
	 * Checks to see if the column passed in is an adjacent column
	 *
	 * @return boolean
	 */
	this.check_adjacent_column = function( stack, sibling_column ) {
		var sibling_in_stack = false;

		if ( sibling_column.length ) {
			$.each( stack, function( key, current_column ) {
				if ( sibling_column[0] == current_column.object ) {
					sibling_in_stack = true;
					return false;
				}
			} );
		}

		return sibling_in_stack;
	};

	/**
	 * Event that occurs when the user moves their mouse
	 */
	this.mousemove_container = function( event ) {
		// Log All Mouse Movement
		self.pageX = event.originalEvent.clientX;
		self.pageY = event.originalEvent.clientY;

		// If we are currently resizing run this process
		if ( self.resize ) {

			var $row = self.resize.element.closest_context( self.row_selectors_string,
				self.$master_container );
			var row_width = $row[0].getBoundingClientRect().width;
			var column_size = self.find_column_size( self.resize.element );
			var offset = self.resize.element[0].getBoundingClientRect();
			var row_size = self.find_row_size( $row );
			// Determine how much drag until next location
			var current_column_size = self.column_sizes[ column_size ] * row_width;
			var offset_added = self.column_sizes[ column_size + 1 ] * row_width;
			var offset_removed = self.column_sizes[ column_size - 1 ] * row_width;

			var smaller_position;
			var larger_position;
			var smaller_override;
			var larger_override;

			// Figure out the position of the next smallest column size
			if ( self.resize.left ) {
				smaller_position = offset_added - current_column_size + offset.left;
				larger_position = offset_removed - current_column_size + offset.left;
				smaller_override = self.pageX > smaller_position;
				larger_override = self.pageX < larger_position;
			} else {
				smaller_position = offset_removed - current_column_size + offset.right;
				larger_position = offset_added - current_column_size + offset.right;
				smaller_override = self.pageX < smaller_position;
				larger_override = self.pageX > larger_position ||
				// If the users cursor is anywhere outside of the row + 10, make
				// larger
				$row[0].getBoundingClientRect().right + self.right_resize_buffer < self.pageX;
			}

			var resize_buffer = row_width * self.resize_buffer;

			// Has the dragging made the current element smaller?
			var made_smaller = smaller_override
				|| self.between( smaller_position, self.pageX - resize_buffer, self.pageX
					+ resize_buffer );

			// Has the dragging made the current element larger?
			var made_larger = larger_override
				|| self.between( larger_position, self.pageX - resize_buffer, self.pageX
					+ resize_buffer );

			var valid_smaller = made_smaller && column_size > 1;
			var valid_larger = made_larger && column_size < self.max_row_size;

			if ( valid_smaller || valid_larger ) {

				var column_stack = self.find_column_stack( $row, self.resize.element[0] );

				// If your resizing from the left and this is the first item in
				// a stack ignore the movemeny
				if ( self.resize.left && self.resize.element[0] == column_stack.stack[0].object ) {
					self.$master_container.addClass( 'cursor-not-allowed-imhwpb' );
					return false;
				}
				// If your resizing from the right
				//	and the row has 12
				//  and your making it larger
				//  and this is a descktop view
				//And this is the last column in the row
				var last_col_in_row = column_stack.stack[ column_stack.stack.length - 1 ].object == self.resize.element[0] ;
				if ( self.resize.right && row_size == 12 && valid_larger && self.active_resize_class == 'col-md' && last_col_in_row ) {
					return false;
				}

				var sibling_in_stack = self.check_adjacent_column( column_stack.stack,
					self.resize.sibling );
			}

			if ( valid_smaller ) {

				self.change_column_size( self.resize.element, false );
				if ( self.resize.sibling.length ) {

					if ( self.find_column_size( self.resize.sibling ) < self.max_row_size
						&& sibling_in_stack ) {
						self.change_column_size( self.resize.sibling );
					}
				}

				var new_column_stack = self.find_column_stack( $row, self.resize.element[0] );

				if ( column_stack.stack_index != new_column_stack.stack_index ) {
					self.end_resize();
				}

			} else if ( valid_larger ) {
				if ( self.resize.sibling.length
					&& self.find_column_size( self.resize.sibling ) == 1 ) {
					return;
				}

				self.change_column_size( self.resize.element )
				if ( sibling_in_stack ) {
					self.change_column_size( self.resize.sibling, false );
				}

				var new_column_stack = self.find_column_stack( $row, self.resize.element[0] );

				if ( column_stack.stack_index != new_column_stack.stack_index ) {
					self.end_resize();
				}
			}

		}
	};

	/**
	 * Prevent default behavior when the user clicks on the drag handle
	 */
	this.prevent_default_draghandle = function( event ) {
		event.preventDefault();
	};

	/**
	 * Remove any classes that were added by the the draggable class
	 */
	this.frame_cleanup = function ( markup ) {
		var $markup = $('<div>' + markup + '</div>');
		self.remove_resizing_classes( $markup );
		self.remove_border_classes( $markup );
		$markup.find('.draggable-tools-imhwpb').remove();
		return $markup.html();
	};

	/**
	 * Remove resizing class
	 */
	this.remove_resizing_classes = function ( $container ) {
		$container.find( '.resizing-imhwpb' ).removeClass( 'resizing-imhwpb' );
	};

	/**
	 * Remove border classes
	 */
	this.remove_border_classes = function ( $container ) {
		// Remove Border Classes
		$container
			.find(
				'.resize-border-left-imhwpb, .resizing-imhwpb, .resize-border-right-imhwpb, .content-border-imhwpb' )
			.removeClass(
				'resize-border-right-imhwpb resizing-imhwpb resize-border-left-imhwpb content-border-imhwpb' );
	};

	/**
	 * Method to be called when the resize process has completed
	 */
	this.end_resize = function() {
		self.resize = false;
		self.remove_border_classes( self.$master_container );

		var $container = self.$master_container.find( 'body' );

		if ( !$container.length ) {
			$container = self.$master_container;
		}

		$container.removeClass( 'no-select-imhwpb' );
		self.remove_resizing_classes( self.$master_container );
		self.$master_container.removeClass( 'resizing-imhwpb cursor-not-allowed-imhwpb' );

		self.$master_container.trigger( self.resize_finish_event );
	};


	/**
	 * Events to trigger when the users mouse leaves the window
	 */
	this.window_mouse_leave = function() {
		if ( self.resize ) {
			self.end_resize();
		}

		self.remove_resizing_classes( self.$master_container );
		self.remove_all_popovers();

		self.hover_elements = {
			'content' : null,
			'column' : null,
			'row' : null
		};
	};

	/**
	 * When the user presses down on the drag handle Add borders to the
	 * locations that the user can drop the items
	 */
	this.drag_handle_mousedown = function( event ) {
		self.valid_drag = true;
		self.$current_clicked_element = $( this ).closest( '.draggable-tools-imhwpb' ).next();

		if ( self.$current_clicked_element.is( 'a' )
			&& self.$current_clicked_element.find( 'img, button' ).length ) {
			self.$current_clicked_element.find( 'img, button' ).first()
				.addClass( 'dragging-imhwpb' );
		} else {
			self.$current_clicked_element.addClass( 'dragging-imhwpb' );
		}

		// Add borders for the possible target selections of the current element
		if ( self.$current_clicked_element.is( self.content_selectors_string ) ) {
			self.$master_container.find( self.column_selectors_string ).addClass(
				'receptor-containers-imhwpb' );

		} else if ( self.$current_clicked_element.is( self.row_selectors_string ) ) {
			self.$master_container.find( self.row_selectors_string ).addClass(
				'receptor-containers-imhwpb' );

		} else if ( self.$current_clicked_element.is( self.column_selectors_string ) ) {
			self.$master_container.find( self.column_selectors_string ).addClass(
				'receptor-containers-imhwpb' );

			self.$master_container.find( self.row_selectors_string ).addClass(
				'receptor-containers-imhwpb' );
		}
	};

	/**
	 * Handles the event of a mouse up on the drag handle
	 */
	this.drag_handle_mouseup = function() {
		self.remove_receptor_containers();
		self.valid_drag = false;
	};

	/**
	 * Handles the mouse up on the main container
	 */
	this.master_container_mouse_up = function( event, element ) {
		if ( self.resize ) {
			self.end_resize();
		}

		if ( self.$current_clicked_element ) {
			self.$current_clicked_element.removeClass( 'dragging-imhwpb' );
		}

		if ( typeof element == 'undefined' ) {
			var $target = $( event.target );
		} else {
			var $target = $( element );
		}

		if ( false == $target.closest( '.draggable-tools-imhwpb' ).length ) {
			$target.trigger( 'mouseenter' );
		}
	};

	/**
	 * Decrease row size by 1
	 */
	this.decrease_row_size = function( $row ) {
		var row_decreased = false;
		$row.find( self.immediate_column_selectors_string ).reverse().each( function() {
			var $current_element = $( this );
			if ( self.find_column_size( $current_element ) >= 2 ) {
				self.change_column_size( $current_element, false );
				row_decreased = true;
				return false;
			}
		} );

		return row_decreased;
	};

	/**
	 * Find the location of the border on an column
	 */
	this.get_border_mouse_location = function( $element, x_position ) {
		var bounding_rectangle = $element[0].getBoundingClientRect();
		var left_position = Math.floor( bounding_rectangle.left );
		var right_position = Math.floor( bounding_rectangle.right );

		var right_of_column = self.between( x_position, right_position - self.border_hover_buffer,
			right_position );

		var left_of_column = self.between( x_position, left_position, left_position
			+ self.border_hover_buffer );

		if ( left_of_column && false == $element.prevAll( self.column_selectors_string ).length ) {
			left_of_column = false;
		}

		return {
			'left' : left_of_column,
			'right' : right_of_column
		};
	};

	/**
	 * Given a set of key value pairs, and a row. Change the sizes in the row to
	 * the sizes in the transform
	 */
	this.transform_layout = function( $row, layout_transform ) {
		$.each( layout_transform, function( current_value, transform_value ) {
			$row.find( self.immediate_column_selectors_string ).each( function() {
				var $column = $( this );
				if ( current_value == self.find_column_size( $column ) ) {
					self.change_column_size( $column, null, transform_value );
				}
			} );
		} );
	};

	/**
	 * Given an array of sizes, returns the an object with the previous rows
	 * values and the size it translates to
	 */
	this.find_layout_transform = function( layout_format, current_column_size ) {
		var translation_key = JSON.stringify( layout_format );
		var transform = self.layout_translation[ translation_key ];

		// If this override is requires a current column to be passed and it
		// does not match
		// Unset the transform
		if ( typeof current_column_size != 'undefined' && typeof transform != 'undefined'
			&& typeof transform.current != 'undefined' && transform.current != current_column_size ) {
			transform = null;

		} else if ( typeof current_column_size == 'undefined' && typeof transform != 'undefined'
			&& transform.current ) {
			transform = null;
		}

		return transform;
	};

	/**
	 * Given a row, return an array of its sizes
	 */
	this.get_layout_format = function( $row ) {
		var layout_format = [];
		$row.find( self.immediate_column_selectors_string ).each( function() {
			layout_format.push( self.find_column_size( $( this ) ) );
		} );

		return layout_format;
	};

	/**
	 * Change the size of a column to the passed in value or
	 * increments/decrements
	 */
	this.change_column_size = function( $column_element, increment, value_override ) {
		if ( !$column_element.length ) {
			return;
		}

		var regex = new RegExp( self.active_resize_class + "-[\\d]+", 'i' );
		$.each( $column_element.attr( 'class' ).split( ' ' ), function( key, class_name ) {

			if ( class_name.match( regex ) ) {
				var column_size = parseInt( class_name.replace( /\D/g, '' ) );

				if ( value_override ) {
					column_size = value_override;
				} else if ( increment === false ) {
					column_size--;
				} else {
					column_size++;
				}

				var new_class_name = class_name.replace( /\d+/g, column_size );
				var new_class_string = $column_element.attr( 'class' ).replace( class_name,
					new_class_name );

				$column_element.attr( 'class', new_class_string );

				return false;
			}
		} );

		//We have just modified the DOM
		self.$master_container.trigger( self.boldgrid_modify_event );
	};

	/**
	 * Return the column size of a column
	 */
	this.find_column_size = function( $column_element ) {
		var column_size = 0;
		var regex = new RegExp( self.active_resize_class + "-([\\d]+)", 'i' );
		var matches = $column_element.attr( 'class' ).match( regex );

		if ( matches ) {
			column_size = matches[1];
		}

		return parseInt( column_size );
	};

	/**
	 * Sums all column sizes in a row
	 */
	this.find_row_size = function( $row ) {
		var total_size = 0;

		$row.find( self.immediate_column_selectors_string ).not( '.dragging-imhwpb' ).each(
			function() {
				total_size += self.find_column_size( $( this ) );
			} );

		return total_size;
	};

	/**
	 * Moves the current drag to the correct cursor position
	 */
	this.set_drag_to_cursor = function( event ) {

		var offset_properties = {};

		if ( self.$current_drag.IMHWPB.is_row ) {
			offset_properties = {
				'top' : event.originalEvent.pageY
			};
		} else if (  self.$current_drag.IMHWPB.is_column && self.$current_drag.IMHWPB.unlock_column == false ){
			offset_properties = {
				'left' : event.originalEvent.pageX
			};
		} else {
			offset_properties = {
				'top' : event.originalEvent.pageY,
				'left' : event.originalEvent.pageX
			};
		}

		self.$current_drag.offset( offset_properties );
		self.$current_drag.show();
	};

	/**
	 * Based on the window size, return the column type that is being used
	 */
	this.determine_class_sizes = function() {
		var column_type;
		var width = self.$master_container.width();

		if ( width > 1061 ) {
			column_type = 'col-md';
		} else if ( width > 837 ) {
			column_type = 'col-sm';
		} else {
			column_type = 'col-xs';
		}

		return column_type;
	};

	/**
	 * Check if a color word is the same a some of the common definitions for these color
	 * Definitions are defined in self.color_alias
	 */
	this.color_is = function (color_returned, color) {
		return self.color_alias[color].indexOf(color_returned) !== -1;
	};

	/**
	 * Logic used for adding a maximum height
	 * If the height of the element if >= 200
	 * 		then max_height * 1.25
	 * Else
	 * 		max_height = 250
	 */
	var add_max_height_styles = function ( $element, cur_height ) {
		if ( cur_height >= 200 ) {
			var max_height = cur_height * 1.25;
		} else {
			var max_height = 250;
		}
		$element.css( {
			'max-height': max_height + 'px',
			'overflow': 'hidden'
		});
	};

	/**
	 * Add Max heights to rows if dragging a column
	 * Add Max Heights to content if dragging content
	 */
	this.add_max_heights = function () {
		if ( self.$current_drag.IMHWPB.type == 'column' ) {
			self.$master_container.find( self.row_selectors_string ).each( function () {
				var $this = $(this);
				var row_size = self.find_row_size( $this );
				if  ( row_size <= 12 ) {
					var outer_height = $this.outerHeight();
					add_max_height_styles( $this, outer_height );
				}
			});
		} else if ( self.$current_drag.IMHWPB.type == 'content' ) {
			add_max_height_styles( self.$temp_insertion, self.$current_drag.IMHWPB.height );
		}
	}

	/**
	 * Remove the list of styles that we add for max heights
	 */
	var remove_max_height_styles = function ( $element ) {
		$element.css( {
			'max-height': '',
			'overflow': ''
		});
	}

	/**
	 * We've added max heights to rows and content elements while dragging
	 * Remove them so that the editor is WYSIWYG after drag is finished
	 */
	this.remove_max_heights = function () {
		if ( self.$current_drag.IMHWPB.type == "column" ) {
			remove_max_height_styles(self.$master_container.find(self.row_selectors_string));
		} else if ( self.$current_drag.IMHWPB.type == 'content' ) {
			remove_max_height_styles(self.$temp_insertion);
		}
	}

	this.get_other_top_level_elements = function () {
		return self.$body.find(self.immediate_row_siblings_string).not(self.$current_drag);
	};

	/**
	 * Find max and min y cord used for dragging rows
	 */
	this.find_page_min_max = function () {
		var min_max = {};
		if ( self.$current_drag.IMHWPB.is_row ) {

			var $other_top_level_elements = self.get_other_top_level_elements();

			var $first = $other_top_level_elements.eq(0);
			var $last = $other_top_level_elements.last();

			min_max = {
				'offset_top' : $first[0].getBoundingClientRect().top,
				'offset_bottom' : $last[0].getBoundingClientRect().top + $last.outerHeight(true)
			}
		}

		return min_max;
	};

	/**
	 * Find boundries of a column when dragging within a row
	 * in the locked setting
	 */
	this.find_row_min_max = function () {
		var min_max = {};
		if ( self.$current_drag.IMHWPB.is_column ) {
			var $row = self.$current_drag.closest('.row');
			var row = $row.get(0);

			var client_rect = row.getBoundingClientRect();
			min_max = {
				'offset_left' : client_rect.left,
				'offset_right' : client_rect.left + $row.outerWidth(true),
				'offset_top' : Math.max(0, client_rect.top - 150),
				'offset_bottom' : client_rect.top + $row.outerHeight(true),
			}
		}

		return min_max;
	};

	/**
	 * Find the the points of each top level element at which a dragged element
	 * should be placed before or after
	 *
	 * This is used everytime the location of an element changes during dragging a row as well
	 * as the start of a row drag.
	 *
	 * Instead of doing the math everytime the over event triggers, do this only when needed
	 * This allows us to use a simple comparison operator later.
	 */
	this.find_top_level_positions = function () {

		var positions = [];
		if ( self.$current_drag.IMHWPB.is_row ) {
			var $other_top_level_elements = self.get_other_top_level_elements();

			$other_top_level_elements
				.each( function () {
					var $this = $(this);
					var height = $this.outerHeight(true);

					positions.push({
						'max' : this.getBoundingClientRect().top + height,
						'element' : $this
					});
				});
		}

		return positions;
	};

	/**
	 * When dragging columns, use this to find the right x point of each element
	 */
	this.find_column_sibling_positions = function () {
		var positions = [];
		if ( self.$current_drag.IMHWPB.is_column ) {
			self.$current_drag
				.siblings(self.general_column_selectors_string)
				.each( function () {
					var $this = $(this);
					var width = $this.outerWidth(true);
					var bounding_rect = this.getBoundingClientRect();

					positions.push({
						'max' : bounding_rect.left + width,
						'element' : $this
					});
				});
		}
		return positions;
	};

	/**
	 * Set the current drag properties for a column. These are needed for drag over DnD
	 */
	this.recalc_col_pos = function () {
		//Recalc pos of all top level elements.
		self.$current_drag.IMHWPB.col_pos = self.find_column_sibling_positions();
		self.$current_drag.IMHWPB.row_min_max = self.find_row_min_max();
	};

	/**
	 * Set the current drag properties for a column. These are needed for drag over DnD
	 */
	this.recalc_row_pos = function () {
		//Recalc pos of all top level elements.
		self.$current_drag.IMHWPB.row_pos = self.find_top_level_positions();
		self.$current_drag.IMHWPB.row_min_max = self.find_page_min_max();
	};

	/**
	 * This function is used to drag colummns
	 */
	this.reposition_row = function ( page_y ) {
		if ( self.$current_drag.IMHWPB.is_row ) {

			if ( page_y < self.$current_drag.IMHWPB.row_min_max.offset_top ) {
				var $first_elem = self.get_other_top_level_elements().first();

				if ( $first_elem.get(0) != self.$temp_insertion[0] ) {
					$first_elem.before( self.$temp_insertion );
					self.recalc_row_pos();

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );
				}
				return;

			} else if (  page_y > self.$current_drag.IMHWPB.row_min_max.offset_bottom ) {
				var $last_elem = self.get_other_top_level_elements().last();

				if ( $last_elem.get(0) != self.$temp_insertion[0] ) {
					$last_elem.after( self.$temp_insertion );
					self.recalc_row_pos();

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );
				}

				return;

			}

			//Check each column end point position
			$.each(self.$current_drag.IMHWPB.row_pos, function () {

				if ( page_y < this.max ) {
					var $other_elements = self.get_other_top_level_elements();

					if ( most_recent_row_enter[0] == this.element[0] ) {
						return false;
					}
					most_recent_row_enter = this.element;

					//Insert Before if not already there
					if ($other_elements.index(this.element) < $other_elements.index(self.$temp_insertion)) {
						this.element.before(self.$temp_insertion);
						//If the element is before me but not immediately before me, insert immediately before me
					} else if ( $other_elements.index(this.element) > $other_elements.index(self.$temp_insertion) &&
						$other_elements.index(this.element) - 1 != $other_elements.index(self.$temp_insertion)
					) {
						this.element.before( self.$temp_insertion );
					} else {
						this.element.after(self.$temp_insertion);
					}

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );

					self.recalc_row_pos();

					return false;
				}
			});
		}
	};

	/**
	 * This function is used to drag colummns
	 */
	this.reposition_column = function ( page_x, page_y  ) {

		if ( self.$current_drag.IMHWPB.is_column && self.$current_drag.IMHWPB.unlock_column == false ) {

			if ( self.$current_drag.IMHWPB.row_min_max.offset_top > page_y ||
					self.$current_drag.IMHWPB.row_min_max.offset_bottom < page_y ) {

				self.$current_drag.IMHWPB.unlock_column = true;
				var $row = self.entered_target.closest( self.row_selectors_string );
				if ( $row.length ) {
					self.move_column_to( self.entered_target ); //Dom mod event triggered in here
				}

				return;
			}

			//If the element is outside of the row to the left and the temp insertion is not the first column,
			//insert this column as the first column
			if ( page_x < self.$current_drag.IMHWPB.row_min_max.offset_left ) {
				var $first_elem = self.$current_drag
					.closest( self.row_selectors_string )
					.find( self.immediate_column_selectors_string )
					.not(self.$current_drag)
					.eq(0);

				if ( $first_elem.get(0) != self.$temp_insertion[0] ) {
					$first_elem.before( self.$temp_insertion );
					self.recalc_col_pos();

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );
				}
				return;

			//If the element is outside of the row to the right and the temp insertion is not the last column,
			//insert this column as the last column
			} else if (  page_x > self.$current_drag.IMHWPB.row_min_max.offset_right ) {
				var $last_elem = self.$current_drag
				.closest( self.row_selectors_string )
				.find( self.immediate_column_selectors_string )
				.not(self.$current_drag)
				.last();

				if ( $last_elem.get(0) != self.$temp_insertion[0] ) {
					$last_elem.after( self.$temp_insertion );
					self.recalc_col_pos();

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );
				}

				return;

			}

			//Check each column end point position
			$.each(self.$current_drag.IMHWPB.col_pos, function () {
				//
				if ( page_x < this.max ) {

					if ( most_recent_enter[0] == this.element[0] ) {
						return false;
					}
					most_recent_enter = this.element;

					//Insert Before if not already there
					if (this.element.nextAll().not(self.$current_drag).filter(self.$temp_insertion).length) {
						this.element.before(self.$temp_insertion);

					//If the element is before me but not immediatly before me, insert immediatly before me
					} else if ( this.element.prevAll(self.general_column_selectors_string).not(self.$current_drag).get(0) != self.$temp_insertion[0] ) {
						this.element.before( self.$temp_insertion );
					} else {
						this.element.after(self.$temp_insertion);
					}

					//We have just modified the DOM
					self.$master_container.trigger( self.boldgrid_modify_event );

					self.recalc_col_pos();

					return false;
				}

			});

		}
	};

	/**
	 * This object contains all the event handlers used for DND (Drag and Drop)
	 */
	this.drag_handlers = {

		/**
		 * Hide all tooltips while dragging
		 */
		hide_tooltips : function() {
			if ( !self.$current_drag ) {
				setTimeout( function() {
					self.$master_container.find( '.draggable-tools-imhwpb' ).addClass( "hidden" );
				}, 100 );
			}
		},

		/**
		 * Handle the drop event of a draggable
		 */
		drop : function( event ) {
			if ( self.$current_drag ) {

				self.prevent_default( event );
				/**
				 * IE Fix Dragend does not fire occasionally, but drag drop does
				 * make sure that the drag end function is always called.
				 */
				self.drag_handlers.end( event );
				self.drag_drop_triggered = true;
			}
		},

		/**
		 * This event is triggered at each drag conclusion. We remove the dragged
		 * image and remove classes as needed Standard cleanup procedures must
		 * ensue
		 */
		end : function( event ) {
			if ( self.drag_drop_triggered ) {
				return;
			}

			if ( !self.$current_drag ) {
				return;
			}

			self.restore_row = null;
			self.$most_recent_row_enter_add = null;
			self.remove_max_heights();

			if ( self.dragImageSetting == 'actual' ) {
				self.slide_in_place( self.$current_drag, self.$temp_insertion );
			} else {
				self.drag_cleanup();
			}

			return true;
		},

		/**
		 * When the Dragging begins We we set a drag image, hide the current
		 * drag image, and set some initial drag properties
		 */
		start : function( event ) {

			self.valid_drag = true;
			self.drag_drop_triggered = false;
			var $this = $(this);
			var $tooltip = $this.closest( '.draggable-tools-imhwpb' );

			setTimeout( function() {
				self.$master_container
					.find( '.draggable-tools-imhwpb' )
					.addClass( "hidden" );
			}, 100 );

			self.$current_drag = $tooltip.next().addClass( 'dragging-imhwpb' );
			self.$master_container.addClass( 'drag-progress' );

			if ( self.$current_drag.parent( 'a' ).length ) {
				self.original_html = self.$current_drag.parent( 'a' )[0].outerHTML;
			} else {
				self.original_html = self.$current_drag[0].outerHTML;
			}
			// These settings help reduce cpu resource usage, storing some
			// properties of the
			// drag start so that they wont be retrieved again
			var $popover_items = $tooltip.find( '.popover-imhwpb' );
			self.$current_drag.IMHWPB = {
				'right_popover' : $popover_items.hasClass( 'right-popover-imhwpb' ),
				'column_popover' : $popover_items.hasClass( 'column-popover-imhwpb' ),
				'is_column' : self.$current_drag.is( self.column_selectors_string ),
				'is_row' : self.$current_drag.is( self.row_selectors_string ),
				'is_content' : self.$current_drag.is( self.content_selectors.join() ),
				'height' : self.$current_drag.outerHeight(),
				'width' : self.$current_drag.outerWidth(),
				'dragStarted' : true
			};

			// Save the column size at drag start so that it wont be recalculated
			if ( self.$current_drag.IMHWPB['is_row'] && $this.hasClass( 'action-list' ) ) {
				self.$current_drag.IMHWPB.is_row = false;
				self.$current_drag.IMHWPB.is_content = true;
			}

			if ( self.$current_drag.IMHWPB['is_column'] ) {
				self.$current_drag.IMHWPB['column_size'] = self
					.find_column_size( self.$current_drag );
				var $current_row = self.$current_drag.closest_context( self.row_selectors_string,
					self.$master_container );
				if ( $current_row.length ) {
					self.$current_drag.IMHWPB['original_row'] = $current_row[0];
				}
			}

			self.determine_current_drag_properties();

			// Set the dragging content
			//For IE this must be set to "text" all lower case
			event.originalEvent.dataTransfer.setData( 'text', ' ' );
			event.originalEvent.dataTransfer.dropEffect = 'copy';

			self.$temp_insertion = $( self.original_html );
			self.$temp_insertion.removeClass( 'dragging-imhwpb' );
			self.$temp_insertion.addClass( 'cloned-div-imhwpb' );

			// Set Dragging Image
			if ( self.dragImageSetting == 'actual' ) {

				//Add the inline-style so that its not modified by content changed
				self.$current_drag.css( {
					'height' : self.$current_drag.IMHWPB['height'],
					'width' : self.$current_drag.IMHWPB['width'],
				} ).addClass( 'hidden dragging-started-imhwpb' );

				self.$current_drag.attr( 'data-mce-bogus', "all" );

				// Set the background color to its parents bg color.
				if ( self.color_is( self.$current_drag.css( 'background-color' ), 'transparent' ) ) {
					self.$current_drag.parents().each( function(){
						var $this = $( this ),
							bgColor = $this.css( 'background-color' );

						if ( ! self.color_is( bgColor, 'transparent' ) ) {
							self.$current_drag.css( 'background-color', bgColor );
							return false;
						}
					} );
				}

				setTimeout( function () {
					//If the background is still transparent, set to white
					if ( self.color_is ( self.$current_drag.css('background-color'), 'transparent') ) {
						self.$current_drag.css( {
							'background-color': 'white',
							'color': '#333'
						});
				  	}
				}, 100);

				// Setting Drag Image is not allowed in IE, and fails on safari.
				if ( typeof event.originalEvent.dataTransfer.setDragImage != "undefined" && ! self.isSafari ) {

					//Turn off Drag Image
					var img = document.createElement("img");
					img.src = "";
					event.originalEvent.dataTransfer.setDragImage(img, 0, 0);
				}
			} else if ( self.dragImageSetting == 'browserImage' ) {
				self.$cloned_drag_image = $( self.original_html );
				self.$cloned_drag_image.addClass( 'temporary-image-div' );
				document.body.appendChild( self.$cloned_drag_image[0] );

				// Set the dragging content
				event.originalEvent.dataTransfer.setDragImage( self.$cloned_drag_image[0], 0, 0 );

				// Hide the image that we are currently dragging. It will be
				// removed once the drag completes
				// It will be replaced by the dragging content set above.
				self.$current_drag.addClass( 'hidden' );
			}

			// Since we arent creating on proximity we will need to create this
			// right away
			self.$current_drag.before( self.$temp_insertion );

			// Set an additional value of type for quick index lookups
			if ( self.$current_drag.IMHWPB.is_column ) {
				self.$current_drag.IMHWPB.type = 'column';
				self.recalc_col_pos();

				//If the row has not stacked with columns, allow the rail dragging && desktop view
				if ( self.find_row_size( self.$current_drag.closest('.row') ) <= 12
					&& self.active_resize_class == 'col-md'
					&& self.$current_drag.siblings( self.unformatted_column_selectors_string ).not( self.$temp_insertion ).length
				//	&& !self.editting_as_row
				) {
					self.$current_drag.IMHWPB.unlock_column = false;
				} else {
					self.$current_drag.IMHWPB.unlock_column = true;
				}
			} else if ( self.$current_drag.IMHWPB.is_row ) {
				self.$current_drag.IMHWPB.type = 'row';
				self.recalc_row_pos();
			} else {
				self.$current_drag.IMHWPB.type = 'content';
			}

			//Set max height to rows and content
			self.add_max_heights();

			// This timeout is needed so that there isnt a flsh on the screen in
			// chrome/ie
			// You cannot modify the drag object in this event
			var timeout_length = 100;
			if ( self.ie_version ) {
				timeout_length = 150;
			}

			setTimeout( function() {
				self.$current_drag.removeClass( 'hidden' );
				self.$master_container.trigger( self.drag_start_event );
				self.$master_container
					.find( '.resizing-imhwpb' )
					.removeClass( 'resizing-imhwpb' );

			}, timeout_length );

		},

		/**
		 * This event triggers as we drag over the selected elements In this
		 * case its triggered on all dragging within the document (iframe if
		 * used within tinyMCE)
		 */
		iframe_over : function( event ) {
			// The following section is allows you to actually drag the element
			// instead of using the drag image
			//self.valid_drag makes sure that the drag originated in from the current frame
			if ( self.dragImageSetting == 'actual' && self.$current_drag ) {
				event.preventDefault();
				self.set_drag_to_cursor( event );
			}
		},

		over : function( event ) {
			if ( !self.$current_drag || !self.valid_drag ) {
				return;
			}

			//Prevent Default is required for IE compatibility
			//Otherwise you'll exp a intermitent drag end
			event.preventDefault();

			// Handles Auto Scrolling
			// Only trigger every 50 microseconds
			if ( !self.last_auto_scroll_event || self.last_auto_scroll_event + 50 <= (new Date).getTime() ) {

				self.last_auto_scroll_event = (new Date).getTime();

				/**
				 * HANDLE ROW DRAGGING
				 * this is important
				 * This was moved to "over" on 10/14/15
				 */
				if ( self.$current_drag.IMHWPB.dragStarted ) {
					self.reposition_row( event.originalEvent.pageY );
					self.reposition_column( event.originalEvent.pageX, event.originalEvent.pageY  );
				}

				// Don't auto scroll when modifying a nested row.
				if ( self.$body.hasClass( 'editing-as-row' ) ) {
					return;
				}

				var scroll_speed = self.scroll_speeds[ self.$current_drag.IMHWPB.type ];
				var toolbar_height = outerHeight - innerHeight;
				var buffer_area = 50;
				var distance_from_top = (event.originalEvent.screenY - toolbar_height)
					- self.$mce_32[0].getBoundingClientRect().bottom;
				var scroll_from_top = self.$window.scrollTop();

				if ( scroll_from_top >= 125 && distance_from_top <= buffer_area ) {
					scrollBy( 0, -scroll_speed );
				}

				var pos_is_fixed = self.$post_status_info.css( 'position' ) == 'fixed';
				if ( pos_is_fixed ) {
					var distance_from_bottom = self.$mce_38[0].getBoundingClientRect().top
						- (event.originalEvent.screenY - toolbar_height);
					if ( distance_from_bottom <= buffer_area ) {
						scrollBy( 0, scroll_speed );
					}
				} else {
					var distance_from_bottom = innerHeight
						- (event.originalEvent.screenY - toolbar_height);
					if ( distance_from_bottom <= buffer_area ) {
						scrollBy( 0, scroll_speed );
					}
				}
			}
		},

		/**
		 * This function is responsible for all of the animation that the user
		 * sees as their cursor moves across the screen. It needs some cleanup
		 * to remove some duplicate code Its currently separated into three
		 * different types of dragging elements for ease of development. Theres
		 * a section for content, column, and row
		 */
		leave_dragging : function( event ) {
			if ( !self.$current_drag || self.$current_drag.IMHWPB.is_row ) {
				return;
			}

			//Prevent Default here causes an issue on IE
			if ( !self.ie_version ) {
				event.preventDefault();
			}

			var $left = $( event.target );
			var $entered = self.entered_target;

			// Prevent Multiple Events from being triggered at an X and Y
			// location
			if ( self.prevent_duplicate_location_events( event ) || !self.$current_drag ) {
				return false;
			}

			// Skip if dragging over same element
			if ( self.$temp_insertion[0] == $entered[0] ) {
				self.$most_recent_row_enter_add = null;
				return true;
			}

			// If you are dragging outside of the master container, skip this
			// event
			// This check is done later for content
			if ( false == self.$master_container.has( $entered ).length
				&& false == self.$current_drag.IMHWPB.is_content ) {
				return true;
			}

			//TODO: Content dragging has some major inefficiencies
			if ( self.$current_drag.IMHWPB.is_content ) {
				/**
				 * Most of Content Dragging is handled when a user enters a container
				 * This section allows for content to leave a row
				 */
				var $left_row = $left.closest_context( self.row_selectors_string,
					self.$master_container );

				// This content left the row and entered the rows parent
				var content_left_container = !!$left_row.parent().closest( $entered ).length;
				if ( content_left_container ) {
					$left = $left.closest_context( self.row_selectors_string,
						self.$master_container );
					var drop_point = self.before_or_after_drop( $left, {
						x : event.originalEvent.clientX,
						y : event.originalEvent.clientY
					} );

					if ( drop_point == 'before' ) {
						$left.before( self.$temp_insertion );
					} else { // drop_point == 'after'
						$left.after( self.$temp_insertion );
					}
				} else {
					if ( false == self.$master_container.has( $entered ).length ) {
						return true;
					}

					// Rewrite to highest
					var $parent_content = $entered.parents( self.content_selectors_string ).last();
					if ( true == $parent_content.length ) {
						$entered = $parent_content;
					}

					//If entered content
					if ( $entered.is( self.unformatted_content_selectors_string ) ) {

						// If entered a column that is not my own
						if ( $entered[0] != self.$current_drag[0] ) {

							// Ive left from a child of this column or the
							// column itself
							if ( $entered.find( $left ).length || $entered[0] == $left[0] ) {
								return true;
							}
						}
					}

					// If you enter the child of a parent
					// And the parent does not have any of your siblings,
					// Remap to the parent.
					var $parent = $entered.closest_context( self.$current_drag.properties.parent,
						self.$master_container );
					var entered_child_of_parent = $parent.length;
					var parent_has_content = false;
					var $content_elements = [];
					if ( entered_child_of_parent ) {

						if ( self.editting_as_row == false ) {
							//If in the standard view, just check for content inside the parent,
							//using the content selector, to find out if it has children
							var $content_elements = $parent
								.find( self.content_selectors_string + ', .row:not(.row .row .row)' )
								.not('.dragging-imhwpb');

							parent_has_content = $content_elements.length > 0;

						} else {
							var $content_elements = $parent
								//In the edit nested row view we can no longer use the conte selector
								//string because the string defines context which is invalid here in this find
								.find( self.general_content_selector_string )
								.not('.dragging-imhwpb');

							//TODO: This block allows nested rows content to drag back into its column
							//For some reason the popover menu is inside that column
							parent_has_content = $content_elements.length > 0;
							if ($content_elements.length == 1 && $content_elements.find('[data-action]')) {
								parent_has_content = false;
							}
						}

						if ( parent_has_content == false ) {
							$entered = $parent;
						}
					}

					//Entered Column
					var current_drag_is_parent = $entered.is( self.unformatted_column_selectors_string );

					/*
					* If entering a column
					* and column is not empty
					* and you've entered this column from anything outside this column
					* 		then Remap to the last element in this column
					*/
					if ( current_drag_is_parent && $content_elements.length ) {
						if ( $entered.find( $left ).length == false ) {
							$entered = $content_elements.last();
							parent_has_content = false;
						}
					}

					var current_drag_is_sibling = $entered
						.is( self.unformatted_content_selectors_string + ',hr:not('
							+ self.master_container_id + '.row .row hr)' );

					// If you began dragging over the column, and the column has
					// "siblings", ignore the drag over.
					// Any of these cases should be rewritten to handle the
					// appropriate sibling in the container.
					// This event should be handled by dragging over the
					// "siblings"
					if ( !current_drag_is_sibling && true == parent_has_content ) {
						return true;
					}

					var $current_placement = $entered.closest( '.cloned-div-imhwpb' );
					var entered_current_drag = $current_placement.length
						&& $current_placement[0] == self.$temp_insertion[0];
					if ( entered_current_drag ) {
						self.$most_recent_row_enter_add = null;
						return true;
					}

					// If the drag enter element is a sibling, we will insert before or after
					// This handles cases where you are dragging onto a sibling
					// Some work above has been done to rewrite the target under
					// certain circumstances
					if ( current_drag_is_sibling ) {

						// Content Siblings
						if ( $entered.is_before( self.$temp_insertion ) ) {
							$entered.before( self.$temp_insertion );

						} else if ( $entered.is_after( self.$temp_insertion ) ) {
							$entered.after( self.$temp_insertion );

						} else {
							$entered.before( self.$temp_insertion );
						}

						//We have just modified the DOM
						self.$master_container.trigger( self.boldgrid_modify_event );
					}
					// If the drag enter element is a parent, we will append or  prepend
					// This handles cases where you are dragging into a container
					else if ( current_drag_is_parent ) {
						// Since we are in this block, we know that we have
						// entered a column
						// First child is the first child of the column
						$first_child = $entered.find( '>:first-child' );
						$direct_descendents = $entered.find('> div');

						// If the first child of the column is a div prepend it
						if ( $first_child.length
								&& $direct_descendents.length === 1
								&& false == $first_child.is( self.column_selectors_string + ", .draggable-tools-imhwpb" )
								&& $first_child.is( 'div' ) ) {

							/**
							 * If you are dragging a content element  
							 * 		And you are entering a column from outside of the column
							 *  	And the column you are entering has a Column > DIV
							 *		And this column > div has no current content elements
							 * Then that drag enter is remapped to the enter the Column > DIV instead 
							 * Element will prepend the other element of the column regardless of entry point.
							 */
							$first_child.prepend( self.$temp_insertion );

						} else {
							var drop_point = self.before_or_after_drop( $entered, {
								x : event.originalEvent.clientX,
								y : event.originalEvent.clientY
							} );
							if ( drop_point == 'before' ) {
								$entered.prepend( self.$temp_insertion );
							} else { // drop_point == 'after'
								$entered.append( self.$temp_insertion );
							}
						}

						//We have just modified the DOM
						self.$master_container.trigger( self.boldgrid_modify_event );
					}
				}
			} else if ( self.$current_drag.IMHWPB.is_column && self.$current_drag.IMHWPB.unlock_column ) {
				if ( self.recent_event && self.recent_event.entered == $entered[0]
					&& self.recent_event.left == $left[0] ) {
					return true;
				}

				self.recent_event = {
					'entered' : $entered[0],
					'left' : $left[0],
				};

				// TODO: Figure out of this is good?
				if ( self.insertion_time + 20 > new Date().getTime() ) {
					return true;
				}

				/**
				 * OVERWRITE(Column): When you trigger an event into child,
				 * rewrite to parent
				 */
				if ( $entered.is ( self.unformatted_column_selectors_string ) == false ) {
					if ( $entered.is ( self.row_selectors_string ) == false ) {
						var $closest_column = $entered.closest_context ( self.column_selectors_string, self.$master_container );
						if ( $closest_column.length ) {
							$entered = $closest_column;
						}
					}
				}


				// If you are dragging outside of the master container, skip
				// this event
				if ( false == self.$master_container.has( $entered ).length ) {
					return true;
				}

				if ( $entered[0] == self.$temp_insertion[0] ) {
					return;
				}

				// If you drag entered a child of a column, from the same
				// column,
				// or child of the column, ignore the drag. This happens if the
				// current drag width is small and after your most recent drop your cursor was
				// still inside of a foreign column.

				//If this is happening in the same row
				if ( $entered.siblings().filter( self.$temp_insertion ).length ) {

					// If entering a column from a column
					if ( $entered.is( self.unformatted_column_selectors_string ) ) {

						// If entered a column that is not my own
						if ( $entered[0] != self.$current_drag[0] ) {

							var $original_drag_leave = $( event.target );

							// Ive left from a child of this column or the column
							// itself
							if ( $entered.find( $original_drag_leave ).length
								|| $entered[0] == $original_drag_leave[0] ) {

									return true;
							}
						}
					}
				}

				//Moves element
				self.move_column_to( $entered );
			}
		},


		/**
		 * When the user drag enters into any element, store the element that
		 * was entered. This is needed because on chrome and safari, there is a
		 * bug that causes the relatedTarget that should be attached to the
		 * event object in the drag entered to be missing. To circumvent this
		 * issue all events where bound to the drag leave and I've recorded the
		 * drag enter with this function. This way we have the record of both
		 * the drag leave and the drag enter.
		 */
		record_drag_enter : function( event ) {
			if ( !self.$current_drag || self.$current_drag.IMHWPB.is_row  ) {
				return;
			}

			//Prevent Default here causes an issue on IE
			if ( !self.ie_version ) {
				event.preventDefault();
			}

			self.entered_target = $( event.target );
		},
	};

	/**
	 * Get IE Version
	 * Thanks To: http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
	 */
	this.get_ie_version = function() {
		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
			// Edge (IE 12+) => return version number
			return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		// other browser
		return;
	}

	/**
	 * Determine if current browser is safari.
	 * Thanks To: http://stackoverflow.com/questions/7944460/detect-safari-browser.
	 *
	 * @since 1.1.1.3
	 *
	 * @return boolean.
	 */
	this.checkIsSafari = function () {
		return /^((?!chrome|android).)*safari/i.test( navigator.userAgent );
	}

	/**
	 * Move the column the passed element
	 */
	this.move_column_to = function ( $entered ) {
		var current_drag_is_sibling = $entered.is( self.unformatted_column_selectors_string );
		var current_drag_is_parent = $entered.is( self.$current_drag.properties.parent );

		// Calculate Row Size
		var $new_row = $entered.closest_context( self.row_selectors_string,
			self.$master_container );
		var $current_row = self.$temp_insertion.closest_context( self.row_selectors_string,
			self.$master_container );

		var row_size = self.find_row_size( $new_row );
		if ( $new_row.length && $current_row[0] != $new_row[0] ) {
			if ( current_drag_is_parent && (row_size >= self.max_row_size) ) {
				return false;
			}

			// If your dragging into a row that is not the original row,
			// Restore the state of the previous row, and store the
			// state of the new row
			/** An IE FIX * */
			/**
			 * Temp insertion is deleted when row is replaced on IE
			 * only*
			 */
			var temp_insertion = self.$temp_insertion[0].innerHTML;
			if ( self.restore_row ) {
				// Restore
				$current_row.html( self.restore_row );
				self.$temp_insertion.html( temp_insertion );
			}

			var dragging_out_of_original = self.$current_drag.IMHWPB['original_row'] != $new_row[0];
			// Store current row only if its not the original row. That
			// row
			// will not be restored
			if ( dragging_out_of_original ) {
				self.restore_row = $new_row.html();
			} else {
				self.restore_row = null;
			}

			// IF the row has enough room for your current drag item,
			// just place the item
			var row_has_room = (row_size + self.$current_drag.IMHWPB['column_size'] <= self.max_row_size);
			if ( false == row_has_room && dragging_out_of_original ) {

				// Use the rest of the space if row is partially empty
				var remaining_row_space = self.max_row_size - row_size;
				var column_size = null;
				var max_capacity = 9;
				if ( remaining_row_space > 0 ) {
					// Row already has enough room for column, do not
					// transform
					column_size = remaining_row_space;
				} else if ( $new_row.find( self.immediate_column_selectors_string ).length <= max_capacity ) {
					// The new column will be a one, make room
					// Transform the row to allow for the size of the
					// row. (Reduce row by 3)
					column_size = 3;

					if ( self.$current_drag.IMHWPB['column_size'] < column_size ) {
						column_size = self.$current_drag.IMHWPB['column_size'];
					}

					for ( var i = 0; i < column_size; i++ ) {
						self.decrease_row_size( $new_row );
					}
				}

				if ( column_size ) {
					// Set the column Size
					self.change_column_size( self.$temp_insertion, null, column_size );
				} else {
					// The row does not have room for the column
					self.restore_row = null;
					return true;
				}
			} else {
				// Set the column Size
				self.change_column_size( self.$temp_insertion, null,
					self.$current_drag.IMHWPB['column_size'] );
			}

			if ( current_drag_is_sibling ) {
				$entered.before( self.$temp_insertion );
			} else {
				$new_row.append( self.$temp_insertion );
			}
			self.record_recent_column_insertion();
		} else if ( current_drag_is_sibling ) {

			// If dragging into new row
			if ( $entered.is_before( self.$temp_insertion ) ) {
				$entered.before( self.$temp_insertion );
			} else {
				$entered.after( self.$temp_insertion );
			}
			self.record_recent_column_insertion();
		}
	};

	/**
	 * Set the time at which a column was inserted Record the columns insertion
	 */
	this.record_recent_column_insertion = function() {
		self.recent_event = {};
		self.insertion_time = new Date().getTime();
		self.$master_container.trigger( self.boldgrid_modify_event );
	};

	/**
	 * Check to see if a recent drag event was triggered at the location
	 * Prevents an event from occuring at teh same location as an event that
	 * just occured
	 */
	this.prevent_duplicate_location_events = function( event ) {
		var current_drag_loc = [
			event.originalEvent.pageX, event.originalEvent.pageY
		];

		var prevent;
		// Filter Duplicate Events
		if ( self.array_equal( self.current_drag_enter_event_loc, current_drag_loc ) ) {
			prevent = true;
		} else {
			self.current_drag_enter_event_loc = current_drag_loc;
			prevent = false;
		}
		return prevent;
	};

	/**
	 * An object with the actions that occur when a user clicks on the options
	 * in the popover menu
	 */
	this.menu_actions = {

		/**
		 * The delete event for all element types
		 */
		delete_element : function( event ) {
			event.preventDefault();
			var $tools = $( this ).closest( '.draggable-tools-imhwpb' );
			$tools.next().remove();
			$tools.remove();
			self.$master_container.trigger( self.delete_event );
		},
		unnest_row : function( event ) {
			var $element = $( this ).closest( '.draggable-tools-imhwpb' ).next();
			if (!$element.length) {
				return;
			}
			$($element[0].outerHTML).insertBefore($element.parent().closest('.row'));
			self.wp_media_modal_action( event, $element );

		},
		nest_row : function( event ) {
			return;
		},
		nest_row_old : function( event ) {
			var $element = $( this ).closest( '.draggable-tools-imhwpb' ).next();
			if (!$element.length) {
				return;
			}

			//Look Before
			var $row_to_nest_in = $element.prevAll( '.row' ).eq(0);
			if ( !$row_to_nest_in.length ) {
				//Look After
				$row_to_nest_in = $element.nextAll( '.row' ).eq(0);
			}

			//Not Found?
			if (!$row_to_nest_in.length) {
				//Create row and nest it
				$row_to_nest_in = $('<div class="row"><div class="col-md-8"></div></div>');
				self.$body.prepend($row_to_nest_in);
			}

			//Find Column
			var $column_to_nest_in = $row_to_nest_in.find( self.general_column_selectors_string ).eq(0);
			if ( !$column_to_nest_in.length ) {
				$column_to_nest_in = $("<div class='col-md-8'></div>");
				$row_to_nest_in.prepend( $column_to_nest_in );
			}

			$column_to_nest_in.prepend($element[0].outerHTML);
			//Focus element scroll
			//need to trigger event
		},
		add_row : function( event ) {
			var $empty_row = $( '<div class="row"><div class="col-md-12"></div></div>' );
			$( this ).closest( '.draggable-tools-imhwpb' ).before( $empty_row );

			$empty_row.addClass( 'added-element' );
			setTimeout( function() {
				self.$master_container.find( '.added-element' ).removeClass( 'added-element' );
			}, 1000 );

			self.$master_container.trigger( self.add_row_event, $empty_row.find( '.col-md-12' ) );
		},
		/**
		 * Adding a column to a row. Available from the row popovers
		 */
		add_column : function( event ) {
			event.preventDefault();
			var min_row_size = 0;
			var $current_click = $( this );
			var $row = $current_click.closest( '.draggable-tools-imhwpb' ).next();
			var row_size = self.find_row_size( $row );
			var $new_column;

			//If this row is empty( only has a br tag ) make sure its blank before adding a column
			var $children = $row.find('> *');
			if ( $children.length === 1 && $children[0].tagName == 'BR') {
				$row.empty();
			}

			if ( row_size < self.max_row_size && row_size >= min_row_size ) {
				$new_column = $( '<div class="col-md-' + (self.max_row_size - row_size)
					+ ' col-sm-12 col-xs-12"></div>' );
				$row.append( $new_column );
			} else if ( row_size >= self.max_row_size ) {

				var layout_format = self.get_layout_format( $row );
				var layout_transform = self.find_layout_transform( layout_format );
				if ( layout_transform && !layout_transform['current'] ) {
					self.transform_layout( $row, layout_transform );
					$new_column = $( '<div class="col-md-' + layout_transform['new']
						+ ' col-sm-12 col-xs-12"></div>' );
					$row.append( $new_column );
				} else {
					self.decrease_row_size( $row );
					$new_column = $( '<div class="col-md-1 col-sm-12 col-xs-12"></div>' );
					$row.append( $new_column );
				}
			}
			$new_column.html('<p><br> </p>');
			$new_column.addClass( 'added-element' );
			setTimeout( function() {
				$new_column.removeClass( 'added-element' );
			}, 1000 );

			self.$master_container.trigger( self.add_column_event, $new_column );
			$current_click.closest( '.popover-menu-imhwpb' ).addClass('hidden');
		},

		/**
		 * Duplicating an element, available from all element types
		 */
		duplicate : function( event ) {
			event.preventDefault();
			var $current_click = $( this );
			var $element = $current_click.closest( '.draggable-tools-imhwpb' ).next();
			var element_type = self.get_element_type( $element );
			if ( element_type == 'row' || element_type == 'content' ) {
				var $cloned_element = $element.clone();
				$cloned_element[0].popover = null;
				$element.after( $cloned_element );

			} else if ( element_type == 'column' ) {

				var $row = $element.closest_context( self.row_selectors_string,
					self.$master_container );

				var column_size = self.find_column_size( $element );
				var layout_format = self.get_layout_format( $row );
				var layout_transform = self.find_layout_transform( layout_format, column_size );
				var new_column_size = 1;

				if ( self.find_row_size( $row ) + column_size <= self.max_row_size ) {
					var $new_element = $element.before( $element[0].outerHTML );
					$new_element[0].popover = null;
				} else if ( layout_transform ) {
					if ( !layout_transform.current ) {
						self.transform_layout( $row, layout_transform );
						new_column_size = layout_transform['new'];
						var $new_element = $element.before( $element[0].outerHTML );
						$new_element[0].popover = null;
						self.change_column_size( $new_element, null, new_column_size );

					} else {

						// Transform current
						self.change_column_size( $element, null,
							layout_transform['current_transform'] );

						// Transform New
						new_column_size = layout_transform['new'];
						var $new_element = $element.before( $element[0].outerHTML );
						$new_element[0].popover = null;
						self.change_column_size( $new_element, null, new_column_size );

						// Transform Additional
						$.each( layout_transform['additional_transform'],
							function( key, transform ) {
								var num_transformed = 0;
								$row.find( self.immediate_column_selectors_string ).reverse()
									.each( function() {
										if ( num_transformed < transform['count'] ) {
											var $column = $( this );
											if ( self.find_column_size( $column ) == transform['from'] ) {
												self.change_column_size( $column, null, transform['to'] );
												num_transformed++;
											}
										} else {
											return false;
										}
									} );
							} );

					}

				} else if ( column_size % 2 == 0 && column_size ) {
					self.change_column_size( $element, null, parseInt( column_size / 2 ) );
					var $new_element = $element.before( $element[0].outerHTML );
					$new_element[0].popover = null;
					self.change_column_size( $new_element, null, parseInt( column_size / 2 ) );

				} else if ( self.decrease_row_size( $row ) ) {
					var $new_element = $element.before( $element[0].outerHTML );
					$new_element[0].popover = null;
					self.change_column_size( $new_element, null, new_column_size );
				}
			}

			self.$master_container.trigger( self.add_column_event );
			$current_click.closest( '.popover-menu-imhwpb' ).addClass('hidden');

			if ( self.ie_version ) {
				self.refresh_handle_location();
			}
		},

		/**
		 * Remove the contents elements of an element
		 */
		clear : function( event ) {
			event.preventDefault();
			var $current_click = $( this );
			var $element = $current_click.closest( '.draggable-tools-imhwpb' ).next();
			var type = self.get_element_type( $element );

			if ( type == 'column') {
				$element.html('<p><br> </p>');
			} else {
				$element.find(
					':not(' + self.column_selectors_string + '):not( ' + self.row_selectors_string
						+ ')' ).remove();
			}

			$current_click.closest( '.popover-menu-imhwpb' ).addClass('hidden');
			self.$master_container.trigger( self.clear_event, $element );
		},

		/**
		 * Activate the add media modal
		 */
		add_media : function( event ) {
			var $clicked_element = $( this );
			self.add_media_event_handler( $clicked_element.closest( '.draggable-tools-imhwpb' )
				.next()[0] );
			return;
		},
		/**
		 * Activate the add media modal
		 */
		insert_layout : function( event ) {
			var $clicked_element = $( this );
			self.insert_layout_event_handler( $clicked_element.closest( '.draggable-tools-imhwpb' )
				.next()[0] );
			return;
		},
		trigger_action_click : function( event ) {
			var $clicked_element = $( this );

			// Native Function do not need to run wp_media_modal_action,
			// However, currently nest-row is the only action that requires that
			// it isn't run
			if ( native_menu_options.indexOf( $clicked_element.data( 'action' ) ) === -1 ) {
				self.$boldgrid_menu_action_clicked = $clicked_element.closest(
					'.draggable-tools-imhwpb' ).next()[0];

				self.wp_media_modal_action( event, $clicked_element );
			}

			self.$master_container.trigger( self.boldgrid_modify_event );
		}
	};

	/**
	 * Every time that we open the media modal this action should occur
	 */
	this.wp_media_modal_action = function( event, $clicked_element ) {
		event.preventDefault();
		$clicked_element.closest( '.popover-menu-imhwpb' ).addClass('hidden');
		self.window_mouse_leave();
	};

	/**
	 * Handle the user typing
	 */
	this.typing_events = {
		'start' : function () {
			//Remove Popovers
			self.delete_popovers();
		},
		'end' : function () {
			//Add Popovers
			self.update_handles(self.last_hover);
		}
	};

	/**
	 * Event that resize the width of a column
	 */
	this.resize_event_map = {

		/**
		 * This event is active while the user is moving their mouse with
		 * 'mouseup'
		 */
		'mousemove.draggable' : function( event, $element ) {
			if ( ! self.resize ) {
				var position_x = self.pageX;
				var border_hover = false;
				if ( typeof event != 'undefined' && event != null ) {
					position_x = event.originalEvent.clientX;
					$element = $( this );
					border_hover = self.get_border_mouse_location( $element, position_x );
				}
				if ( border_hover && (border_hover.left || border_hover.right) ) {
					$element.addClass( 'resizing-imhwpb' );

					if ( self.ie_version && tinymce ) {
						tinymce.activeEditor.getBody().setAttribute( 'contenteditable', false );
						tinymce.activeEditor.boldgridResize = true;
					}
				} else {
					$element.removeClass( 'resizing-imhwpb' );

					if ( self.ie_version && tinymce ) {
						tinymce.activeEditor.getBody().setAttribute( 'contenteditable', true );
						tinymce.activeEditor.boldgridResize = false;
					}
				}
			}

			// If for some reason drag is still active, remove it.
			if ( self.$current_drag ) {
				self.drag_handlers.end( event );
			}
		},
		/**
		 * The event is activates the resize process
		 */
		'mousedown.draggable' : function( event ) {
			// If they user clicked on drag handle, return
			$target = $( event.target );
			if ( $target.closest( '.draggable-tools-imhwpb' ).length ) {
				return;
			}

			var $element = $( this );
			var border_hover = self.get_border_mouse_location( $element,
				event.originalEvent.clientX );
			var $sibling = null;

			if ( border_hover.left ) {
				$sibling = $element.prevAll( self.column_selectors_string ).first();
				// Add borders before and after
				$element.addClass( 'resize-border-left-imhwpb' );
			} else if ( border_hover.right ) {
				$sibling = $element.nextAll( self.column_selectors_string ).first();
				// Add borders before and after
				$element.addClass( 'resize-border-right-imhwpb' );
			}

			if ( border_hover.left || border_hover.right ) {
				if ( $sibling.length ) {
					$sibling.addClass( "content-border-imhwpb" );
				}

				self.$master_container.addClass( 'resizing-imhwpb' );
				self.$master_container.find( '.resizing-imhwpb' ).removeClass( 'resizing-imhwpb' );
				self.remove_all_popovers();
				var $container = self.$master_container.find( 'body' );

				if ( !$container.length ) {
					$container = self.$master_container;
				}

				self.$master_container.trigger( self.resize_start_event );
				$container.addClass( 'no-select-imhwpb' );

				self.resize = {
					'element' : $element,
					'sibling' : $sibling,
					'left' : border_hover.left,
					'right' : border_hover.right,
				};
			}
		},
	};

	return this;
};