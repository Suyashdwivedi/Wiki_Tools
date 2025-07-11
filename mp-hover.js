// [[User:Suyash.dwivedi/userscripts/mp-hover.js]]
// https://meta.wikimedia.org/wiki/User:Suyash.dwivedi

(function () {
    'use strict';

    // Add CSS for ⏳ emoji pulsing animation
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
        }
        .mp-loading {
            font-size: 16px;
            animation: pulse 1s infinite;
        }
    `;
    document.head.appendChild(style);

    // Create tooltip
    const tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
        position: "fixed",
        background: "rgba(0,0,0,0.85)",
        color: "white",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "13px",
        zIndex: 9999,
        pointerEvents: "none",
        display: "none",
        maxWidth: "240px",
        fontFamily: "system-ui, sans-serif",
        whiteSpace: "nowrap",
        transition: "top 0.05s, left 0.05s"
    });
    document.body.appendChild(tooltip);

    function formatMP(w, h) {
        return 'This is <b style="color:#FFD700;">' + (w * h / 1000000).toFixed(2) + ' MP</b> Image';
    }

    function showTooltip(html) {
        tooltip.innerHTML = html;
        tooltip.style.display = "block";
    }

    function attachHoverHandler(img) {
        let moveHandler, outHandler;

        img.addEventListener("mouseenter", function () {
            const currentImg = this;

            moveHandler = function (ev) {
                tooltip.style.left = ev.clientX + 15 + "px";
                tooltip.style.top = ev.clientY + 15 + "px";
            };

            outHandler = function () {
                tooltip.style.display = "none";
                document.removeEventListener("mousemove", moveHandler);
                currentImg.removeEventListener("mouseleave", outHandler);
            };

            document.addEventListener("mousemove", moveHandler);
            currentImg.addEventListener("mouseleave", outHandler);

            // Loading animation
            showTooltip('<span class="mp-loading">⏳</span>');

            // Use cached result if present
            if (currentImg.dataset.mp) {
                showTooltip(currentImg.dataset.mp);
                return;
            }

            // Use data-file-* if available
            const w = currentImg.getAttribute('data-file-width');
            const h = currentImg.getAttribute('data-file-height');
            if (w && h) {
                const msg = formatMP(w, h);
                currentImg.dataset.mp = msg;
                showTooltip(msg);
                return;
            }

            // Load full image to get dimensions
            const src = currentImg.src || currentImg.getAttribute("data-src");
            if (!src) return;

            if (src.includes("/thumb/")) {
                const originalUrl = src.replace(/\/thumb\/(.*)\/[^/]+$/, "/$1");
                const fullImg = new Image();
                fullImg.onload = function () {
                    const msg = formatMP(fullImg.naturalWidth, fullImg.naturalHeight);
                    currentImg.dataset.mp = msg;
                    showTooltip(msg);
                };
                fullImg.src = originalUrl;
            } else if (currentImg.naturalWidth && currentImg.naturalHeight) {
                const msg = formatMP(currentImg.naturalWidth, currentImg.naturalHeight);
                currentImg.dataset.mp = msg;
                showTooltip(msg);
            }
        });
    }

    function applyToAllImages() {
        document.querySelectorAll("img").forEach(function (imgNode) {
            if (!imgNode.dataset.mpBound) {
                attachHoverHandler(imgNode);
                imgNode.dataset.mpBound = "1";
            }
        });
    }

    // Initial images
    applyToAllImages();

    // Dynamic images (AJAX)
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                const imgs = node.tagName === "IMG" ? [node] : node.querySelectorAll("img");
                imgs.forEach(function (imgNode) {
                    if (!imgNode.dataset.mpBound) {
                        attachHoverHandler(imgNode);
                        imgNode.dataset.mpBound = "1";
                    }
                });
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Static MP badge for File pages
    mw.hook("wikipage.content").add(function () {
        if (mw.config.get("wgNamespaceNumber") === 6) {
            const fullMediaLink = document.querySelector(".fullMedia a");
            if (!fullMediaLink) return;
            if (document.querySelector("#mp-badge")) return;

            const tempImg = new Image();
            tempImg.onload = function () {
                const w = tempImg.naturalWidth;
                const h = tempImg.naturalHeight;
                const badge = document.createElement("div");
                badge.id = "mp-badge";
                badge.innerHTML = formatMP(w, h);
                Object.assign(badge.style, {
                    background: "#333",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    marginTop: "10px",
                    fontSize: "14px",
                    fontFamily: "system-ui, sans-serif",
                    display: "inline-block"
                });

                const container = document.querySelector(".fullMedia");
                if (container && container.parentNode) {
                    container.parentNode.insertBefore(badge, container.nextSibling);
                }
            };
            tempImg.src = fullMediaLink.href;
        }
    });
})();
