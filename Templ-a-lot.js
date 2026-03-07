/**
 * Templ-a-lot — Bulk template inserter/remover for MediaWiki file pages
 *
 * Supported pages:
 *  - Category pages        (gallery / gallerybox layout)
 *  - Special:ListFiles     (table layout)
 *  - Special:Search results
 *
 * Features:
 *  - Compact floating panel (bottom-right, won't cover SDC / Cat-a-lot)
 *  - Click thumbnails or table checkboxes to select files
 *  - SELECT ALL / DESELECT ALL
 *  - INSERT template in bulk  → skips files that already have it (⚠ skipped)
 *  - REMOVE template in bulk  → skips files that don't have it  (⚠ skipped)
 *  - Insert position: top / before-licensing (default) / before-categories / bottom
 *  - Parallel processing (3 concurrent edits — much faster)
 *  - Per-file status badges after run
 *  - Summary report
 *  - Green flash + sound cue when batch finishes
 *  - REVERT last batch
 *
 * Install — add to Special:MyPage/common.js:
 *   importScript( 'User:Suyash.dwivedi/userscripts/Templ-a-lot.js' );
 *
 * @author   Suyash.dwivedi
 *           https://commons.wikimedia.org/wiki/User:Suyash.dwivedi
 * @source   //commons.wikimedia.org/w/index.php?title=User:Suyash.dwivedi/userscripts/Templ-a-lot.js
 * @version  1.3.0
 * @license  MIT
 */

/* global mw, $ */
( function () {
    'use strict';

    // ── Preferences (override via window.templALotPrefs) ──────────────────────
    var prefs = $.extend( {
        position:    'before-licensing',
        minor:       true,
        watchlist:   'nochange',
        concurrency: 3,   // how many edits run in parallel
        summary:     'Bulk template edit via [[User:Suyash.dwivedi/userscripts/Templ-a-lot.js|Templ-a-lot]]'
    }, window.templALotPrefs || {} );

    // ── Page detection ────────────────────────────────────────────────────────
    var ns          = mw.config.get( 'wgNamespaceNumber' );
    var specialPage = mw.config.get( 'wgCanonicalSpecialPageName' ) || '';
    var isCategoryPage = ( ns === 14 );
    var isListFiles    = ( specialPage === 'Listfiles' );
    var isSearch       = ( specialPage === 'Search' );
    if ( !isCategoryPage && !isListFiles && !isSearch ) { return; }

    // ── State ─────────────────────────────────────────────────────────────────
    var selectedPages = {};
    var revertData    = {};
    var lastAction    = null;
    var lastTemplate  = '';

    // ── CSS ───────────────────────────────────────────────────────────────────
    mw.util.addCSS( [
        '#tal-panel{',
            'position:fixed;bottom:90px;right:6px;z-index:9990;',
            'width:230px;',
            'background:#1b1d1f;color:#e8e8e8;',
            'border-radius:8px;',
            'box-shadow:0 6px 24px rgba(0,0,0,.65);',
            'font-family:"Linux Libertine",Georgia,serif;font-size:12px;',
            'transition:box-shadow .3s;',
        '}',
        /* Done flash animation */
        '@keyframes tal-flash{',
            '0%{box-shadow:0 0 0 0 rgba(46,200,100,.0);}',
            '30%{box-shadow:0 0 0 10px rgba(46,200,100,.55);}',
            '70%{box-shadow:0 0 0 14px rgba(46,200,100,.25);}',
            '100%{box-shadow:0 6px 24px rgba(0,0,0,.65);}',
        '}',
        '#tal-panel.tal-done{animation:tal-flash .9s ease forwards;}',
        '#tal-panel.tal-collapsed #tal-body{display:none;}',

        '#tal-header{',
            'background:#2e6ca4;padding:5px 10px;cursor:pointer;',
            'display:flex;align-items:center;justify-content:space-between;',
            'border-radius:8px 8px 0 0;user-select:none;',
            'transition:background .2s;',
        '}',
        '#tal-panel.tal-done #tal-header{background:#1e7a45;}',
        '#tal-header:hover{background:#3a7ec0;}',
        '#tal-header h3{margin:0;font-size:12px;font-weight:700;letter-spacing:.03em;color:#fff;}',
        '#tal-header .tal-caret{font-size:10px;color:#acd4f5;margin-left:4px;}',

        '#tal-author{font-size:9px;color:#5a8ebc;text-align:right;padding:1px 10px 0;background:#1b1d1f;}',
        '#tal-author a{color:#5a8ebc;}',
        '#tal-body{padding:8px 10px;}',

        '#tal-template-input{',
            'width:100%;box-sizing:border-box;padding:4px 7px;',
            'background:#252729;border:1px solid #3d4043;border-radius:4px;',
            'color:#e8e8e8;font-size:11px;margin-bottom:6px;',
        '}',
        '#tal-template-input:focus{outline:none;border-color:#2e6ca4;}',

        '#tal-position-row{display:flex;gap:4px;margin-bottom:6px;align-items:center;}',
        '#tal-position-row label{font-size:9px;color:#888;white-space:nowrap;}',
        '#tal-position-row select{flex:1;padding:3px 5px;background:#252729;border:1px solid #3d4043;border-radius:3px;color:#e8e8e8;font-size:10px;}',

        '#tal-select-row{display:flex;gap:4px;margin-bottom:5px;}',
        '.tal-sel-btn{flex:1;padding:3px;background:#252729;border:1px solid #3d4043;border-radius:3px;color:#aaa;font-size:10px;cursor:pointer;}',
        '.tal-sel-btn:hover{background:#2e2e2e;color:#fff;}',

        '#tal-counter{font-size:10px;color:#8ab4d0;margin-bottom:6px;}',

        '#tal-btn-row{display:flex;gap:5px;margin-bottom:6px;}',
        '.tal-btn{flex:1;padding:5px 0;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;}',
        '.tal-btn:hover{filter:brightness(1.15);}',
        '.tal-btn:disabled{opacity:.4;cursor:not-allowed;}',
        '#tal-btn-add{background:#2a7d4f;color:#fff;}',
        '#tal-btn-rem{background:#9e3535;color:#fff;}',
        '#tal-btn-revert{width:100%;background:#3a3a3a;color:#ccc;flex:unset;margin-bottom:6px;}',

        /* Done banner inside body */
        '#tal-done-banner{',
            'display:none;text-align:center;font-size:13px;font-weight:700;',
            'color:#7ee8a2;padding:4px 0 2px;letter-spacing:.04em;',
        '}',

        '#tal-progress{font-size:10px;color:#7ec87e;min-height:12px;margin-bottom:2px;}',
        '#tal-report{font-size:10px;border-top:1px solid #2a2c2e;padding-top:6px;max-height:110px;overflow-y:auto;}',
        '#tal-report div{padding:1px 0;line-height:1.4;word-break:break-word;}',
        '.tal-ok{color:#7ec87e;}.tal-skip{color:#d4a800;}.tal-err{color:#d05050;}',

        /* Gallery thumbnails */
        '.tal-thumb-wrap{position:relative !important;cursor:pointer;}',
        '.tal-thumb-wrap .tal-check{position:absolute;top:4px;left:4px;width:16px;height:16px;background:rgba(0,0,0,.5);border:2px solid #999;border-radius:3px;z-index:10;}',
        '.tal-thumb-wrap.tal-selected .tal-check{background:#2e6ca4;border-color:#6ab0e8;}',
        '.tal-thumb-wrap.tal-selected .tal-check::after{content:"✓";color:#fff;font-size:11px;line-height:16px;display:block;text-align:center;}',
        '.tal-status-badge{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:9px;font-weight:700;padding:1px 0;z-index:10;}',
        '.tal-status-added{background:rgba(42,125,79,.85);color:#fff;}',
        '.tal-status-removed{background:rgba(158,53,53,.85);color:#fff;}',
        '.tal-status-skipped{background:rgba(160,130,0,.85);color:#fff;}',
        '.tal-status-error{background:rgba(90,20,20,.85);color:#f88;}',

        /* ListFiles rows */
        'tr.tal-row-selected>td{background:#1e3a5a !important;}',
        'td.tal-cell-check{width:24px;text-align:center;vertical-align:middle;cursor:pointer;user-select:none;font-size:14px;color:#888;}',
        'tr.tal-row-selected td.tal-cell-check{color:#6ab0e8;}',
        'td.tal-cell-status{font-size:10px;font-weight:700;white-space:nowrap;}',
        'td.tal-ok{color:#2a7d4f;}td.tal-skip{color:#a07800;}td.tal-err{color:#9e3535;}'
    ].join( '' ) );

    // ── Build panel ───────────────────────────────────────────────────────────
    var $panel = $( [
        '<div id="tal-panel" class="tal-collapsed">',
            '<div id="tal-header">',
                '<h3>📋 Templ-a-lot</h3>',
                '<span class="tal-caret">▲</span>',
            '</div>',
            '<div id="tal-author">',
                'by <a href="https://commons.wikimedia.org/wiki/User:Suyash.dwivedi"',
                '   target="_blank">Suyash.dwivedi</a>',
            '</div>',
            '<div id="tal-body">',
                '<input id="tal-template-input" type="text"',
                '       placeholder="Template name (e.g. Delete)" />',
                '<div id="tal-position-row">',
                    '<label>Insert&nbsp;at:</label>',
                    '<select id="tal-position-sel">',
                        '<option value="top">Top of page</option>',
                        '<option value="before-licensing" selected>Before Licensing</option>',
                        '<option value="before-categories">Before categories</option>',
                        '<option value="bottom">Bottom of page</option>',
                    '</select>',
                '</div>',
                '<div id="tal-select-row">',
                    '<button class="tal-sel-btn" id="tal-sel-all">✔ All</button>',
                    '<button class="tal-sel-btn" id="tal-sel-none">✘ None</button>',
                '</div>',
                '<div id="tal-counter">0 files selected</div>',
                '<div id="tal-btn-row">',
                    '<button class="tal-btn" id="tal-btn-add">＋ Add</button>',
                    '<button class="tal-btn" id="tal-btn-rem">－ Remove</button>',
                '</div>',
                '<button class="tal-btn" id="tal-btn-revert"',
                '        style="display:none">↩ Revert last batch</button>',
                '<div id="tal-done-banner"></div>',
                '<div id="tal-progress"></div>',
                '<div id="tal-report"></div>',
            '</div>',
        '</div>'
    ].join( '' ) );

    $( document.body ).append( $panel );

    // ── Collapse / expand ─────────────────────────────────────────────────────
    $( '#tal-header' ).on( 'click', function () {
        $panel.toggleClass( 'tal-collapsed' );
        var col = $panel.hasClass( 'tal-collapsed' );
        $( '#tal-header .tal-caret' ).text( col ? '▲' : '▼' );
        if ( !col ) { wrapItems(); }
    } );

    // ── Selection ─────────────────────────────────────────────────────────────
    function toggleSelect( title, $galleryEl, $tr ) {
        if ( selectedPages[ title ] ) {
            delete selectedPages[ title ];
            if ( $galleryEl ) { $galleryEl.removeClass( 'tal-selected' ); }
            if ( $tr ) {
                $tr.removeClass( 'tal-row-selected' );
                $tr.find( '.tal-cell-check' ).text( '☐' );
            }
        } else {
            selectedPages[ title ] = true;
            if ( $galleryEl ) { $galleryEl.addClass( 'tal-selected' ); }
            if ( $tr ) {
                $tr.addClass( 'tal-row-selected' );
                $tr.find( '.tal-cell-check' ).text( '☑' );
            }
        }
        updateCounter();
    }

    function updateCounter() {
        var n = Object.keys( selectedPages ).length;
        $( '#tal-counter' ).text( n + ' file' + ( n !== 1 ? 's' : '' ) + ' selected' );
    }

    // ── Wrap gallery (category / search) ─────────────────────────────────────
    function wrapGalleryBoxes() {
        $( '.gallerybox' ).each( function () {
            var $box = $( this );
            if ( $box.data( 'tal-wrapped' ) ) { return; }
            $box.data( 'tal-wrapped', true );
            var title = $box.find( '.gallerytext a' ).first().attr( 'title' ) || '';
            if ( !title ) { return; }
            var $thumb = $box.find( '.thumb' );
            $thumb.css( 'position', 'relative' ).addClass( 'tal-thumb-wrap' );
            $thumb.data( 'tal-title', title );
            $thumb.prepend( '<span class="tal-check"></span>' );
            $thumb.on( 'click', function ( e ) {
                e.preventDefault();
                toggleSelect( title, $thumb, null );
            } );
        } );
    }

    // ── Wrap ListFiles rows ───────────────────────────────────────────────────
    function wrapListFilesRows() {
        var $table = $( 'table.tablesorter, table.wikitable, #mw-content-text table' ).first();
        if ( !$table.length ) { return; }
        if ( !$table.data( 'tal-hdr' ) ) {
            $table.data( 'tal-hdr', true );
            $table.find( 'tr' ).first()
                .prepend( '<th style="width:26px;text-align:center">☑</th>' )
                .append( '<th>Status</th>' );
        }
        $table.find( 'tr:gt(0)' ).each( function () {
            var $tr = $( this );
            if ( $tr.data( 'tal-wrapped' ) ) { return; }
            var $link = $tr.find( 'a[title^="File:"]' ).first();
            if ( !$link.length ) { return; }
            var title = $link.attr( 'title' );
            $tr.data( 'tal-wrapped', true ).data( 'tal-title', title ).addClass( 'tal-row' );
            var $chk = $( '<td class="tal-cell-check">☐</td>' );
            $tr.prepend( $chk ).append( '<td class="tal-cell-status"></td>' );
            $chk.on( 'click', function () { toggleSelect( title, null, $tr ); } );
            $tr.find( 'td' ).eq( 3 ).css( 'cursor', 'pointer' )
               .on( 'click', function () { toggleSelect( title, null, $tr ); } );
        } );
    }

    function wrapItems() {
        if ( isCategoryPage || isSearch ) { wrapGalleryBoxes(); }
        if ( isListFiles )               { wrapListFilesRows(); }
    }

    // ── Select / deselect all ─────────────────────────────────────────────────
    $( '#tal-sel-all' ).on( 'click', function () {
        $( '.tal-thumb-wrap' ).each( function () {
            var t = $( this ).data( 'tal-title' );
            if ( t ) { selectedPages[ t ] = true; $( this ).addClass( 'tal-selected' ); }
        } );
        $( 'tr.tal-row' ).each( function () {
            var t = $( this ).data( 'tal-title' );
            if ( t ) {
                selectedPages[ t ] = true;
                $( this ).addClass( 'tal-row-selected' ).find( '.tal-cell-check' ).text( '☑' );
            }
        } );
        updateCounter();
    } );

    $( '#tal-sel-none' ).on( 'click', function () {
        selectedPages = {};
        $( '.tal-thumb-wrap' ).removeClass( 'tal-selected' );
        $( 'tr.tal-row' ).removeClass( 'tal-row-selected' ).find( '.tal-cell-check' ).text( '☐' );
        updateCounter();
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

    /**
     * insertTemplate
     *
     * 'before-licensing':
     *   Wikimedia Commons file pages always contain a section heading like:
     *     == Licensing ==
     *   We search for any ==...Licensing...== heading (case-insensitive,
     *   any spacing, any level ===) and insert immediately before it.
     *
     *   Strategy: split wikitext by lines, find the first line that is
     *   a heading containing "licensing", insert before that line.
     *   This is more reliable than a single regex on the whole text.
     */
    function insertTemplate( text, tpl, pos ) {
        if ( pos === 'top' ) {
            return tpl + '\n' + text;
        }

        if ( pos === 'before-licensing' ) {
            var lines = text.split( '\n' );
            // Match lines like: ==Licensing==  /  == Licensing ==  /  === Licensing ===
            var licLineRe = /^={2,}\s*[Ll][Ii][Cc][Ee][Nn][Ss][Ii][Nn][Gg]\s*={2,}\s*$/;
            for ( var i = 0; i < lines.length; i++ ) {
                if ( licLineRe.test( lines[i] ) ) {
                    lines.splice( i, 0, tpl );  // insert tpl line just before heading
                    return lines.join( '\n' );
                }
            }
            // Licensing section not found — fall back to bottom
            return text + '\n' + tpl;
        }

        if ( pos === 'before-categories' ) {
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
    // Fetch wikitext via the API
    function getWikitext( title ) {
        return new mw.Api().get( {
            action: 'query', titles: title,
            prop: 'revisions', rvprop: 'content|ids',
            rvslots: 'main', formatversion: 2
        } ).then( function ( data ) {
            var page = data.query.pages[0];
            if ( page.missing ) { return { text: '', revid: 0 }; }
            var slot = page.revisions[0].slots.main;
            return { text: slot.content, revid: page.revisions[0].revid };
        } );
    }

    function saveWikitext( title, text, summary, baserevid ) {
        return new mw.Api().postWithToken( 'csrf', {
            action: 'edit', title: title, text: text, summary: summary,
            minor: prefs.minor ? 1 : undefined,
            watchlist: prefs.watchlist, baserevid: baserevid
        } );
    }

    // ── Per-file status display ───────────────────────────────────────────────
    function setStatus( title, cssClass, label ) {
        $( '.tal-thumb-wrap' ).filter( function () {
            return $( this ).data( 'tal-title' ) === title;
        } ).each( function () {
            $( this ).find( '.tal-status-badge' ).remove();
            if ( label ) {
                $( this ).append(
                    '<span class="tal-status-badge ' + cssClass + '">' +
                    mw.html.escape( label ) + '</span>'
                );
            }
        } );
        $( 'tr.tal-row' ).filter( function () {
            return $( this ).data( 'tal-title' ) === title;
        } ).find( '.tal-cell-status' )
            .text( label )
            .attr( 'class', 'tal-cell-status ' +
                ( cssClass ? cssClass.replace( 'tal-status-', 'tal-' ) : '' ) );
    }

    // ── "Done" visual flash ───────────────────────────────────────────────────
    function flashDone( counts ) {
        var msg = '✅ ' + counts.added + ' added · ' +
                  counts.removed + ' removed · ' +
                  counts.skipped + ' skipped' +
                  ( counts.errors ? ' · ⚠ ' + counts.errors + ' err' : '' );

        $( '#tal-done-banner' ).text( msg ).show();
        $panel.addClass( 'tal-done' );

        // Play a short beep using Web Audio API if available
        try {
            var ctx = new ( window.AudioContext || window.webkitAudioContext )();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect( gain );
            gain.connect( ctx.destination );
            osc.type = 'sine';
            osc.frequency.setValueAtTime( 880, ctx.currentTime );
            osc.frequency.exponentialRampToValueAtTime( 660, ctx.currentTime + 0.15 );
            gain.gain.setValueAtTime( 0.18, ctx.currentTime );
            gain.gain.exponentialRampToValueAtTime( 0.001, ctx.currentTime + 0.35 );
            osc.start( ctx.currentTime );
            osc.stop( ctx.currentTime + 0.35 );
        } catch ( e ) { /* audio not available — silent is fine */ }

        // Remove flash class after animation, but keep the green header for a moment
        setTimeout( function () {
            $panel.removeClass( 'tal-done' );
            setTimeout( function () {
                $( '#tal-header' ).css( 'background', '' );
                $( '#tal-done-banner' ).hide();
            }, 3000 );
        }, 900 );
    }

    // ── Parallel batch runner ─────────────────────────────────────────────────
    /**
     * Runs up to `prefs.concurrency` file-edits simultaneously.
     * Uses a pool pattern: whenever one slot finishes, the next title is picked up.
     */
    function runBatch( action ) {
        var tplName = normaliseTemplate( $( '#tal-template-input' ).val() );
        if ( !tplName ) { alert( 'Please enter a template name.' ); return; }

        var titles = Object.keys( selectedPages );
        if ( !titles.length ) { alert( 'No files selected.' ); return; }

        var tplStr  = '{{' + tplName + '}}';
        var pos     = $( '#tal-position-sel' ).val();
        var summary = prefs.summary + ': ' + ( action === 'add' ? '+' : '−' ) + tplStr;

        $( '#tal-btn-add, #tal-btn-rem' ).prop( 'disabled', true );
        $( '#tal-btn-revert' ).hide();
        $( '#tal-done-banner' ).hide();
        $( '#tal-report' ).empty();
        revertData   = {};
        lastAction   = action;
        lastTemplate = tplName;

        var total    = titles.length;
        var done     = 0;
        var cursor   = 0;  // next index to dispatch
        var active   = 0;
        var c        = { added: 0, removed: 0, skipped: 0, errors: 0 };
        var $prog    = $( '#tal-progress' );
        var $rep     = $( '#tal-report' );

        function log( cls, msg ) {
            $rep.append( '<div class="' + cls + '">' + mw.html.escape( msg ) + '</div>' );
            // Auto-scroll report to bottom
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
                dispatch(); // pick up next title
            }
        }

        function processTitle( title ) {
            active++;
            updateProg();

            getWikitext( title ).then( function ( rev ) {
                var oldText = rev.text, newText;
                var sCls, sLbl, rCls, rMsg;

                if ( action === 'add' ) {
                    if ( hasTemplate( oldText, tplName ) ) {
                        c.skipped++;
                        sCls = 'tal-status-skipped'; sLbl = '⚠ exists';
                        rCls = 'tal-skip';
                        rMsg = '⚠ ' + title + ' — already has ' + tplStr + ', skipped';
                        log( rCls, rMsg ); setStatus( title, sCls, sLbl );
                        oneDone(); return;
                    }
                    newText = insertTemplate( oldText, tplStr, pos );
                } else {
                    if ( !hasTemplate( oldText, tplName ) ) {
                        c.skipped++;
                        sCls = 'tal-status-skipped'; sLbl = '⚠ absent';
                        rCls = 'tal-skip';
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
                            sCls = 'tal-status-added';   sLbl = '✔ added';
                            rCls = 'tal-ok';
                            rMsg = '✔ ' + title + ' — ' + tplStr + ' added';
                        } else {
                            c.removed++;
                            sCls = 'tal-status-removed'; sLbl = '✔ removed';
                            rCls = 'tal-ok';
                            rMsg = '✔ ' + title + ' — ' + tplStr + ' removed';
                        }
                    } )
                    .catch( function ( err ) {
                        c.errors++;
                        delete revertData[ title ];
                        sCls = 'tal-status-error'; sLbl = '✘ error';
                        rCls = 'tal-err';
                        rMsg = '✘ ' + title + ' — ' + ( err || 'error' );
                    } )
                    .always( function () {
                        log( rCls, rMsg ); setStatus( title, sCls, sLbl );
                        oneDone();
                    } );

            } ).catch( function ( err ) {
                c.errors++;
                log( 'tal-err', '✘ ' + title + ' — fetch failed: ' + err );
                oneDone();
            } );
        }

        // Dispatch up to concurrency slots
        function dispatch() {
            while ( active < prefs.concurrency && cursor < total ) {
                processTitle( titles[ cursor++ ] );
            }
        }

        function finish() {
            $( '#tal-btn-add, #tal-btn-rem' ).prop( 'disabled', false );
            if ( Object.keys( revertData ).length ) { $( '#tal-btn-revert' ).show(); }

            $prog.text( '✔ All done — ' + total + ' files processed' );
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
        $( '#tal-btn-revert' ).prop( 'disabled', true );
        $( '#tal-report' ).empty();
        $( '#tal-done-banner' ).hide();

        var total   = titles.length;
        var done    = 0;
        var cursor  = 0;
        var active  = 0;
        var $prog   = $( '#tal-progress' );
        var $rep    = $( '#tal-report' );
        var tplStr  = '{{' + lastTemplate + '}}';
        var summary = prefs.summary + ': REVERT ' + ( lastAction === 'add' ? '+' : '−' ) + tplStr;

        function oneDone() {
            done++; active--;
            $prog.text( 'Reverting ' + done + '/' + total +
                ( active ? ' (' + active + ' running…)' : '' ) );
            if ( done === total ) {
                $prog.text( '↩ Revert complete.' );
                $( '#tal-btn-revert' ).hide().prop( 'disabled', false );
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
                    $rep.append( '<div class="tal-ok">↩ ' + mw.html.escape( title ) + '</div>' );
                    setStatus( title, '', '' );
                } )
                .catch( function () {
                    $rep.append( '<div class="tal-err">✘ Revert failed: ' +
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
    $( '#tal-btn-add'    ).on( 'click', function () { runBatch( 'add' ); } );
    $( '#tal-btn-rem'    ).on( 'click', function () { runBatch( 'remove' ); } );
    $( '#tal-btn-revert' ).on( 'click', revertBatch );
    $( '#tal-template-input' ).on( 'keydown', function ( e ) {
        if ( e.key === 'Enter' ) { $( '#tal-btn-add' ).trigger( 'click' ); }
    } );

    mw.hook( 'wikipage.content' ).add( wrapItems );

}() );
