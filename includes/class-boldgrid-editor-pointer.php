<?php
/**
 * BoldGrid Source Code
 *
 * @package Boldgrid_Editor_Pointer
 * @copyright BoldGrid.com
 * @version $Id$
 * @author BoldGrid.com <wpb@boldgrid.com>
 *         @based upon this work: https://github.com/rawcreative/wp-help-pointers
 */
class Boldgrid_Editor_Pointer {
	public $screen_id;
	public $valid;
	public $pointers;
	public function __construct( $pntrs = array() ) {
		
		// Don't run on WP < 3.3
		if ( get_bloginfo( 'version' ) < '3.3' )
			return;
		
		if ( isset( $pntrs ) ) {
			$screen = get_current_screen();
			
			$this->screen_id = $screen->id;
			
			$this->register_pointers( $pntrs );
			
			add_action( 'admin_enqueue_scripts', array (
				&$this,
				'add_pointers' 
			), 1000 );
			
			add_action( 'admin_head', array (
				&$this,
				'add_scripts' 
			) );
		}
	}
	
	/**
	 * Register Pointers
	 *
	 * @param unknown $pntrs        	
	 */
	public function register_pointers( $pntrs ) {
		$pointers = array ();
		foreach ( $pntrs as $ptr ) {
			
			if ( $ptr['screen'] == $this->screen_id ) {
				$pointers[$ptr['id']] = array (
					'screen' => $ptr['screen'],
					'target' => $ptr['target'],
					'options' => array (
						'content' => sprintf( '<h3> %s </h3> <p> %s </p>', 
							__( $ptr['title'], 'plugindomain' ), 
							__( $ptr['content'], 'plugindomain' ) ),
						'position' => $ptr['position'] 
					) 
				);
			}
		}
		
		$this->pointers = $pointers;
	}
	
	/**
	 * Adds to the list of pointers
	 */
	public function add_pointers() {
		$pointers = $this->pointers;
		
		if ( empty( $pointers ) || ! is_array( $pointers ) ) {
			return;
		}
		
		// Get dismissed pointers
		$dismissed = explode( ',', 
			( string ) get_user_meta( get_current_user_id(), 'dismissed_wp_pointers', true ) );
		
		$valid_pointers = array ();
		
		// Check pointers and remove dismissed ones.
		foreach ( $pointers as $pointer_id => $pointer ) {
			
			// Make sure we have pointers & check if they have been dismissed
			if ( in_array( $pointer_id, $dismissed ) || empty( $pointer ) || empty( $pointer_id ) ||
				 empty( $pointer['target'] ) || empty( $pointer['options'] ) ) {
				continue;
			}
			
			$pointer['pointer_id'] = $pointer_id;
			
			// Add the pointer to $valid_pointers array
			$valid_pointers['pointers'][] = $pointer;
		}
		
		// No valid pointers? Stop here.
		if ( empty( $valid_pointers ) ) {
			return;
		}
		
		$this->valid = $valid_pointers;
		
		wp_enqueue_style( 'wp-pointer' );
		
		wp_enqueue_script( 'wp-pointer' );
	}
	
	/**
	 * Add scripts for pointers
	 */
	public function add_scripts() {
		$pointers = $this->valid;
		
		if ( empty( $pointers ) ) {
			return;
		}
		
		$pointers = json_encode( $pointers );
		
		?>
<script>
        jQuery(document).ready( function($) {
            var WPHelpPointer = <?php echo $pointers; ?>;
           
            $.each(WPHelpPointer.pointers, function(i) {
            	setTimeout( function () {
					wp_help_pointer_open(i);
				}, 2000);
            });

            function wp_help_pointer_open(i) {
                pointer = WPHelpPointer.pointers[i];
                options = $.extend( pointer.options, {
                    close: function() {
                        $.post( ajaxurl, {
                            pointer: pointer.pointer_id,
                            action: 'dismiss-wp-pointer'
                        });
                    }
                });
                $(pointer.target).pointer( options ).pointer('open');
            }
        });
</script>
<?php
	}
}
