// [[User:Suyash.dwivedi/userscripts/mp-hover.js]]
// Author: Suyash Dwivedi — CC BY-SA 4.0
// https://meta.wikimedia.org/wiki/User:Suyash.dwivedi

(function () {
    'use strict';

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
        whiteSpace: "nowrap"
    });
    document.body.appendChild(tooltip);

    // Main hover for static images
    document.addEventListener("mouseover", function (e) {
        const img = e.target.closest("img");
        if (!img || img.dataset.mpTooltip === "1") return;

        const src = img.src || img.getAttribute("data-src");
        if (!src) return;
        img.dataset.mpTooltip = "1";

        function formatMP(w, h) {
            return 'This is <b style="color:#FFD700;">' + (w * h / 1000000).toFixed(2) + ' MP</b> Image';
        }

        function showTooltip(w, h, pageX, pageY) {
            tooltip.innerHTML = formatMP(w, h);
            tooltip.style.left = pageX + 12 + "px";
            tooltip.style.top = pageY + 12 + "px";
            tooltip.style.display = "block";
        }

        function moveHandler(ev) {
            tooltip.style.left = ev.pageX + 12 + "px";
            tooltip.style.top = ev.pageY + 12 + "px";
        }

        function outHandler() {
            tooltip.style.display = "none";
            document.removeEventListener("mousemove", moveHandler);
            img.removeEventListener("mouseout", outHandler);
        }

        document.addEventListener("mousemove", moveHandler);
        img.addEventListener("mouseout", outHandler);

        if (src.includes("/thumb/")) {
            const originalUrl = src.replace(/\/thumb\/(.*)\/[^/]+$/, "/$1");
            const fullImg = new Image();
            fullImg.onload = function () {
                showTooltip(fullImg.naturalWidth, fullImg.naturalHeight, e.pageX, e.pageY);
            };
            fullImg.src = originalUrl;
        } else if (img.naturalWidth && img.naturalHeight) {
            showTooltip(img.naturalWidth, img.naturalHeight, e.pageX, e.pageY);
        }
    });

    // Handle lazy-loaded or dynamically added images
    const observer = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];
            for (let j = 0; j < mutation.addedNodes.length; j++) {
                const node = mutation.addedNodes[j];
                if (node.nodeType !== 1) continue;

                const imgs = node.querySelectorAll?.("img");
                if (imgs) {
                    imgs.forEach(function (imgNode) {
                        imgNode.addEventListener("mouseover", function (e) {
                            const img = this;
                            if (!img || img.dataset.mpTooltip === "1") return;

                            const src = img.src || img.getAttribute("data-src");
                            if (!src) return;
                            img.dataset.mpTooltip = "1";

                            function formatMP(w, h) {
                                return 'This is <b style="color:#FFD700;">' + (w * h / 1000000).toFixed(2) + ' MP</b> Image';
                            }

                            function showTooltip(w, h, pageX, pageY) {
                                tooltip.innerHTML = formatMP(w, h);
                                tooltip.style.left = pageX + 12 + "px";
                                tooltip.style.top = pageY + 12 + "px";
                                tooltip.style.display = "block";
                            }

                            function moveHandler(ev) {
                                tooltip.style.left = ev.pageX + 12 + "px";
                                tooltip.style.top = ev.pageY + 12 + "px";
                            }

                            function outHandler() {
                                tooltip.style.display = "none";
                                document.removeEventListener("mousemove", moveHandler);
                                img.removeEventListener("mouseout", outHandler);
                            }

                            document.addEventListener("mousemove", moveHandler);
                            img.addEventListener("mouseout", outHandler);

                            if (src.includes("/thumb/")) {
                                const originalUrl = src.replace(/\/thumb\/(.*)\/[^/]+$/, "/$1");
                                const fullImg = new Image();
                                fullImg.onload = function () {
                                    showTooltip(fullImg.naturalWidth, fullImg.naturalHeight, e.pageX, e.pageY);
                                };
                                fullImg.src = originalUrl;
                            } else if (img.naturalWidth && img.naturalHeight) {
                                showTooltip(img.naturalWidth, img.naturalHeight, e.pageX, e.pageY);
                            }
                        });
                    });
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Show static badge on File: pages
    if (mw.config.get("wgNamespaceNumber") === 6) {
        const fullMediaLink = document.querySelector(".fullMedia a");
        if (fullMediaLink) {
            const fullImageURL = fullMediaLink.href;
            const tempImg = new Image();
            tempImg.onload = function () {
                const w = tempImg.naturalWidth;
                const h = tempImg.naturalHeight;

                const badge = document.createElement("div");
                badge.innerHTML = 'This is <b style="color:#FFD700;">' + (w * h / 1000000).toFixed(2) + ' MP</b> Image';
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
            tempImg.src = fullImageURL;
        }
    }
})();
