<?php
/**
 * @package Modern Editor
 * @version 1.0.0
 */
/*
Plugin Name: Modern Editor
Plugin URI: https://www.typop.net/modern_editor
Description: Modern user interface for edit screens of posts and pages.
Author: Typop
Version: 1.0.0
Author URI: https://www.typop.net
*/

add_action('init','moder_editor_change_editor', 1);

function moder_editor_change_editor() {

	// gutenberg buraya kaydederken de düşüyor
	// hem sayfa açılırken hem de kaydederken teyallaam

	$request_body = file_get_contents('php://input');
	$postbody = json_decode($request_body, true);
	$post_id = $postbody["id"];

	// new post or edit post
	if (strpos($_SERVER['SCRIPT_NAME'], '/wp-admin/post.php') !== false || strpos($_SERVER['SCRIPT_NAME'], '/wp-admin/post-new.php') !== false || isset($post_id)) {

		if (!isset($_GET['post_type'])) {
			// gutenmorgın
			if (isset($_GET["post"])) {
				$type = get_post_type(sanitize_key($_GET["post"]));
				
				// acf için devre dışı bıraktım
				// çok sorun çıkardı
				if ($type == "acf-field-group") {
					return;
				}
			}
			// edit
			else if (strpos($_SERVER['SCRIPT_NAME'], '/wp-admin/post.php')) {
				$post_id = sanitize_key($_GET['post']) ? sanitize_key($_GET['post']) : sanitize_key($_POST['post_ID']);
				$post = get_post($post_id);
				$type = get_post_type($post);
			}
			// new post ise
			else {
				$type = "post";
			}
		}
		else {
		
			$type = sanitize_key($_GET['post_type']);
		}

		$options = get_option( 'modern_editor_settings' );
		//add_filter('use_block_editor_for_post', '__return_true');
		if (isset($options[$type]) && $options[$type] == "Modern") {
			add_filter('use_block_editor_for_post', '__return_false');
			wp_register_script( 'mui', plugins_url('mui/mui.js'), array('jquery'), '1.0' );
			wp_enqueue_script('mui');
			
			wp_register_style('mui', plugins_url('mui/mui.css'));
			wp_enqueue_style('mui');
		}
		else if (isset($options[$type]) && $options[$type] == "Classic") {
			add_filter('use_block_editor_for_post', '__return_false');
		}
		else if (isset($options[$type]) && $options[$type] == "Gutenberg") {
			//$arrgs = get_post_type_object("movie"); // get the post type to modify
			//$arrgs->supports = array("title", 'editor', "author");
			//$arrgs->supports = array("author", "title", "revisions");
			//$arrgs->show_in_rest = true;
			add_post_type_support('movie', 'author');
			add_post_type_support('movie', 'editor');
			add_filter('use_block_editor_for_post', '__return_true');
		}

		if (has_blocks($post)) { }
	}
}

add_action( 'admin_menu', 'modern_editor_add_admin_menu' );
add_action( 'admin_init', 'modern_editor_settings_init' );

function modern_editor_add_admin_menu( ) {
	add_options_page(
		'Modern Editor',
		'Modern Editor',
		'manage_options',
		'modern_editor',
		'modern_editor_options_page'
	);
}

function modern_editor_settings_init(  ) {
	register_setting( 'pluginPage', 'modern_editor_settings' );

	add_settings_section(
		'modern_editor_pluginPage_section',
		__( 'Tick post types you want to enable modern editor on', 'modern_editor' ),
		'modern_editor_settings_section_callback',
		'pluginPage'
	);

	add_settings_field(
		'modern_editor_radio_field_0',
		__( '', 'modern_editor' ),
		'modern_editor_radio_field_0_render',
		'pluginPage',
		'modern_editor_pluginPage_section'
	);


}


function modern_editor_radio_field_0_render(  ) {

	$options = get_option( 'modern_editor_settings' );
	$editors = array("Modern");
	$postTypes = array("post", "page");

	$args = array(
		'public'   => true,
		'_builtin' => false,
	);

	$output = 'names'; // names or objects, note names is the default
	$operator = 'and'; // 'and' or 'or'
	$post_types = get_post_types( $args, $output, $operator );
	foreach ( $post_types  as $post_type ) {
		array_push($postTypes, $post_type);
	}

	foreach ( $postTypes  as $post_type ) {
		echo "<b style='width: 100px; display: inline-block; text-transform: capitalize'>" . esc_attr($post_type) . "</b>";
		foreach ($editors as $value) {

			if (isset($options[$post_type]) && $value == "Modern") {
				$setDefault = "checked";
			}
			else {
				unset($setDefault);
			}

			?>
				<input id="<?php echo esc_attr($post_type.$value) ?>" type='checkbox' name='modern_editor_settings[<?php echo esc_attr($post_type); ?>]' <?php if (isset($setDefault)) { echo esc_attr("checked"); }  ?> value='<?php echo esc_attr($value) ?>'>
				<label for="<?php echo esc_attr($post_type.$value) ?>"><!--<?php echo esc_attr($value) ?>--></label>
			<?php
		}
		echo "<hr>";
	}

	?>
	<style>
		.form-table td,
		.form-table th {
			display: block;
    		padding: 0px;
			width: fit-content;
		}
		hr {
			border-top: 1px solid rgba(0,0,0,.2);
			border-bottom: none;
		}
		input[type=radio] {
			vertical-align: sub;
    		margin-left: 30px!important;
		}
	</style>
	<?php


}


function modern_editor_settings_section_callback(  ) {

	//echo __( 'Your editor preferences per post type', 'modern_editor' );

}


function modern_editor_options_page(  ) {
		?>
		<form action='options.php' method='post'>

			<h1>Modern Editor</h1>

			<?php
			settings_fields( 'pluginPage' );
			do_settings_sections( 'pluginPage' );
			submit_button();
			?>

		</form>
		<?php

}

?>