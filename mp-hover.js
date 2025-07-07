// [[User:Suyash.dwivedi/userscripts/mp-hover.js]]
// Description: Show image megapixels on hover
// Author: Suyash Dwivedi (https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)
// License: CC0

(function () {
    function formatMP(w, h) {
        return " This is " + (w * h / 1_000_000).toFixed(2) + " MP Image";
    }

    const tooltip = document.createElement("div");
    tooltip.style.position = "fixed";
    tooltip.style.background = "rgba(0,0,0,0.8)";
    tooltip.style.color = "white";
    tooltip.style.padding = "4px 8px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = 9999;
    tooltip.style.pointerEvents = "none";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    document.addEventListener("mouseover", function (e) {
        const img = e.target.closest("img");
        if (!img) return;

        const updateTooltip = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            if (w > 0 && h > 0) {
                tooltip.textContent = formatMP(w, h);
                tooltip.style.display = "block";
            }
        };

        updateTooltip();

        const moveHandler = (moveEvent) => {
            tooltip.style.left = moveEvent.pageX + 10 + "px";
            tooltip.style.top = moveEvent.pageY + 10 + "px";
        };

        const outHandler = () => {
            tooltip.style.display = "none";
            document.removeEventListener("mousemove", moveHandler);
            img.removeEventListener("mouseout", outHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        img.addEventListener("mouseout", outHandler);
    });
})();
