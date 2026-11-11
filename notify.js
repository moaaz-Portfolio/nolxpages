// ============================================================
// NOLX TELEGRAM NOTIFIER v4.0
// إشعار لكل تاب جديد + إشعار رسائل الدعم
// ============================================================

(function () {
    // ⚙️ الإعدادات
    const TELEGRAM_BOT_TOKEN = '8381476288:AAGAYYSXE1rvIG0-2PN8QvpkeavvwZ1h24g';
    const TELEGRAM_CHAT_ID = '6404301620';

    // 🔑 مفاتيح التخزين
    const TAB_KEY = 'nolx_tab_id';

    // ============================================================
    // 1) توليد ID للتاب
    // ============================================================
    function getTabId() {
        let id = null;
        try { id = sessionStorage.getItem(TAB_KEY); } catch (e) {}
        if (!id) {
            id = 'tab_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
            try { sessionStorage.setItem(TAB_KEY, id); } catch (e) {}
        }
        return id;
    }

    // ============================================================
    // 2) التحقق: هل بعتنا إشعار في التاب ده؟
    // ============================================================
    function hasNotifiedInThisTab() {
        try {
            return sessionStorage.getItem('nolx_notified_this_tab') === 'yes';
        } catch (e) {
            return false;
        }
    }

    function markNotifiedInThisTab() {
        try { sessionStorage.setItem('nolx_notified_this_tab', 'yes'); } catch (e) {}
    }

    // ============================================================
    // 3) معلومات الجهاز
    // ============================================================
    function getDeviceInfo() {
        const ua = navigator.userAgent;

        let device = '💻 كمبيوتر';
        let deviceType = 'Desktop';
        if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
            device = '📱 موبايل';
            deviceType = 'Mobile';
        } else if (/iPad|Tablet/i.test(ua)) {
            device = '📱 تابلت';
            deviceType = 'Tablet';
        }

        let browser = 'غير معروف';
        if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';

        let os = 'غير معروف';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Android')) os = 'Android';
        else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';

        return { device, deviceType, browser, os };
    }

    // ============================================================
    // 4) جلب IP والموقع
    // ============================================================
    async function getIPInfo() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                const data = await res.json();
                if (data.ip) {
                    return {
                        ip: data.ip,
                        country: data.country_name || 'غير معروف',
                        countryCode: data.country_code || '',
                        city: data.city || 'غير معروف',
                        region: data.region || '',
                        isp: data.org || 'غير معروف',
                        timezone: data.timezone || ''
                    };
                }
            }
        } catch (e) {}

        return {
            ip: 'غير معروف',
            country: 'غير معروف',
            countryCode: '',
            city: 'غير معروف',
            region: '',
            isp: 'غير معروف',
            timezone: ''
        };
    }

    // ============================================================
    // 5) إرسال لتيليجرام
    // ============================================================
    async function sendTelegram(message) {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            });
            const data = await res.json();
            return data.ok === true;
        } catch (e) {
            console.warn('[NOLX] Telegram send error:', e);
            return false;
        }
    }

    // ============================================================
    // 6) إشعار فتح الصفحة
    // ============================================================
    async function notifyPageVisit() {
        // لو بعتنا في التاب ده قبل كده، اخرج
        if (hasNotifiedInThisTab()) {
            console.log('[NOLX] Already notified in this tab');
            return;
        }

        const tabId = getTabId();
        const { device, deviceType, browser, os } = getDeviceInfo();
        const ipInfo = await getIPInfo();

        const pageTitle = document.title || 'بدون عنوان';
        const pageUrl = window.location.href;
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        const referrer = document.referrer || 'مباشر (لا يوجد مصدر)';

        // تحليل المصدر
        let referrerSource = 'مباشر';
        if (document.referrer) {
            try {
                const refUrl = new URL(document.referrer);
                const host = refUrl.hostname;
                if (host.includes('google')) referrerSource = '🔍 Google';
                else if (host.includes('facebook')) referrerSource = '📘 Facebook';
                else if (host.includes('instagram')) referrerSource = '📷 Instagram';
                else if (host.includes('twitter') || host.includes('x.com')) referrerSource = '🐦 Twitter/X';
                else if (host.includes('tiktok')) referrerSource = '🎵 TikTok';
                else if (host.includes('youtube')) referrerSource = '▶️ YouTube';
                else if (host.includes('whatsapp')) referrerSource = '💬 WhatsApp';
                else if (host.includes('telegram')) referrerSource = '✈️ Telegram';
                else if (host.includes('nolxpages')) referrerSource = '🏠 من الموقع نفسه';
                else referrerSource = `🔗 ${host}`;
            } catch (e) {}
        }

        const screenSize = `${screen.width}x${screen.height}`;
        const language = navigator.language || 'غير معروف';
        const now = new Date().toLocaleString('ar-EG', {
            timeZone: 'Africa/Cairo',
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const message = `
🔔 <b>زائر جديد فتح صفحة</b>

📄 <b>الصفحة:</b> ${pageTitle}
📁 <b>الملف:</b> <code>${pageName}</code>
🔗 <b>الرابط الكامل:</b>
<code>${pageUrl}</code>

↩️ <b>المصدر:</b> ${referrerSource}
${document.referrer ? `<i>${document.referrer}</i>` : ''}

━━━━━━━━━━━━━━━━━
🌍 <b>الدولة:</b> ${ipInfo.country} ${ipInfo.countryCode ? `(${ipInfo.countryCode})` : ''}
🏙️ <b>المدينة:</b> ${ipInfo.city}
📍 <b>المنطقة:</b> ${ipInfo.region || 'غير معروف'}
📡 <b>IP:</b> <code>${ipInfo.ip}</code>
🏢 <b>ISP:</b> ${ipInfo.isp}
━━━━━━━━━━━━━━━━━

${device} <b>الجهاز:</b> ${deviceType}
💿 <b>النظام:</b> ${os}
🌐 <b>المتصفح:</b> ${browser}
📐 <b>الشاشة:</b> ${screenSize}
🗣️ <b>اللغة:</b> ${language}

🆔 <b>التاب:</b> <code>${tabId.substring(0, 20)}</code>
⏰ <b>الوقت:</b> ${now}
`.trim();

        const ok = await sendTelegram(message);

        if (ok) {
            markNotifiedInThisTab();
            console.log('[NOLX] ✅ Visit notification sent');
        }
    }

    // ============================================================
    // 7) إشعار رسالة الدعم
    // ============================================================
    async function notifySupportMessage(userInfo, messageText) {
        const tabId = getTabId();
        const { device, deviceType, browser, os } = getDeviceInfo();
        const ipInfo = await getIPInfo();

        const now = new Date().toLocaleString('ar-EG', {
            timeZone: 'Africa/Cairo',
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const userName = userInfo?.name || userInfo?.displayName || 'زائر غير مسجل';
        const userEmail = userInfo?.email || 'غير معروف';
        const userUid = userInfo?.uid || 'غير معروف';

        const message = `
💬 <b>رسالة دعم جديدة!</b>

━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> ${userName}
📧 <b>البريد:</b> <code>${userEmail}</code>
🆔 <b>UID:</b> <code>${userUid}</code>
━━━━━━━━━━━━━━━━━

📝 <b>الرسالة:</b>
<blockquote>${escapeHtml(messageText)}</blockquote>

━━━━━━━━━━━━━━━━━
🌍 <b>الدولة:</b> ${ipInfo.country} ${ipInfo.countryCode ? `(${ipInfo.countryCode})` : ''}
🏙️ <b>المدينة:</b> ${ipInfo.city}
📡 <b>IP:</b> <code>${ipInfo.ip}</code>
🏢 <b>ISP:</b> ${ipInfo.isp}
━━━━━━━━━━━━━━━━━

${device} <b>الجهاز:</b> ${deviceType}
💿 <b>النظام:</b> ${os}
🌐 <b>المتصفح:</b> ${browser}

🆔 <b>التاب:</b> <code>${tabId.substring(0, 20)}</code>
⏰ <b>الوقت:</b> ${now}
`.trim();

        return await sendTelegram(message);
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ============================================================
    // 8) التشغيل التلقائي
    // ============================================================
    function init() {
        setTimeout(() => notifyPageVisit(), 1500);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

    // ============================================================
    // 9) API عام
    // ============================================================
    window.NOLXNotify = {
        send: sendTelegram,
        visit: notifyPageVisit,
        supportMessage: notifySupportMessage,
        getTabId: getTabId,
        reset: function () {
            try {
                sessionStorage.removeItem('nolx_notified_this_tab');
                console.log('[NOLX] Reset done');
            } catch (e) {}
        }
    };
})();