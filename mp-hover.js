// [[User:Suyash.dwivedi/userscripts/mp-hover.js]]
// Description: Show image megapixels on hover + full-res megapixel display on File: pages
// Author: Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
// License: CC BY-SA 4.0

(function () {
    'use strict';

    function formatMP(w, h) {
        const mp = (w * h / 1_000_000).toFixed(2);
        return `This is <b style="color:#FFD700;">${mp} MP</b> Image`;
    }

    // --- Tooltip for general hover ---
    const tooltip = document.createElement("div");
    tooltip.style.position = "fixed";
    tooltip.style.background = "rgba(0, 0, 0, 0.85)";
    tooltip.style.color = "white";
    tooltip.style.padding = "6px 10px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.fontSize = "13px";
    tooltip.style.zIndex = 9999;
    tooltip.style.pointerEvents = "none";
    tooltip.style.display = "none";
    tooltip.style.maxWidth = "220px";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.fontFamily = "system-ui, sans-serif";
    tooltip.innerHTML = "";
    document.body.appendChild(tooltip);

    document.addEventListener("mouseover", function (e) {
        const img = e.target.closest("img");
        if (!img) return;

        const updateTooltip = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            if (w > 0 && h > 0) {
                tooltip.innerHTML = formatMP(w, h);
                tooltip.style.display = "block";
            }
        };

        updateTooltip();

        const moveHandler = (moveEvent) => {
            tooltip.style.left = moveEvent.pageX + 12 + "px";
            tooltip.style.top = moveEvent.pageY + 12 + "px";
        };

        const outHandler = () => {
            tooltip.style.display = "none";
            document.removeEventListener("mousemove", moveHandler);
            img.removeEventListener("mouseout", outHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        img.addEventListener("mouseout", outHandler);
    });

    // --- On File pages, show real full-res MP value ---
    if (mw.config.get("wgNamespaceNumber") === 6) {
        const fullMediaLink = document.querySelector(".fullMedia a");

        if (fullMediaLink) {
            const fullImageURL = fullMediaLink.href;

            const tempImg = new Image();
            tempImg.onload = function () {
                const w = tempImg.naturalWidth;
                const h = tempImg.naturalHeight;

                const mpHTML = formatMP(w, h);

                const badge = document.createElement("div");
                badge.innerHTML = mpHTML;
                badge.style.background = "#333";
                badge.style.color = "#fff";
                badge.style.padding = "8px 12px";
                badge.style.borderRadius = "6px";
                badge.style.marginTop = "10px";
                badge.style.fontSize = "14px";
                badge.style.fontFamily = "system-ui, sans-serif";
                badge.style.display = "inline-block";

                const previewContainer = document.querySelector(".fullMedia");

                if (previewContainer && previewContainer.parentNode) {
                    previewContainer.parentNode.insertBefore(badge, previewContainer.nextSibling);
                }
            };
            tempImg.src = fullImageURL;
        }
    }
})();
