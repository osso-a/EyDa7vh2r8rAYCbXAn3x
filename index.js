const CONFIG = {
    version: '5.2.2',
    afkWebhook: "https://discord.com/api/webhooks/1346656934178062377/oU7ZgrJhOw6ynr-Hvo23ch8VDsmCOop7nwg-BA8_PEV8KfrO7OH5AXBiLbns5CmebnCe",
    timeGap: 300,
    cooldown: 5 * 60 * 1000,
    rarityColors: {
        Common: "#7eef6d",
        Unusual: "#ffe65d",
        Rare: "#4d52e3",
        Epic: "#861fde",
        Legendary: "#de1f1f",
        Mythic: "#1fdbde",
        Ultra: "#ff2b75",
        Super: "#2bffa3",
        Unique: "#555555"
    }
}
if (!GM_getValue("discordUserId")) {
    GM_setValue("discordUserId", prompt("Enter your Discord User ID for AFK notifications:"))
}
if (!GM_getValue("alertSound")) {
    GM_setValue("alertSound", "https://github.com/osso-a/EyDa7vh2r8rAYCbXAn3x/raw/refs/heads/main/src/sounds/afkCheck.mp3")
}
if (!GM_getValue("userToken")) {
    GM_setValue("userToken", (Math.random() + 1).toString(36).substring(2))
}

let afkCheckCounts = { number: 0, startTime: Math.floor(Date.now() / 1000) }
function sendDiscordWebhook(webhookUrl, data) {
    GM_xmlhttpRequest({
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        url: webhookUrl,
        data: JSON.stringify(data)
    })
}

let lastAFKCheck = 0
let lastSendTime = 0
function handleAFKAlert(text, x, y, radius, startAngle, endAngle, counterclockwise, color) {
    if (text === "ARC" && Object.values(CONFIG.rarityColors).includes(color) && radius >= 0 && radius <= 0.06) {
        lastAFKCheck = Date.now()
    }

    const now = Date.now()
    const hasRecentArcAlert = now - lastAFKCheck < CONFIG.timeGap
    if (hasRecentArcAlert && now - lastSendTime > CONFIG.cooldown) {
        lastSendTime = now
        if (GM_getValue("discordUserId")) {
            afkCheckCounts.number++
            if (GM_getValue("alertSound")) {
                try {
                    new Audio(GM_getValue("alertSound")).play().catch(console.warn)
                } catch (e) {
                    console.warn("Could not play alert sound:", e)
                }
            }
            const embed = {
                content: `<@${GM_getValue("discordUserId")}>`,
                embeds: [{
                    title: "AFK Check ⚠️",
                    description: `${afkCheckCounts.number} AFK checks\nSession started <t:${afkCheckCounts.startTime}:R>\nDifficulty: ${(1 / radius).toFixed(2)}`,
                    footer: {
                        text: `${GM_getValue("userToken")} | ${CONFIG.version} | ${versionHash}`
                    },
                    timestamp: new Date().toISOString()
                }]
            }

            sendDiscordWebhook(CONFIG.afkWebhook, embed)
        }
    }

}
for (const { prototype } of [OffscreenCanvasRenderingContext2D, CanvasRenderingContext2D]) {
    if (!prototype.__afk_monitor_hooked) {
        prototype.__original_fillText = prototype.fillText
        prototype.__original_strokeText = prototype.strokeText
        prototype.__original_arc = prototype.arc
        prototype.__afk_monitor_hooked = true
    } else {
        break
    }
    prototype.strokeText = function (text, x, y) {
        handleAFKAlert(text, x, y)
        return this.__original_strokeText(text, x, y)
    }
    prototype.arc = function (x, y, radius, startAngle, endAngle, counterclockwise) {
        handleAFKAlert("ARC", x, y, radius, startAngle, endAngle, counterclockwise, this.fillStyle)
        return this.__original_arc(x, y, radius, startAngle, endAngle, counterclockwise)
    }
}
