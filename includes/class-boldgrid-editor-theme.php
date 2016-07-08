<?php
/**
 * Class: Boldgrid_Editor
 *
 * Gather more information about a theme so that we know how to display the editor tools.
 *
 * @since      1.2
 * @package    Boldgrid_Editor
 * @subpackage Boldgrid_Editor_Version
 * @author     BoldGrid <support@boldgrid.com>
 * @link       https://boldgrid.com
 */

/**
 * Class: Boldgrid_Editor_Theme
 *
 * Gather more information about a theme so that we know how to display the editor tools.
 *
 * @since      1.2
 */
class Boldgrid_Editor_Theme {

	/**
	 * Returns the name of a theme if and only if the theme is a boldgrid theme
	 *
	 * @param WP_Theme $wp_theme
	 * @return string
	 */
	public static function get_boldgrid_theme_name( $wp_theme ) {
		$current_boldgrid_theme = '';

		$current_theme = $wp_theme;

		if ( is_a( $current_theme, 'WP_Theme' ) &&
			strpos( $current_theme->get( 'TextDomain' ), 'boldgrid' ) !== false ) {
				$current_boldgrid_theme = $current_theme->get( 'Name' );
			}

			return $current_boldgrid_theme;
	}

	/**
	 * Get the correct theme body class
	 *
	 * @param int $_REQUEST['post']
	 *
	 * @return string
	 */
	public static function theme_body_class() {
		$post_id = ! empty( $_REQUEST['post'] ) ? intval( $_REQUEST['post'] ) : null;

		$stylesheet = get_stylesheet();

		$staging_theme_stylesheet = get_option( 'boldgrid_staging_stylesheet' );

		if ( $staging_theme_stylesheet ) {
			$staged_theme = wp_get_theme( $staging_theme_stylesheet );

			$post_status = get_post_status( $post_id );

			if ( 'staging' == $post_status && is_object( $staged_theme ) ) {
				$stylesheet = $staging_theme_stylesheet;
			}
		}

		//$this->theme_stylesheet = $stylesheet;

		$theme_mods = get_option( 'theme_mods_' . $stylesheet );

		$boldgrid_palette_class = ! empty( $theme_mods['boldgrid_palette_class'] ) ? $theme_mods['boldgrid_palette_class'] : 'palette-primary';

		return ( $boldgrid_palette_class ? $boldgrid_palette_class : $stylzr_palette_class );
	}


	/**
	 * Check to see if we are editing a boldgrid theme page
	 * Keeping in mind that if this is a staged page it will be using the staged theme.
	 * If the staged theme is not a Boldgrid theme, and this is a staged page return false
	 *
	 * @return boolean
	 */
	public static function is_editing_boldgrid_theme() {
		$post_id = ! empty( $_REQUEST['post'] ) ? intval( $_REQUEST['post'] ) : null;

		$is_editing_boldgrid_theme = ( bool ) self::get_boldgrid_theme_name( wp_get_theme() );

		if ( $post_id ) {
			$post_status = get_post_status( $post_id );

			$staging_theme_stylesheet = get_option( 'boldgrid_staging_stylesheet' );

			$staged_theme = wp_get_theme( $staging_theme_stylesheet );

			if ( 'staging' == $post_status && is_object( $staged_theme ) ) {
				$is_editing_boldgrid_theme = ( bool ) self::get_boldgrid_theme_name( $staged_theme );
			}
		}

		/**
		 * Allow other theme developers to indicate that they would like all BG edit tools enabled.
		 *
		 * @since 1.0.9
		 *
		 * @param boolean $is_editing_boldgrid_theme Whether or not the user is editing a BG theme.
		 */
		$is_editing_boldgrid_theme = apply_filters( 'is_editing_boldgrid_theme', $is_editing_boldgrid_theme );

		return $is_editing_boldgrid_theme;
	}

}