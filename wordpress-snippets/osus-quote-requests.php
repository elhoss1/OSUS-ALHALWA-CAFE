<?php
/**
 * Mini Osus wholesale quote requests for WooCommerce / Code Snippets.
 * Paste this code into Code Snippets WITHOUT the opening <?php line, then activate site-wide.
 * REST endpoint: /wp-json/osus/v1/quotes
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Set the exact public origin of the Angular storefront here.
 * Add the production custom domain too if the storefront uses one.
 */
function osus_quote_allowed_origins() {
    return apply_filters( 'osus_quote_allowed_origins', array(
        'https://miniosussalhalwa.vercel.app',
    ) );
}

/** Let WordPress REST add CORS headers only for the configured storefront origin. */
function osus_quote_register_allowed_origins( $origins ) {
    return array_values( array_unique( array_merge( $origins, osus_quote_allowed_origins() ) ) );
}
add_filter( 'allowed_http_origins', 'osus_quote_register_allowed_origins' );

/** Register a private post type, visible in the WordPress admin sidebar. */
function osus_register_quote_request_type() {
    register_post_type( 'osus_quote_request', array(
        'labels' => array(
            'name'               => 'طلبات عرض السعر',
            'singular_name'      => 'طلب عرض سعر',
            'menu_name'          => 'طلبات عرض السعر',
            'add_new'            => 'إضافة طلب',
            'add_new_item'       => 'إضافة طلب عرض سعر',
            'edit_item'          => 'تفاصيل طلب عرض السعر',
            'new_item'           => 'طلب عرض سعر جديد',
            'view_item'          => 'عرض طلب عرض السعر',
            'search_items'       => 'البحث في طلبات عرض السعر',
            'not_found'          => 'لا توجد طلبات عرض سعر بعد',
            'not_found_in_trash' => 'لا توجد طلبات في سلة المهملات',
        ),
        'public'              => false,
        'publicly_queryable'  => false,
        'exclude_from_search' => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'show_in_rest'        => false,
        'menu_position'       => 3,
        'menu_icon'           => 'dashicons-clipboard',
        'supports'            => array( 'title', 'editor' ),
        'capability_type'     => 'post',
        'map_meta_cap'        => true,
    ) );
}
add_action( 'init', 'osus_register_quote_request_type' );

/** Keep Products directly below Dashboard and quote requests immediately after it. */
function osus_quote_admin_custom_menu_order_enabled() {
    return true;
}
add_filter( 'custom_menu_order', 'osus_quote_admin_custom_menu_order_enabled' );

function osus_quote_admin_menu_order( $menu_order ) {
    $priority_slugs = array(
        'index.php',
        'edit.php?post_type=product',
        'edit.php?post_type=osus_quote_request',
    );
    $ordered = array();
    foreach ( $priority_slugs as $slug ) {
        if ( in_array( $slug, $menu_order, true ) ) {
            $ordered[] = $slug;
        }
    }
    foreach ( $menu_order as $slug ) {
        if ( ! in_array( $slug, $priority_slugs, true ) ) {
            $ordered[] = $slug;
        }
    }
    return $ordered;
}
add_filter( 'menu_order', 'osus_quote_admin_menu_order' );

/** Add a details panel for customer contact and product line items. */
function osus_quote_add_meta_box() {
    add_meta_box(
        'osus_quote_request_details',
        'بيانات المنشأة والأصناف المطلوبة',
        'osus_quote_render_meta_box',
        'osus_quote_request',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes_osus_quote_request', 'osus_quote_add_meta_box' );

function osus_quote_render_meta_box( $post ) {
    $fields = array(
        'business_name'    => 'اسم المنشأة',
        'contact_name'     => 'مسؤول المشتريات',
        'phone'            => 'رقم الجوال',
        'city'             => 'مدينة التوريد',
        'supply_frequency' => 'دورية التوريد',
        'reference'        => 'رقم الطلب',
        'created_at'       => 'وقت استلام الطلب',
    );

    echo '<table class="widefat striped" style="margin-bottom:16px"><tbody>';
    foreach ( $fields as $key => $label ) {
        $value = get_post_meta( $post->ID, '_osus_quote_' . $key, true );
        echo '<tr><th style="width:190px">' . esc_html( $label ) . '</th><td>' . esc_html( $value ? $value : '—' ) . '</td></tr>';
    }
    $notes = get_post_meta( $post->ID, '_osus_quote_notes', true );
    echo '<tr><th>ملاحظات العميل</th><td>' . nl2br( esc_html( $notes ? $notes : '—' ) ) . '</td></tr>';
    echo '</tbody></table>';

    $items = get_post_meta( $post->ID, '_osus_quote_items', true );
    echo '<h3>الأصناف والكميات</h3>';
    if ( ! is_array( $items ) || empty( $items ) ) {
        echo '<p>لا توجد أصناف مسجلة.</p>';
        return;
    }
    echo '<table class="widefat striped"><thead><tr><th>الصنف</th><th>SKU</th><th>التصنيف</th><th>الخيارات / الحجم</th><th>الكمية</th></tr></thead><tbody>';
    foreach ( $items as $item ) {
        $options = isset( $item['selectedOptions'] ) && is_array( $item['selectedOptions'] ) ? $item['selectedOptions'] : array();
        $option_text = array();
        foreach ( $options as $name => $value ) {
            $option_text[] = sanitize_text_field( $name ) . ': ' . sanitize_text_field( $value );
        }
        $categories = isset( $item['categories'] ) && is_array( $item['categories'] ) ? implode( '، ', array_map( 'sanitize_text_field', $item['categories'] ) ) : '';
        echo '<tr>';
        echo '<td>' . esc_html( isset( $item['name'] ) ? $item['name'] : '' ) . ' <small>(ID: ' . esc_html( isset( $item['productId'] ) ? $item['productId'] : '' ) . ')</small></td>';
        echo '<td>' . esc_html( isset( $item['sku'] ) ? $item['sku'] : '' ) . '</td>';
        echo '<td>' . esc_html( $categories ) . '</td>';
        echo '<td>' . esc_html( implode( '، ', $option_text ) ) . '</td>';
        echo '<td>' . esc_html( isset( $item['quantity'] ) ? $item['quantity'] : '' ) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table>';
}

/** Add useful columns to the Requests list in wp-admin. */
function osus_quote_admin_columns( $columns ) {
    $result = array();
    foreach ( $columns as $key => $label ) {
        $result[ $key ] = $label;
        if ( 'title' === $key ) {
            $result['osus_quote_business'] = 'المنشأة';
            $result['osus_quote_phone']    = 'الجوال';
            $result['osus_quote_city']     = 'المدينة';
            $result['osus_quote_items']    = 'عدد الأصناف';
        }
    }
    return $result;
}
add_filter( 'manage_osus_quote_request_posts_columns', 'osus_quote_admin_columns' );

function osus_quote_admin_column_values( $column, $post_id ) {
    if ( 'osus_quote_business' === $column ) {
        echo esc_html( get_post_meta( $post_id, '_osus_quote_business_name', true ) );
    } elseif ( 'osus_quote_phone' === $column ) {
        echo esc_html( get_post_meta( $post_id, '_osus_quote_phone', true ) );
    } elseif ( 'osus_quote_city' === $column ) {
        echo esc_html( get_post_meta( $post_id, '_osus_quote_city', true ) );
    } elseif ( 'osus_quote_items' === $column ) {
        $items = get_post_meta( $post_id, '_osus_quote_items', true );
        echo esc_html( is_array( $items ) ? count( $items ) : 0 );
    }
}
add_action( 'manage_osus_quote_request_posts_custom_column', 'osus_quote_admin_column_values', 10, 2 );

/** Validate, rate-limit and save a storefront quote request. */
function osus_quote_create_request( WP_REST_Request $request ) {
    $ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
    $rate_key = 'osus_quote_rate_' . hash( 'sha256', $ip );
    $attempts = (int) get_transient( $rate_key );
    if ( $attempts >= 8 ) {
        return new WP_Error( 'osus_quote_rate_limited', 'محاولات كثيرة. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.', array( 'status' => 429 ) );
    }
    set_transient( $rate_key, $attempts + 1, 10 * MINUTE_IN_SECONDS );

    $data     = $request->get_json_params();
    $customer = isset( $data['customer'] ) && is_array( $data['customer'] ) ? $data['customer'] : array();
    $items    = isset( $data['items'] ) && is_array( $data['items'] ) ? $data['items'] : array();

    $business = sanitize_text_field( isset( $customer['businessName'] ) ? $customer['businessName'] : '' );
    $contact  = sanitize_text_field( isset( $customer['contactName'] ) ? $customer['contactName'] : '' );
    $phone    = sanitize_text_field( isset( $customer['phone'] ) ? $customer['phone'] : '' );
    $city     = sanitize_text_field( isset( $customer['city'] ) ? $customer['city'] : '' );
    $frequency = sanitize_text_field( isset( $customer['supplyFrequency'] ) ? $customer['supplyFrequency'] : '' );
    $notes    = sanitize_textarea_field( isset( $customer['notes'] ) ? $customer['notes'] : '' );
    $consent  = ! empty( $data['privacyConsent'] );

    $phone_digits = preg_replace( '/\D+/', '', $phone );
    if ( '' === $business || '' === $contact || strlen( $phone_digits ) < 8 || strlen( $phone_digits ) > 15 ) {
        return new WP_Error( 'osus_quote_invalid_customer', 'يرجى إدخال اسم المنشأة واسم مسؤول المشتريات ورقم جوال صحيح.', array( 'status' => 400 ) );
    }
    if ( ! $consent ) {
        return new WP_Error( 'osus_quote_consent_required', 'الموافقة على استخدام بيانات التواصل لمتابعة الطلب مطلوبة.', array( 'status' => 400 ) );
    }
    if ( empty( $items ) || count( $items ) > 50 ) {
        return new WP_Error( 'osus_quote_invalid_items', 'يجب أن يحتوي الطلب على صنف واحد على الأقل، وبحد أقصى 50 صنفًا.', array( 'status' => 400 ) );
    }

    $clean_items = array();
    foreach ( $items as $item ) {
        if ( ! is_array( $item ) ) {
            continue;
        }
        $product_id = absint( isset( $item['productId'] ) ? $item['productId'] : 0 );
        $name       = sanitize_text_field( isset( $item['name'] ) ? $item['name'] : '' );
        $quantity   = absint( isset( $item['quantity'] ) ? $item['quantity'] : 0 );
        if ( ! $product_id || '' === $name || $quantity < 1 || $quantity > 100000 ) {
            return new WP_Error( 'osus_quote_invalid_item', 'توجد بيانات صنف أو كمية غير صالحة.', array( 'status' => 400 ) );
        }
        $categories = isset( $item['categories'] ) && is_array( $item['categories'] ) ? array_map( 'sanitize_text_field', array_slice( $item['categories'], 0, 10 ) ) : array();
        $options = array();
        if ( isset( $item['selectedOptions'] ) && is_array( $item['selectedOptions'] ) ) {
            foreach ( array_slice( $item['selectedOptions'], 0, 10, true ) as $key => $value ) {
                $options[ sanitize_text_field( $key ) ] = sanitize_text_field( $value );
            }
        }
        $clean_items[] = array(
            'productId'      => $product_id,
            'sku'            => sanitize_text_field( isset( $item['sku'] ) ? $item['sku'] : '' ),
            'name'           => $name,
            'categories'     => $categories,
            'selectedOptions'=> $options,
            'quantity'       => $quantity,
        );
    }
    if ( empty( $clean_items ) ) {
        return new WP_Error( 'osus_quote_invalid_items', 'لم يتم العثور على أصناف صالحة في الطلب.', array( 'status' => 400 ) );
    }

    $reference = 'MS-' . gmdate( 'Ymd' ) . '-' . strtoupper( wp_generate_password( 6, false, false ) );
    $post_id = wp_insert_post( array(
        'post_type'    => 'osus_quote_request',
        'post_status'  => 'private',
        'post_title'   => $reference . ' — ' . $business,
        'post_content' => 'طلب توريد مستلم من واجهة ميني أسس. راجع بيانات المنشأة والأصناف في لوحة التفاصيل أدناه.',
    ), true );
    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'osus_quote_save_failed', 'تعذر حفظ الطلب. يرجى المحاولة مرة أخرى.', array( 'status' => 500 ) );
    }

    $meta = array(
        'reference'        => $reference,
        'business_name'    => $business,
        'contact_name'     => $contact,
        'phone'            => $phone,
        'city'             => $city,
        'supply_frequency' => $frequency,
        'notes'            => $notes,
        'items'            => $clean_items,
        'created_at'       => current_time( 'mysql' ),
        'consent'          => 'yes',
    );
    foreach ( $meta as $key => $value ) {
        update_post_meta( $post_id, '_osus_quote_' . $key, $value );
    }

    return new WP_REST_Response( array(
        'success'   => true,
        'reference' => $reference,
        'message'   => 'تم استلام طلب عرض السعر.',
    ), 201 );
}

function osus_quote_register_rest_route() {
    register_rest_route( 'osus/v1', '/quotes', array(
        'methods'             => array( 'GET', 'POST' ),
        'callback'            => 'osus_quote_route_handler',
        'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'osus_quote_register_rest_route' );

/** A harmless health check: GET confirms the snippet and REST route are active. */
function osus_quote_route_handler( WP_REST_Request $request ) {
    if ( 'GET' === $request->get_method() ) {
        return new WP_REST_Response( array(
            'active'   => true,
            'service'  => 'osus-quote-requests',
            'message'  => 'نقطة استقبال طلبات التوريد تعمل.',
        ), 200 );
    }
    return osus_quote_create_request( $request );
}
