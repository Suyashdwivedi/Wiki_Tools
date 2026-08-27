/**
 * Templ-a-lot-Everything — Bulk template inserter/remover for
 * MediaWiki FILE pages AND ARTICLE pages, in a single script.
 *
 * Handles mixed batches (a category or search result containing both
 * files and articles together) without ambiguity: each selected page's
 * namespace is read back from the API when its wikitext is fetched, and
 * the insert position is resolved PER ITEM — not guessed once for the
 * whole page. "Auto" position (the default) means: files get inserted
 * before Licensing, articles get inserted before Categories. You can
 * still force a specific position for everything if you want.
 *
 * Supported pages:
 *  - Category pages        (gallery/gallerybox layout for files,
 *                            plain #mw-pages links for articles/subcats)
 *  - Special:ListFiles     (table layout, files only)
 *  - Special:Search        (results can be files or articles — detected
 *                            per item)
 *  - Recursive category scan (walk a category + all its subcategories and
 *                            auto-select every article/file found — no
 *                            manual list-building needed)
 *  - Paste-list mode       (fallback: paste any list of titles, files or
 *                            articles, mixed freely — e.g. from a
 *                            maintenance page or external tool)
 *
 * Features:
 *  - Compact floating panel (bottom-right), draggable, position remembered
 *  - Click thumbnails / table rows / article links to select pages
 *  - SELECT ALL / DESELECT ALL
 *  - Recursive category + subcategory scan with depth/type controls and
 *    safety caps against huge or cyclic category trees
 *  - Paste-list mode for arbitrary title lists (fallback)
 *  - INSERT template in bulk  → skips pages that already have it
 *  - REMOVE template in bulk  → skips pages that don't have it
 *  - Insert position: Auto (recommended) / top / before-licensing /
 *    before-see-also / before-references / before-categories / bottom
 *  - Parallel processing (concurrency configurable)
 *  - Per-page status badges after run
 *  - Summary report, REVERT last batch
 *  - Green flash + sound cue when batch finishes
 *
 *   Install — add to Special:MyPage/common.js or global.js:
 *   mw.loader.load( 'https://commons.wikimedia.org/w/index.php?title=User:Suyash.dwivedi/userscripts/Templ-a-lot-Everything.js&action=raw&ctype=text/javascript' );
 *
 * @author   Suyash.dwivedi (original Templ-a-lot for Commons files),
 *           "Everything" edition combining the articles fork back into one script
 * @version  2.0.0 (Everything edition, based on Templ-a-lot 1.5.0 + articles fork 1.0.0)
 * @license  MIT
 */

/* global mw, $ */
( function () {
    'use strict';

    // ── Preferences (override via window.talEverythingPrefs) ───────────────────
    var prefs = $.extend( {
        position:      'auto',   // 'auto' resolves per item: file → before-licensing, article → before-categories
        minor:         true,
        watchlist:     'nochange',
        concurrency:   2,
        summary:       'Bulk template edit via Templ-a-lot-Everything',
        scanMaxDepth:      6,     // safety cap on subcategory recursion depth
        scanMaxCategories: 300,   // safety cap on how many categories get walked in one scan
        scanMaxMembers:    2000   // safety cap on total pages collected in one scan
    }, window.talEverythingPrefs || {} );

    // ── Page detection ────────────────────────────────────────────────────────
    var ns          = mw.config.get( 'wgNamespaceNumber' );
    var specialPage = mw.config.get( 'wgCanonicalSpecialPageName' ) || '';
    var isCategoryPage = ( ns === 14 );
    var isListFiles     = ( specialPage === 'Listfiles' );
    var isSearch         = ( specialPage === 'Search' );
    // On Commons, batches are overwhelmingly files — default the scan to
    // Files checked instead of Articles. Anywhere else, default to Articles.
    var isCommons = ( mw.config.get( 'wgServerName' ) === 'commons.wikimedia.org' );
    // Paste-list mode works everywhere, so we don't gate script load on page type,
    // same reasoning as the articles fork.

    // ── State ─────────────────────────────────────────────────────────────────
    var selectedPages = {};   // title -> true
    var revertData    = {};   // title -> old wikitext
    var lastAction    = null;
    var lastTemplate  = '';

    var FILE_NS = 6; // canonical File: namespace id, same across all MediaWiki wikis

    // ── Position persistence (localStorage) ─────────────────────────────────
    var POS_KEY = 'talm-panel-position-v1';

    function loadSavedPos() {
        try {
            var raw = window.localStorage.getItem( POS_KEY );
            if ( !raw ) { return null; }
            var pos = JSON.parse( raw );
            if ( typeof pos.top === 'number' && typeof pos.left === 'number' ) {
                return pos;
            }
        } catch ( e ) { /* ignore corrupt/missing storage */ }
        return null;
    }

    function saveSavedPos( top, left ) {
        try {
            window.localStorage.setItem( POS_KEY, JSON.stringify( { top: top, left: left } ) );
        } catch ( e ) { /* storage unavailable — fail silently */ }
    }

    function clamp( val, min, max ) {
        return Math.max( min, Math.min( max, val ) );
    }

    // ── CSS ───────────────────────────────────────────────────────────────────
    mw.util.addCSS( [
        '#talm-panel{',
            'position:fixed;bottom:90px;right:6px;z-index:9990;',
            'width:250px;',
            'background:#1b1d1f;color:#e8e8e8;',
            'border-radius:8px;',
            'box-shadow:0 6px 24px rgba(0,0,0,.65);',
            'font-family:"Linux Libertine",Georgia,serif;font-size:12px;',
            'transition:box-shadow .3s;',
        '}',
        '@keyframes talm-flash{',
            '0%{box-shadow:0 0 0 0 rgba(46,200,100,.0);}',
            '30%{box-shadow:0 0 0 10px rgba(46,200,100,.55);}',
            '70%{box-shadow:0 0 0 14px rgba(46,200,100,.25);}',
            '100%{box-shadow:0 6px 24px rgba(0,0,0,.65);}',
        '}',
        '#talm-panel.talm-done{animation:talm-flash .9s ease forwards;}',
        '#talm-panel.talm-collapsed #talm-body{display:none;}',
        '#talm-panel.talm-collapsed{width:auto;min-width:0;}',
        '#talm-panel.talm-dragging{transition:none !important;box-shadow:0 10px 32px rgba(0,0,0,.8) !important;}',
        '#talm-panel.talm-dragging,#talm-panel.talm-dragging *{user-select:none !important;}',

        '#talm-header{',
            'background:#2e6ca4;padding:5px 10px;cursor:grab;',
            'display:flex;align-items:center;justify-content:space-between;gap:8px;',
            'border-radius:8px 8px 0 0;user-select:none;white-space:nowrap;',
            'transition:background .2s;touch-action:none;',
        '}',
        '#talm-header:active{cursor:grabbing;}',
        '#talm-panel.talm-done #talm-header{background:#1e7a45;}',
        '#talm-header:hover{background:#3a7ec0;}',
        '#talm-header h3{margin:0;font-size:12px;font-weight:700;letter-spacing:.03em;color:#fff;white-space:nowrap;}',
        '#talm-header .talm-caret{font-size:10px;color:#acd4f5;margin-left:4px;}',

        '#talm-author{font-size:9px;color:#5a8ebc;text-align:center;padding:1px 10px 0;background:#1b1d1f;white-space:nowrap;}',
        '#talm-author a{color:#5a8ebc;}',
        '#talm-body{padding:8px 10px;}',

        '#talm-template-input{',
            'width:100%;box-sizing:border-box;padding:4px 7px;',
            'background:#252729;border:1px solid #3d4043;border-radius:4px;',
            'color:#e8e8e8;font-size:11px;margin-bottom:6px;',
        '}',
        '#talm-template-input:focus{outline:none;border-color:#2e6ca4;}',

        '#talm-position-row{display:flex;gap:4px;margin-bottom:2px;align-items:center;}',
        '#talm-position-row label{font-size:9px;color:#888;white-space:nowrap;}',
        '#talm-position-row select{flex:1;padding:3px 5px;background:#252729;border:1px solid #3d4043;border-radius:3px;color:#e8e8e8;font-size:10px;}',
        '#talm-position-hint{font-size:9px;color:#666;margin-bottom:6px;line-height:1.3;}',

        '#talm-select-row{display:flex;gap:4px;margin-bottom:5px;}',
        '.talm-sel-btn{flex:1;padding:3px;background:#252729;border:1px solid #3d4043;border-radius:3px;color:#aaa;font-size:10px;cursor:pointer;}',
        '.talm-sel-btn:hover{background:#2e2e2e;color:#fff;}',

        '#talm-scan-row{margin-bottom:6px;padding:6px;background:#202224;border:1px solid #2e3134;border-radius:5px;}',
        '#talm-scan-row label{font-size:9px;color:#888;white-space:nowrap;}',
        '#talm-scan-cat-input{width:100%;box-sizing:border-box;padding:3px 6px;margin:3px 0 4px;',
            'background:#252729;border:1px solid #3d4043;border-radius:3px;color:#e8e8e8;font-size:10px;}',
        '#talm-scan-opts{display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap;}',
        '#talm-scan-opts label{display:flex;align-items:center;gap:2px;font-size:9px;color:#aaa;}',
        '#talm-scan-depth{width:36px;padding:2px;background:#252729;border:1px solid #3d4043;border-radius:3px;color:#e8e8e8;font-size:10px;}',
        '#talm-scan-btn{width:100%;padding:4px;background:#2e6ca4;border:none;border-radius:3px;color:#fff;font-size:10px;font-weight:700;cursor:pointer;}',
        '#talm-scan-btn:hover{filter:brightness(1.15);}',
        '#talm-scan-btn:disabled{opacity:.5;cursor:not-allowed;}',
        '#talm-scan-status{font-size:9px;color:#7ec87e;margin-top:4px;min-height:11px;}',
        '#talm-scan-results{display:none;max-height:90px;overflow-y:auto;margin-top:4px;',
            'border-top:1px solid #2a2c2e;padding-top:4px;}',
        '.talm-scan-item{font-size:10px;padding:1px 0;display:flex;align-items:center;gap:4px;cursor:pointer;}',
        '.talm-scan-item input{margin:0;}',
        '.talm-scan-item .talm-scan-ns{font-size:8px;color:#666;}',

        '#talm-pastelist-row{margin-bottom:5px;}',
        '#talm-pastelist-btn{width:100%;padding:3px;background:#252729;border:1px dashed #3d4043;border-radius:3px;color:#8ab4d0;font-size:10px;cursor:pointer;}',
        '#talm-pastelist-btn:hover{background:#2e2e2e;}',
        '#talm-pastelist-box{width:100%;box-sizing:border-box;height:60px;margin-top:4px;',
            'background:#252729;border:1px solid #3d4043;border-radius:4px;color:#e8e8e8;',
            'font-size:10px;padding:4px;display:none;}',
        '#talm-pastelist-apply{width:100%;margin-top:4px;padding:3px;background:#2e6ca4;border:none;',
            'border-radius:3px;color:#fff;font-size:10px;cursor:pointer;display:none;}',

        '#talm-counter{font-size:10px;color:#8ab4d0;margin-bottom:6px;}',

        '#talm-btn-row{display:flex;gap:5px;margin-bottom:6px;}',
        '.talm-btn{flex:1;padding:5px 0;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;}',
        '.talm-btn:hover{filter:brightness(1.15);}',
        '.talm-btn:disabled{opacity:.4;cursor:not-allowed;}',
        '#talm-btn-add{background:#2a7d4f;color:#fff;}',
        '#talm-btn-rem{background:#9e3535;color:#fff;}',
        '#talm-btn-revert{width:100%;background:#3a3a3a;color:#ccc;flex:unset;margin-bottom:6px;}',

        '#talm-done-banner{',
            'display:none;text-align:center;font-size:13px;font-weight:700;',
            'color:#7ee8a2;padding:4px 0 2px;letter-spacing:.04em;',
        '}',

        '#talm-progress{font-size:10px;color:#7ec87e;min-height:12px;margin-bottom:2px;}',
        '#talm-report{font-size:10px;border-top:1px solid #2a2c2e;padding-top:6px;max-height:110px;overflow-y:auto;}',
        '#talm-report div{padding:1px 0;line-height:1.4;word-break:break-word;}',
        '.talm-ok{color:#7ec87e;}.talm-skip{color:#d4a800;}.talm-err{color:#d05050;}',

        /* Gallery thumbnails (files) */
        '.talm-thumb-wrap{position:relative !important;cursor:pointer;}',
        '.talm-thumb-wrap .talm-check{position:absolute;top:4px;left:4px;width:16px;height:16px;background:rgba(0,0,0,.5);border:2px solid #999;border-radius:3px;z-index:10;}',
        '.talm-thumb-wrap.talm-selected .talm-check{background:#2e6ca4;border-color:#6ab0e8;}',
        '.talm-thumb-wrap.talm-selected .talm-check::after{content:"✓";color:#fff;font-size:11px;line-height:16px;display:block;text-align:center;}',
        '.talm-status-badge{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:9px;font-weight:700;padding:1px 0;z-index:10;}',
        '.talm-status-added{background:rgba(42,125,79,.85);color:#fff;}',
        '.talm-status-removed{background:rgba(158,53,53,.85);color:#fff;}',
        '.talm-status-skipped{background:rgba(160,130,0,.85);color:#fff;}',
        '.talm-status-error{background:rgba(90,20,20,.85);color:#f88;}',

        /* ListFiles rows (files) */
        'tr.talm-row-selected>td{background:#1e3a5a !important;}',
        'td.talm-cell-check{width:24px;text-align:center;vertical-align:middle;cursor:pointer;user-select:none;font-size:14px;color:#888;}',
        'tr.talm-row-selected td.talm-cell-check{color:#6ab0e8;}',
        'td.talm-cell-status{font-size:10px;font-weight:700;white-space:nowrap;}',
        'td.talm-ok{color:#2a7d4f;}td.talm-skip{color:#a07800;}td.talm-err{color:#9e3535;}',

        /* Plain links (articles / subcats on category pages, search results) */
        '.talm-link-wrap{padding:0 2px;border-radius:2px;}',
        '.talm-link-wrap.talm-selected{background:#2e6ca4;color:#fff !important;}',
        '.talm-link-check{display:inline-block;width:15px;text-align:center;cursor:pointer;',
            'color:#8ab4d0;margin-right:3px;user-select:none;font-size:12px;vertical-align:middle;}',
        '.talm-link-check:hover{color:#fff;}',
        '.talm-status-inline{font-size:9px;font-weight:700;margin-left:4px;}',
        '.talm-status-added .talm-status-inline{color:#7ec87e;}',
        '.talm-status-removed .talm-status-inline{color:#f88;}',
        '.talm-status-skipped .talm-status-inline{color:#d4a800;}',
        '.talm-status-error .talm-status-inline{color:#d05050;}'
    ].join( '' ) );

    // ── Build panel ───────────────────────────────────────────────────────────
    var $panel = $( [
        '<div id="talm-panel" class="talm-collapsed">',
            '<div id="talm-header">',
                '<h3>📋 Templ-a-lot</h3>',
                '<span class="talm-caret">▲</span>',
            '</div>',
            '<div id="talm-author">',
                'Everything edition',
            '</div>',
            '<div id="talm-body">',
                '<input id="talm-template-input" type="text"',
                '       placeholder="Template name (e.g. Delete)" />',
                '<div id="talm-position-row">',
                    '<label>Insert&nbsp;at:</label>',
                    '<select id="talm-position-sel">',
                        '<option value="auto" selected>Auto (recommended)</option>',
                        '<option value="top">Top of page</option>',
                        '<option value="before-licensing">Before Licensing (files)</option>',
                        '<option value="before-see-also">Before See also (articles)</option>',
                        '<option value="before-references">Before References (articles)</option>',
                        '<option value="before-categories">Before categories</option>',
                        '<option value="bottom">Bottom of page</option>',
                    '</select>',
                '</div>',
                '<div id="talm-position-hint">Auto: files → before Licensing, articles → before categories.</div>',
                '<div id="talm-select-row">',
                    '<button class="talm-sel-btn" id="talm-sel-all">✔ All</button>',
                    '<button class="talm-sel-btn" id="talm-sel-none">✘ None</button>',
                '</div>',
                '<div id="talm-scan-row">',
                    '<label>🔁 Scan a category + all its subcats:</label>',
                    '<input id="talm-scan-cat-input" type="text" placeholder="Category:Example" />',
                    '<div id="talm-scan-opts">',
                        '<label><input type="checkbox" id="talm-scan-inc-articles"' + ( isCommons ? '' : ' checked' ) + ' /> Articles</label>',
                        '<label><input type="checkbox" id="talm-scan-inc-files"' + ( isCommons ? ' checked' : '' ) + ' /> Files</label>',
                        '<label>Depth <input type="number" id="talm-scan-depth" value="1" min="0" max="' + prefs.scanMaxDepth + '" /></label>',
                    '</div>',
                    '<div id="talm-scan-btn-row" style="display:flex;gap:5px;">',
                        '<button id="talm-scan-btn" style="flex:1">Scan &amp; select</button>',
                        '<button id="talm-scan-stop-btn" style="display:none;flex:0 0 auto;padding:4px 8px;background:#9e3535;border:none;border-radius:3px;color:#fff;font-size:10px;font-weight:700;cursor:pointer;">⏹ Stop</button>',
                    '</div>',
                    '<div id="talm-scan-status"></div>',
                    '<div id="talm-scan-results"></div>',
                '</div>',
                '<div id="talm-pastelist-row">',
                    '<button id="talm-pastelist-btn">＋ Or paste a list of titles manually</button>',
                    '<textarea id="talm-pastelist-box" placeholder="One title per line, e.g.&#10;File:Example.jpg&#10;Some Article"></textarea>',
                    '<button id="talm-pastelist-apply">Use this list</button>',
                '</div>',
                '<div id="talm-counter">0 pages selected</div>',
                '<div id="talm-btn-row">',
                    '<button class="talm-btn" id="talm-btn-add">＋ Add</button>',
                    '<button class="talm-btn" id="talm-btn-rem">－ Remove</button>',
                '</div>',
                '<button class="talm-btn" id="talm-btn-revert"',
                '        style="display:none">↩ Revert last batch</button>',
                '<div id="talm-done-banner"></div>',
                '<div id="talm-progress"></div>',
                '<div id="talm-report"></div>',
            '</div>',
        '</div>'
    ].join( '' ) );

    $( document.body ).append( $panel );

    // ── Restore saved position ─────────────────────────────────────────────
    function applyPos( top, left ) {
        var rect = $panel[0].getBoundingClientRect();
        var w = rect.width  || 250;
        var h = rect.height || 40;
        top  = clamp( top,  0, Math.max( 0, window.innerHeight - h ) );
        left = clamp( left, 0, Math.max( 0, window.innerWidth  - w ) );
        $panel.css( { top: top + 'px', left: left + 'px', bottom: 'auto', right: 'auto' } );
        return { top: top, left: left };
    }

    ( function restorePosition() {
        var saved = loadSavedPos();
        if ( saved ) { applyPos( saved.top, saved.left ); }
    }() );

    $( window ).on( 'resize', function () {
        var saved = loadSavedPos();
        if ( saved ) { applyPos( saved.top, saved.left ); }
    } );

    // ── Drag handling ─────────────────────────────────────────────────────────
    ( function initDrag() {
        var header = $( '#talm-header' )[0];
        var dragging = false;
        var moved    = false;
        var pointerId = null;
        var startX, startY, startTop, startLeft;
        var DRAG_THRESHOLD = 5;

        function onPointerDown( e ) {
            if ( e.button !== undefined && e.button !== 0 ) { return; }
            dragging  = true;
            moved     = false;
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            var rect = $panel[0].getBoundingClientRect();
            startTop  = rect.top;
            startLeft = rect.left;
            try { header.setPointerCapture( pointerId ); } catch ( err ) { /* ignore */ }
            e.preventDefault();
        }

        function onPointerMove( e ) {
            if ( !dragging || e.pointerId !== pointerId ) { return; }
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            if ( !moved && ( Math.abs( dx ) > DRAG_THRESHOLD || Math.abs( dy ) > DRAG_THRESHOLD ) ) {
                moved = true;
                $panel.addClass( 'talm-dragging' );
            }
            if ( moved ) {
                applyPos( startTop + dy, startLeft + dx );
                e.preventDefault();
            }
        }

        function onPointerUp( e ) {
            if ( !dragging || e.pointerId !== pointerId ) { return; }
            dragging = false;
            try { header.releasePointerCapture( pointerId ); } catch ( err ) { /* ignore */ }
            if ( moved ) {
                $panel.removeClass( 'talm-dragging' );
                var rect = $panel[0].getBoundingClientRect();
                saveSavedPos( rect.top, rect.left );
            }
            $panel.data( 'talm-just-dragged', moved );
            pointerId = null;
        }

        header.addEventListener( 'pointerdown', onPointerDown );
        header.addEventListener( 'pointermove', onPointerMove );
        header.addEventListener( 'pointerup',   onPointerUp );
        header.addEventListener( 'pointercancel', onPointerUp );
    }() );

    // ── Collapse / expand ─────────────────────────────────────────────────────
    $( '#talm-header' ).on( 'click', function () {
        if ( $panel.data( 'talm-just-dragged' ) ) {
            $panel.data( 'talm-just-dragged', false );
            return;
        }
        $panel.toggleClass( 'talm-collapsed' );
        var col = $panel.hasClass( 'talm-collapsed' );
        $( '#talm-header .talm-caret' ).text( col ? '▲' : '▼' );
        if ( !col ) { wrapItems(); }
    } );

    // ── Selection ─────────────────────────────────────────────────────────────
    // $chk (when present) is the small select-checkbox rendered next to a plain
    // article/search-result link — kept visually in sync but click-handled
    // separately from the link itself, so the underlying <a> always navigates
    // normally and is never hijacked.
    function toggleSelect( title, $galleryEl, $tr, $linkEl, $chk ) {
        if ( selectedPages[ title ] ) {
            delete selectedPages[ title ];
            if ( $galleryEl ) { $galleryEl.removeClass( 'talm-selected' ); }
            if ( $linkEl )    { $linkEl.removeClass( 'talm-selected' ); }
            if ( $chk )       { $chk.text( '☐' ); }
            if ( $tr ) {
                $tr.removeClass( 'talm-row-selected' );
                $tr.find( '.talm-cell-check' ).text( '☐' );
            }
        } else {
            selectedPages[ title ] = true;
            if ( $galleryEl ) { $galleryEl.addClass( 'talm-selected' ); }
            if ( $linkEl )    { $linkEl.addClass( 'talm-selected' ); }
            if ( $chk )       { $chk.text( '☑' ); }
            if ( $tr ) {
                $tr.addClass( 'talm-row-selected' );
                $tr.find( '.talm-cell-check' ).text( '☑' );
            }
        }
        updateCounter();
    }

    function updateCounter() {
        var n = Object.keys( selectedPages ).length;
        $( '#talm-counter' ).text( n + ' page' + ( n !== 1 ? 's' : '' ) + ' selected' );
    }

    // ── Wrap gallery (files: category / search) ────────────────────────────────
    function wrapGalleryBoxes() {
        $( '.gallerybox' ).each( function () {
            var $box = $( this );
            if ( $box.data( 'talm-wrapped' ) ) { return; }
            $box.data( 'talm-wrapped', true );
            var title = $box.find( '.gallerytext a' ).first().attr( 'title' ) || '';
            if ( !title ) { return; }
            var $thumb = $box.find( '.thumb' );
            $thumb.css( 'position', 'relative' ).addClass( 'talm-thumb-wrap' );
            $thumb.data( 'talm-title', title );
            $thumb.prepend( '<span class="talm-check"></span>' );
            $thumb.on( 'click', function ( e ) {
                e.preventDefault();
                toggleSelect( title, $thumb, null, null );
            } );
        } );
    }

    // ── Wrap ListFiles rows (files) ──────────────────────────────────────────
    function wrapListFilesRows() {
        var $table = $( 'table.tablesorter, table.wikitable, #mw-content-text table' ).first();
        if ( !$table.length ) { return; }
        if ( !$table.data( 'talm-hdr' ) ) {
            $table.data( 'talm-hdr', true );
            $table.find( 'tr' ).first()
                .prepend( '<th style="width:26px;text-align:center">☑</th>' )
                .append( '<th>Status</th>' );
        }
        $table.find( 'tr:gt(0)' ).each( function () {
            var $tr = $( this );
            if ( $tr.data( 'talm-wrapped' ) ) { return; }
            var $link = $tr.find( 'a[title^="File:"]' ).first();
            if ( !$link.length ) { return; }
            var title = $link.attr( 'title' );
            $tr.data( 'talm-wrapped', true ).data( 'talm-title', title ).addClass( 'talm-row' );
            var $chk = $( '<td class="talm-cell-check">☐</td>' );
            $tr.prepend( $chk ).append( '<td class="talm-cell-status"></td>' );
            $chk.on( 'click', function () { toggleSelect( title, null, $tr, null ); } );
            $tr.find( 'td' ).eq( 3 ).css( 'cursor', 'pointer' )
               .on( 'click', function () { toggleSelect( title, null, $tr, null ); } );
        } );
    }

    // ── Wrap plain article/subcat links (category pages) ────────────────────────
    // Only links NOT already inside a .gallerybox — those are handled by
    // wrapGalleryBoxes() above, so a mixed category doesn't double-wrap files.
    // A small checkbox is inserted BEFORE the link to handle selection — the
    // link itself is left completely untouched so it still navigates normally
    // on click, exactly like any other link on the page.
    function wrapCategoryArticleLinks() {
        $( '#mw-pages a[title]' ).each( function () {
            var $a = $( this );
            if ( $a.data( 'talm-wrapped' ) ) { return; }
            if ( $a.closest( '.gallerybox' ).length ) { return; } // handled elsewhere
            $a.data( 'talm-wrapped', true );
            var title = $a.attr( 'title' );
            if ( !title ) { return; }
            $a.addClass( 'talm-link-wrap' ).data( 'talm-title', title );
            var $chk = $( '<span class="talm-link-check" title="Select for bulk template">☐</span>' );
            $a.data( 'talm-chk', $chk );
            $a.before( $chk );
            $chk.on( 'click', function ( e ) {
                e.preventDefault();
                e.stopPropagation();
                toggleSelect( title, null, null, $a, $chk );
            } );
        } );
    }

    // ── Wrap search result links (files or articles — resolved per item later) ──
    // Same checkbox-before-the-link approach — clicking the result title still
    // opens the page; the checkbox is the only thing that selects it.
    function wrapSearchResultLinks() {
        $( '.mw-search-result-heading a[title]' ).each( function () {
            var $a = $( this );
            if ( $a.data( 'talm-wrapped' ) ) { return; }
            $a.data( 'talm-wrapped', true );
            var title = $a.attr( 'title' );
            if ( !title ) { return; }
            $a.addClass( 'talm-link-wrap' ).data( 'talm-title', title );
            var $chk = $( '<span class="talm-link-check" title="Select for bulk template">☐</span>' );
            $a.data( 'talm-chk', $chk );
            $a.before( $chk );
            $chk.on( 'click', function ( e ) {
                e.preventDefault();
                e.stopPropagation();
                toggleSelect( title, null, null, $a, $chk );
            } );
        } );
    }

    function wrapItems() {
        if ( isCategoryPage ) { wrapGalleryBoxes(); wrapCategoryArticleLinks(); }
        if ( isListFiles )    { wrapListFilesRows(); }
        if ( isSearch )       { wrapGalleryBoxes(); wrapSearchResultLinks(); }
    }

    // ── Select / deselect all ─────────────────────────────────────────────────
    $( '#talm-sel-all' ).on( 'click', function () {
        $( '.talm-thumb-wrap' ).each( function () {
            var t = $( this ).data( 'talm-title' );
            if ( t ) { selectedPages[ t ] = true; $( this ).addClass( 'talm-selected' ); }
        } );
        $( 'tr.talm-row' ).each( function () {
            var t = $( this ).data( 'talm-title' );
            if ( t ) {
                selectedPages[ t ] = true;
                $( this ).addClass( 'talm-row-selected' ).find( '.talm-cell-check' ).text( '☑' );
            }
        } );
        $( '.talm-link-wrap' ).each( function () {
            var t = $( this ).data( 'talm-title' );
            if ( t ) {
                selectedPages[ t ] = true;
                $( this ).addClass( 'talm-selected' );
                var $c = $( this ).data( 'talm-chk' );
                if ( $c ) { $c.text( '☑' ); }
            }
        } );
        updateCounter();
    } );

    $( '#talm-sel-none' ).on( 'click', function () {
        selectedPages = {};
        $( '.talm-thumb-wrap' ).removeClass( 'talm-selected' );
        $( 'tr.talm-row' ).removeClass( 'talm-row-selected' ).find( '.talm-cell-check' ).text( '☐' );
        $( '.talm-link-wrap' ).each( function () {
            $( this ).removeClass( 'talm-selected' );
            var $c = $( this ).data( 'talm-chk' );
            if ( $c ) { $c.text( '☐' ); }
        } );
        updateCounter();
    } );

    // ── Paste-list mode ───────────────────────────────────────────────────────
    $( '#talm-pastelist-btn' ).on( 'click', function () {
        $( '#talm-pastelist-box, #talm-pastelist-apply' ).toggle();
    } );

    $( '#talm-pastelist-apply' ).on( 'click', function () {
        var raw = $( '#talm-pastelist-box' ).val() || '';
        var lines = raw.split( '\n' )
            .map( function ( l ) { return $.trim( l ); } )
            .filter( function ( l ) { return l.length > 0; } );
        if ( !lines.length ) { alert( 'Paste at least one page title.' ); return; }
        lines.forEach( function ( t ) { selectedPages[ t ] = true; } );
        updateCounter();
        $( '#talm-pastelist-box, #talm-pastelist-apply' ).hide();
    } );

    // ── Recursive category scan ─────────────────────────────────────────────────
    // Walks a category and its subcategories (breadth-first) and collects
    // member pages, classified as file/article/subcat by their namespace —
    // no manual list-building required. Replaces paste-list for the common
    // "everything under this category tree" case.

    // Pre-fill the scan box with the category being viewed, if any.
    ( function prefillScanCategory() {
        if ( isCategoryPage ) {
            var pageName = mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
            $( '#talm-scan-cat-input' ).val( pageName );
        }
    }() );

    function fetchAllCategoryMembers( catTitle ) {
        var collected = [];
        function fetchPage( cmcontinue ) {
            var params = {
                action: 'query', list: 'categorymembers',
                cmtitle: catTitle, cmlimit: 500, cmprop: 'title|ns',
                format: 'json', formatversion: 2
            };
            if ( cmcontinue ) { params.cmcontinue = cmcontinue; }
            return new mw.Api().get( params ).then( function ( data ) {
                var members = ( data.query && data.query.categorymembers ) || [];
                collected = collected.concat( members );
                if ( data.continue && data.continue.cmcontinue ) {
                    return fetchPage( data.continue.cmcontinue );
                }
                return collected;
            } );
        }
        return fetchPage( null );
    }

    /**
     * Breadth-first walk starting at rootCat. Stops recursing a branch once
     * maxDepth is reached, and stops the whole scan once scanMaxCategories
     * categories have been walked or scanMaxMembers pages have been collected
     * — cheap safety nets against huge or cyclic category trees.
     *
     * `control` is a plain object the caller keeps a reference to; setting
     * control.cancelled = true from outside (e.g. a Stop button) makes the
     * scan wrap up on its next step and return whatever it found so far,
     * same as hitting one of the safety caps.
     */
    function scanCategoryRecursive( rootCat, maxDepth, includeArticles, includeFiles, onProgress, control ) {
        var visited      = {};
        var articles      = {};
        var files          = {};
        var queue           = [ { title: rootCat, depth: 0 } ];
        var categoriesWalked = 0;
        var hitCap             = null;

        function memberCount() {
            return Object.keys( articles ).length + Object.keys( files ).length;
        }

        function step() {
            if ( control && control.cancelled ) { hitCap = 'cancelled'; }

            if ( !queue.length || hitCap ) {
                return $.Deferred().resolve( {
                    articles: Object.keys( articles ),
                    files: Object.keys( files ),
                    categoriesWalked: categoriesWalked,
                    hitCap: hitCap
                } ).promise();
            }

            var item = queue.shift();
            if ( visited[ item.title ] ) { return step(); }
            visited[ item.title ] = true;
            categoriesWalked++;

            if ( onProgress ) {
                onProgress( item.title, item.depth, categoriesWalked, memberCount() );
            }

            if ( categoriesWalked > prefs.scanMaxCategories ) {
                hitCap = 'categories';
                return step();
            }

            return fetchAllCategoryMembers( item.title ).then( function ( members ) {
                for ( var i = 0; i < members.length; i++ ) {
                    var m = members[ i ];
                    if ( m.ns === 14 ) {
                        if ( item.depth < maxDepth ) {
                            queue.push( { title: m.title, depth: item.depth + 1 } );
                        }
                    } else if ( m.ns === FILE_NS ) {
                        if ( includeFiles ) { files[ m.title ] = true; }
                    } else {
                        if ( includeArticles ) { articles[ m.title ] = true; }
                    }
                    if ( memberCount() >= prefs.scanMaxMembers ) {
                        hitCap = 'members';
                        break;
                    }
                }
                return step();
            } );
        }

        return step();
    }

    function renderScanResults( titles ) {
        var $box = $( '#talm-scan-results' ).empty().show();
        titles.forEach( function ( t ) {
            var isFile = /^File:/i.test( t );
            var $row = $(
                '<label class="talm-scan-item">' +
                    '<input type="checkbox" checked />' +
                    '<span>' + mw.html.escape( t ) + '</span>' +
                    '<span class="talm-scan-ns">' + ( isFile ? '(file)' : '(article)' ) + '</span>' +
                '</label>'
            );
            $row.find( 'input' ).on( 'change', function () {
                if ( this.checked ) { selectedPages[ t ] = true; }
                else { delete selectedPages[ t ]; }
                updateCounter();
            } );
            $box.append( $row );
        } );
    }

    var activeScanControl = null; // set while a scan is running, so Stop can reach it

    $( '#talm-scan-btn' ).on( 'click', function () {
        var catInput = $.trim( $( '#talm-scan-cat-input' ).val() );
        if ( !catInput ) { alert( 'Enter a category to scan (e.g. Category:Example).' ); return; }
        if ( !/^category:/i.test( catInput ) ) { catInput = 'Category:' + catInput; }

        var depth           = clamp( parseInt( $( '#talm-scan-depth' ).val(), 10 ) || 0, 0, prefs.scanMaxDepth );
        var includeArticles = $( '#talm-scan-inc-articles' ).is( ':checked' );
        var includeFiles     = $( '#talm-scan-inc-files' ).is( ':checked' );

        if ( !includeArticles && !includeFiles ) {
            alert( 'Select at least one of Articles / Files to include.' );
            return;
        }

        var $btn      = $( '#talm-scan-btn' );
        var $stopBtn  = $( '#talm-scan-stop-btn' );
        var $status   = $( '#talm-scan-status' );
        $btn.prop( 'disabled', true );
        $stopBtn.show().prop( 'disabled', false ).text( '⏹ Stop' );
        $( '#talm-scan-results' ).hide().empty();
        $status.text( 'Scanning ' + catInput + ' …' );

        activeScanControl = { cancelled: false };

        scanCategoryRecursive( catInput, depth, includeArticles, includeFiles, function ( curCat, curDepth, catsWalked, found ) {
            $status.text( 'Scanning… depth ' + curDepth + ', ' + catsWalked + ' categor' +
                ( catsWalked === 1 ? 'y' : 'ies' ) + ' checked, ' + found + ' pages found so far' );
        }, activeScanControl ).then( function ( result ) {
            $btn.prop( 'disabled', false );
            $stopBtn.hide();
            activeScanControl = null;
            var all = result.files.concat( result.articles );

            if ( !all.length ) {
                $status.text( result.hitCap === 'cancelled'
                    ? '⏹ Stopped — no pages had been found yet.'
                    : '⚠ No matching pages found under ' + catInput + '.' );
                return;
            }

            all.forEach( function ( t ) { selectedPages[ t ] = true; } );
            updateCounter();
            renderScanResults( all );

            var msg = '✔ Found ' + all.length + ' page' + ( all.length !== 1 ? 's' : '' ) +
                ' across ' + result.categoriesWalked + ' categor' +
                ( result.categoriesWalked === 1 ? 'y' : 'ies' ) + ' — all selected.';
            if ( result.hitCap === 'cancelled' ) {
                msg = '⏹ Stopped early — ' + msg.replace( /^✔ /, '' );
            } else if ( result.hitCap === 'categories' ) {
                msg += ' ⚠ Stopped early: hit the ' + prefs.scanMaxCategories + '-category safety limit.';
            } else if ( result.hitCap === 'members' ) {
                msg += ' ⚠ Stopped early: hit the ' + prefs.scanMaxMembers + '-page safety limit.';
            }
            $status.text( msg );
        } ).catch( function ( err ) {
            $btn.prop( 'disabled', false );
            $stopBtn.hide();
            activeScanControl = null;
            $status.text( '✘ Scan failed: ' + err );
        } );
    } );

    $( '#talm-scan-stop-btn' ).on( 'click', function () {
        if ( activeScanControl ) {
            activeScanControl.cancelled = true;
            $( this ).prop( 'disabled', true ).text( 'Stopping…' );
        }
    } );

    // ── Template helpers ──────────────────────────────────────────────────────
    function normaliseTemplate( name ) {
        return $.trim( name )
            .replace( /^\{\{/, '' ).replace( /\}\}$/, '' )
            .replace( /^[Tt]emplate:/, '' );
    }

    function buildTemplateRegex( name ) {
        var esc = name.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
        return new RegExp(
            '\\{\\{\\s*[' + esc[0].toUpperCase() + esc[0].toLowerCase() + ']' +
            esc.slice(1) + '\\s*(\\|[^}]*)?\\}\\}', 'g'
        );
    }

    function hasTemplate( text, name ) {
        return buildTemplateRegex( name ).test( text );
    }

    function findHeadingLine( lines, keyword ) {
        var re = new RegExp( '^={2,}\\s*' + keyword + '\\s*={2,}\\s*$', 'i' );
        for ( var i = 0; i < lines.length; i++ ) {
            if ( re.test( lines[i] ) ) { return i; }
        }
        return -1;
    }

    /**
     * insertTemplate — resolves the EFFECTIVE position per item.
     *
     * pos === 'auto': files (itemNs === FILE_NS) → 'before-licensing',
     *                 everything else            → 'before-categories'.
     * Any other pos value is used literally for every item, with the
     * same safe fallback-to-bottom behaviour as before if the relevant
     * heading/section isn't found on that particular page.
     */
    function insertTemplate( text, tpl, pos, itemNs ) {
        var effectivePos = pos;
        if ( pos === 'auto' ) {
            effectivePos = ( itemNs === FILE_NS ) ? 'before-licensing' : 'before-categories';
        }

        if ( effectivePos === 'top' ) {
            return tpl + '\n' + text;
        }

        if ( effectivePos === 'before-licensing' ) {
            var lines1 = text.split( '\n' );
            var licLineRe = /^={2,}\s*\{\{\s*int:license-header\s*\}\}\s*={2,}\s*$/i;
            for ( var i = 0; i < lines1.length; i++ ) {
                if ( licLineRe.test( lines1[i] ) ) {
                    lines1.splice( i, 0, tpl );
                    return lines1.join( '\n' );
                }
            }
            return text + '\n' + tpl;
        }

        if ( effectivePos === 'before-see-also' || effectivePos === 'before-references' ) {
            var lines2 = text.split( '\n' );
            var keyword = ( effectivePos === 'before-see-also' ) ? 'See also' : 'References';
            var idx = findHeadingLine( lines2, keyword );
            if ( idx !== -1 ) {
                lines2.splice( idx, 0, tpl );
                return lines2.join( '\n' );
            }
            return text + '\n' + tpl;
        }

        if ( effectivePos === 'before-categories' ) {
            var catIdx = text.search( /\[\[Category:/i );
            return catIdx === -1
                ? text + '\n' + tpl
                : text.slice( 0, catIdx ) + tpl + '\n' + text.slice( catIdx );
        }

        // bottom (default fallback)
        return text + '\n' + tpl;
    }

    function removeTemplate( text, name ) {
        return $.trim(
            text.replace( buildTemplateRegex( name ), '' )
                .replace( /\n{3,}/g, '\n\n' )
        );
    }

    // ── API ───────────────────────────────────────────────────────────────────
    // Now also returns the page's namespace id (rev.ns), needed to resolve
    // 'auto' position per item.
    function getWikitext( title ) {
        return new mw.Api().get( {
            action: 'query', titles: title,
            prop: 'revisions', rvprop: 'content|ids',
            rvslots: 'main', formatversion: 2
        } ).then( function ( data ) {
            var page = data.query.pages[0];
            if ( page.missing ) { return { text: '', revid: 0, ns: page.ns, missing: true }; }
            var slot = page.revisions[0].slots.main;
            return { text: slot.content, revid: page.revisions[0].revid, ns: page.ns, missing: false };
        } );
    }

    function saveWikitext( title, text, summary, baserevid ) {
        return new mw.Api().postWithToken( 'csrf', {
            action: 'edit', title: title, text: text, summary: summary,
            minor: prefs.minor ? 1 : undefined,
            watchlist: prefs.watchlist, baserevid: baserevid
        } );
    }

    // ── Per-page status display ───────────────────────────────────────────────
    function setStatus( title, cssClass, label ) {
        // Gallery thumbnails (files)
        $( '.talm-thumb-wrap' ).filter( function () {
            return $( this ).data( 'talm-title' ) === title;
        } ).each( function () {
            $( this ).find( '.talm-status-badge' ).remove();
            if ( label ) {
                $( this ).append(
                    '<span class="talm-status-badge ' + cssClass + '">' +
                    mw.html.escape( label ) + '</span>'
                );
            }
        } );
        // ListFiles rows
        $( 'tr.talm-row' ).filter( function () {
            return $( this ).data( 'talm-title' ) === title;
        } ).find( '.talm-cell-status' )
            .text( label )
            .attr( 'class', 'talm-cell-status ' +
                ( cssClass ? cssClass.replace( 'talm-status-', 'talm-' ) : '' ) );
        // Plain links (articles / subcats / search results)
        $( '.talm-link-wrap' ).filter( function () {
            return $( this ).data( 'talm-title' ) === title;
        } ).each( function () {
            $( this ).parent().find( '.talm-status-inline' ).remove();
            $( this ).removeClass( 'talm-status-added talm-status-removed talm-status-skipped talm-status-error' );
            if ( cssClass ) { $( this ).addClass( cssClass ); }
            if ( label ) {
                $( this ).after( '<span class="talm-status-inline">' + mw.html.escape( label ) + '</span>' );
            }
        } );
    }

    // ── "Done" visual flash ───────────────────────────────────────────────────
    function flashDone( counts ) {
        var msg = '✅ ' + counts.added + ' added · ' +
                  counts.removed + ' removed · ' +
                  counts.skipped + ' skipped' +
                  ( counts.errors ? ' · ⚠ ' + counts.errors + ' err' : '' );

        $( '#talm-done-banner' ).text( msg ).show();
        $panel.addClass( 'talm-done' );

        try {
            var ctx = new ( window.AudioContext || window.webkitAudioContext )();
            // Two short, separate notes (no continuous frequency glide, which
            // is what caused the droning/"bee" quality before) — a clean
            // ascending two-note chime instead.
            var notes = [ { freq: 660, start: 0,    dur: 0.12 },
                          { freq: 990, start: 0.11, dur: 0.22 } ];
            notes.forEach( function ( n ) {
                var osc  = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect( gain );
                gain.connect( ctx.destination );
                osc.type = 'triangle';
                osc.frequency.setValueAtTime( n.freq, ctx.currentTime + n.start );
                gain.gain.setValueAtTime( 0.0001, ctx.currentTime + n.start );
                gain.gain.exponentialRampToValueAtTime( 0.22, ctx.currentTime + n.start + 0.015 );
                gain.gain.exponentialRampToValueAtTime( 0.0001, ctx.currentTime + n.start + n.dur );
                osc.start( ctx.currentTime + n.start );
                osc.stop( ctx.currentTime + n.start + n.dur + 0.02 );
            } );
        } catch ( e ) { /* audio not available */ }

        setTimeout( function () {
            $panel.removeClass( 'talm-done' );
            setTimeout( function () {
                $( '#talm-header' ).css( 'background', '' );
                $( '#talm-done-banner' ).hide();
            }, 3000 );
        }, 900 );
    }

    // ── Parallel batch runner ─────────────────────────────────────────────────
    function runBatch( action ) {
        var tplName = normaliseTemplate( $( '#talm-template-input' ).val() );
        if ( !tplName ) { alert( 'Please enter a template name.' ); return; }

        var titles = Object.keys( selectedPages );
        if ( !titles.length ) { alert( 'No pages selected.' ); return; }

        var tplStr  = '{{' + tplName + '}}';
        var pos     = $( '#talm-position-sel' ).val();
        var summary = prefs.summary + ': ' + ( action === 'add' ? '+' : '−' ) + tplStr;

        $( '#talm-btn-add, #talm-btn-rem' ).prop( 'disabled', true );
        $( '#talm-btn-revert' ).hide();
        $( '#talm-done-banner' ).hide();
        $( '#talm-report' ).empty();
        revertData   = {};
        lastAction   = action;
        lastTemplate = tplName;

        var total    = titles.length;
        var done     = 0;
        var cursor   = 0;
        var active   = 0;
        var c        = { added: 0, removed: 0, skipped: 0, errors: 0 };
        var $prog    = $( '#talm-progress' );
        var $rep     = $( '#talm-report' );

        function log( cls, msg ) {
            $rep.append( '<div class="' + cls + '">' + mw.html.escape( msg ) + '</div>' );
            $rep.scrollTop( $rep[0].scrollHeight );
        }

        function updateProg() {
            $prog.text( done + ' / ' + total + ' processed' +
                ( active ? ' (' + active + ' running…)' : '' ) );
        }

        function oneDone() {
            done++;
            active--;
            updateProg();
            if ( done === total ) {
                finish();
            } else {
                dispatch();
            }
        }

        function processTitle( title ) {
            active++;
            updateProg();

            getWikitext( title ).then( function ( rev ) {
                if ( rev.missing ) {
                    c.errors++;
                    log( 'talm-err', '✘ ' + title + ' — page does not exist' );
                    setStatus( title, 'talm-status-error', '✘ missing' );
                    oneDone(); return;
                }

                var oldText = rev.text, newText;
                var sCls, sLbl, rCls, rMsg;

                if ( action === 'add' ) {
                    if ( hasTemplate( oldText, tplName ) ) {
                        c.skipped++;
                        sCls = 'talm-status-skipped'; sLbl = '⚠ exists';
                        rCls = 'talm-skip';
                        rMsg = '⚠ ' + title + ' — already has ' + tplStr + ', skipped';
                        log( rCls, rMsg ); setStatus( title, sCls, sLbl );
                        oneDone(); return;
                    }
                    newText = insertTemplate( oldText, tplStr, pos, rev.ns );
                } else {
                    if ( !hasTemplate( oldText, tplName ) ) {
                        c.skipped++;
                        sCls = 'talm-status-skipped'; sLbl = '⚠ absent';
                        rCls = 'talm-skip';
                        rMsg = '⚠ ' + title + ' — does not have ' + tplStr + ', skipped';
                        log( rCls, rMsg ); setStatus( title, sCls, sLbl );
                        oneDone(); return;
                    }
                    newText = removeTemplate( oldText, tplName );
                }

                revertData[ title ] = oldText;

                saveWikitext( title, newText, summary, rev.revid )
                    .then( function () {
                        if ( action === 'add' ) {
                            c.added++;
                            sCls = 'talm-status-added';   sLbl = '✔ added';
                            rCls = 'talm-ok';
                            rMsg = '✔ ' + title + ' — ' + tplStr + ' added';
                        } else {
                            c.removed++;
                            sCls = 'talm-status-removed'; sLbl = '✔ removed';
                            rCls = 'talm-ok';
                            rMsg = '✔ ' + title + ' — ' + tplStr + ' removed';
                        }
                    } )
                    .catch( function ( err ) {
                        c.errors++;
                        delete revertData[ title ];
                        sCls = 'talm-status-error'; sLbl = '✘ error';
                        rCls = 'talm-err';
                        rMsg = '✘ ' + title + ' — ' + ( err || 'error' );
                    } )
                    .always( function () {
                        log( rCls, rMsg ); setStatus( title, sCls, sLbl );
                        oneDone();
                    } );

            } ).catch( function ( err ) {
                c.errors++;
                log( 'talm-err', '✘ ' + title + ' — fetch failed: ' + err );
                oneDone();
            } );
        }

        function dispatch() {
            while ( active < prefs.concurrency && cursor < total ) {
                processTitle( titles[ cursor++ ] );
            }
        }

        function finish() {
            $( '#talm-btn-add, #talm-btn-rem' ).prop( 'disabled', false );
            if ( Object.keys( revertData ).length ) { $( '#talm-btn-revert' ).show(); }

            $prog.text( '✔ All done — ' + total + ' pages processed' );
            $rep.prepend(
                '<div style="font-weight:700;color:#acd4f5;border-bottom:1px solid #333;' +
                'padding-bottom:3px;margin-bottom:3px">' +
                mw.html.escape(
                    c.added   + ' added, ' +
                    c.removed + ' removed, ' +
                    c.skipped + ' skipped' +
                    ( c.errors ? ', ' + c.errors + ' error(s)' : '' )
                ) + '</div>'
            );

            flashDone( c );
        }

        updateProg();
        dispatch();
    }

    // ── Revert (parallel) ─────────────────────────────────────────────────────
    function revertBatch() {
        var titles = Object.keys( revertData );
        if ( !titles.length ) { return; }
        $( '#talm-btn-revert' ).prop( 'disabled', true );
        $( '#talm-report' ).empty();
        $( '#talm-done-banner' ).hide();

        var total   = titles.length;
        var done    = 0;
        var cursor  = 0;
        var active  = 0;
        var $prog   = $( '#talm-progress' );
        var $rep    = $( '#talm-report' );
        var tplStr  = '{{' + lastTemplate + '}}';
        var summary = prefs.summary + ': REVERT ' + ( lastAction === 'add' ? '+' : '−' ) + tplStr;

        function oneDone() {
            done++; active--;
            $prog.text( 'Reverting ' + done + '/' + total +
                ( active ? ' (' + active + ' running…)' : '' ) );
            if ( done === total ) {
                $prog.text( '↩ Revert complete.' );
                $( '#talm-btn-revert' ).hide().prop( 'disabled', false );
                revertData = {};
                flashDone( { added: 0, removed: 0, skipped: 0, errors: 0 } );
            } else { dispatch(); }
        }

        function revertTitle( title ) {
            active++;
            getWikitext( title )
                .then( function ( rev ) {
                    return saveWikitext( title, revertData[ title ], summary, rev.revid );
                } )
                .then( function () {
                    $rep.append( '<div class="talm-ok">↩ ' + mw.html.escape( title ) + '</div>' );
                    setStatus( title, '', '' );
                } )
                .catch( function () {
                    $rep.append( '<div class="talm-err">✘ Revert failed: ' +
                        mw.html.escape( title ) + '</div>' );
                } )
                .always( oneDone );
        }

        function dispatch() {
            while ( active < prefs.concurrency && cursor < total ) {
                revertTitle( titles[ cursor++ ] );
            }
        }

        $prog.text( 'Reverting 0/' + total );
        dispatch();
    }

    // ── Wire buttons ──────────────────────────────────────────────────────────
    $( '#talm-btn-add'    ).on( 'click', function () { runBatch( 'add' ); } );
    $( '#talm-btn-rem'    ).on( 'click', function () { runBatch( 'remove' ); } );
    $( '#talm-btn-revert' ).on( 'click', revertBatch );
    $( '#talm-template-input' ).on( 'keydown', function ( e ) {
        if ( e.key === 'Enter' ) { $( '#talm-btn-add' ).trigger( 'click' ); }
    } );

    mw.hook( 'wikipage.content' ).add( wrapItems );

}() );
